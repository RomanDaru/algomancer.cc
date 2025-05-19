import { NextRequest, NextResponse } from 'next/server';
import { deckService } from '@/app/lib/services/deckService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * PUT /api/decks/[id]/cards
 * Update the cards in a deck
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the existing deck
    const existingDeck = await deckService.getDeckById(params.id);
    
    if (!existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Check if the user owns this deck
    if (existingDeck.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this deck' },
        { status: 403 }
      );
    }
    
    // Get the updated cards
    const { cards } = await request.json();
    
    if (!Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Invalid cards data' },
        { status: 400 }
      );
    }
    
    // Update the deck cards
    const updatedDeck = await deckService.updateDeckCards(params.id, cards);
    
    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error(`Error updating cards in deck ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update deck cards' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/decks/[id]/cards
 * Add a card to a deck
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the existing deck
    const existingDeck = await deckService.getDeckById(params.id);
    
    if (!existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Check if the user owns this deck
    if (existingDeck.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this deck' },
        { status: 403 }
      );
    }
    
    // Get the card data
    const { cardId, quantity = 1 } = await request.json();
    
    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }
    
    // Add the card to the deck
    const updatedDeck = await deckService.addCardToDeck(params.id, cardId, quantity);
    
    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error(`Error adding card to deck ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to add card to deck' },
      { status: 500 }
    );
  }
}
