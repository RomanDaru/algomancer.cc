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
import {
  withErrorHandling,
  validateRequestData,
  sanitizeInput,
  checkRateLimit,
  createApiResponse,
} from "@/app/lib/utils/apiErrorHandler";
import { validateCompetitionData } from "@/app/lib/utils/competitionValidation";
import { errorLogger } from "@/app/lib/utils/errorLogger";

/**
 * GET /api/competitions
 * Get all competitions
 */
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Validate status parameter
    if (
      status &&
      !["upcoming", "active", "voting", "completed"].includes(status)
    ) {
      await errorLogger.logApiError(
        `Invalid status parameter: ${status}`,
        "GET /api/competitions",
        request
      );

      return NextResponse.json(
        createApiResponse(undefined, "Invalid status parameter"),
        { status: 400 }
      );
    }

    // Get competitions from database
    const competitions = await competitionDbService.getAllCompetitions(
      status || undefined
    );

    // Update competition statuses based on current date
    const updatedCompetitions = updateCompetitionsStatus(competitions);

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

    const response = NextResponse.json(
      createApiResponse(serializedCompetitions)
    );

    // Add caching headers for better performance
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  },
  { endpoint: "GET /api/competitions" }
);

/**
 * POST /api/competitions
 * Create a new competition (admin only)
 */
export const POST = withErrorHandling(
  async (request: NextRequest) => {
    // Rate limiting for competition creation
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (userId && !checkRateLimit(`competition-create-${userId}`, 5, 60000)) {
      await errorLogger.logApiError(
        `Rate limit exceeded for user ${userId}`,
        "POST /api/competitions",
        request,
        userId
      );

      return NextResponse.json(
        createApiResponse(
          undefined,
          "Too many requests. Please try again later."
        ),
        { status: 429 }
      );
    }

    // Parse and sanitize input data
    const rawData = await request.json();
    const competitionData = sanitizeInput(rawData);

    // Comprehensive validation
    const validationResult = validateCompetitionData(competitionData);
    const validationError = validateRequestData(
      validationResult,
      "POST /api/competitions",
      competitionData,
      userId
    );

    if (validationError) {
      return validationError;
    }

    // Additional business logic validation
    if (!COMPETITION_TYPE_VALUES.includes(competitionData.type)) {
      await errorLogger.logValidationError(
        [`Invalid competition type: ${competitionData.type}`],
        "POST /api/competitions",
        competitionData,
        userId
      );

      return NextResponse.json(
        createApiResponse(undefined, "Invalid competition type", {
          validTypes: COMPETITION_TYPE_VALUES,
        }),
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = new Date(competitionData.startDate);
    const endDate = new Date(competitionData.endDate);
    const votingEndDate = new Date(competitionData.votingEndDate);

    // Determine the correct initial status based on dates
    const initialStatus = getCompetitionStatus(
      startDate,
      endDate,
      votingEndDate
    );

    // Log competition creation attempt
    await errorLogger.logInfo(
      `Admin ${userId} creating competition: ${competitionData.title}`,
      {
        competitionId: "pending",
        userId,
        endpoint: "POST /api/competitions",
      }
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

    // Log successful creation
    await errorLogger.logInfo(
      `Competition created successfully: ${newCompetition._id}`,
      {
        competitionId: newCompetition._id.toString(),
        userId,
        endpoint: "POST /api/competitions",
      }
    );

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

    return NextResponse.json(createApiResponse(serializedCompetition), {
      status: 201,
    });
  },
  {
    requireAuth: true,
    requireAdmin: true,
    endpoint: "POST /api/competitions",
  }
);
