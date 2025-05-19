"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Deck } from "@/app/lib/types/user";
import { Card } from "@/app/lib/types/card";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import DeckGrid from "@/app/components/DeckGrid";

interface DeckWithUser {
  deck: Deck;
  user: {
    name: string;
    username: string | null;
  };
}

export default function PublicDecksPage() {
  const { data: session, status } = useSession();
  const [decksWithUsers, setDecksWithUsers] = useState<DeckWithUser[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch public decks and cards
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch public decks
        const decksResponse = await fetch("/api/decks/public");
        if (!decksResponse.ok) {
          throw new Error("Failed to fetch public decks");
        }
        const decksData = await decksResponse.json();
        setDecksWithUsers(decksData);

        // Fetch all cards for element display
        const cardsResponse = await fetch("/api/cards");
        if (!cardsResponse.ok) {
          throw new Error("Failed to fetch cards");
        }
        const cardsData = await cardsResponse.json();
        setCards(cardsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-white'>Community Decks</h1>
        </div>

        {error && (
          <div className='bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-white'>
            <p>{error}</p>
          </div>
        )}

        <DeckGrid
          decks={decksWithUsers.map((item) => item.deck)}
          cards={cards}
          users={decksWithUsers.reduce((acc, { deck, user }) => {
            if (deck.userId) {
              acc[deck.userId] = user;
            }
            return acc;
          }, {} as Record<string, { name: string; username: string | null }>)}
          emptyMessage='No Public Decks Yet'
          createDeckLink={session ? "/decks/create" : "/auth/signin"}
          createDeckText={session ? "Create a Deck" : "Sign In to Create Decks"}
          columns={{ sm: 1, md: 2, lg: 2, xl: 3 }}
          className='py-4'
        />
      </div>
    </div>
  );
}
