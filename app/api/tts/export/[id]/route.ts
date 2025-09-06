import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deckService } from '@/app/lib/services/deckService';
import { buildTTSDeck } from '@/app/lib/tts/buildTTSDeck';

// Single back image for all cards (can be overridden by env)
const DEFAULT_BACK_URL =
  process.env.TTS_CARDBACK_URL ||
  'https://res.cloudinary.com/dyfj9qvc0/image/upload/v1757082182/CardBack_j8zm7i.jpg';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params; // Next.js 14 params promise
    const deckId = resolvedParams.id;

    const { deck, cards } = await deckService.getDeckWithCards(deckId);

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Access control: allow export if deck is public or user owns it
    if (!deck.isPublic) {
      if (!session?.user?.id || deck.userId.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to export this deck' },
          { status: 403 }
        );
      }
    }

    // Join cards with quantities from deck.cards in order
    const qtyMap = new Map<string, number>();
    for (const dc of deck.cards) {
      qtyMap.set(dc.cardId, (qtyMap.get(dc.cardId) || 0) + (dc.quantity || 0));
    }

    const exportCards = deck.cards
      .map((dc) => {
        const card = cards.find((c) => c.id === dc.cardId);
        if (!card) return null;
        return {
          id: card.id,
          name: card.name,
          imageUrl: card.imageUrl,
          quantity: dc.quantity || 0,
        };
      })
      .filter((c): c is NonNullable<typeof c> => !!c);

    const { json, suggestedFilename } = buildTTSDeck(deck.name, exportCards, DEFAULT_BACK_URL);

    // Return as a downloadable attachment named after the deck
    const body = JSON.stringify(json);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${suggestedFilename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting deck to TTS:', error);
    return NextResponse.json(
      { error: 'Failed to export deck to TTS' },
      { status: 500 }
    );
  }
}

