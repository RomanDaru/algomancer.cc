// Usage: node scripts/apply-card-image-update.cjs scripts/card-updates/2026-09-21.json [--apply]
// Default is read-only. Images are immutable uploads; cards and deck review flags commit together.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Module = require('node:module');
const assert = require('node:assert/strict');
const { MongoClient, BSON } = require('mongodb');
const root = path.resolve(__dirname, '..');

const loadLocalTs = require('./lib/load-local-ts.cjs');
const { resolveCardChangeScope, buildCardChangeSummary } = loadLocalTs('app/lib/utils/cardChange.ts');
const { CardModel } = loadLocalTs('app/lib/db/models/Card.ts');
const serialize = value => BSON.EJSON.stringify(value, { relaxed: false });
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const matchesDeck = ids => ({ $or: [
  { 'cards.cardId': { $in: ids } }, { 'sideboard.cardId': { $in: ids } },
] });

function readManifest(filename) {
  const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
  assert.match(manifest.batchId, /^[a-z0-9-]+$/);
  assert.ok(Array.isArray(manifest.cards) && manifest.cards.length > 0);
  assert.equal(new Set(manifest.cards.map(card => card.id)).size, manifest.cards.length, 'Duplicate card ID');
  for (const card of manifest.cards) {
    assert.match(card.id, /^[a-z0-9-]+$/);
    assert.equal(path.basename(card.imageFile), card.imageFile, 'Image must be a filename');
    const bytes = fs.readFileSync(path.join(root, 'public/images/cards', card.imageFile));
    assert.equal(sha256(bytes), card.imageSha256, `Unreviewed image contents: ${card.id}`);
    assert.ok(Number.isInteger(card.manaCost) && card.manaCost >= 0);
    for (const [element, quantity] of Object.entries(card.stats.affinity)) {
      assert.ok(['fire', 'water', 'earth', 'wood', 'metal', 'dark', 'light'].includes(element));
      assert.ok(Number.isInteger(quantity) && quantity >= 0);
    }
    assert.ok(card.abilities.every(ability => typeof ability === 'string' && ability.trim()));
  }
  return manifest;
}

function planCard(previous, entry, imageUrl, now = new Date()) {
  assert.equal(previous.originalId, entry.id, 'Card identity mismatch');
  assert.equal(previous.name, entry.name, `Name changed: ${entry.id}`);
  // This batch does not change timing or element identity. Refuse accidental remapping.
  assert.equal(previous.timing.type, entry.timingType, `Timing requires review: ${entry.id}`);
  assert.equal(previous.element.type, entry.element.type, `Element requires review: ${entry.id}`);
  const fields = {
    name: entry.name, manaCost: entry.manaCost, element: entry.element,
    stats: entry.stats, timing: previous.timing,
    typeAndAttributes: entry.typeAndAttributes, abilities: entry.abilities,
    set: { ...previous.set, complexity: entry.complexity }, imageUrl, flavorText: '',
  };
  const before = { ...previous, id: previous.originalId };
  const after = { ...before, ...fields };
  const scope = resolveCardChangeScope(before, after);
  const summary = buildCardChangeSummary(before, after, scope);
  if (scope === 'none') return { id: entry.id, scope, summary, fields: null };
  Object.assign(fields, {
    rulesVersion: (previous.rulesVersion || 1) + (scope === 'rules' ? 1 : 0),
    rulesUpdatedAt: scope === 'rules' ? now : previous.rulesUpdatedAt || now,
    assetUpdatedAt: now, updatedAt: now,
    lastChangeScope: scope, lastChangeSummary: summary,
  });
  const validation = new CardModel({ ...previous, ...fields }).validateSync();
  if (validation) throw validation;
  return { id: entry.id, scope, summary, fields };
}

async function applyBatch({ client, db, manifest, originals, uploads, writeBackup, beforeCommit }) {
  const session = client.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const ids = manifest.cards.map(card => card.id);
      const current = await db.collection('cards').find({ originalId: { $in: ids } }, { session }).toArray();
      assert.equal(current.length, ids.length, 'Missing or duplicate card records');
      const plans = manifest.cards.map(entry => {
        const previous = current.find(card => card.originalId === entry.id);
        assert.equal(serialize(previous), serialize(originals.find(card => card.originalId === entry.id)),
          `Card changed since preflight: ${entry.id}. Run a new preview.`);
        return planCard(previous, entry, uploads[entry.id].secure_url);
      });
      const rulePlans = plans.filter(plan => plan.scope === 'rules');
      const decks = rulePlans.length ? await db.collection('decks').find(matchesDeck(rulePlans.map(plan => plan.id)), {
        session, projection: { cards: 1, sideboard: 1, reviewFlags: 1, needsReview: 1, updatedAt: 1, isPublic: 1 },
      }).toArray() : [];
      // Backups contain BSON dates/IDs and only the deck fields needed to recover review state.
      // A retried transaction gets a fresh backup before any writes.
      await writeBackup({ cards: current, decks, plans });
      for (const plan of plans.filter(plan => plan.fields)) {
        const result = await db.collection('cards').updateOne({ originalId: plan.id }, { $set: plan.fields }, { session });
        assert.equal(result.matchedCount, 1);
      }
      for (const deck of decks) {
        const usedIds = new Set([...(deck.cards || []), ...(deck.sideboard || [])].map(card => card.cardId));
        const changed = rulePlans.filter(plan => usedIds.has(plan.id));
        const changedIds = new Set(changed.map(plan => plan.id));
        const flags = (deck.reviewFlags || []).filter(flag => !changedIds.has(flag.cardId));
        flags.push(...changed.map(plan => ({
          cardId: plan.id, cardName: plan.fields.name, changeSummary: plan.summary,
          rulesVersion: plan.fields.rulesVersion, changedAt: plan.fields.rulesUpdatedAt,
        })));
        await db.collection('decks').updateOne({ _id: deck._id }, { $set: {
          reviewFlags: flags, needsReview: true, updatedAt: new Date(),
        } }, { session });
      }
      if (beforeCommit) await beforeCommit();
      result = { changedCards: plans.filter(plan => plan.fields).length,
        rulesChanged: rulePlans.length, flaggedDecks: decks.length,
        flaggedPublicDecks: decks.filter(deck => deck.isPublic).length };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    return result;
  } finally {
    await session.endSession();
  }
}

async function main() {
  const args = process.argv.slice(2);
  assert.ok(args.length >= 1 && args.length <= 2 && (args.length === 1 || args[1] === '--apply'),
    'Usage: node scripts/apply-card-image-update.cjs <manifest.json> [--apply]');
  const manifest = readManifest(path.resolve(args[0]));
  Module.createRequire(require.resolve('next/package.json'))('@next/env').loadEnvConfig(root, true);
  assert.ok(process.env.MONGODB_URI, 'Missing MongoDB configuration');
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db();
    const ids = manifest.cards.map(card => card.id);
    const originals = await db.collection('cards').find({ originalId: { $in: ids } }).toArray();
    assert.equal(originals.length, ids.length, 'Missing or duplicate card records');
    for (const entry of manifest.cards) {
      const previous = originals.find(card => card.originalId === entry.id);
      const plan = planCard(previous, entry, previous.imageUrl);
      console.log(`${entry.name}: ${plan.scope}; ${plan.summary}`);
    }
    console.log(`Matching decks (main or sideboard): ${await db.collection('decks').countDocuments(matchesDeck(ids))}`);
    if (!args.includes('--apply')) {
      console.log('Preview only; no database or Cloudinary writes. Image changes are applied with --apply.');
      return;
    }
    const cloudinary = require('cloudinary').v2;
    for (const key of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
      assert.ok(process.env[key], `Missing ${key}`);
    }
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
    const backupDir = path.join(root, 'backups', `${manifest.batchId}-${Date.now()}`);
    fs.mkdirSync(backupDir, { recursive: true });
    const save = (name, value) => fs.writeFileSync(path.join(backupDir, name), serialize(value), { flag: 'wx' });
    save('preflight.json', { manifest, cards: originals });
    const uploads = {};
    for (const entry of manifest.cards) {
      const result = await cloudinary.uploader.upload(path.join(root, 'public/images/cards', entry.imageFile), {
        public_id: `algomancy/cards/revisions/${entry.id}-${entry.imageSha256}`,
        overwrite: false, resource_type: 'image', type: 'upload',
      });
      assert.ok(result.secure_url?.startsWith('https://res.cloudinary.com/'));
      assert.ok(result.width > 0 && result.height > 0);
      uploads[entry.id] = { secure_url: result.secure_url, public_id: result.public_id,
        width: result.width, height: result.height, version: result.version };
      console.log(`Image ready: ${entry.name} (${result.width}x${result.height})`);
    }
    save('uploads.json', uploads);
    let attempt = 0;
    const result = await applyBatch({ client, db, manifest, originals, uploads,
      writeBackup: snapshot => save(`before-transaction-${++attempt}.json`, snapshot) });
    save('result.json', { ...result, completedAt: new Date(), uploads });
    console.log(JSON.stringify({ ...result, backupDirectory: path.relative(root, backupDir) }));
    console.log('Database committed. Restart the local preview with a fresh fetch cache. Hosted catalog cache refreshes on its existing one-hour expiry or through an authenticated admin update.');
  } finally {
    await client.close();
  }
}

module.exports = { readManifest, planCard, applyBatch };
if (require.main === module) main().catch(error => {
  // Drivers may include credentials in connection diagnostics; never print raw errors here.
  console.error(`Card image update failed (${error.name || 'Error'}). No credentials logged. Review preflight/backups before retrying.`);
  if (error.code === 'ERR_ASSERTION') console.error(error.message.split('\n')[0]);
  process.exitCode = 1;
});
