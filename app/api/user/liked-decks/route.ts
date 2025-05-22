import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import { ObjectId } from "mongodb";

/**
 * GET /api/user/liked-decks
 * Get all decks liked by the current user
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = new ObjectId(session.user.id);

    // Get liked decks with user information
    const likedDecks = await deckService.getUserLikedDecksWithUserInfo(
      userId.toString()
    );

    return NextResponse.json(likedDecks);
  } catch (error) {
    console.error("Error getting user liked decks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
