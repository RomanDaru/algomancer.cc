import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { competitionDbService } from "@/app/lib/db/services/competitionDbService";
import { ObjectId } from "mongodb";

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

    if (competition.status !== "active") {
      return NextResponse.json(
        { error: "Competition is not currently accepting submissions" },
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
