import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { competitionDbService } from "@/app/lib/db/services/competitionDbService";
import {
  getCompetitionStatus,
  updateCompetitionStatus,
  updateCompetitionsStatus,
} from "@/app/lib/utils/competitionStatus";
import { ObjectId } from "mongodb";
import { COMPETITION_TYPE_VALUES } from "@/app/lib/constants";

/**
 * GET /api/competitions
 * Get all competitions
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Get competitions from database
    const competitions = await competitionDbService.getAllCompetitions(
      status || undefined
    );

    // For now, use competitions as-is without automatic status updates
    // TODO: Re-enable automatic status updates once import issues are resolved
    const updatedCompetitions = competitions;

    // Ensure ObjectIds are properly serialized to strings
    const serializedCompetitions = updatedCompetitions.map((competition) => ({
      ...competition,
      _id: competition._id.toString(),
      winners: competition.winners.map((winner) => ({
        ...winner,
        deckId: winner.deckId.toString(),
        userId: winner.userId.toString(),
      })),
    }));

    return NextResponse.json(serializedCompetitions);
  } catch (error) {
    console.error("Error getting competitions:", error);
    return NextResponse.json(
      { error: "Failed to get competitions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitions
 * Create a new competition (admin only)
 */
export async function POST(request: NextRequest) {
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

    const competitionData = await request.json();

    // Validate required fields
    if (
      !competitionData.title ||
      !competitionData.description ||
      !competitionData.type
    ) {
      return NextResponse.json(
        { error: "Title, description, and type are required" },
        { status: 400 }
      );
    }

    // Validate type
    if (!COMPETITION_TYPE_VALUES.includes(competitionData.type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${COMPETITION_TYPE_VALUES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(competitionData.startDate);
    const endDate = new Date(competitionData.endDate);
    const votingEndDate = new Date(competitionData.votingEndDate);

    if (startDate >= endDate || endDate >= votingEndDate) {
      return NextResponse.json(
        { error: "Invalid date sequence: start < end < voting end" },
        { status: 400 }
      );
    }

    // Determine the correct initial status based on dates
    const initialStatus = getCompetitionStatus(
      startDate,
      endDate,
      votingEndDate
    );

    // Create new competition
    const newCompetition = await competitionDbService.createCompetition({
      title: competitionData.title,
      description: competitionData.description,
      type: competitionData.type,
      status: initialStatus,
      startDate,
      endDate,
      votingEndDate,
      discordChannelId: competitionData.discordChannelId || null,
      submissionCount: 0,
      winners: [],
    });

    // Ensure ObjectIds are properly serialized to strings
    const serializedCompetition = {
      ...newCompetition,
      _id: newCompetition._id.toString(),
      winners: newCompetition.winners.map((winner) => ({
        ...winner,
        deckId: winner.deckId.toString(),
        userId: winner.userId.toString(),
      })),
    };

    return NextResponse.json(serializedCompetition, { status: 201 });
  } catch (error) {
    console.error("Error creating competition:", error);
    return NextResponse.json(
      { error: "Failed to create competition" },
      { status: 500 }
    );
  }
}
