"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/lib/types/card";
import { Deck } from "@/app/lib/types/user";
import Image from "next/image";
import Link from "next/link";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import DeckStats from "@/app/components/DeckStats";
import { toast, Toaster } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import ElementIcons from "@/app/components/ElementIcons";
import {
  ElementType,
  getDeckElements,
  generateElementGradient,
} from "@/app/lib/utils/elements";

interface DeckPageProps {
  params: {
    id: string;
  };
}

export default function DeckPage({ params }: DeckPageProps) {
  // Access params directly - we'll handle the warning later in a better way
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [user, setUser] = useState<{
    name: string;
    username: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch deck and cards
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/decks/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Deck not found");
          } else if (response.status === 403) {
            throw new Error("You don't have permission to view this deck");
          } else {
            throw new Error("Failed to fetch deck");
          }
        }
        const data = await response.json();
        setDeck(data.deck);
        setCards(data.cards);
        setUser(data.user || null);
      } catch (error) {
        console.error("Error fetching deck:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // Handle deck deletion
  const handleDeleteDeck = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this deck? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete deck");
      }

      toast.success("Deck deleted successfully");
      router.push("/profile/decks");
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete deck"
      );
      setIsDeleting(false);
    }
  };

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

  if (!deck) {
    return null;
  }

  // Check if the current user is the owner of the deck
  const isOwner = session?.user?.id === deck.userId.toString();

  // Group cards by type
  const groupedCards: Record<string, { card: Card; quantity: number }[]> = {};

  // Map deck cards to actual cards
  deck.cards.forEach((deckCard) => {
    const card = cards.find((c) => c.id === deckCard.cardId);
    if (card) {
      const type = card.typeAndAttributes.mainType;
      if (!groupedCards[type]) {
        groupedCards[type] = [];
      }
      groupedCards[type].push({ card, quantity: deckCard.quantity });
    }
  });

  // Sort card types
  const sortedTypes = Object.keys(groupedCards).sort();

  // Calculate total cards
  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);

  // Get deck elements
  const cardsWithQuantities = deck.cards
    .map((deckCard) => {
      const card = cards.find((c) => c.id === deckCard.cardId);
      return {
        card,
        quantity: deckCard.quantity,
      };
    })
    .filter((item) => item.card !== undefined) as {
    card: Card;
    quantity: number;
  }[];

  // Get the dominant elements (max 3)
  const deckElements =
    cardsWithQuantities.length > 0
      ? getDeckElements(cardsWithQuantities, 3)
      : ["Colorless"];

  // Generate gradient based on deck elements - use non-vibrant colors
  const gradientStyle = {
    background: generateElementGradient(deckElements, "135deg", false),
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <Toaster position='top-right' />
      <div className='max-w-7xl mx-auto'>
        {/* Deck header with gradient background */}
        <div className='relative rounded-lg overflow-hidden mb-6'>
          {/* Element gradient background with consistent opacity */}
          <div className='absolute inset-0 opacity-30' style={gradientStyle} />

          <div className='relative p-6 flex flex-col md:flex-row justify-between items-start md:items-center'>
            <div>
              <div className='flex items-center'>
                <h1 className='text-2xl font-bold text-white mr-3'>
                  {deck.name}
                </h1>
                <ElementIcons
                  elements={deckElements}
                  size={24}
                  showTooltips={true}
                />
              </div>

              <div className='flex items-center mt-1'>
                <span className='text-algomancy-gold font-medium'>
                  {user?.username ? (
                    <>@{user.username}</>
                  ) : (
                    <span className='text-gray-400'>
                      {user?.name || "Unknown User"}
                    </span>
                  )}
                </span>
                <span className='text-gray-500 text-xs ml-2'>
                  •{" "}
                  {formatDistanceToNow(new Date(deck.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {deck.description && (
                <p className='text-gray-300 mt-2'>{deck.description}</p>
              )}
            </div>

            {isOwner && (
              <div className='flex space-x-2 mt-4 md:mt-0'>
                <Link
                  href={`/decks/${id}/edit`}
                  className='flex items-center px-4 py-2 bg-algomancy-blue text-white rounded hover:bg-algomancy-blue-dark'>
                  <PencilIcon className='w-4 h-4 mr-1' />
                  Edit
                </Link>
                <button
                  onClick={handleDeleteDeck}
                  disabled={isDeleting}
                  className='flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50'>
                  <TrashIcon className='w-4 h-4 mr-1' />
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Deck Stats */}
          <div className='lg:col-span-1'>
            <DeckStats cards={cards} deckCards={deck.cards} />
          </div>

          {/* Right Column - Card List */}
          <div className='lg:col-span-2'>
            <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
              <h2 className='text-lg font-semibold text-white mb-4'>
                Cards ({totalCards})
              </h2>

              {totalCards === 0 ? (
                <div className='text-center py-8 text-gray-400'>
                  <p>This deck is empty.</p>
                </div>
              ) : (
                <div className='space-y-6'>
                  {sortedTypes.map((type) => (
                    <div key={type} className='space-y-2'>
                      <h3 className='text-sm font-medium text-algomancy-gold border-b border-algomancy-gold/30 pb-1'>
                        {type} (
                        {groupedCards[type].reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}
                        )
                      </h3>
                      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                        {groupedCards[type]
                          .sort((a, b) => a.card.manaCost - b.card.manaCost)
                          .map(({ card, quantity }) => (
                            <div key={card.id} className='relative group'>
                              <div className='relative w-full aspect-[3/4] rounded-md overflow-hidden'>
                                <Image
                                  src={card.imageUrl}
                                  alt={card.name}
                                  fill
                                  className='object-cover'
                                  sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw'
                                />
                              </div>
                              <div className='absolute top-1 right-1 bg-algomancy-purple text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center'>
                                {quantity}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
