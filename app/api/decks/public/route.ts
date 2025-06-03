import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";

/**
 * GET /api/decks/public
 * Get all public decks with user information
 * Supports pagination with limit and skip parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Get parameters from the URL query
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sort") as
      | "popular"
      | "newest"
      | "liked"
      | null;
    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");

    // Validate and parse parameters
    const validSortBy = ["popular", "newest", "liked"].includes(sortBy || "")
      ? (sortBy as "popular" | "newest" | "liked")
      : "newest";

    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 100)
      : undefined;
    const skip = skipParam ? Math.max(parseInt(skipParam, 10), 0) : undefined;

    const decksWithUserInfo = await deckService.getPublicDecksWithUserInfo(
      validSortBy,
      limit,
      skip
    );
    return NextResponse.json(decksWithUserInfo);
  } catch (error) {
    console.error("Error getting public decks:", error);
    return NextResponse.json(
      { error: "Failed to get public decks" },
      { status: 500 }
    );
  }
}
