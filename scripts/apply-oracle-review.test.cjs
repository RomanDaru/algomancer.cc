const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const { readReview, planBatch, applyBatch } = require('./apply-oracle-review.cjs');
const load = require('./lib/load-local-ts.cjs');
const { parseCardValue, parseAffinity } = load('app/lib/utils/cardValues.ts');
const fullReview = readReview();
const selected = ['the-foretold', 'counter-theif', 'generic-unit', 'bripp', 'floral-singularity', 'animated-spark'];
const review = { ...fullReview, entries: Object.fromEntries(selected.map(id => [id, fullReview.entries[id]])) };
function original(entry) {
  const b = entry.baseline;
  return { originalId: entry.cardId, name: b.name, manaCost: parseCardValue(b.manaCost),
    stats: { power: parseCardValue(b.power || '0', true), defense: parseCardValue(b.defense || '0', true), affinity: parseAffinity(b.affinity) },
    element: { type: 'Light', symbol: 'light' }, timing: { type: b.timing, description: '' },
    typeAndAttributes: { mainType: b.mainType, subType: b.subType, attributes: b.attributes.split(',').map(s => s.trim()).filter(Boolean) },
    abilities: b.rulesText ? b.rulesText.split('\n') : [],
    set: { name: b.setName, complexity: b.complexity, symbol: 'preserved-symbol' },
    imageUrl: entry.baselineImage, rulesVersion: entry.baselineVersion, internalMetadata: 'preserve' };
}
let repl, client, db;
before(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  client = new MongoClient(repl.getUri()); await client.connect(); db = client.db('oracle_test');
});
after(async () => { await client?.close(); await repl?.stop(); });
beforeEach(async () => {
  await db.dropDatabase();
  await db.collection('cards').insertMany(Object.values(review.entries).map(original));
  await db.collection('decks').insertMany([
    { cards: [{ cardId: 'the-foretold', quantity: 2 }], sideboard: [], isPublic: true, userId: 'one', reviewFlags: [{ cardId: 'untouched', rulesVersion: 1 }] },
    { cards: [], sideboard: [{ cardId: 'bripp', quantity: 1 }], isPublic: false, userId: 'two' },
    { cards: [], isPublic: true, needsReview: false },
  ]);
});
async function run(options = {}) {
  const originals = await db.collection('cards').find().toArray();
  return applyBatch({ client, db, review, originals, writeBackup: async () => {}, ...options });
}
test('all 340 approved entries validate and preserve user edits, costs, IDs and artwork', () => {
  const originals = Object.values(fullReview.entries).map(original);
  const plans = planBatch(originals, fullReview);
  assert.equal(plans.length, 340);
  assert.equal(plans.find(p => p.id === 'generic-unit').fields.stats.power, 'X');
  assert.equal(plans.find(p => p.id === 'the-foretold').fields.prophecy.manaCost, 0);
  assert.match(plans.find(p => p.id === 'animated-spark').fields.abilities.join(' '), /non-token/);
  for (const plan of plans) { assert.ok(!('imageUrl' in plan.fields)); assert.ok(!('originalId' in plan.fields)); }
});
test('commit is idempotent; preserves deck ownership/lists and backs up before writes', async () => {
  const cards = await db.collection('cards').find().toArray();
  const decks = await db.collection('decks').find().toArray();
  let backedUp = false;
  const result = await run({ writeBackup: async snapshot => {
    backedUp = true; assert.equal(snapshot.cards.length, 6);
    assert.deepEqual(await db.collection('cards').find().toArray(), cards);
  } });
  assert.ok(backedUp); assert.equal(result.changedCards, 6); assert.equal(result.flaggedDecks, 2);
  const saved = await db.collection('cards').find().toArray();
  for (const card of saved) {
    const old = cards.find(c => c.originalId === card.originalId);
    assert.deepEqual(card._id, old._id); assert.equal(card.imageUrl, old.imageUrl);
    assert.equal(card.internalMetadata, 'preserve');
  }
  const afterDecks = await db.collection('decks').find().toArray();
  for (let i = 0; i < decks.length; i++) for (const key of ['cards', 'sideboard', 'userId', 'isPublic']) assert.deepEqual(afterDecks[i][key], decks[i][key]);
  assert.ok(afterDecks[0].reviewFlags.some(flag => flag.cardId === 'untouched'));
  assert.equal(afterDecks[1].needsReview, true); assert.equal(afterDecks[2].needsReview, false);
  assert.equal((await run()).changedCards, 0);
  assert.deepEqual(await db.collection('cards').find().toArray(), saved);
  assert.deepEqual(await db.collection('decks').find().toArray(), afterDecks);
  await db.collection('cards').updateOne({ originalId: 'bripp' }, { $set: { manaCost: 99 } });
  await assert.rejects(run(), /changed afterwards/);
});
test('failure rolls back every card and deck flag; failed backup also prevents writes', async () => {
  const cards = await db.collection('cards').find().toArray(); const decks = await db.collection('decks').find().toArray();
  await assert.rejects(run({ beforeCommit() { throw new Error('simulated failure'); } }), /simulated failure/);
  assert.deepEqual(await db.collection('cards').find().toArray(), cards);
  assert.deepEqual(await db.collection('decks').find().toArray(), decks);
  await assert.rejects(run({ writeBackup() { throw new Error('backup failure'); } }), /backup failure/);
  assert.deepEqual(await db.collection('cards').find().toArray(), cards);
});
test('rejects stale review, concurrent changes and missing cards without partial updates', async () => {
  const originals = await db.collection('cards').find().toArray();
  await db.collection('cards').updateOne({ originalId: 'bripp' }, { $set: { manaCost: 99 } });
  await assert.rejects(run({ originals }), /since preflight/);
  await assert.rejects(run(), /baseline is stale/);
  await db.collection('cards').deleteOne({ originalId: 'bripp' });
  await assert.rejects(run(), /Missing or duplicate/);
  assert.equal(await db.collection('cards').countDocuments({ oracleImport: { $exists: true } }), 0);
});
