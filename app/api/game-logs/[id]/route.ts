import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { gameLogService } from "@/app/lib/services/gameLogService";
import { achievementService } from "@/app/lib/services/achievementService";
import { resolveConstructedElements } from "@/app/lib/services/gameLogElementService";
import { validateGameLogData } from "@/app/lib/utils/gameLogValidation";
import { normalizeGameLogPayload } from "@/app/lib/utils/gameLogPayload";
import { UserModel } from "@/app/lib/db/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const logId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    const log = await gameLogService.getGameLogById(logId);
    if (!log) {
      return NextResponse.json({ error: "Game log not found" }, { status: 404 });
    }

    if (
      !log.isPublic &&
      (!session?.user?.id || log.userId.toString() !== session.user.id)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to view this game log" },
        { status: 403 }
      );
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error getting game log:", error);
    return NextResponse.json({ error: "Failed to get game log" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const logId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const existing = await gameLogService.getGameLogById(logId);
    if (!existing) {
      return NextResponse.json({ error: "Game log not found" }, { status: 404 });
    }

    if (existing.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this game log" },
        { status: 403 }
      );
    }

    const rawData = await request.json();
    const validation = validateGameLogData(rawData, { requireAll: false });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const normalized = normalizeGameLogPayload(rawData);

    if (normalized.matchType && normalized.matchType !== "custom") {
      delete normalized.matchTypeLabel;
    }

    if (normalized.isPublic !== undefined) {
      const userDoc = await UserModel.findById(session.user.id, {
        includePrivateLogsInCommunityStats: 1,
      });
      const includePrivate = userDoc?.includePrivateLogsInCommunityStats === true;
      const isPublic = normalized.isPublic === true;
      normalized.includeInCommunityStats = isPublic || includePrivate;
    }

    if (normalized.format === "constructed") {
      delete normalized.liveDraft;
      if (normalized.constructed) {
        normalized.constructed.elementsPlayed =
          await resolveConstructedElements(normalized.constructed);
      }
    } else if (normalized.format === "live_draft") {
      delete normalized.constructed;
    }

    const updated = await gameLogService.updateGameLog(logId, normalized);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update game log" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating game log:", error);
    return NextResponse.json({ error: "Failed to update game log" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const logId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const existing = await gameLogService.getGameLogById(logId);
    if (!existing) {
      return NextResponse.json({ error: "Game log not found" }, { status: 404 });
    }

    if (existing.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this game log" },
        { status: 403 }
      );
    }

    const success = await gameLogService.deleteGameLog(logId);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete game log" }, { status: 500 });
    }

    try {
      await achievementService.reconcileAchievementsForUser(session.user.id);
    } catch (awardError) {
      console.error("Error reconciling achievements after delete:", awardError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting game log:", error);
    return NextResponse.json({ error: "Failed to delete game log" }, { status: 500 });
  }
}
