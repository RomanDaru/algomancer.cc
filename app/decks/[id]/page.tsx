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
import LikeButton from "@/app/components/LikeButton";
import ShareButton from "@/app/components/ShareButton";
import { toast, Toaster } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import ElementIcons from "@/app/components/ElementIcons";
import DeckDetailViewer from "@/app/components/DeckDetailViewer";
import {
  ElementType,
  getAllDeckElements,
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

        // Only increment view count after we have the deck data
        // This ensures we have the correct deck information
        if (data.deck) {
          // Use setTimeout to delay the view count increment
          // This prevents it from blocking the UI rendering
          setTimeout(() => {
            incrementViewCount(data.deck);
          }, 1000);
        }
      } catch (error) {
        console.error("Error fetching deck:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    // Function to increment view count
    async function incrementViewCount(currentDeck = deck) {
      try {
        // If no deck is provided, don't proceed
        if (!currentDeck) {
          return;
        }

        // Only increment view count for public decks or if the user is not the owner
        if (
          session &&
          session.user &&
          session.user.id === currentDeck.userId.toString()
        ) {
          return; // Don't increment view count for the owner
        }

        // Check if the deck is public before incrementing view count
        if (!currentDeck.isPublic) {
          return; // Don't increment view count for private decks
        }

        await fetch(`/api/decks/${id}/view`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Error incrementing view count:", error);
        // Don't show an error to the user for this - non-critical feature
      }
    }

    fetchData();
  }, [id, session, deck?.userId]);

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

  // Get ALL elements in the deck
  const deckElements =
    cardsWithQuantities.length > 0
      ? getAllDeckElements(cardsWithQuantities)
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
              {/* Top row: Element icons + Deck name + Creator name */}
              <div className='flex items-center flex-wrap gap-3'>
                <ElementIcons
                  elements={deckElements}
                  size={24}
                  showTooltips={true}
                />
                <h1 className='text-2xl font-bold text-white'>{deck.name}</h1>
                <span className='text-algomancy-gold font-medium text-lg'>
                  {user?.username ? (
                    <>@{user.username}</>
                  ) : (
                    <span className='text-gray-300'>
                      {user?.name || "Unknown User"}
                    </span>
                  )}
                </span>
              </div>

              {/* Bottom row: Date, Views, Likes */}
              <div className='flex items-center mt-2 text-sm text-white'>
                <span>
                  {formatDistanceToNow(new Date(deck.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                <span className='ml-3 flex items-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 mr-1'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                  {typeof deck.views === "number" ? deck.views : 0}
                </span>
                <span className='ml-3'>
                  <LikeButton
                    deckId={deck._id.toString()}
                    initialLikes={deck.likes || 0}
                    size='sm'
                    showCount={true}
                    className='text-white'
                  />
                </span>
                <span className='ml-3'>
                  <ShareButton
                    deckId={deck._id.toString()}
                    deckName={deck.name}
                    size='sm'
                    className='text-white'
                  />
                </span>
              </div>

              {deck.description && (
                <p className='text-gray-300 mt-3'>{deck.description}</p>
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
            <DeckDetailViewer
              cards={cards}
              groupedCards={groupedCards}
              totalCards={totalCards}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
