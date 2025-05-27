"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DeckBuilder from "@/app/components/DeckBuilder";
import { Card } from "@/app/lib/types/card";
import { Toaster } from "react-hot-toast";
import { DeckCard } from "@/app/lib/types/user";

function CreateDeckForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardId = searchParams.get("card");

  const [cards, setCards] = useState<Card[]>([]);
  const [initialCard, setInitialCard] = useState<Card | null>(null);
  const [initialDeckCards, setInitialDeckCards] = useState<DeckCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if user is in guest mode
  const isGuestMode = status === "unauthenticated";

  // No longer redirect to sign in - allow guest access

  // Fetch all cards and the initial card if provided
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all cards (with cache control)
        const cardsResponse = await fetch("/api/cards", {
          next: { revalidate: 300 }, // Cache for 5 minutes
        });
        if (!cardsResponse.ok) {
          throw new Error("Failed to fetch cards");
        }
        const cardsData = await cardsResponse.json();
        setCards(cardsData);

        // If a card ID is provided, fetch that specific card and add it to the initial deck
        if (cardId) {
          // Find the card in the fetched cards
          const foundCard = cardsData.find((card: Card) => card.id === cardId);

          if (foundCard) {
            setInitialCard(foundCard);
            setInitialDeckCards([{ cardId: foundCard.id, quantity: 1 }]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [cardId]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-2xl font-bold text-white mb-6'>
          {initialCard
            ? `Create New Deck with ${initialCard.name}`
            : "Create New Deck"}
        </h1>
        <DeckBuilder
          cards={cards}
          initialDeckCards={initialDeckCards}
          isGuestMode={isGuestMode}
        />
      </div>
    </div>
  );
}

export default function CreateDeckPage() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
        </div>
      }>
      <CreateDeckForm />
    </Suspense>
  );
}
