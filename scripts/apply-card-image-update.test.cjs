const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const { applyBatch } = require('./apply-card-image-update.cjs');
const data = require('./card-updates/2026-09-21.json');
const manifest = { cards: data.cards.slice(0, 2) };
const uploads = Object.fromEntries(manifest.cards.map(card => [card.id, {
  secure_url: `https://res.cloudinary.com/test/image/upload/v2/${card.id}.jpg`,
}]));
let replSet, client, db;

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  client = new MongoClient(replSet.getUri());
  await client.connect();
  db = client.db('card_image_update_test');
});
after(async () => {
  await client?.close();
  await replSet?.stop();
});
beforeEach(async () => {
  await db.dropDatabase();
  await db.collection('cards').insertMany(manifest.cards.map(entry => ({
    originalId: entry.id, name: entry.name, manaCost: entry.manaCost,
    stats: { ...entry.stats, affinity: {} }, element: entry.element,
    timing: { type: entry.timingType, description: 'Existing timing description' },
    typeAndAttributes: entry.typeAndAttributes, abilities: ['Old ability'],
    set: { name: 'Existing set', symbol: 'existing', complexity: 'Common' },
    imageUrl: 'https://res.cloudinary.com/test/image/upload/v1/old.png',
    internalMetadata: 'preserve me', rulesVersion: 4,
  })));
  await db.collection('decks').insertMany([
    { cards: [{ cardId: manifest.cards[0].id, quantity: 2 }], sideboard: [], isPublic: true,
      reviewFlags: [{ cardId: 'unrelated', rulesVersion: 3 }, { cardId: manifest.cards[0].id, rulesVersion: 4 }] },
    { cards: [], sideboard: [{ cardId: manifest.cards[1].id, quantity: 1 }], isPublic: false },
    { cards: [{ cardId: 'untouched', quantity: 2 }], needsReview: false },
  ]);
});
async function run(extra = {}) {
  const originals = await db.collection('cards').find().toArray();
  return applyBatch({ client, db, manifest, originals, uploads, writeBackup: async () => {}, ...extra });
}

test('updates existing cards, preserves IDs/metadata and flags main-deck and sideboard users only', async () => {
  const beforeCards = await db.collection('cards').find().toArray();
  const result = await run({ writeBackup: async snapshot => {
    assert.equal(snapshot.cards.length, 2);
    assert.equal(snapshot.decks.length, 2);
    assert.equal((await db.collection('cards').findOne()).rulesVersion, 4);
  } });
  assert.deepEqual(result, { changedCards: 2, rulesChanged: 2, flaggedDecks: 2, flaggedPublicDecks: 1 });
  const cards = await db.collection('cards').find().toArray();
  for (const card of cards) {
    assert.equal(card._id.toString(), beforeCards.find(before => before.originalId === card.originalId)._id.toString());
    assert.equal(card.rulesVersion, 5);
    assert.equal(card.internalMetadata, 'preserve me');
    assert.equal(card.set.name, 'Existing set');
    assert.deepEqual(card.stats.affinity, manifest.cards.find(entry => entry.id === card.originalId).stats.affinity);
  }
  const decks = await db.collection('decks').find().toArray();
  assert.equal(decks[0].reviewFlags.length, 2);
  assert.equal(decks[0].reviewFlags.find(flag => flag.cardId === manifest.cards[0].id).rulesVersion, 5);
  assert.equal(decks[1].needsReview, true);
  assert.equal(decks[2].needsReview, false);
  const repeated = await run();
  assert.deepEqual(repeated, { changedCards: 0, rulesChanged: 0, flaggedDecks: 0, flaggedPublicDecks: 0 });
  assert.deepEqual(await db.collection('cards').find().toArray(), cards);
  assert.deepEqual(await db.collection('decks').find().toArray(), decks);
});

test('failure before commit rolls back both cards and review flags', async () => {
  const cards = await db.collection('cards').find().toArray();
  const decks = await db.collection('decks').find().toArray();
  await assert.rejects(run({ beforeCommit: () => { throw new Error('Simulated failure'); } }), /Simulated failure/);
  assert.deepEqual(await db.collection('cards').find().toArray(), cards);
  assert.deepEqual(await db.collection('decks').find().toArray(), decks);
});

test('refuses a card changed since preview and refuses a missing card without partial writes', async () => {
  const originals = await db.collection('cards').find().toArray();
  await db.collection('cards').updateOne({ originalId: manifest.cards[0].id }, { $set: { manaCost: 99 } });
  await assert.rejects(run({ originals }), /Card changed since preflight/);
  assert.equal((await db.collection('cards').findOne({ originalId: manifest.cards[1].id })).rulesVersion, 4);
  await db.collection('cards').deleteOne({ originalId: manifest.cards[1].id });
  await assert.rejects(run(), /Missing or duplicate card records/);
  assert.equal(await db.collection('decks').countDocuments({ needsReview: true }), 0);
});
