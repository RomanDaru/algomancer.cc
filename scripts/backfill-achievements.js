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

const RARITY_XP = {
  common: 5,
  uncommon: 10,
  rare: 20,
  epic: 35,
  legendary: 50,
};

const BASIC_ELEMENTS = ["Fire", "Water", "Earth", "Wood", "Metal"];
const ELEMENT_ICON_PREFIX = {
  Fire: "Fi",
  Water: "Wa",
  Earth: "Ea",
  Wood: "Wo",
  Metal: "Me",
};
const ELEMENT_TIERS = [
  { count: 5, label: "I" },
  { count: 10, label: "II" },
  { count: 25, label: "III" },
  { count: 50, label: "IV" },
];

const buildElementChain = (kind, rarity, titleBase) =>
  BASIC_ELEMENTS.flatMap((element) =>
    ELEMENT_TIERS.map((tier, index) => {
      const suffix = index === 0 ? "" : ` ${tier.label}`;
      return {
        key: `${element.toLowerCase()}_${kind === "element_logs" ? "played" : "wins"}_${tier.count}`,
        title: `${element} ${titleBase}${suffix}`,
        description:
          kind === "element_logs"
            ? `Log ${tier.count} games with ${element}.`
            : `Win ${tier.count} games with ${element}.`,
        rarity,
        icon: `${ELEMENT_ICON_PREFIX[element]}${tier.count}`,
        color: rarity === "epic" ? "#10B981" : "#F59E0B",
        criteria: { type: kind, element, count: tier.count },
        seriesKey: `${kind}_${element.toLowerCase()}`,
        tier: index + 1,
      };
    })
  );

const ACHIEVEMENTS = [
  {
    key: "first_log",
    title: "First Log",
    description: "Record your first game log.",
    rarity: "rare",
    icon: "LOG",
    color: "#F59E0B",
    criteria: { type: "total_logs", count: 1 },
    seriesKey: "total_logs",
    tier: 1,
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
    rarity: "epic",
    icon: "W1",
    color: "#10B981",
    criteria: { type: "wins", count: 1 },
    seriesKey: "wins",
    tier: 1,
  },
  {
    key: "wins_5",
    title: "Winning Streak",
    description: "Record 5 wins.",
    rarity: "epic",
    icon: "W5",
    color: "#10B981",
    criteria: { type: "wins", count: 5 },
    seriesKey: "wins",
    tier: 2,
  },
  {
    key: "wins_10",
    title: "Victory Lap",
    description: "Record 10 wins.",
    rarity: "epic",
    icon: "W10",
    color: "#10B981",
    criteria: { type: "wins", count: 10 },
    seriesKey: "wins",
    tier: 3,
  },
  {
    key: "wins_25",
    title: "Relentless",
    description: "Record 25 wins.",
    rarity: "epic",
    icon: "W25",
    color: "#10B981",
    criteria: { type: "wins", count: 25 },
    seriesKey: "wins",
    tier: 4,
  },
  {
    key: "wins_50",
    title: "Unstoppable",
    description: "Record 50 wins.",
    rarity: "epic",
    icon: "W50",
    color: "#10B981",
    criteria: { type: "wins", count: 50 },
    seriesKey: "wins",
    tier: 5,
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
    seriesKey: "total_logs",
    tier: 2,
  },
  {
    key: "chronicler",
    title: "Chronicler",
    description: "Log 10 games.",
    rarity: "rare",
    icon: "10X",
    color: "#F59E0B",
    criteria: { type: "total_logs", count: 10 },
    seriesKey: "total_logs",
    tier: 3,
  },
  {
    key: "archivist",
    title: "Archivist",
    description: "Log 25 games.",
    rarity: "rare",
    icon: "25X",
    color: "#F59E0B",
    criteria: { type: "total_logs", count: 25 },
    seriesKey: "total_logs",
    tier: 4,
  },
  {
    key: "loremaster",
    title: "Loremaster",
    description: "Log 50 games.",
    rarity: "rare",
    icon: "50X",
    color: "#F59E0B",
    criteria: { type: "total_logs", count: 50 },
    seriesKey: "total_logs",
    tier: 5,
  },
  ...buildElementChain("element_logs", "rare", "Mastery"),
  ...buildElementChain("element_wins", "epic", "Supremacy"),
];

const ALLOWED_HOSTS = new Set([
  "algomancer.cc",
  "www.algomancer.cc",
  "algomancer.gg",
  "www.algomancer.gg",
]);

const DECK_PATH_REGEX = /^\/decks\/([0-9a-fA-F]{24})(?:\/|$)/;

const parseDeckIdFromUrl = (value) => {
  try {
    const url = new URL(value);
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    const match = url.pathname.match(DECK_PATH_REGEX);
    return match ? match[1] : null;
  } catch {
    return null;
  }
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
    case "element_logs":
      return (metrics.elementLogs?.[criteria.element] || 0) >= criteria.count;
    case "element_wins":
      return (metrics.elementWins?.[criteria.element] || 0) >= criteria.count;
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

    const elementLogs = {};
    const elementWins = {};
    BASIC_ELEMENTS.forEach((element) => {
      elementLogs[element] = 0;
      elementWins[element] = 0;
    });

    const logs = await gameLogs
      .find(
        { userId, seedTag: { $exists: false } },
        {
          projection: {
            outcome: 1,
            format: 1,
            "liveDraft.elementsPlayed": 1,
            "constructed.deckId": 1,
            "constructed.externalDeckUrl": 1,
          },
        }
      )
      .toArray();

    const deckIdSet = new Set();
    logs.forEach((log) => {
      const deckId = log?.constructed?.deckId?.toString?.();
      if (deckId) {
        deckIdSet.add(deckId);
      }
      if (typeof log?.constructed?.externalDeckUrl === "string") {
        const parsed = parseDeckIdFromUrl(log.constructed.externalDeckUrl);
        if (parsed) {
          deckIdSet.add(parsed);
        }
      }
    });

    const deckElementsMap = new Map();
    if (deckIdSet.size > 0) {
      const deckDocs = await db
        .collection("decks")
        .find({ _id: { $in: [...deckIdSet].map((id) => new ObjectId(id)) } })
        .project({ deckElements: 1 })
        .toArray();
      deckDocs.forEach((doc) => {
        deckElementsMap.set(doc._id.toString(), doc.deckElements || []);
      });
    }

    const elementSet = new Set(BASIC_ELEMENTS);
    logs.forEach((log) => {
      let elements = [];
      if (log.format === "live_draft") {
        elements = Array.isArray(log?.liveDraft?.elementsPlayed)
          ? log.liveDraft.elementsPlayed
          : [];
      } else if (log.format === "constructed") {
        const deckId = log?.constructed?.deckId?.toString?.();
        const externalId =
          typeof log?.constructed?.externalDeckUrl === "string"
            ? parseDeckIdFromUrl(log.constructed.externalDeckUrl)
            : null;
        const lookupId = deckId || externalId;
        if (lookupId) {
          elements = deckElementsMap.get(lookupId) || [];
        }
      }

      const uniqueElements = Array.from(
        new Set(elements.filter((element) => elementSet.has(element)))
      );
      if (uniqueElements.length === 0) return;
      const weight = uniqueElements.length >= 2 ? 0.5 : 1;

      uniqueElements.forEach((element) => {
        elementLogs[element] = (elementLogs[element] || 0) + weight;
        if (log.outcome === "win") {
          elementWins[element] = (elementWins[element] || 0) + weight;
        }
      });
    });

    const metrics = {
      totalLogs,
      winLogs,
      constructedLogs,
      liveDraftLogs,
      publicLogs,
      mvpLogs,
      elementLogs,
      elementWins,
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

    const badgeXp = ACHIEVEMENTS.reduce((sum, achievement) => {
      if (!earnedKeys.has(achievement.key)) return sum;
      return sum + (RARITY_XP[achievement.rarity] || 0);
    }, 0);

    const [likesAgg, deckCounts] = await Promise.all([
      db
        .collection("decks")
        .aggregate([
          { $match: { userId } },
          { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
        ])
        .toArray(),
      db
        .collection("decks")
        .aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: { $dateTrunc: { date: "$createdAt", unit: "day" } },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);

    const totalLikes = likesAgg?.[0]?.totalLikes ?? 0;
    const likeXp = totalLikes * 5;
    const maxDecksPerDay = Math.floor(50 / 10);
    const deckXp = deckCounts.reduce((sum, entry) => {
      const count = typeof entry?.count === "number" ? entry.count : 0;
      return sum + Math.min(count, maxDecksPerDay) * 10;
    }, 0);

    const totalXp = badgeXp + likeXp + deckXp;

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
