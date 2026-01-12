"use strict";

const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/algomancy";
const SEED_TAG = "seed-game-logs";
const TOTAL_LOGS = 20;
const ELEMENTS = ["Fire", "Water", "Earth", "Wood", "Metal"];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const sample = (list) => list[Math.floor(Math.random() * list.length)];

const pickElements = (min = 1, max = 3) => {
  const count = randomInt(min, max);
  const shuffled = [...ELEMENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const buildOpponent = (index, format, deckIds) => {
  const opponent = {
    name: `Opponent ${String.fromCharCode(65 + index)}`,
  };

  if (format === "live_draft") {
    opponent.elements = pickElements(1, 3);
  }

  if (format === "constructed" && deckIds.length > 0) {
    const deckId = deckIds[(index + 1) % deckIds.length].toString();
    opponent.externalDeckUrl = `https://algomancer.cc/decks/${deckId}`;
  }

  return opponent;
};

async function seedLogs() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  const usersCollection = db.collection("users");
  const decksCollection = db.collection("decks");
  const logsCollection = db.collection("gamelogs");

  const user = await usersCollection.findOne({});
  if (!user) {
    throw new Error("No users found. Create a user first.");
  }

  const decks = await decksCollection
    .find({ userId: user._id })
    .limit(20)
    .toArray();
  const deckIds = decks.map((deck) => deck._id);

  const logs = Array.from({ length: TOTAL_LOGS }, (_, index) => {
    const format = index % 2 === 0 ? "constructed" : "live_draft";
    const matchType =
      index % 5 === 0 ? "custom" : index % 4 === 0 ? "2v2" : "1v1";
    const outcome =
      index % 3 === 0 ? "win" : index % 3 === 1 ? "loss" : "draw";
    const playedAt = new Date(Date.now() - index * 1000 * 60 * 60 * 12);
    const createdAt = new Date(playedAt.getTime() + 1000 * 60);
    const updatedAt = new Date(createdAt.getTime() + 1000 * 60 * 5);

    const log = {
      userId: user._id,
      title: `Seed Log #${index + 1}`,
      playedAt,
      durationMinutes: randomInt(12, 75),
      outcome,
      format,
      matchType,
      matchTypeLabel: matchType === "custom" ? "Custom Match" : undefined,
      isPublic: index % 4 === 0,
      opponents: [buildOpponent(0, format, deckIds)],
      notes: "Seed log for pagination testing.",
      seedTag: SEED_TAG,
      createdAt,
      updatedAt,
    };

    if (format === "constructed") {
      const deckId = deckIds.length > 0 ? deckIds[index % deckIds.length] : null;
      log.constructed = {
        deckId: deckId || undefined,
        externalDeckUrl: deckId
          ? undefined
          : "https://algomancer.cc/decks/sample",
        teammateDeckId:
          matchType === "2v2" && deckIds.length > 1
            ? deckIds[(index + 1) % deckIds.length]
            : undefined,
      };
    }

    if (format === "live_draft") {
      log.liveDraft = {
        elementsPlayed: pickElements(2, 4),
      };
    }

    return log;
  });

  const result = await logsCollection.insertMany(logs);
  console.log(`Inserted ${result.insertedCount} game logs.`);

  await client.close();
}

async function removeLogs() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const collections = ["gameLogs", "gamelogs"];
  let totalRemoved = 0;
  for (const name of collections) {
    const logsCollection = db.collection(name);
    const result = await logsCollection.deleteMany({ seedTag: SEED_TAG });
    totalRemoved += result.deletedCount || 0;
  }
  console.log(`Removed ${totalRemoved} seeded game logs.`);
  await client.close();
}

async function main() {
  const shouldRemove = process.argv.includes("--remove");
  if (shouldRemove) {
    await removeLogs();
    return;
  }
  await seedLogs();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
