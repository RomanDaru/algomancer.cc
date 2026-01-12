"use strict";

const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/algomancy";

const DRY_RUN = process.argv.includes("--dry-run");
const RESET = process.argv.includes("--reset");
const userArg = process.argv.find((arg) => arg.startsWith("--user="));
const userFilter = userArg ? userArg.split("=")[1] : null;

const ACHIEVEMENTS = [
  {
    key: "first_log",
    title: "First Log",
    description: "Record your first game log.",
    rarity: "common",
    icon: "LOG",
    color: "#9CA3AF",
    criteria: { type: "total_logs", count: 1 },
  },
  {
    key: "constructed_debut",
    title: "Constructed Debut",
    description: "Log your first constructed match.",
    rarity: "common",
    icon: "CON",
    color: "#9CA3AF",
    criteria: { type: "constructed_logs", count: 1 },
  },
  {
    key: "draft_debut",
    title: "Draft Debut",
    description: "Log your first live draft match.",
    rarity: "common",
    icon: "DRF",
    color: "#9CA3AF",
    criteria: { type: "live_draft_logs", count: 1 },
  },
  {
    key: "first_win",
    title: "First Victory",
    description: "Record your first win.",
    rarity: "uncommon",
    icon: "WIN",
    color: "#A78BFA",
    criteria: { type: "wins", count: 1 },
  },
  {
    key: "public_record",
    title: "Public Record",
    description: "Make a game log public.",
    rarity: "uncommon",
    icon: "PUB",
    color: "#A78BFA",
    criteria: { type: "public_logs", count: 1 },
  },
  {
    key: "mvp_spotlight",
    title: "MVP Spotlight",
    description: "Record at least one MVP card.",
    rarity: "uncommon",
    icon: "MVP",
    color: "#A78BFA",
    criteria: { type: "mvp_logs", count: 1 },
  },
  {
    key: "getting_consistent",
    title: "Getting Consistent",
    description: "Log 5 games.",
    rarity: "rare",
    icon: "5X",
    color: "#F59E0B",
    criteria: { type: "total_logs", count: 5 },
  },
  {
    key: "chronicler",
    title: "Chronicler",
    description: "Log 10 games.",
    rarity: "epic",
    icon: "10X",
    color: "#10B981",
    criteria: { type: "total_logs", count: 10 },
  },
];

const RARITY_XP = {
  common: 5,
  uncommon: 10,
  rare: 20,
  epic: 35,
  legendary: 50,
};

function meetsCriteria(criteria, metrics) {
  switch (criteria.type) {
    case "total_logs":
      return metrics.totalLogs >= criteria.count;
    case "wins":
      return metrics.winLogs >= criteria.count;
    case "constructed_logs":
      return metrics.constructedLogs >= criteria.count;
    case "live_draft_logs":
      return metrics.liveDraftLogs >= criteria.count;
    case "public_logs":
      return metrics.publicLogs >= criteria.count;
    case "mvp_logs":
      return metrics.mvpLogs >= criteria.count;
    default:
      return false;
  }
}

async function backfill() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  const users = db.collection("users");
  const badges = db.collection("badges");
  const userBadges = db.collection("userbadges");
  const gameLogs = db.collection("gamelogs");

  const now = new Date();

  for (const achievement of ACHIEVEMENTS) {
    if (DRY_RUN) continue;
    await badges.updateOne(
      { type: "achievement", key: achievement.key },
      {
        $set: {
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          color: achievement.color,
          updatedAt: now,
        },
        $setOnInsert: {
          type: "achievement",
          key: achievement.key,
          awardedAt: now,
          createdAt: now,
        },
      },
      { upsert: true }
    );
  }

  const badgeDocs = await badges
    .find({ type: "achievement", key: { $in: ACHIEVEMENTS.map((a) => a.key) } })
    .toArray();
  const badgeMap = new Map(badgeDocs.map((doc) => [doc.key, doc._id]));

  const userQuery = {};
  if (userFilter) {
    if (userFilter.includes("@")) {
      userQuery.email = userFilter;
    } else if (ObjectId.isValid(userFilter)) {
      userQuery._id = new ObjectId(userFilter);
    } else {
      throw new Error("Invalid --user value. Use email or ObjectId.");
    }
  }

  const allUsers = await users.find(userQuery).toArray();
  const userIds = allUsers.map((user) => user._id);

  if (RESET && !DRY_RUN && userIds.length > 0) {
    await userBadges.deleteMany({
      userId: { $in: userIds },
      badgeId: { $in: [...badgeMap.values()] },
    });
    await users.updateMany(
      { _id: { $in: userIds } },
      { $set: { achievementXp: 0, updatedAt: new Date() } }
    );
  }

  for (const user of allUsers) {
    const userId = user._id;
    const [totalLogs, winLogs, constructedLogs, liveDraftLogs, publicLogs, mvpLogs] =
      await Promise.all([
        gameLogs.countDocuments({ userId, seedTag: { $exists: false } }),
        gameLogs.countDocuments({ userId, seedTag: { $exists: false }, outcome: "win" }),
        gameLogs.countDocuments({ userId, seedTag: { $exists: false }, format: "constructed" }),
        gameLogs.countDocuments({ userId, seedTag: { $exists: false }, format: "live_draft" }),
        gameLogs.countDocuments({ userId, seedTag: { $exists: false }, isPublic: true }),
        gameLogs.countDocuments({
          userId,
          seedTag: { $exists: false },
          $or: [
            { "liveDraft.mvpCardIds.0": { $exists: true } },
            { "opponents.mvpCardIds.0": { $exists: true } },
          ],
        }),
      ]);

    const metrics = {
      totalLogs,
      winLogs,
      constructedLogs,
      liveDraftLogs,
      publicLogs,
      mvpLogs,
    };

    const existing = await userBadges
      .find({ userId, badgeId: { $in: [...badgeMap.values()] } })
      .toArray();
    const existingBadgeIds = new Set(
      existing.map((entry) => entry.badgeId.toString())
    );

    const earnedKeys = new Set();
    const inserts = [];

    for (const achievement of ACHIEVEMENTS) {
      const badgeId = badgeMap.get(achievement.key);
      if (!badgeId) continue;
      const shouldHave = meetsCriteria(achievement.criteria, metrics);
      if (!shouldHave) continue;
      earnedKeys.add(achievement.key);
      if (existingBadgeIds.has(badgeId.toString())) continue;
      inserts.push({
        userId,
        badgeId,
        awardedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (!DRY_RUN && inserts.length > 0) {
      await userBadges.insertMany(inserts, { ordered: false });
    }

    const totalXp = ACHIEVEMENTS.reduce((sum, achievement) => {
      if (!earnedKeys.has(achievement.key)) return sum;
      return sum + (RARITY_XP[achievement.rarity] || 0);
    }, 0);

    if (!DRY_RUN) {
      await users.updateOne(
        { _id: userId },
        { $set: { achievementXp: totalXp, updatedAt: new Date() } }
      );
    }

    console.log(
      `[${user.email || user._id}] achievements: ${earnedKeys.size}, xp: ${totalXp}`
    );
  }

  await client.close();
}

backfill().catch((error) => {
  console.error("Achievement backfill failed:", error);
  process.exit(1);
});
