// Dry run: node scripts/apply-oracle-review.cjs
// Apply only after the matching application code is deployed: append --apply.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { MongoClient, BSON } = require('mongodb');
const load = require('./lib/load-local-ts.cjs');
const { parseBackup, isStale, validateDraft } = load('app/lib/utils/oracleReview.ts');
const { parseCardValue, parseAffinity } = load('app/lib/utils/cardValues.ts');
const { normalizeOracleText } = load('app/lib/utils/oracleText.ts');
const { resolveCardChangeScope, buildCardChangeSummary } = load('app/lib/utils/cardChange.ts');
const { CardModel } = load('app/lib/db/models/Card.ts');
const root = path.resolve(__dirname, '..');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const serialize = value => BSON.EJSON.stringify(value, { relaxed: false });
const approvedHash = '18a1e7336e210774ed311967720cfe7bd2cd8c2541243533631ade74f74ad972';
const csv = value => value.split(',').map(item => item.trim()).filter(Boolean);
const matchesDeck = ids => ({ $or: [
  { 'cards.cardId': { $in: ids } }, { 'sideboard.cardId': { $in: ids } },
] });

function readReview() {
  const bytes = fs.readFileSync(path.join(root, 'app/cards/oracle-approved-drafts.json'));
  assert.equal(sha256(bytes), approvedHash, 'Approved file changed; review the new file before importing.');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'data/oracle/2026-09-21.json'), 'utf8'));
  const ids = source.map(card => card.algomancer_id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate source card identity');
  const review = parseBackup(JSON.parse(bytes), sha256(JSON.stringify(source)), new Set(ids));
  assert.equal(Object.keys(review.entries).length, 340, 'Unexpected reviewed count');
  assert.ok(Object.values(review.entries).every(entry => entry.status === 'approved'), 'Unapproved entry');
  return review;
}

function planCard(previous, entry, batchId, now = new Date()) {
  assert.equal(previous.originalId, entry.cardId, 'Identity mismatch');
  assert.equal(entry.status, 'approved', `Not approved: ${entry.cardId}`);
  assert.deepEqual(validateDraft(entry.draft), [], `Invalid draft: ${entry.cardId}`);
  const draft = entry.draft;
  const fields = {
    name: draft.name, manaCost: parseCardValue(draft.manaCost),
    stats: { ...previous.stats, power: draft.power ? parseCardValue(draft.power, true) : previous.stats.power,
      defense: draft.defense ? parseCardValue(draft.defense, true) : previous.stats.defense,
      affinity: parseAffinity(draft.affinity) },
    timing: { ...previous.timing, type: draft.timing },
    typeAndAttributes: { mainType: draft.mainType, subType: draft.subType, attributes: csv(draft.attributes) },
    abilities: draft.rulesText.split('\n').map(normalizeOracleText).filter(Boolean),
    prophecy: draft.prophecy ? { manaCost: parseCardValue(draft.prophecy.mana),
      affinity: parseAffinity(draft.prophecy.affinity), condition: normalizeOracleText(draft.prophecy.condition) } : null,
    augmentTransfers: csv(draft.augmentTransfers),
    set: { ...previous.set, name: draft.setName, complexity: draft.complexity },
  };
  const reviewHash = sha256(JSON.stringify(entry));
  if (previous.oracleImport?.batchId === batchId && previous.oracleImport?.reviewHash === reviewHash) {
    for (const [key, value] of Object.entries(fields)) {
      assert.deepEqual(previous[key], value, `Imported card changed afterwards: ${entry.cardId} (${key})`);
    }
    return { id: entry.cardId, scope: 'none', fields: null };
  }
  const before = { ...previous, id: previous.originalId };
  assert.ok(!isStale(entry, before), `Reviewed baseline is stale: ${entry.cardId}`);
  const after = { ...before, ...fields };
  const scope = resolveCardChangeScope(before, after);
  const summary = buildCardChangeSummary(before, after, scope);
  Object.assign(fields, {
    oracleImport: { batchId, reviewHash, approvedRulesText: draft.rulesText,
      ...(draft.prophecy ? { approvedProphecyCondition: draft.prophecy.condition } : {}), importedAt: now },
    rulesVersion: (previous.rulesVersion || 1) + (scope === 'rules' ? 1 : 0), updatedAt: now,
    ...(scope === 'rules' ? { rulesUpdatedAt: now } : {}),
    ...(scope === 'asset' ? { assetUpdatedAt: now } : {}),
    ...(scope !== 'none' ? { lastChangeScope: scope, lastChangeSummary: summary } : {}),
  });
  const validation = new CardModel({ ...previous, ...fields }).validateSync();
  assert.ok(!validation, `Invalid card ${entry.cardId}: ${validation?.message || ''}`);
  return { id: entry.cardId, scope, summary, fields };
}

function planBatch(originals, review) {
  const entries = Object.values(review.entries);
  assert.equal(originals.length, entries.length, 'Missing or duplicate card records');
  assert.equal(new Set(originals.map(card => card.originalId)).size, entries.length, 'Duplicate card identity');
  return entries.map(entry => {
    const card = originals.find(card => card.originalId === entry.cardId);
    assert.ok(card, `Missing card: ${entry.cardId}`);
    return planCard(card, entry, review.batchId);
  });
}

async function applyBatch({ client, db, review, originals, writeBackup, beforeCommit }) {
  const session = client.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const ids = Object.keys(review.entries);
      const current = await db.collection('cards').find({ originalId: { $in: ids } }, { session }).toArray();
      for (const card of current) assert.equal(serialize(card), serialize(originals.find(old => old.originalId === card.originalId)),
        `Card changed since preflight: ${card.originalId}`);
      const plans = planBatch(current, review);
      const changed = plans.filter(plan => plan.fields);
      const rulePlans = changed.filter(plan => plan.scope === 'rules');
      const decks = rulePlans.length ? await db.collection('decks').find(matchesDeck(rulePlans.map(plan => plan.id)), {
        session, projection: { cards: 1, sideboard: 1, reviewFlags: 1, needsReview: 1, updatedAt: 1, isPublic: 1 },
      }).toArray() : [];
      if (changed.length) await writeBackup({ cards: current, decks, plans, batchId: review.batchId });
      for (const plan of changed) {
        const result = await db.collection('cards').updateOne({ originalId: plan.id }, { $set: plan.fields }, { session });
        assert.equal(result.matchedCount, 1);
      }
      for (const deck of decks) {
        const usedIds = new Set([...(deck.cards || []), ...(deck.sideboard || [])].map(card => card.cardId));
        const relevant = rulePlans.filter(plan => usedIds.has(plan.id));
        const changedIds = new Set(relevant.map(plan => plan.id));
        const flags = (deck.reviewFlags || []).filter(flag => !changedIds.has(flag.cardId));
        flags.push(...relevant.map(plan => ({ cardId: plan.id, cardName: plan.fields.name,
          changeSummary: plan.summary, rulesVersion: plan.fields.rulesVersion, changedAt: plan.fields.rulesUpdatedAt })));
        await db.collection('decks').updateOne({ _id: deck._id }, { $set: { reviewFlags: flags, needsReview: true, updatedAt: new Date() } }, { session });
      }
      if (beforeCommit) await beforeCommit();
      result = { changedCards: changed.length, rulesChanged: rulePlans.length, flaggedDecks: decks.length,
        flaggedPublicDecks: decks.filter(deck => deck.isPublic).length };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    return result;
  } finally { await session.endSession(); }
}

async function main() {
  const args = process.argv.slice(2);
  assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--apply'), 'Usage: node scripts/apply-oracle-review.cjs [--apply]');
  const review = readReview();
  Module.createRequire(require.resolve('next/package.json'))('@next/env').loadEnvConfig(root, true);
  assert.ok(process.env.MONGODB_URI, 'Missing MongoDB configuration');
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db();
    const originals = await db.collection('cards').find({ originalId: { $in: Object.keys(review.entries) } }).toArray();
    const plans = planBatch(originals, review);
    const rules = plans.filter(plan => plan.scope === 'rules');
    const report = { approved: plans.length, toWrite: plans.filter(plan => plan.fields).length,
      rulesChanged: rules.length, decksToFlag: rules.length ? await db.collection('decks').countDocuments(matchesDeck(rules.map(plan => plan.id))) : 0 };
    console.log(JSON.stringify(report));
    if (!args.includes('--apply')) { console.log('Preview only; no database writes.'); return; }
    const dir = path.join(root, 'backups', `oracle-import-${Date.now()}`);
    fs.mkdirSync(dir, { recursive: true });
    const save = (name, data) => fs.writeFileSync(path.join(dir, name), serialize(data), { flag: 'wx' });
    save('preflight.json', { review, cards: originals, plans });
    let attempt = 0;
    const result = await applyBatch({ client, db, review, originals, writeBackup: snapshot => save(`before-transaction-${++attempt}.json`, snapshot) });
    save('result.json', { ...result, completedAt: new Date() });
    const fresh = await db.collection('cards').find({ originalId: { $in: Object.keys(review.entries) } }).toArray();
    assert.ok(planBatch(fresh, review).every(plan => !plan.fields), 'Post-import verification failed');
    console.log(JSON.stringify({ ...result, verified: true, backupDirectory: path.relative(root, dir) }));
    console.log('Refresh the deployed catalog cache after commit.');
  } finally { await client.close(); }
}
module.exports = { readReview, planCard, planBatch, applyBatch };
if (require.main === module) main().catch(error => {
  console.error(`Oracle import failed (${error.name || 'Error'}). No credentials logged.`);
  if (error.code === 'ERR_ASSERTION') console.error(error.message.split('\n')[0]);
  process.exitCode = 1;
});
