import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  DECK_BADGE_VALUES,
  PUBLIC_DECKS_MAX_PAGE_SIZE,
  PUBLIC_DECKS_PAGE_SIZE,
} from "@/app/lib/constants";
import { ElementType } from "@/app/lib/utils/elements";

const VALID_ELEMENTS = new Set<ElementType>([
  "Fire",
  "Water",
  "Earth",
  "Wood",
  "Metal",
  "Dark",
  "Light",
  "Colorless",
]);

function parseCsvParam(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * GET /api/decks/public
 * Get all public decks with user information
 * Supports cursor pagination with limit and cursor parameters
 * Includes like status for authenticated users
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Get parameters from the URL query
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sort") as
      | "popular"
      | "newest"
      | "liked"
      | null;
    const searchQuery = searchParams.get("q")?.trim() || undefined;
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor") || undefined;
    const withMeta = searchParams.get("withMeta") === "1";
    const elements = parseCsvParam(searchParams.get("elements")).filter(
      (element): element is ElementType => VALID_ELEMENTS.has(element as ElementType)
    );
    const badges = parseCsvParam(searchParams.get("badges")).filter((badge) =>
      DECK_BADGE_VALUES.includes(badge as (typeof DECK_BADGE_VALUES)[number])
    );

    // Validate and parse parameters
    const validSortBy = ["popular", "newest", "liked"].includes(sortBy || "")
      ? (sortBy as "popular" | "newest" | "liked")
      : "newest";

    const requestedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
    const effectiveLimit = requestedLimit
      ? Math.min(Math.max(requestedLimit, 1), PUBLIC_DECKS_MAX_PAGE_SIZE)
      : PUBLIC_DECKS_PAGE_SIZE;
    const warnings: string[] = [];

    if (
      typeof requestedLimit === "number" &&
      Number.isFinite(requestedLimit) &&
      requestedLimit > PUBLIC_DECKS_MAX_PAGE_SIZE
    ) {
      warnings.push("limit_capped_to_max");
      console.warn("Public decks API limit capped", {
        requestedLimit,
        effectiveLimit,
        sortBy: validSortBy,
        hasSearch: Boolean(searchQuery),
        elements,
        badges,
      });
    }

    if (!withMeta) {
      const decksWithUserInfo = await deckService.getPublicDecksWithUserInfo(
        validSortBy,
        effectiveLimit,
        undefined,
        currentUserId,
        searchQuery
      );

      return NextResponse.json(decksWithUserInfo);
    }

    const response = await deckService.getPublicDecksPage({
      sortBy: validSortBy,
      limit: effectiveLimit,
      cursor,
      currentUserId,
      filters: {
        searchQuery,
        elements,
        badges,
      },
      requestedLimit,
      warnings,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid cursor") {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    console.error("Error getting public decks:", error);
    return NextResponse.json(
      { error: "Failed to get public decks" },
      { status: 500 }
    );
  }
}
