import { NextRequest, NextResponse } from 'next/server';
import { cardDbService } from '@/app/lib/db/services/cardDbService';
import { Card } from '@/app/lib/types/card';

/**
 * POST /api/cards/import
 * Import cards in bulk
 */
export async function POST(request: NextRequest) {
  try {
    const cards = await request.json() as Card[];
    
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty cards array' },
        { status: 400 }
      );
    }
    
    // Validate each card has the required fields
    const invalidCards = cards.filter(card => !card.id || !card.name);
    if (invalidCards.length > 0) {
      return NextResponse.json(
        { error: 'Some cards are missing required fields', invalidCards },
        { status: 400 }
      );
    }
    
    const count = await cardDbService.importCards(cards);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error importing cards:', error);
    return NextResponse.json(
      { error: 'Failed to import cards' },
      { status: 500 }
    );
  }
}
