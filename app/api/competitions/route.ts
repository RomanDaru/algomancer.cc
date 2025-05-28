import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

// Mock data for now - will be replaced with database service
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
 * GET /api/competitions
 * Get all competitions
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let competitions = mockCompetitions;

    // Filter by status if provided
    if (status) {
      competitions = competitions.filter((c) => c.status === status);
    }

    // Sort by creation date (newest first)
    competitions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(competitions);
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
    if (!["constructed", "draft"].includes(competitionData.type)) {
      return NextResponse.json(
        { error: "Type must be 'constructed' or 'draft'" },
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

    // Create new competition
    const newCompetition = {
      _id: new ObjectId(),
      title: competitionData.title,
      description: competitionData.description,
      type: competitionData.type,
      status: "upcoming" as const,
      startDate,
      endDate,
      votingEndDate,
      discordChannelId: competitionData.discordChannelId || null,
      submissionCount: 0,
      winners: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: Save to database
    // For now, just return the mock competition

    return NextResponse.json(newCompetition, { status: 201 });
  } catch (error) {
    console.error("Error creating competition:", error);
    return NextResponse.json(
      { error: "Failed to create competition" },
      { status: 500 }
    );
  }
}
