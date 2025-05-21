import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

/**
 * GET /api/decks/[id]
 * Get a deck by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 14, we need to await the params object
    const resolvedParams = await params;
    const deckId = resolvedParams.id;

    const session = await getServerSession(authOptions);

    // Get the deck
    const deck = await deckService.getDeckById(deckId);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Check if the user has access to this deck
    if (
      !deck.isPublic &&
      (!session?.user?.id || deck.userId.toString() !== session.user.id)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to view this deck" },
        { status: 403 }
      );
    }

    // Get the full deck with card details
    const deckWithCards = await deckService.getDeckWithCards(deckId);

    return NextResponse.json(deckWithCards);
  } catch (error) {
    console.error(`Error getting deck:`, error);
    return NextResponse.json({ error: "Failed to get deck" }, { status: 500 });
  }
}

/**
 * PUT /api/decks/[id]
 * Update a deck
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 14, we need to await the params object
    const resolvedParams = await params;
    const deckId = resolvedParams.id;

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the existing deck
    const existingDeck = await deckService.getDeckById(deckId);

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Check if the user owns this deck
    if (existingDeck.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this deck" },
        { status: 403 }
      );
    }

    // Get the updated deck data
    const deckData = await request.json();

    // Update the deck
    const updatedDeck = await deckService.updateDeck(deckId, deckData);

    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error(`Error updating deck:`, error);
    return NextResponse.json(
      { error: "Failed to update deck" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/decks/[id]
 * Delete a deck
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 14, we need to await the params object
    const resolvedParams = await params;
    const deckId = resolvedParams.id;

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the existing deck
    const existingDeck = await deckService.getDeckById(deckId);

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Check if the user owns this deck
    if (existingDeck.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this deck" },
        { status: 403 }
      );
    }

    // Delete the deck
    const success = await deckService.deleteDeck(deckId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete deck" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting deck:`, error);
    return NextResponse.json(
      { error: "Failed to delete deck" },
      { status: 500 }
    );
  }
}
