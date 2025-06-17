import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { competitionDbService } from "@/app/lib/db/services/competitionDbService";
import { updateCompetitionStatus } from "@/app/lib/utils/competitionStatus";
import { ObjectId } from "mongodb";
import {
  withErrorHandling,
  createApiResponse,
} from "@/app/lib/utils/apiErrorHandler";
import { errorLogger } from "@/app/lib/utils/errorLogger";

/**
 * GET /api/competitions/[id]
 * Get a competition by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const competitionId = resolvedParams.id;

    // Get competition from database
    const competition = await competitionDbService.getCompetitionWithWinners(
      competitionId
    );

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // Update competition status based on current date
    const updatedCompetition = updateCompetitionStatus(competition);

    // Ensure ObjectIds are properly serialized to strings
    const serializedCompetition = {
      ...updatedCompetition,
      _id: updatedCompetition._id.toString(),
      winners: updatedCompetition.winners.map((winner) => ({
        ...winner,
        deckId: winner.deckId.toString(),
        userId: winner.userId.toString(),
        // Preserve user and deck data if they exist
        user: winner.user
          ? {
              ...winner.user,
              _id: winner.user._id.toString(),
            }
          : undefined,
        deck: winner.deck
          ? {
              ...winner.deck,
              _id: winner.deck._id.toString(),
            }
          : undefined,
      })),
    };

    return NextResponse.json(createApiResponse(serializedCompetition));
  } catch (error) {
    console.error("Error getting competition:", error);
    return NextResponse.json(
      createApiResponse(undefined, "Failed to get competition"),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/competitions/[id]
 * Update a competition (admin only)
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

    const updateData = await request.json();

    // Validate dates if provided
    if (
      updateData.startDate &&
      updateData.endDate &&
      updateData.votingEndDate
    ) {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);
      const votingEndDate = new Date(updateData.votingEndDate);

      if (startDate >= endDate || endDate >= votingEndDate) {
        return NextResponse.json(
          { error: "Invalid date sequence: start < end < voting end" },
          { status: 400 }
        );
      }
    }

    // Update competition in database
    const updatedCompetition = await competitionDbService.updateCompetition(
      competitionId,
      updateData
    );

    if (!updatedCompetition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // Ensure ObjectIds are properly serialized to strings
    const serializedCompetition = {
      ...updatedCompetition,
      _id: updatedCompetition._id.toString(),
      winners: updatedCompetition.winners.map((winner) => ({
        ...winner,
        deckId: winner.deckId.toString(),
        userId: winner.userId.toString(),
        // Preserve user and deck data if they exist
        user: winner.user
          ? {
              ...winner.user,
              _id: winner.user._id.toString(),
            }
          : undefined,
        deck: winner.deck
          ? {
              ...winner.deck,
              _id: winner.deck._id.toString(),
            }
          : undefined,
      })),
    };

    return NextResponse.json(serializedCompetition);
  } catch (error) {
    console.error("Error updating competition:", error);
    return NextResponse.json(
      { error: "Failed to update competition" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/competitions/[id]
 * Delete a competition (admin only)
 */
export async function DELETE(
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

    // Delete competition from database
    const deleted = await competitionDbService.deleteCompetition(competitionId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Competition deleted successfully" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    return NextResponse.json(
      { error: "Failed to delete competition" },
      { status: 500 }
    );
  }
}
