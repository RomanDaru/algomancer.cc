"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Deck } from "@/app/lib/types/user";
import { Card } from "@/app/lib/types/card";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import DeckGrid from "@/app/components/DeckGrid";
import ElementFilter from "@/app/components/ElementFilter";
import { ElementType, getAllDeckElements } from "@/app/lib/utils/elements";

interface DeckWithUser {
  deck: Deck;
  user: {
    name: string;
    username: string | null;
  };
}

function PublicDecksContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const cardId = searchParams.get("card");

  const [decksWithUsers, setDecksWithUsers] = useState<DeckWithUser[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [filteredCard, setFilteredCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "liked">(
    "newest"
  );
  const [sortTransition, setSortTransition] = useState(false);
  const [selectedElements, setSelectedElements] = useState<ElementType[]>([]);

  // Load cards only when needed for element filtering
  const loadCardsIfNeeded = async () => {
    if (cardsLoaded) return;

    try {
      const cardsResponse = await fetch("/api/cards", {
        next: { revalidate: 600 }, // Cache for 10 minutes
      });
      if (!cardsResponse.ok) {
        throw new Error("Failed to fetch cards");
      }
      const cardsData = await cardsResponse.json();
      setCards(cardsData);
      setCardsLoaded(true);
    } catch (error) {
      console.error("Error loading cards for filtering:", error);
    }
  };

  // Fetch public decks (cards loaded only when needed for filtering)
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // If we have a card ID, fetch the specific card and decks containing it
        if (cardId) {
          // Fetch the specific card
          const cardResponse = await fetch(`/api/cards/${cardId}`);
          if (!cardResponse.ok) {
            throw new Error("Failed to fetch card details");
          }
          const cardData = await cardResponse.json();
          setFilteredCard(cardData);

          // Fetch decks containing this card
          const decksResponse = await fetch(`/api/decks/card/${cardId}`);
          if (!decksResponse.ok) {
            throw new Error("Failed to fetch decks containing this card");
          }
          const decksData = await decksResponse.json();
          setDecksWithUsers(decksData);
        } else {
          // Fetch all public decks (always newest first, we'll sort client-side)
          const decksResponse = await fetch(`/api/decks/public?sort=newest`);
          if (!decksResponse.ok) {
            throw new Error("Failed to fetch public decks");
          }
          const decksData = await decksResponse.json();
          setDecksWithUsers(decksData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [cardId]); // Only refetch when cardId changes, not sortBy

  // Load cards when element filtering is first used
  useEffect(() => {
    if (selectedElements.length > 0 && !cardsLoaded) {
      loadCardsIfNeeded();
    }
  }, [selectedElements, cardsLoaded]);

  // Handle smooth sorting transitions
  const handleSortChange = (newSortBy: "newest" | "popular" | "liked") => {
    if (newSortBy === sortBy) return;

    setSortTransition(true);
    setSortBy(newSortBy);

    // Reset transition after animation
    setTimeout(() => {
      setSortTransition(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
      </div>
    );
  }

  return (
    <div className='mx-auto px-6 py-8 max-w-[95%]'>
      <div className='flex justify-between items-center mb-6'>
        {filteredCard ? (
          <div className='flex items-center'>
            <Link
              href='/decks'
              className='text-algomancy-purple hover:text-algomancy-gold mr-3'>
              ← Back to All Decks
            </Link>
            <h1 className='text-2xl font-bold text-white'>
              Decks with {filteredCard.name}
            </h1>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 items-center w-full'>
            {/* Left side - Title */}
            <div className='flex-shrink-0'>
              <h1 className='text-2xl font-bold text-white'>Community Decks</h1>
            </div>

            {/* Center - Sort by section */}
            <div className='flex items-center justify-center'>
              <span className='text-gray-400 mr-3'>Sort by:</span>
              <div className='flex space-x-2'>
                <button
                  onClick={() => handleSortChange("newest")}
                  className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                    sortBy === "newest"
                      ? "bg-algomancy-purple/40 border-algomancy-purple text-white"
                      : "bg-algomancy-dark border-algomancy-purple/30 hover:bg-algomancy-purple/20"
                  }`}>
                  Newest
                </button>
                <button
                  onClick={() => handleSortChange("liked")}
                  className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                    sortBy === "liked"
                      ? "bg-algomancy-purple/40 border-algomancy-purple text-white"
                      : "bg-algomancy-dark border-algomancy-purple/30 hover:bg-algomancy-purple/20"
                  }`}>
                  Most Liked
                </button>
                <button
                  onClick={() => handleSortChange("popular")}
                  className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                    sortBy === "popular"
                      ? "bg-algomancy-purple/40 border-algomancy-purple text-white"
                      : "bg-algomancy-dark border-algomancy-purple/30 hover:bg-algomancy-purple/20"
                  }`}>
                  Most Popular
                </button>
              </div>
            </div>

            {/* Right side - Element Filter */}
            <div className='flex justify-end'>
              <ElementFilter onElementsChange={setSelectedElements} />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className='bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-white'>
          <p>{error}</p>
        </div>
      )}

      {filteredCard && (
        <div className='bg-algomancy-dark border border-algomancy-purple/30 rounded-lg p-4 mb-6'>
          <div className='flex items-center'>
            <div className='relative w-12 h-16 mr-4 rounded overflow-hidden'>
              <img
                src={filteredCard.imageUrl}
                alt={filteredCard.name}
                className='object-cover w-full h-full'
              />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-algomancy-gold'>
                {filteredCard.name}
              </h2>
              <p className='text-sm text-gray-300'>
                {filteredCard.element.type}{" "}
                {filteredCard.typeAndAttributes.mainType}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deck Grid with smooth transitions */}
      <div
        className={`transition-all duration-300 ${
          sortTransition ? "opacity-50 scale-95" : "opacity-100 scale-100"
        }`}>
        {(() => {
          // Filter decks by selected elements first
          let filteredDecks = decksWithUsers;

          if (selectedElements.length > 0) {
            // Only filter if cards are loaded, otherwise show all decks
            if (cardsLoaded && cards.length > 0) {
              filteredDecks = decksWithUsers.filter(({ deck }) => {
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

                if (cardsWithQuantities.length === 0) return false;

                // Get ALL elements used in the deck, not just dominant ones
                const deckElements = getAllDeckElements(cardsWithQuantities);

                // Filtering logic:
                // Show decks that contain ALL selected elements (inclusive filtering)
                // Deck can have additional elements beyond the selected ones
                return selectedElements.every((element) =>
                  deckElements.includes(element)
                );
              });
            }
            // If cards aren't loaded yet, show all decks (filtering will apply once cards load)
          }

          // Create a sorted copy of the filtered decks
          const sortedDecks = [...filteredDecks].sort((a, b) => {
            if (sortBy === "popular") {
              // Sort by view count (most viewed first)
              return (b.deck.views || 0) - (a.deck.views || 0);
            } else if (sortBy === "liked") {
              // Sort by like count (most liked first)
              return (b.deck.likes || 0) - (a.deck.likes || 0);
            } else {
              // Sort by creation date (newest first)
              return (
                new Date(b.deck.createdAt).getTime() -
                new Date(a.deck.createdAt).getTime()
              );
            }
          });

          return (
            <DeckGrid
              decksWithUserInfo={sortedDecks} // 🎯 NEW: Use optimized format directly
              cards={cardsLoaded ? cards : undefined} // Only pass cards when loaded
              emptyMessage={
                filteredCard
                  ? `No decks found containing ${filteredCard.name}`
                  : selectedElements.length > 0
                  ? `No decks found with ${selectedElements.join(
                      ", "
                    )} elements`
                  : "No Public Decks Yet"
              }
              emptyAction={
                filteredCard
                  ? {
                      text: `Create a deck with ${filteredCard.name}`,
                      link: `/decks/create?card=${filteredCard.id}`,
                    }
                  : undefined
              }
              createDeckLink='/decks/create'
              createDeckText={
                session ? "Create a Deck" : "Try Deck Builder (Guest Mode)"
              }
              columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
              className='py-4'
            />
          );
        })()}
      </div>
    </div>
  );
}

export default function PublicDecksPage() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center min-h-[calc(100vh-64px)]'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algomancy-purple'></div>
        </div>
      }>
      <PublicDecksContent />
    </Suspense>
  );
}
