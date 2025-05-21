import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";

/**
 * GET /api/decks/public
 * Get all public decks with user information
 */
export async function GET(request: NextRequest) {
  try {
    // Get the sort parameter from the URL query
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sort") as "popular" | "newest" | null;

    // Use the sort parameter if it's valid, otherwise default to 'newest'
    const validSortBy = sortBy === "popular" ? "popular" : "newest";

    const decksWithUserInfo = await deckService.getPublicDecksWithUserInfo(
      validSortBy
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
