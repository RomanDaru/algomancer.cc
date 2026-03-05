import { NextRequest, NextResponse } from "next/server";
import { cardService } from "@/app/lib/services/cardService";
import { Card } from "@/app/lib/types/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/cards
 * Get all cards
 * Query params:
 * - clearCache=true: Clear the card cache before fetching
 */
export async function GET(request: NextRequest) {
  try {
    // Check if cache should be cleared
    const { searchParams } = new URL(request.url);
    const clearCache = searchParams.get("clearCache") === "true";

    if (clearCache) {
      cardService.clearCache();
    }

    const cards = await cardService.getAllCards();

    const response = NextResponse.json(cards);

    // Add aggressive caching for cards (they rarely change)
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=600, stale-while-revalidate=1800"
    );
    response.headers.set("Content-Type", "application/json; charset=utf-8");

    return response;
  } catch (error) {
    console.error("Error getting cards:", error);
    return NextResponse.json({ error: "Failed to get cards" }, { status: 500 });
  }
}

/**
 * POST /api/cards
 * Create or update a card
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const card = (await request.json()) as Card;

    if (!card.id || !card.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const savedCard = await cardService.saveCard(card);
    return NextResponse.json(savedCard);
  } catch (error) {
    console.error("Error saving card:", error);
    return NextResponse.json({ error: "Failed to save card" }, { status: 500 });
  }
}
