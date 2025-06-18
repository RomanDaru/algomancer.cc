import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/decks/public
 * Get all public decks with user information
 * Supports pagination with limit and skip parameters
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
      skip,
      currentUserId
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
