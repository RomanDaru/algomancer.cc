import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { deckDbService } from "@/app/lib/db/services/deckDbService";
import { achievementService } from "@/app/lib/services/achievementService";
import { ObjectId } from "mongodb";

/**
 * POST /api/decks/[id]/copy
 * Duplicate a deck into the current user's account.
 * - Clears youtubeUrl
 * - Defaults to private (isPublic=false)
 * - Resets metrics (likes/views via schema defaults)
 * - Appends "(Copy from {owner})" to the name
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const sourceDeckId = resolvedParams.id;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Load source deck
    const sourceDeck = await deckService.getDeckById(sourceDeckId);
    if (!sourceDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Permission: allow copying public decks or user's own private decks
    const isOwner = sourceDeck.userId.toString() === session.user.id;
    if (!sourceDeck.isPublic && !isOwner) {
      return NextResponse.json(
        { error: "You do not have permission to copy this deck" },
        { status: 403 }
      );
    }

    // Get owner info for attribution in the name
    const ownerInfo = await deckDbService.getDeckUserInfo(
      sourceDeck.userId.toString()
    );
    const ownerAttribution = ownerInfo.username || ownerInfo.name || "Unknown";

    // Build the new deck payload
    const newDeckPayload = {
      name: `${sourceDeck.name} (Copy from ${ownerAttribution})`,
      description: sourceDeck.description || "",
      // youtubeUrl intentionally cleared
      userId: new ObjectId(session.user.id),
      cards: sourceDeck.cards.map((c) => ({ cardId: c.cardId, quantity: c.quantity })),
      isPublic: false, // default to private
    };

    const newDeck = await deckService.createDeck(newDeckPayload);

    try {
      await achievementService.refreshUserXp(session.user.id);
    } catch (error) {
      console.error("Error refreshing XP after deck copy:", error);
    }

    return NextResponse.json({ deckId: newDeck._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Error copying deck:", error);
    return NextResponse.json(
      { error: "Failed to copy deck" },
      { status: 500 }
    );
  }
}

