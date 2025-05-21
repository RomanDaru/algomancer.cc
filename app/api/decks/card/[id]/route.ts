import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";

/**
 * GET /api/decks/card/[id]
 * Get decks containing a specific card
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 14, we need to await the params object
    const resolvedParams = await params;
    const cardId = resolvedParams.id;

    // Get the limit parameter from the URL query
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Get decks containing the card
    const decksWithUserInfo =
      await deckService.getDecksContainingCardWithUserInfo(cardId, limit);

    return NextResponse.json(decksWithUserInfo);
  } catch (error) {
    console.error(`Error getting decks containing card:`, error);
    return NextResponse.json(
      { error: "Failed to get decks containing card" },
      { status: 500 }
    );
  }
}
