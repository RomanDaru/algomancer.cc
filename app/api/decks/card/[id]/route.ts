import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  PUBLIC_DECKS_MAX_PAGE_SIZE,
  PUBLIC_DECKS_PAGE_SIZE,
} from "@/app/lib/constants";

/**
 * GET /api/decks/card/[id]
 * Get decks containing a specific card
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // In Next.js 14, we need to await the params object
    const resolvedParams = await params;
    const cardId = resolvedParams.id;

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor") || undefined;
    const withMeta = searchParams.get("withMeta") === "1";
    const requestedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
    const effectiveLimit = requestedLimit
      ? Math.min(Math.max(requestedLimit, 1), PUBLIC_DECKS_MAX_PAGE_SIZE)
      : PUBLIC_DECKS_PAGE_SIZE;
    const warnings: string[] = [];

    if (
      typeof requestedLimit === "number" &&
      Number.isFinite(requestedLimit) &&
      requestedLimit > PUBLIC_DECKS_MAX_PAGE_SIZE
    ) {
      warnings.push("limit_capped_to_max");
      console.warn("Card decks API limit capped", {
        cardId,
        requestedLimit,
        effectiveLimit,
      });
    }

    if (!withMeta) {
      const decksWithUserInfo = await deckService.getDecksContainingCardWithUserInfo(
        cardId,
        effectiveLimit,
        currentUserId
      );

      return NextResponse.json(decksWithUserInfo);
    }

    const response = await deckService.getDecksContainingCardPage({
      cardId,
      limit: effectiveLimit,
      cursor,
      currentUserId,
      requestedLimit,
      warnings,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid cursor") {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    console.error(`Error getting decks containing card:`, error);
    return NextResponse.json(
      { error: "Failed to get decks containing card" },
      { status: 500 }
    );
  }
}
