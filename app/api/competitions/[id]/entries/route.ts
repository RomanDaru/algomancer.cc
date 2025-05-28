import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { ObjectId } from "mongodb";

// Mock competition entries data - using a global array to persist during session
let mockEntries = [
  {
    _id: new ObjectId("674d1234567890abcdef3001"),
    competitionId: new ObjectId("674d1234567890abcdef0001"),
    deckId: new ObjectId("674d1234567890abcdef1001"),
    userId: new ObjectId("674d1234567890abcdef2001"),
    submittedAt: new Date("2024-12-02"),
    discordMessageId: "1234567890123456789",
  },
  {
    _id: new ObjectId("674d1234567890abcdef3002"),
    competitionId: new ObjectId("674d1234567890abcdef0001"),
    deckId: new ObjectId("674d1234567890abcdef1002"),
    userId: new ObjectId("674d1234567890abcdef2002"),
    submittedAt: new Date("2024-12-03"),
    discordMessageId: "1234567890123456790",
  },
];

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

    console.log(`Getting entries for competition ${competitionId}`);
    console.log(`Total mock entries: ${mockEntries.length}`);

    // Filter entries by competition ID
    const entries = mockEntries.filter(
      (entry) =>
        entry.competitionId.toString() === competitionId ||
        (competitionId === "1" &&
          entry.competitionId.toString() === "674d1234567890abcdef0001")
    );

    console.log(
      `Filtered entries for competition ${competitionId}: ${entries.length}`
    );

    // Get deck details for each entry
    const entriesWithDecks = await Promise.all(
      entries.map(async (entry) => {
        try {
          const deckDetails = await deckService.getDeckWithCards(
            entry.deckId.toString()
          );
          return {
            ...entry,
            deck: deckDetails.deck,
            user: deckDetails.user,
          };
        } catch (error) {
          console.error(
            `Error getting deck details for entry ${entry._id}:`,
            error
          );
          return {
            ...entry,
            deck: null,
            user: null,
          };
        }
      })
    );

    // Sort by submission date (newest first)
    entriesWithDecks.sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
    );

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

    // Check if user has already submitted to this competition
    const existingEntry = mockEntries.find(
      (entry) =>
        (entry.competitionId.toString() === competitionId ||
          (competitionId === "1" &&
            entry.competitionId.toString() === "674d1234567890abcdef0001")) &&
        entry.userId.toString() === session.user.id
    );

    if (existingEntry) {
      return NextResponse.json(
        { error: "You have already submitted a deck to this competition" },
        { status: 400 }
      );
    }

    // TODO: Check if competition is active and accepting submissions

    // Create new entry
    const newEntry = {
      _id: new ObjectId(),
      competitionId: new ObjectId(
        competitionId === "1" ? "674d1234567890abcdef0001" : competitionId
      ),
      deckId: new ObjectId(deckId),
      userId: new ObjectId(session.user.id),
      submittedAt: new Date(),
      discordMessageId: null, // Will be set when posted to Discord
    };

    // Save to mock entries array (in production this would be saved to database)
    mockEntries.push(newEntry);

    console.log(`New entry added for competition ${competitionId}:`, newEntry);
    console.log(`Total entries now: ${mockEntries.length}`);

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
