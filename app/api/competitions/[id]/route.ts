import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

// Mock data - same as in route.ts
const mockCompetitions = [
  {
    _id: new ObjectId("674d1234567890abcdef0001"),
    title: "Winter Constructed Championship",
    description:
      "Show off your best constructed deck in this seasonal championship! Build your most powerful deck and compete for the title.",
    type: "constructed" as const,
    status: "active" as const,
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-15"),
    votingEndDate: new Date("2024-12-20"),
    discordChannelId: "winter-constructed-2024",
    submissionCount: 23,
    winners: [],
    createdAt: new Date("2024-11-25"),
    updatedAt: new Date("2024-11-25"),
  },
  {
    _id: new ObjectId("674d1234567890abcdef0002"),
    title: "Draft Masters Tournament",
    description:
      "Test your drafting skills in this live draft competition! Create the best deck from limited card pools.",
    type: "draft" as const,
    status: "voting" as const,
    startDate: new Date("2024-11-15"),
    endDate: new Date("2024-11-30"),
    votingEndDate: new Date("2024-12-05"),
    discordChannelId: "draft-masters-2024",
    submissionCount: 18,
    winners: [],
    createdAt: new Date("2024-11-10"),
    updatedAt: new Date("2024-11-10"),
  },
  {
    _id: new ObjectId("674d1234567890abcdef0003"),
    title: "Autumn Constructed Classic",
    description:
      "Our previous constructed tournament featuring amazing deck innovations and creative strategies.",
    type: "constructed" as const,
    status: "completed" as const,
    startDate: new Date("2024-10-01"),
    endDate: new Date("2024-10-15"),
    votingEndDate: new Date("2024-10-20"),
    discordChannelId: "autumn-constructed-2024",
    submissionCount: 31,
    winners: [
      {
        place: 1 as const,
        deckId: new ObjectId("674d1234567890abcdef1001"),
        userId: new ObjectId("674d1234567890abcdef2001"),
        votes: 45,
      },
      {
        place: 2 as const,
        deckId: new ObjectId("674d1234567890abcdef1002"),
        userId: new ObjectId("674d1234567890abcdef2002"),
        votes: 38,
      },
      {
        place: 3 as const,
        deckId: new ObjectId("674d1234567890abcdef1003"),
        userId: new ObjectId("674d1234567890abcdef2003"),
        votes: 32,
      },
    ],
    createdAt: new Date("2024-09-25"),
    updatedAt: new Date("2024-10-25"),
  },
];

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

    // Find competition by ID
    const competition = mockCompetitions.find(
      (c) =>
        c._id.toString() === competitionId ||
        competitionId === "1" ||
        competitionId === "2" ||
        competitionId === "3" // Support old mock IDs
    );

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(competition);
  } catch (error) {
    console.error("Error getting competition:", error);
    return NextResponse.json(
      { error: "Failed to get competition" },
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

    const competition = mockCompetitions.find(
      (c) =>
        c._id.toString() === competitionId ||
        competitionId === "1" ||
        competitionId === "2" ||
        competitionId === "3"
    );

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    const updateData = await request.json();

    // Update allowed fields
    if (updateData.title) competition.title = updateData.title;
    if (updateData.description)
      competition.description = updateData.description;
    if (updateData.status) competition.status = updateData.status;
    if (updateData.winners) competition.winners = updateData.winners;
    if (updateData.submissionCount !== undefined)
      competition.submissionCount = updateData.submissionCount;

    competition.updatedAt = new Date();

    // TODO: Save to database

    return NextResponse.json(competition);
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

    const competitionIndex = mockCompetitions.findIndex(
      (c) =>
        c._id.toString() === competitionId ||
        competitionId === "1" ||
        competitionId === "2" ||
        competitionId === "3"
    );

    if (competitionIndex === -1) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // TODO: Remove from database
    // mockCompetitions.splice(competitionIndex, 1);

    return NextResponse.json({ message: "Competition deleted successfully" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    return NextResponse.json(
      { error: "Failed to delete competition" },
      { status: 500 }
    );
  }
}
