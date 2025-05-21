import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";

/**
 * POST /api/decks/[id]/view
 * Increment the view count for a deck
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 14, we need to await the params object
    const resolvedParams = await params;
    const deckId = resolvedParams.id;

    // Get client IP or a unique identifier
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Get the session ID from the request cookies if available
    const sessionId =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value ||
      null;

    // Use a combination of IP and session ID as the viewer identifier
    // This helps prevent abuse while still allowing legitimate views
    const viewerId = sessionId ? `${ip}-${sessionId.substring(0, 10)}` : ip;

    // First check if the deck exists
    const deck = await deckService.getDeckById(deckId);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Increment the view count
    const updatedDeck = await deckService.incrementDeckViews(deckId, viewerId);

    if (!updatedDeck) {
      return NextResponse.json(
        { error: "Failed to update view count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      views: updatedDeck.views,
    });
  } catch (error) {
    console.error(`Error incrementing view count:`, error);
    return NextResponse.json(
      { error: "Failed to increment view count" },
      { status: 500 }
    );
  }
}
