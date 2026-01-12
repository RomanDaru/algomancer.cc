import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/app/lib/db/mongodb";
import { BadgeModel } from "@/app/lib/db/models/Badge";
import { UserBadgeModel } from "@/app/lib/db/models/UserBadge";
import { UserModel } from "@/app/lib/db/models/User";
import { GameLogModel } from "@/app/lib/db/models/GameLog";
import { DeckModel } from "@/app/lib/db/models/Deck";
import { BASIC_ELEMENTS, type BasicElementType } from "@/app/lib/types/card";
import { parseAlgomancerDeckId } from "@/app/lib/utils/deckUrl";
import { calculateBonusXp } from "@/app/lib/utils/achievementXp";
import {
  ACHIEVEMENTS,
  AchievementCriteria,
  AchievementDefinition,
  getAchievementXp,
} from "@/app/lib/achievements/definitions";

type AchievementUnlock = AchievementDefinition & { xp: number };

type AchievementSnapshot = {
  achievementXp: number;
  achievements: Array<{
    definition: AchievementDefinition;
    unlocked: boolean;
    awardedAt?: Date;
  }>;
  metrics: Awaited<ReturnType<typeof getAchievementMetrics>>;
};

let dbConnection: Awaited<ReturnType<typeof connectToDatabase>> | null = null;

const ensureDbConnection = async () => {
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
  }
  return dbConnection;
};

const ensureAchievementBadges = async () => {
  await ensureDbConnection();
  const badgeMap = new Map<string, ObjectId>();
  const now = new Date();

  const badgeDocs = await Promise.all(
    ACHIEVEMENTS.map((achievement) =>
      BadgeModel.findOneAndUpdate(
        { type: "achievement", key: achievement.key },
        {
          $set: {
            type: "achievement",
            key: achievement.key,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            color: achievement.color,
          },
          $setOnInsert: {
            awardedAt: now,
          },
        },
        { upsert: true, new: true }
      )
    )
  );

  badgeDocs.forEach((doc, index) => {
    if (doc) {
      badgeMap.set(ACHIEVEMENTS[index].key, doc._id);
    }
  });

  return badgeMap;
};

const getAchievementMetrics = async (userId: ObjectId) => {
  await ensureDbConnection();

  const baseQuery = {
    userId,
    seedTag: { $exists: false },
  };

  const [
    totalLogs,
    winLogs,
    constructedLogs,
    liveDraftLogs,
    publicLogs,
    mvpLogs,
  ] = await Promise.all([
    GameLogModel.countDocuments(baseQuery),
    GameLogModel.countDocuments({ ...baseQuery, outcome: "win" }),
    GameLogModel.countDocuments({ ...baseQuery, format: "constructed" }),
    GameLogModel.countDocuments({ ...baseQuery, format: "live_draft" }),
    GameLogModel.countDocuments({ ...baseQuery, isPublic: true }),
    GameLogModel.countDocuments({
      ...baseQuery,
      $or: [
        { "liveDraft.mvpCardIds.0": { $exists: true } },
        { "opponents.mvpCardIds.0": { $exists: true } },
      ],
    }),
  ]);

  const elementLogs: Record<BasicElementType, number> = {
    Fire: 0,
    Water: 0,
    Earth: 0,
    Wood: 0,
    Metal: 0,
  };
  const elementWins: Record<BasicElementType, number> = {
    Fire: 0,
    Water: 0,
    Earth: 0,
    Wood: 0,
    Metal: 0,
  };
  Object.values(BASIC_ELEMENTS).forEach((element) => {
    elementLogs[element] = elementLogs[element] ?? 0;
    elementWins[element] = elementWins[element] ?? 0;
  });

  const logs = await GameLogModel.find(
    { ...baseQuery },
    {
      outcome: 1,
      format: 1,
      "liveDraft.elementsPlayed": 1,
      "constructed.deckId": 1,
      "constructed.externalDeckUrl": 1,
    }
  ).lean();

  const deckIdSet = new Set<string>();
  logs.forEach((log: any) => {
    const deckId = log?.constructed?.deckId?.toString?.();
    if (deckId) {
      deckIdSet.add(deckId);
    }
    if (typeof log?.constructed?.externalDeckUrl === "string") {
      const parsed = parseAlgomancerDeckId(log.constructed.externalDeckUrl);
      if (parsed) {
        deckIdSet.add(parsed);
      }
    }
  });

  const connection = await ensureDbConnection();
  const deckElementsMap = new Map<string, string[]>();
  if (deckIdSet.size > 0) {
    const deckIds = [...deckIdSet].map((id) => new ObjectId(id));
    const deckDocs = await connection.db
      .collection("decks")
      .find({ _id: { $in: deckIds } }, { projection: { deckElements: 1 } })
      .toArray();
    deckDocs.forEach((doc: any) => {
      deckElementsMap.set(doc._id.toString(), doc.deckElements || []);
    });
  }

  const basicElementSet = new Set(Object.values(BASIC_ELEMENTS));

  logs.forEach((log: any) => {
    let elements: string[] = [];
    if (log.format === "live_draft") {
      elements = Array.isArray(log?.liveDraft?.elementsPlayed)
        ? log.liveDraft.elementsPlayed
        : [];
    } else if (log.format === "constructed") {
      const deckId = log?.constructed?.deckId?.toString?.();
      const externalId =
        typeof log?.constructed?.externalDeckUrl === "string"
          ? parseAlgomancerDeckId(log.constructed.externalDeckUrl)
          : null;
      const lookupId = deckId || externalId;
      if (lookupId) {
        elements = deckElementsMap.get(lookupId) || [];
      }
    }

    const uniqueElements = Array.from(
      new Set(elements.filter((element) => basicElementSet.has(element)))
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

  return {
    totalLogs,
    winLogs,
    constructedLogs,
    liveDraftLogs,
    publicLogs,
    mvpLogs,
    elementLogs,
    elementWins,
  };
};

const meetsCriteria = (
  criteria: AchievementCriteria,
  metrics: Awaited<ReturnType<typeof getAchievementMetrics>>
) => {
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
      return (
        (metrics.elementLogs?.[criteria.element] || 0) >= criteria.count
      );
    case "element_wins":
      return (
        (metrics.elementWins?.[criteria.element] || 0) >= criteria.count
      );
    default:
      return false;
  }
};

const getCriteriaCount = (criteria: AchievementCriteria) => criteria.count;

const getBonusXp = async (userId: ObjectId) => {
  await ensureDbConnection();

  const [likesAgg, deckCounts] = await Promise.all([
    DeckModel.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]),
    DeckModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateTrunc: { date: "$createdAt", unit: "day" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalLikes = likesAgg?.[0]?.totalLikes ?? 0;

  return calculateBonusXp({
    totalLikes,
    deckCounts,
  });
};

export const achievementService = {
  async refreshUserXp(userId: string) {
    const userObjectId = new ObjectId(userId);
    const badgeMap = await ensureAchievementBadges();
    const badgeIds = [...badgeMap.values()];

    const userBadges = await UserBadgeModel.find({
      userId: userObjectId,
      badgeId: { $in: badgeIds },
    }).populate("badgeId");

    const awardedKeys = new Set(
      userBadges
        .map((userBadge) => (userBadge.badgeId as any)?.key)
        .filter(Boolean)
    );

    const xpFromBadges = ACHIEVEMENTS.reduce((sum, achievement) => {
      if (!awardedKeys.has(achievement.key)) return sum;
      return sum + getAchievementXp(achievement.rarity);
    }, 0);

    const bonusXp = await getBonusXp(userObjectId);
    const totalXp = xpFromBadges + bonusXp.totalBonusXp;

    const connection = await ensureDbConnection();
    await connection.db.collection("users").updateOne(
      { _id: userObjectId },
      { $set: { achievementXp: totalXp, updatedAt: new Date() } }
    );

    return totalXp;
  },
  async getAchievementSnapshot(userId: string): Promise<AchievementSnapshot> {
    const userObjectId = new ObjectId(userId);
    const badgeMap = await ensureAchievementBadges();
    const badgeIds = [...badgeMap.values()];
    const metrics = await getAchievementMetrics(userObjectId);
    const bonusXp = await getBonusXp(userObjectId);

    const [userBadges, userDoc] = await Promise.all([
      UserBadgeModel.find({
        userId: userObjectId,
        badgeId: { $in: badgeIds },
      }).populate("badgeId"),
      UserModel.findById(userObjectId, { achievementXp: 1 }),
    ]);

    let achievementXp =
      typeof userDoc?.achievementXp === "number" ? userDoc.achievementXp : null;
    if (achievementXp === null) {
      const connection = await ensureDbConnection();
      const rawUser = await connection.db
        .collection("users")
        .findOne({ _id: userObjectId }, { projection: { achievementXp: 1 } });
      achievementXp =
        typeof rawUser?.achievementXp === "number" ? rawUser.achievementXp : 0;
    }

    const awardedMap = new Map<string, Date>();
    userBadges.forEach((userBadge) => {
      const badge: any = userBadge.badgeId;
      if (badge?.key) {
        awardedMap.set(badge.key, userBadge.awardedAt);
      }
    });

    const achievements = ACHIEVEMENTS.map((definition) => ({
      definition,
      unlocked: awardedMap.has(definition.key),
      awardedAt: awardedMap.get(definition.key),
    }));

    const xpFromBadges = achievements.reduce((sum, achievement) => {
      if (!achievement.unlocked) return sum;
      return sum + getAchievementXp(achievement.definition.rarity);
    }, 0);

    const totalXp = xpFromBadges + bonusXp.totalBonusXp;

    if (achievementXp !== totalXp) {
      const connection = await ensureDbConnection();
      await connection.db.collection("users").updateOne(
        { _id: userObjectId },
        { $set: { achievementXp: totalXp, updatedAt: new Date() } }
      );
      achievementXp = totalXp;
    }

    return {
      achievementXp: achievementXp ?? 0,
      achievements,
      metrics,
    };
  },

  async awardAchievementsForUser(userId: string) {
    const userObjectId = new ObjectId(userId);
    const badgeMap = await ensureAchievementBadges();

    const userDoc = await UserModel.findById(userObjectId, {
      achievementXp: 1,
    });
    let previousAchievementXp =
      typeof userDoc?.achievementXp === "number"
        ? userDoc.achievementXp
        : null;
    if (previousAchievementXp === null) {
      const connection = await ensureDbConnection();
      const rawUser = await connection.db
        .collection("users")
        .findOne({ _id: userObjectId }, { projection: { achievementXp: 1 } });
      previousAchievementXp =
        typeof rawUser?.achievementXp === "number" ? rawUser.achievementXp : 0;
    }

    const existingBadges = await UserBadgeModel.find({
      userId: userObjectId,
      badgeId: { $in: [...badgeMap.values()] },
    }).populate("badgeId");

    const existingKeys = new Set(
      existingBadges
        .map((userBadge) => (userBadge.badgeId as any)?.key)
        .filter(Boolean)
    );

    const metrics = await getAchievementMetrics(userObjectId);
    const chainGroups = new Map<string, AchievementDefinition[]>();
    const unlocked: AchievementDefinition[] = [];

    ACHIEVEMENTS.forEach((achievement) => {
      if (achievement.seriesKey) {
        const group = chainGroups.get(achievement.seriesKey) ?? [];
        group.push(achievement);
        chainGroups.set(achievement.seriesKey, group);
        return;
      }

      if (
        !existingKeys.has(achievement.key) &&
        meetsCriteria(achievement.criteria, metrics)
      ) {
        unlocked.push(achievement);
      }
    });

    chainGroups.forEach((group) => {
      const qualified = group.filter((achievement) =>
        meetsCriteria(achievement.criteria, metrics)
      );
      if (qualified.length === 0) return;

      const maxQualifiedCount = Math.max(
        ...qualified.map((achievement) =>
          getCriteriaCount(achievement.criteria)
        )
      );

      group
        .slice()
        .sort(
          (left, right) =>
            getCriteriaCount(left.criteria) - getCriteriaCount(right.criteria)
        )
        .forEach((achievement) => {
          if (getCriteriaCount(achievement.criteria) > maxQualifiedCount) return;
          if (existingKeys.has(achievement.key)) return;
          if (unlocked.some((entry) => entry.key === achievement.key)) return;
          unlocked.push(achievement);
        });
    });

    if (unlocked.length === 0) {
      const xpFromBadges = ACHIEVEMENTS.reduce((sum, achievement) => {
        if (!existingKeys.has(achievement.key)) return sum;
        return sum + getAchievementXp(achievement.rarity);
      }, 0);
      const bonusXp = await getBonusXp(userObjectId);
      const totalXp = xpFromBadges + bonusXp.totalBonusXp;
      return {
        unlocked: [] as AchievementUnlock[],
        achievementXp: totalXp,
        previousAchievementXp: previousAchievementXp ?? totalXp,
      };
    }

    const now = new Date();
    const badgeInserts = unlocked
      .map((achievement) => {
        const badgeId = badgeMap.get(achievement.key);
        if (!badgeId) return null;
        return {
          userId: userObjectId,
          badgeId,
          awardedAt: now,
        };
      })
      .filter(Boolean);

    if (badgeInserts.length > 0) {
      await UserBadgeModel.insertMany(badgeInserts, { ordered: false });
    }

    const allKeys = new Set<string>([...existingKeys, ...unlocked.map((a) => a.key)]);
    const xpFromBadges = ACHIEVEMENTS.reduce((sum, achievement) => {
      if (!allKeys.has(achievement.key)) return sum;
      return sum + getAchievementXp(achievement.rarity);
    }, 0);

    const bonusXp = await getBonusXp(userObjectId);
    const totalXp = xpFromBadges + bonusXp.totalBonusXp;

    const connection = await ensureDbConnection();
    await connection.db.collection("users").updateOne(
      { _id: userObjectId },
      { $set: { achievementXp: totalXp, updatedAt: new Date() } }
    );

    return {
      unlocked: unlocked.map((achievement) => ({
        ...achievement,
        xp: getAchievementXp(achievement.rarity),
      })),
      achievementXp: totalXp,
      previousAchievementXp: previousAchievementXp ?? 0,
    };
  },
};
