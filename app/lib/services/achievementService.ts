import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/app/lib/db/mongodb";
import { BadgeModel } from "@/app/lib/db/models/Badge";
import { UserBadgeModel } from "@/app/lib/db/models/UserBadge";
import { UserModel } from "@/app/lib/db/models/User";
import { GameLogModel } from "@/app/lib/db/models/GameLog";
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

  return {
    totalLogs,
    winLogs,
    constructedLogs,
    liveDraftLogs,
    publicLogs,
    mvpLogs,
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
    default:
      return false;
  }
};

export const achievementService = {
  async getAchievementSnapshot(userId: string): Promise<AchievementSnapshot> {
    const userObjectId = new ObjectId(userId);
    const badgeMap = await ensureAchievementBadges();
    const badgeIds = [...badgeMap.values()];

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

    if (achievementXp !== xpFromBadges) {
      const connection = await ensureDbConnection();
      await connection.db.collection("users").updateOne(
        { _id: userObjectId },
        { $set: { achievementXp: xpFromBadges, updatedAt: new Date() } }
      );
      achievementXp = xpFromBadges;
    }

    return {
      achievementXp: achievementXp ?? 0,
      achievements,
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
    const unlocked = ACHIEVEMENTS.filter(
      (achievement) =>
        !existingKeys.has(achievement.key) &&
        meetsCriteria(achievement.criteria, metrics)
    );

    if (unlocked.length === 0) {
      return {
        unlocked: [] as AchievementUnlock[],
        achievementXp: previousAchievementXp ?? 0,
        previousAchievementXp: previousAchievementXp ?? 0,
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

    const xpGained = unlocked.reduce(
      (sum, achievement) => sum + getAchievementXp(achievement.rarity),
      0
    );

    const allKeys = new Set<string>([...existingKeys, ...unlocked.map((a) => a.key)]);
    const xpFromBadges = ACHIEVEMENTS.reduce((sum, achievement) => {
      if (!allKeys.has(achievement.key)) return sum;
      return sum + getAchievementXp(achievement.rarity);
    }, 0);

    const connection = await ensureDbConnection();
    await connection.db.collection("users").updateOne(
      { _id: userObjectId },
      { $set: { achievementXp: xpFromBadges, updatedAt: new Date() } }
    );

    return {
      unlocked: unlocked.map((achievement) => ({
        ...achievement,
        xp: getAchievementXp(achievement.rarity),
      })),
      achievementXp:
        typeof xpFromBadges === "number" ? xpFromBadges : xpGained,
      previousAchievementXp: previousAchievementXp ?? 0,
    };
  },
};
