import { NextRequest, NextResponse } from "next/server";
import { competitionDbService } from "@/app/lib/db/services/competitionDbService";
import { updateCompetitionStatus } from "@/app/lib/utils/competitionStatus";
import { errorLogger } from "@/app/lib/utils/errorLogger";
import { createApiResponse } from "@/app/lib/utils/apiErrorHandler";

/**
 * GET /api/cron/update-competition-status
 * Cron job to automatically update competition statuses
 * Should be called every hour via Vercel Cron or external service
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      await errorLogger.logCronError(
        "Unauthorized cron request",
        "update-competition-status",
        { authHeader: authHeader ? "present" : "missing" }
      );

      return NextResponse.json(createApiResponse(undefined, "Unauthorized"), {
        status: 401,
      });
    }

    await errorLogger.logInfo("Starting competition status update job", {
      endpoint: "cron/update-competition-status",
    });

    // Get all competitions that are not completed
    const competitions = await competitionDbService.getAllCompetitions();
    const activeCompetitions = competitions.filter(
      (c) => c.status !== "completed"
    );

    let updatedCount = 0;
    let errorCount = 0;

    for (const competition of activeCompetitions) {
      try {
        const updatedCompetition = updateCompetitionStatus(competition);

        // Only update if status changed
        if (updatedCompetition.status !== competition.status) {
          await competitionDbService.updateCompetitionStatus(
            competition._id.toString(),
            updatedCompetition.status
          );

          updatedCount++;

          await errorLogger.logInfo(
            `Competition status updated: ${competition.title}`,
            {
              competitionId: competition._id.toString(),
              oldStatus: competition.status,
              newStatus: updatedCompetition.status,
              endpoint: "cron/update-competition-status",
            }
          );
        }
      } catch (competitionError) {
        errorCount++;
        const errorMessage =
          competitionError instanceof Error
            ? competitionError.message
            : "Unknown error";

        await errorLogger.logCronError(
          `Failed to update competition ${competition._id}: ${errorMessage}`,
          "update-competition-status",
          {
            competitionId: competition._id.toString(),
            competitionTitle: competition.title,
            originalError: errorMessage,
          }
        );
      }
    }

    const duration = Date.now() - startTime;
    const resultMessage = `Competition status update completed. Updated ${updatedCount} competitions, ${errorCount} errors in ${duration}ms`;

    await errorLogger.logInfo(resultMessage, {
      endpoint: "cron/update-competition-status",
      duration,
      updatedCount,
      errorCount,
      totalCompetitions: activeCompetitions.length,
    });

    return NextResponse.json(
      createApiResponse({
        updatedCount,
        errorCount,
        totalCompetitions: activeCompetitions.length,
        duration,
        message: resultMessage,
      })
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await errorLogger.logCronError(
      `Competition status update job failed: ${errorMessage}`,
      "update-competition-status",
      { duration, originalError: errorMessage }
    );

    return NextResponse.json(
      createApiResponse(undefined, "Failed to update competition statuses", {
        duration,
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}
