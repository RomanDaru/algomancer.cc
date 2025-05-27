import { NextRequest, NextResponse } from "next/server";
import { cardService } from "@/app/lib/services/cardService";
import { Card } from "@/app/lib/types/card";

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
    return NextResponse.json(cards);
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
