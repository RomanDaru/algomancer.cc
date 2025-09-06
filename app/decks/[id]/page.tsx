"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Toaster } from "react-hot-toast";

import { Card } from "@/app/lib/types/card";
import { Deck } from "@/app/lib/types/user";
import DeckStats from "@/app/components/DeckStats";
import LikeButton from "@/app/components/LikeButton";
import ShareButton from "@/app/components/ShareButton";
import ElementIcons from "@/app/components/ElementIcons";
import DeckDetailViewer from "@/app/components/DeckDetailViewer";
import YouTubeEmbed from "@/app/components/YouTubeEmbed";
import DeckOptionsMenu from "@/app/components/DeckOptionsMenu";
import {
  ElementType,
  getAllDeckElements,
  generateElementGradient,
} from "@/app/lib/utils/elements";

interface DeckPageProps {
  params: { id: string };
}

export default function DeckPage({ params }: DeckPageProps) {
  const [deckId, setDeckId] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [user, setUser] = useState<{ name: string; username: string | null } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setDeckId(resolvedParams.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!deckId) return;

    async function fetchData() {
      try {
        const res = await fetch(`/api/decks/${deckId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Deck not found");
          if (res.status === 403) throw new Error("You don't have permission to view this deck");
          throw new Error("Failed to fetch deck");
        }
        const data = await res.json();
        setDeck(data.deck);
        setCards(data.cards);
        setUser(data.user || null);

        if (data.deck && data.deck.isPublic) {
          setTimeout(() => {
            incrementViewCount(data.deck);
          }, 1000);
        }
      } catch (e) {
        console.error("Error fetching deck:", e);
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    async function incrementViewCount(currentDeck: Deck) {
      try {
        if (session?.user?.id === currentDeck.userId.toString()) return;
        if (!currentDeck.isPublic) return;
        await fetch(`/api/decks/${deckId}/view`, { method: "POST" });
      } catch (e) {
        console.warn("View count increment failed", e);
      }
    }

    fetchData();
  }, [deckId, session?.user?.id]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-white'>
            <h2 className='text-xl font-bold mb-2'>Error</h2>
            <p>{error}</p>
            <button
              onClick={() => router.push("/profile/decks")}
              className='mt-4 px-4 py-2 bg-algomancy-purple rounded hover:bg-algomancy-purple-dark'>
              Back to My Decks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!deck) return null;

  const isOwner = session?.user?.id === deck.userId.toString();

  // Group cards by type for DeckDetailViewer
  const groupedCards: Record<string, { card: Card; quantity: number }[]> = {};
  deck.cards.forEach((dc: Deck["cards"][number]) => {
    const card = cards.find((c: Card) => c.id === dc.cardId);
    if (card) {
      const type = card.typeAndAttributes.mainType;
      if (!groupedCards[type]) groupedCards[type] = [];
      groupedCards[type].push({ card, quantity: dc.quantity });
    }
  });

  const totalCards = deck.cards.reduce(
    (sum: number, c: Deck["cards"][number]) => sum + c.quantity,
    0
  );

  const cardsWithQuantities = deck.cards
    .map((dc: Deck["cards"][number]) => {
      const card = cards.find((c: Card) => c.id === dc.cardId);
      return { card, quantity: dc.quantity };
    })
    .filter((x) => x.card !== undefined) as { card: Card; quantity: number }[];

  const deckElements: ElementType[] =
    cardsWithQuantities.length > 0
      ? getAllDeckElements(cardsWithQuantities)
      : (["Colorless"] as ElementType[]);

  const gradientStyle = {
    background: generateElementGradient(deckElements, "135deg", false),
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='max-w-7xl mx-auto'>
        {/* Deck header with gradient background */}
        <div className='relative rounded-lg overflow-hidden mb-6'>
          <div className='absolute inset-0 opacity-30' style={gradientStyle} />

          <div className='relative p-6 flex flex-col md:flex-row justify-between items-start md:items-start'>
            <div>
              {/* Top row: Element icons + Deck name + Creator name */}
              <div className='flex items-center flex-wrap gap-3'>
                <ElementIcons elements={deckElements} size={24} showTooltips={true} />
                <h1 className='text-2xl font-bold text-white'>{deck.name}</h1>
                <span className='text-algomancy-gold font-medium text-lg'>
                  {user?.username ? (
                    <>@{user.username}</>
                  ) : (
                    <span className='text-gray-300'>{user?.name || "Unknown User"}</span>
                  )}
                </span>
              </div>

              {/* Bottom row: Date, Views, Likes, Share, Options */}
              <div className='flex items-center mt-2 text-sm text-white'>
                <span>
                  {formatDistanceToNow(new Date(deck.createdAt), { addSuffix: true })}
                </span>
                <span className='ml-3 flex items-center'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                  </svg>
                  {typeof deck.views === "number" ? deck.views : 0}
                </span>
                <span className='ml-3'>
                  <LikeButton deckId={deck._id.toString()} initialLikes={deck.likes || 0} size='sm' showCount={true} className='text-white' />
                </span>
                <span className='ml-3'>
                  <ShareButton deckId={deck._id.toString()} deckName={deck.name} size='sm' className='text-white' />
                </span>
                <div className='ml-2'>
                  {deckId && (
                    <DeckOptionsMenu deck={deck} cards={cards} deckId={deckId} isOwner={isOwner} />
                  )}
                </div>
              </div>

              {deck.description && <p className='text-gray-300 mt-3'>{deck.description}</p>}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-1'>
            <DeckStats cards={cards} deckCards={deck.cards} />
          </div>

          <div className='lg:col-span-2'>
            <DeckDetailViewer cards={cards} groupedCards={groupedCards} totalCards={totalCards} />
          </div>
        </div>

        {deck.youtubeUrl && (
          <div className='mt-8'>
            <div className='max-w-4xl mx-auto'>
              <h2 className='text-2xl font-bold text-white mb-4 text-center'>Deck Showcase Video</h2>
              <YouTubeEmbed url={deck.youtubeUrl} title={`${deck.name} - Deck Showcase`} showTitle={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
