import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { gameLogService } from "@/app/lib/services/gameLogService";
import { achievementService } from "@/app/lib/services/achievementService";
import { validateGameLogData } from "@/app/lib/utils/gameLogValidation";
import { normalizeGameLogPayload } from "@/app/lib/utils/gameLogPayload";

const ALLOWED_FORMATS = new Set(["constructed", "live_draft"]);
const ALLOWED_OUTCOMES = new Set(["win", "loss", "draw"]);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));

    const format = searchParams.get("format") || undefined;
    const outcome = searchParams.get("outcome") || undefined;

    if (format && !ALLOWED_FORMATS.has(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    if (outcome && !ALLOWED_OUTCOMES.has(outcome)) {
      return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
    }

    const logs = await gameLogService.getUserGameLogs(session.user.id, {
      skip: (page - 1) * pageSize,
      limit: pageSize,
      format,
      outcome,
    });

    const total = await gameLogService.countUserGameLogs(session.user.id, {
      format,
      outcome,
    });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({ logs, page, pageSize, total, totalPages });
  } catch (error) {
    console.error("Error getting game logs:", error);
    return NextResponse.json({ error: "Failed to get game logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rawData = await request.json();
    const validation = validateGameLogData(rawData, { requireAll: true });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const normalized = normalizeGameLogPayload(rawData);
    normalized.userId = new ObjectId(session.user.id);

    if (normalized.matchType && normalized.matchType !== "custom") {
      delete normalized.matchTypeLabel;
    }

    if (normalized.format === "constructed") {
      delete normalized.liveDraft;
    } else if (normalized.format === "live_draft") {
      delete normalized.constructed;
    }

    const created = await gameLogService.createGameLog(normalized);

    let achievementsUnlocked: any[] = [];
    let achievementXp: number | undefined;
    let previousAchievementXp: number | undefined;

    try {
      const awardResult = await achievementService.awardAchievementsForUser(
        session.user.id
      );
      achievementsUnlocked = awardResult.unlocked;
      achievementXp = awardResult.achievementXp;
      previousAchievementXp = awardResult.previousAchievementXp;
    } catch (awardError) {
      console.error("Error awarding achievements:", awardError);
    }

    return NextResponse.json(
      {
        log: created,
        achievementsUnlocked,
        achievementXp,
        previousAchievementXp,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating game log:", error);
    return NextResponse.json({ error: "Failed to create game log" }, { status: 500 });
  }
}
