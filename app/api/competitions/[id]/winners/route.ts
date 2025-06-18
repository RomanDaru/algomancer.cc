import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { competitionDbService } from "@/app/lib/db/services/competitionDbService";
import { CompetitionWinner } from "@/app/lib/types/user";
import { ObjectId } from "mongodb";

/**
 * PUT /api/competitions/[id]/winners
 * Set competition winners (admin only)
 */
export async function PUT(
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

    // Check if user is admin (only roman.daru.ml@gmail.com)
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const competitionId = resolvedParams.id;

    const { winners } = await request.json();

    // Validate winners data
    if (!Array.isArray(winners)) {
      return NextResponse.json(
        { error: "Winners must be an array" },
        { status: 400 }
      );
    }

    // Validate each winner
    for (const winner of winners) {
      if (!winner.place || !winner.deckId || !winner.userId) {
        return NextResponse.json(
          { error: "Each winner must have place, deckId, and userId" },
          { status: 400 }
        );
      }

      if (![1, 2, 3].includes(winner.place)) {
        return NextResponse.json(
          { error: "Winner place must be 1, 2, or 3" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate places
    const places = winners.map((w: any) => w.place);
    if (new Set(places).size !== places.length) {
      return NextResponse.json(
        { error: "Duplicate winner places are not allowed" },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectIds
    const formattedWinners: CompetitionWinner[] = winners.map(
      (winner: any) => ({
        place: winner.place,
        deckId: new ObjectId(winner.deckId),
        userId: new ObjectId(winner.userId),
        votes: winner.votes || 0,
      })
    );

    // Set winners and mark competition as completed
    const updatedCompetition = await competitionDbService.setCompetitionWinners(
      competitionId,
      formattedWinners
    );

    if (!updatedCompetition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // Serialize the response
    const serializedCompetition = {
      ...updatedCompetition,
      _id: updatedCompetition._id.toString(),
      winners: updatedCompetition.winners.map((winner) => ({
        ...winner,
        deckId: winner.deckId.toString(),
        userId: winner.userId.toString(),
      })),
    };

    return NextResponse.json(serializedCompetition);
  } catch (error) {
    console.error("Error setting competition winners:", error);
    return NextResponse.json(
      { error: "Failed to set competition winners" },
      { status: 500 }
    );
  }
}
