import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { ObjectId } from "mongodb";

/**
 * POST /api/decks/[id]/like
 * Toggle like/unlike for a deck
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 14, we need to await the params object
    const resolvedParams = await params;
    const deckId = resolvedParams.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = new ObjectId(session.user.id);

    // Check if deck exists and is public
    const deck = await deckService.getDeckById(deckId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (!deck.isPublic) {
      return NextResponse.json(
        { error: "Cannot like private decks" },
        { status: 403 }
      );
    }

    // Prevent users from liking their own decks
    if (deck.userId.toString() === userId.toString()) {
      return NextResponse.json(
        { error: "Cannot like your own deck" },
        { status: 403 }
      );
    }

    // Toggle like status
    const result = await deckService.toggleDeckLike(deckId, userId);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to update like status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      liked: result.liked,
      likes: result.likes,
    });
  } catch (error) {
    console.error("Error toggling deck like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/decks/[id]/like
 * Check if current user has liked the deck
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 14, we need to await the params object
    const resolvedParams = await params;
    const deckId = resolvedParams.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ liked: false, likes: 0 });
    }

    const userId = new ObjectId(session.user.id);

    // Get deck and check like status
    const deck = await deckService.getDeckById(deckId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const liked = deck.likedBy.some(id => id.toString() === userId.toString());

    return NextResponse.json({
      liked,
      likes: deck.likes || 0,
    });
  } catch (error) {
    console.error("Error checking deck like status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
