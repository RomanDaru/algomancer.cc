"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DeckBuilder from "@/app/components/DeckBuilder";
import { Card } from "@/app/lib/types/card";
import { Deck } from "@/app/lib/types/user";
import { Toaster } from "react-hot-toast";
import React from "react";

interface EditDeckPageProps {
  params: {
    id: string;
  };
}

export default function EditDeckPage({ params }: EditDeckPageProps) {
  // Access params directly - we'll handle the warning later in a better way
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch deck and cards
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all cards
        const cardsResponse = await fetch("/api/cards");
        if (!cardsResponse.ok) {
          throw new Error("Failed to fetch cards");
        }
        const cardsData = await cardsResponse.json();
        setCards(cardsData);

        // Fetch the deck
        const deckResponse = await fetch(`/api/decks/${id}`);
        if (!deckResponse.ok) {
          if (deckResponse.status === 404) {
            throw new Error("Deck not found");
          } else if (deckResponse.status === 403) {
            throw new Error("You don't have permission to edit this deck");
          } else {
            throw new Error("Failed to fetch deck");
          }
        }
        const deckData = await deckResponse.json();
        setDeck(deckData.deck);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [id, status]);

  if (status === "loading" || isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  if (!session) {
    return null;
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

  if (!deck) {
    return null;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-2xl font-bold text-white mb-6'>
          Edit Deck: {deck.name}
        </h1>
        <DeckBuilder
          cards={cards}
          initialDeckName={deck.name}
          initialDeckDescription={deck.description || ""}
          initialYouTubeUrl={deck.youtubeUrl || ""}
          initialDeckBadges={deck.deckBadges ?? []}
          initialDeckCards={deck.cards}
          initialIsPublic={deck.isPublic || false}
          deckId={id}
          isEditing={true}
        />
      </div>
    </div>
  );
}
