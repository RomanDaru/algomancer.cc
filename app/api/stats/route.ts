import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { gameLogStatsDbService } from "@/app/lib/db/services/gameLogStatsDbService";
import { CardModel } from "@/app/lib/db/models/Card";
import { DeckModel } from "@/app/lib/db/models/Deck";
import type {
  CardPreview,
  GameStatsResponse,
  StatsFormatBreakdown,
  StatsMatchTypeBreakdown,
  StatsScope,
} from "@/app/lib/types/gameStats";
import { BASIC_ELEMENTS } from "@/app/lib/types/card";
import { ObjectId } from "mongodb";
import {
  buildRankedLists,
  normalizeBreakdown,
} from "@/app/lib/utils/gameStatsUtils";

const FORMAT_KEYS = ["constructed", "live_draft"] as const;
const MATCH_TYPE_KEYS = ["1v1", "2v2", "ffa", "custom"] as const;
const ELEMENT_KEYS = Object.values(BASIC_ELEMENTS);

const parseDateParam = (value: string | null, isEnd: boolean) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const parsed = new Date(
    isDateOnly
      ? `${trimmed}T${isEnd ? "23:59:59.999" : "00:00:00.000"}Z`
      : trimmed
  );
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeParam = (searchParams.get("scope") || "my") as StatsScope;

    if (scopeParam !== "my" && scopeParam !== "community") {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }

    const from = parseDateParam(searchParams.get("from"), false);
    const to = parseDateParam(searchParams.get("to"), true);

    if (from === null || to === null) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    if (from && to && from > to) {
      return NextResponse.json(
        { error: "from must be before to" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (scopeParam === "my" && !session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const aggregate = await gameLogStatsDbService.getGameLogStatsAggregate({
      scope: scopeParam,
      userId: session?.user?.id,
      from: from || undefined,
      to: to || undefined,
    });

    const summaryRaw = aggregate.summary[0];
    const summary = summaryRaw
      ? normalizeBreakdown({
          total: summaryRaw.total,
          wins: summaryRaw.wins,
          losses: summaryRaw.losses,
          draws: summaryRaw.draws,
          winRate: 0,
          avgDurationMinutes: summaryRaw.avgDurationMinutes || 0,
        })
      : {
          total: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          avgDurationMinutes: 0,
        };

    const byFormat: StatsFormatBreakdown[] = FORMAT_KEYS.map((format) => {
      const item = aggregate.byFormat.find((entry) => entry._id === format);
      const base = {
        format,
        total: item?.total || 0,
        wins: item?.wins || 0,
        losses: item?.losses || 0,
        draws: item?.draws || 0,
        winRate: 0,
      };
      return normalizeBreakdown(base);
    });

    const byMatchType: StatsMatchTypeBreakdown[] = MATCH_TYPE_KEYS.map(
      (matchType) => {
        const item = aggregate.byMatchType.find((entry) => entry._id === matchType);
        const base = {
          matchType,
          total: item?.total || 0,
          wins: item?.wins || 0,
          losses: item?.losses || 0,
          draws: item?.draws || 0,
          winRate: 0,
        };
        return normalizeBreakdown(base);
      }
    );

    const timeSeries = aggregate.timeSeries.map((entry) =>
      normalizeBreakdown({
        day: new Date(entry._id).toISOString(),
        total: entry.total,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        winRate: 0,
      })
    );

    const elements = ELEMENT_KEYS.map((element) => {
      const item = aggregate.elements.find((entry) => entry._id === element);
      const base = {
        element,
        total: item?.total || 0,
        wins: item?.wins || 0,
        losses: item?.losses || 0,
        draws: item?.draws || 0,
        winRate: 0,
      };
      return normalizeBreakdown(base);
    });

    const mvpCards = buildRankedLists(
      aggregate.mvpCards.map((entry) => ({
        cardId: entry._id,
        total: entry.total,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        winRate: 0,
      }))
    );

    const decks = buildRankedLists(
      aggregate.decks.map((entry) => ({
        deckId: entry._id.toString(),
        total: entry.total,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        winRate: 0,
      }))
    );

    const cardLookup: Record<string, CardPreview> = {};
    const deckLookup: Record<string, string> = {};
    const cardIds = Array.from(
      new Set(
        [...mvpCards.mostPlayed, ...mvpCards.highestWinRate].map(
          (item) => item.cardId
        )
      )
    );
    const deckIds = Array.from(
      new Set(
        [...decks.mostPlayed, ...decks.highestWinRate].map((item) => item.deckId)
      )
    );

    if (cardIds.length > 0 || deckIds.length > 0) {
      const { connectToDatabase } = await import("@/app/lib/db/mongodb");
      await connectToDatabase();
    }

    if (cardIds.length > 0) {
      const cardDocs = await CardModel.find(
        { originalId: { $in: cardIds } },
        "originalId name imageUrl"
      ).lean();
      cardDocs.forEach((card) => {
        cardLookup[card.originalId] = {
          id: card.originalId,
          name: card.name,
          imageUrl: card.imageUrl,
        };
      });
    }

    if (deckIds.length > 0) {
      const deckObjectIds = deckIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (deckObjectIds.length > 0) {
        const deckQuery: Record<string, any> = {
          _id: { $in: deckObjectIds },
        };
        if (scopeParam === "community") {
          deckQuery.isPublic = true;
        }
        const deckDocs = await DeckModel.find(deckQuery, "name").lean();
        deckDocs.forEach((deck) => {
          deckLookup[deck._id.toString()] = deck.name || "Deck";
        });
      }
    }

    const response: GameStatsResponse = {
      scope: scopeParam,
      range: {
        from: from ? from.toISOString() : undefined,
        to: to ? to.toISOString() : undefined,
      },
      summary,
      byFormat,
      byMatchType,
      timeSeries,
      elements,
      mvpCards,
      decks,
      cardLookup,
      deckLookup,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting stats:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
