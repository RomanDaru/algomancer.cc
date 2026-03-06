import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongodb";
import { GameLogModel } from "../models/GameLog";
import type { StatsScope } from "../../types/gameStats";

export interface GameLogStatsQuery {
  scope: StatsScope;
  userId?: string;
  from?: Date;
  to?: Date;
  includeUserIds?: string[];
}

export interface GameLogStatsAggregate {
  summary: Array<{
    total: number;
    wins: number;
    losses: number;
    draws: number;
    avgDurationMinutes: number;
  }>;
  byFormat: Array<{
    _id: string;
    total: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
  byMatchType: Array<{
    _id: string;
    total: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
  timeSeries: Array<{
    _id: Date;
    total: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
  elements: Array<{
    _id: string;
    total: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
  mvpCards: Array<{
    _id: string;
    total: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
  decks: Array<{
    _id: ObjectId;
    total: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
}

let dbConnection: Awaited<ReturnType<typeof connectToDatabase>> | null = null;

async function ensureDbConnection() {
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
  }
  return dbConnection;
}

const sumIfOutcome = (outcome: string) => ({
  $sum: {
    $cond: [{ $eq: ["$outcome", outcome] }, 1, 0],
  },
});

const buildEmptyFacet = () => [{ $match: { _id: null } }];

const buildMvpCardsFacet = (scope: StatsScope) => {
  if (scope === "communitySnapshot") {
    return buildEmptyFacet();
  }

  return [
    {
      $project: {
        outcome: 1,
        mvpCards: {
          $setUnion: [
            { $ifNull: ["$liveDraft.mvpCardIds", []] },
            {
              $reduce: {
                input: { $ifNull: ["$opponents", []] },
                initialValue: [],
                in: {
                  $setUnion: ["$$value", { $ifNull: ["$$this.mvpCardIds", []] }],
                },
              },
            },
          ],
        },
      },
    },
    { $match: { "mvpCards.0": { $exists: true } } },
    { $unwind: "$mvpCards" },
    {
      $group: {
        _id: "$mvpCards",
        total: { $sum: 1 },
        wins: sumIfOutcome("win"),
        losses: sumIfOutcome("loss"),
        draws: sumIfOutcome("draw"),
      },
    },
    { $sort: { total: -1 } },
  ];
};

const buildDeckFacet = (scope: StatsScope) => {
  if (scope === "communitySnapshot") {
    return buildEmptyFacet();
  }

  const facet: Array<Record<string, unknown>> = [
    {
      $match: {
        format: "constructed",
        "constructed.deckId": { $exists: true, $ne: null },
      },
    },
  ];

  if (scope === "publicMeta") {
    facet.push(
      {
        $lookup: {
          from: "decks",
          localField: "constructed.deckId",
          foreignField: "_id",
          as: "deck",
        },
      },
      { $unwind: "$deck" },
      { $match: { "deck.isPublic": true } }
    );
  }

  facet.push(
    {
      $group: {
        _id: "$constructed.deckId",
        total: { $sum: 1 },
        wins: sumIfOutcome("win"),
        losses: sumIfOutcome("loss"),
        draws: sumIfOutcome("draw"),
      },
    },
    { $sort: { total: -1 } }
  );

  return facet;
};

export const gameLogStatsDbService = {
  async getGameLogStatsAggregate(
    query: GameLogStatsQuery
  ): Promise<GameLogStatsAggregate> {
    await ensureDbConnection();

    const match: Record<string, unknown> = {
      seedTag: { $exists: false },
    };

    if (query.scope === "my") {
      if (!query.userId) {
        throw new Error("userId is required for my stats");
      }
      match.userId = new ObjectId(query.userId);
    } else if (query.scope === "publicMeta") {
      match.isPublic = true;
    } else {
      match.$or = [{ isPublic: true }, { includeInCommunityStats: true }];
    }

    if (query.from || query.to) {
      const playedAt: Record<string, Date> = {};
      if (query.from) {
        playedAt.$gte = query.from;
      }
      if (query.to) {
        playedAt.$lte = query.to;
      }
      match.playedAt = playedAt;
    }

    const [result] = await GameLogModel.aggregate([
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                wins: sumIfOutcome("win"),
                losses: sumIfOutcome("loss"),
                draws: sumIfOutcome("draw"),
                avgDurationMinutes: { $avg: "$durationMinutes" },
              },
            },
          ],
          byFormat: [
            {
              $group: {
                _id: "$format",
                total: { $sum: 1 },
                wins: sumIfOutcome("win"),
                losses: sumIfOutcome("loss"),
                draws: sumIfOutcome("draw"),
              },
            },
          ],
          byMatchType: [
            {
              $group: {
                _id: "$matchType",
                total: { $sum: 1 },
                wins: sumIfOutcome("win"),
                losses: sumIfOutcome("loss"),
                draws: sumIfOutcome("draw"),
              },
            },
          ],
          timeSeries: [
            {
              $group: {
                _id: {
                  $dateTrunc: {
                    date: "$playedAt",
                    unit: "day",
                  },
                },
                total: { $sum: 1 },
                wins: sumIfOutcome("win"),
                losses: sumIfOutcome("loss"),
                draws: sumIfOutcome("draw"),
              },
            },
            { $sort: { _id: 1 } },
          ],
          elements: [
            {
              $match: {
                format: "live_draft",
                "liveDraft.elementsPlayed.0": { $exists: true },
              },
            },
            { $unwind: "$liveDraft.elementsPlayed" },
            {
              $group: {
                _id: "$liveDraft.elementsPlayed",
                total: { $sum: 1 },
                wins: sumIfOutcome("win"),
                losses: sumIfOutcome("loss"),
                draws: sumIfOutcome("draw"),
              },
            },
            { $sort: { total: -1 } },
          ],
          mvpCards: buildMvpCardsFacet(query.scope),
          decks: buildDeckFacet(query.scope),
        },
      },
    ]);

    return (
      result || {
        summary: [],
        byFormat: [],
        byMatchType: [],
        timeSeries: [],
        elements: [],
        mvpCards: [],
        decks: [],
      }
    );
  },
};
