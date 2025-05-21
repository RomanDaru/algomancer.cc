"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DeckBuilder from "@/app/components/DeckBuilder";
import { Card } from "@/app/lib/types/card";
import { Toaster } from "react-hot-toast";
import { DeckCard } from "@/app/lib/types/user";

export default function CreateDeckPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardId = searchParams.get("card");

  const [cards, setCards] = useState<Card[]>([]);
  const [initialCard, setInitialCard] = useState<Card | null>(null);
  const [initialDeckCards, setInitialDeckCards] = useState<DeckCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch all cards and the initial card if provided
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

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-2xl font-bold text-white mb-6'>
          {initialCard
            ? `Create New Deck with ${initialCard.name}`
            : "Create New Deck"}
        </h1>
        <DeckBuilder cards={cards} initialDeckCards={initialDeckCards} />
      </div>
    </div>
  );
}
