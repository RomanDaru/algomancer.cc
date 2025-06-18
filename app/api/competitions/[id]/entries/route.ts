import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { competitionDbService } from "@/app/lib/db/services/competitionDbService";
import { ObjectId } from "mongodb";
import { COMPETITION_STATUS } from "@/app/lib/constants";
import { connectToDatabase } from "@/app/lib/db/mongodb";

// Batch fetch functions to avoid N+1 queries
async function getBatchDecks(deckIds: ObjectId[]): Promise<Map<string, any>> {
  if (deckIds.length === 0) return new Map();

  const { db } = await connectToDatabase();
  const decks = await db
    .collection("decks")
    .find(
      { _id: { $in: deckIds } },
      {
        projection: {
          name: 1,
          description: 1,
          userId: 1,
          isPublic: 1,
          cards: 1, // Include cards for submission display
          elements: 1,
          totalCards: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .toArray();

  const deckMap = new Map();
  decks.forEach((deck) => {
    deckMap.set(deck._id.toString(), {
      _id: deck._id.toString(),
      name: deck.name,
      description: deck.description,
      userId: deck.userId,
      isPublic: deck.isPublic,
      cards: deck.cards || [], // Ensure cards array exists
      elements: deck.elements || [],
      totalCards: deck.totalCards || 0,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    });
  });

  return deckMap;
}

async function getBatchUsers(userIds: ObjectId[]): Promise<Map<string, any>> {
  if (userIds.length === 0) return new Map();

  const { db } = await connectToDatabase();
  const users = await db
    .collection("users")
    .find(
      { _id: { $in: userIds } },
      { projection: { name: 1, email: 1, username: 1 } }
    )
    .toArray();

  const userMap = new Map();
  users.forEach((user) => {
    userMap.set(user._id.toString(), {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
    });
  });

  return userMap;
}

/**
 * GET /api/competitions/[id]/entries
 * Get all entries for a competition
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const competitionId = resolvedParams.id;

    // Get entries from database
    const entries = await competitionDbService.getCompetitionEntries(
      competitionId
    );

    // Optimize: Batch fetch all deck and user data to avoid N+1 queries
    const deckIds = entries.map((entry) => entry.deckId);
    const userIds = entries.map((entry) => entry.userId);

    // Batch fetch decks and users
    const [decksMap, usersMap] = await Promise.all([
      getBatchDecks(deckIds),
      getBatchUsers(userIds),
    ]);

    // Combine data efficiently
    const entriesWithDecks = entries.map((entry) => ({
      ...entry,
      deck: decksMap.get(entry.deckId.toString()) || null,
      user: usersMap.get(entry.userId.toString()) || null,
    }));

    return NextResponse.json(entriesWithDecks);
  } catch (error) {
    console.error("Error getting competition entries:", error);
    return NextResponse.json(
      { error: "Failed to get competition entries" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitions/[id]/entries
 * Submit a deck to a competition
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const competitionId = resolvedParams.id;

    const { deckId } = await request.json();

    if (!deckId) {
      return NextResponse.json(
        { error: "Deck ID is required" },
        { status: 400 }
      );
    }

    // Verify the deck exists and belongs to the user
    const deck = await deckService.getDeckById(deckId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (deck.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You can only submit your own decks" },
        { status: 403 }
      );
    }

    if (!deck.isPublic) {
      return NextResponse.json(
        { error: "Deck must be public to submit to competition" },
        { status: 400 }
      );
    }

    // Check if competition exists and is active
    const competition = await competitionDbService.getCompetitionById(
      competitionId
    );
    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // Allow submissions during UPCOMING and ACTIVE phases
    if (
      competition.status !== COMPETITION_STATUS.UPCOMING &&
      competition.status !== COMPETITION_STATUS.ACTIVE
    ) {
      return NextResponse.json(
        {
          error: `Competition is not currently accepting submissions. Status: ${competition.status}. Submissions are only allowed during "upcoming" and "active" phases.`,
        },
        { status: 400 }
      );
    }

    // Create new entry using database service
    const newEntry = await competitionDbService.createCompetitionEntry({
      competitionId: new ObjectId(competitionId),
      deckId: new ObjectId(deckId),
      userId: new ObjectId(session.user.id),
      submittedAt: new Date(),
      discordMessageId: undefined, // Will be set when posted to Discord
    });

    // Get deck details for response
    const deckDetails = await deckService.getDeckWithCards(deckId);

    const entryWithDetails = {
      ...newEntry,
      deck: deckDetails.deck,
      user: deckDetails.user,
    };

    return NextResponse.json(entryWithDetails, { status: 201 });
  } catch (error) {
    console.error("Error submitting deck to competition:", error);
    return NextResponse.json(
      { error: "Failed to submit deck to competition" },
      { status: 500 }
    );
  }
}
