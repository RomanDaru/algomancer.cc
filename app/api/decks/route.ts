import { NextRequest, NextResponse } from 'next/server';
import { deckService } from '@/app/lib/services/deckService';
import { achievementService } from "@/app/lib/services/achievementService";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { DECK_BADGES } from "@/app/lib/constants";

/**
 * GET /api/decks
 * Get all decks for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const decks = await deckService.getUserDecks(session.user.id);
    return NextResponse.json(decks);
  } catch (error) {
    console.error('Error getting decks:', error);
    return NextResponse.json(
      { error: 'Failed to get decks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/decks
 * Create a new deck
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const deckData = await request.json();
    const rawBadges = Array.isArray(deckData?.deckBadges)
      ? deckData.deckBadges
      : deckData?.deckBadge
      ? [deckData.deckBadge]
      : [];
    const allowedBadges = new Set(Object.values(DECK_BADGES));
    const deckBadges = rawBadges
      .map((badge: unknown) =>
        typeof badge === "string" ? badge.trim() : ""
      )
      .filter((badge: string) => badge && allowedBadges.has(badge))
      .filter((badge: string, index: number, self: string[]) =>
        self.indexOf(badge) === index
      )
      .slice(0, 2);
    deckData.deckBadges = deckBadges;
    delete deckData.deckBadge;
    
    if (!deckData.name) {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }
    
    // Set the user ID for the deck
    deckData.userId = new ObjectId(session.user.id);
    
    // Create the deck
    const deck = await deckService.createDeck(deckData);

    try {
      await achievementService.refreshUserXp(session.user.id);
    } catch (error) {
      console.error("Error refreshing XP after deck creation:", error);
    }
    
    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error('Error creating deck:', error);
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    );
  }
}
