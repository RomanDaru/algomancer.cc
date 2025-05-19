import { NextRequest, NextResponse } from "next/server";
import { deckService } from "@/app/lib/services/deckService";

/**
 * GET /api/decks/public
 * Get all public decks with user information
 */
export async function GET(request: NextRequest) {
  try {
    const decksWithUserInfo = await deckService.getPublicDecksWithUserInfo();
    return NextResponse.json(decksWithUserInfo);
  } catch (error) {
    console.error("Error getting public decks:", error);
    return NextResponse.json(
      { error: "Failed to get public decks" },
      { status: 500 }
    );
  }
}
