import { NextRequest, NextResponse } from "next/server";
import { cardService } from "@/app/lib/services/cardService";
import { Card } from "@/app/lib/types/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/cards
 * Get all cards
 */
export async function GET(_request: NextRequest) {
  try {
    const cards = await cardService.getAllCards();

    const response = NextResponse.json(cards);

    // cardService owns the tagged data cache. Do not keep a separate HTTP
    // response cache that can outlive catalog invalidation after writes.
    response.headers.set("Cache-Control", "no-store");
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
