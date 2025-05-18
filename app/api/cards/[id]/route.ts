import { NextRequest, NextResponse } from "next/server";
import { cardDbService } from "@/app/lib/db/services/cardDbService";

/**
 * GET /api/cards/[id]
 * Get a card by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const card = await cardDbService.getCardById(params.id);

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error(`Error getting card with ID ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to get card" }, { status: 500 });
  }
}

/**
 * PUT /api/cards/[id]
 * Update a card
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const card = await request.json();

    // Ensure the ID in the URL matches the card ID
    if (card.id !== params.id) {
      return NextResponse.json({ error: "Card ID mismatch" }, { status: 400 });
    }

    const updatedCard = await cardDbService.updateCard(card);

    if (!updatedCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error(`Error updating card with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cards/[id]
 * Delete a card - requires confirmation to prevent accidental deletions
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get confirmation from request
    const { searchParams } = new URL(request.url);
    const confirmDelete = searchParams.get("confirm") === "true";

    if (!confirmDelete) {
      return NextResponse.json(
        {
          error: "Delete operation requires explicit confirmation",
          message: "To delete this card, add ?confirm=true to the request URL",
        },
        { status: 400 }
      );
    }

    // Create a backup before deletion
    const card = await cardDbService.getCardById(params.id);
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Log the card being deleted for recovery if needed
    console.log(`Deleting card: ${JSON.stringify(card)}`);

    // Proceed with deletion
    const success = await cardDbService.deleteCard(params.id, true);

    if (!success) {
      return NextResponse.json(
        { error: "Card not found or deletion failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Card ${params.id} has been deleted`,
      deletedCard: card, // Include the deleted card in the response for potential recovery
    });
  } catch (error) {
    console.error(`Error deleting card with ID ${params.id}:`, error);
    return NextResponse.json(
      {
        error: "Failed to delete card",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
