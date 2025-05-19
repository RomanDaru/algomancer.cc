"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import CardSearch from "./CardSearch";
import CardGrid from "./CardGrid";
import DeckCardList from "./DeckCardList";
import DeckStats from "./DeckStats";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface DeckBuilderProps {
  cards: Card[];
  initialDeckName?: string;
  initialDeckDescription?: string;
  initialDeckCards?: DeckCard[];
  initialIsPublic?: boolean;
  deckId?: string;
  isEditing?: boolean;
}

export default function DeckBuilder({
  cards,
  initialDeckName = "",
  initialDeckDescription = "",
  initialDeckCards = [],
  initialIsPublic = false,
  deckId,
  isEditing = false,
}: DeckBuilderProps) {
  const router = useRouter();
  const [deckName, setDeckName] = useState(initialDeckName);
  const [deckDescription, setDeckDescription] = useState(
    initialDeckDescription
  );
  const [deckCards, setDeckCards] = useState<DeckCard[]>(initialDeckCards);
  const [filteredCards, setFilteredCards] = useState<Card[]>(cards);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isSaving, setIsSaving] = useState(false);

  // Maximum number of copies of a card allowed in a deck
  const MAX_COPIES = 4;

  // Handle adding a card to the deck
  const handleAddCard = (cardId: string) => {
    setDeckCards((prevDeckCards) => {
      const existingCardIndex = prevDeckCards.findIndex(
        (c) => c.cardId === cardId
      );

      if (existingCardIndex >= 0) {
        // Card already exists in the deck, increase quantity if below max
        if (prevDeckCards[existingCardIndex].quantity < MAX_COPIES) {
          const updatedCards = [...prevDeckCards];
          updatedCards[existingCardIndex] = {
            ...updatedCards[existingCardIndex],
            quantity: updatedCards[existingCardIndex].quantity + 1,
          };
          return updatedCards;
        }
        return prevDeckCards; // Already at max copies
      } else {
        // Card doesn't exist in the deck, add it
        return [...prevDeckCards, { cardId, quantity: 1 }];
      }
    });
  };

  // Handle removing a card from the deck
  const handleRemoveCard = (cardId: string) => {
    setDeckCards((prevDeckCards) => {
      const existingCardIndex = prevDeckCards.findIndex(
        (c) => c.cardId === cardId
      );

      if (existingCardIndex >= 0) {
        // Card exists in the deck
        if (prevDeckCards[existingCardIndex].quantity > 1) {
          // More than one copy, decrease quantity
          const updatedCards = [...prevDeckCards];
          updatedCards[existingCardIndex] = {
            ...updatedCards[existingCardIndex],
            quantity: updatedCards[existingCardIndex].quantity - 1,
          };
          return updatedCards;
        } else {
          // Only one copy, remove the card
          return prevDeckCards.filter((c) => c.cardId !== cardId);
        }
      }
      return prevDeckCards;
    });
  };

  // Handle removing all copies of a card from the deck
  const handleRemoveAllCopies = (cardId: string) => {
    setDeckCards((prevDeckCards) =>
      prevDeckCards.filter((c) => c.cardId !== cardId)
    );
  };

  // Handle saving the deck
  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      toast.error("Please enter a deck name");
      return;
    }

    if (deckCards.length === 0) {
      toast.error("Please add at least one card to your deck");
      return;
    }

    setIsSaving(true);

    try {
      const deckData = {
        name: deckName,
        description: deckDescription,
        cards: deckCards,
        isPublic,
      };

      let response;

      if (isEditing && deckId) {
        // Update existing deck
        response = await fetch(`/api/decks/${deckId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deckData),
        });
      } else {
        // Create new deck
        response = await fetch("/api/decks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deckData),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save deck");
      }

      const savedDeck = await response.json();

      toast.success(
        isEditing ? "Deck updated successfully" : "Deck created successfully"
      );

      // Redirect to the deck page
      router.push(`/decks/${savedDeck._id}`);
    } catch (error) {
      console.error("Error saving deck:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save deck"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      {/* Left Column - Deck Info and Cards */}
      <div className='lg:col-span-1 space-y-4'>
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            Deck Information
          </h3>

          <div className='space-y-4'>
            <div>
              <label
                htmlFor='deckName'
                className='block text-sm font-medium text-gray-300 mb-1'>
                Deck Name
              </label>
              <input
                type='text'
                id='deckName'
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className='w-full p-2 bg-algomancy-dark border border-algomancy-purple/30 rounded text-white'
                placeholder='Enter deck name'
              />
            </div>

            <div>
              <label
                htmlFor='deckDescription'
                className='block text-sm font-medium text-gray-300 mb-1'>
                Description
              </label>
              <textarea
                id='deckDescription'
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                className='w-full p-2 bg-algomancy-dark border border-algomancy-purple/30 rounded text-white h-24'
                placeholder='Enter deck description'
              />
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                id='isPublic'
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className='mr-2'
              />
              <label htmlFor='isPublic' className='text-sm text-gray-300'>
                Make this deck public
              </label>
            </div>

            <button
              onClick={handleSaveDeck}
              disabled={isSaving}
              className='w-full py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark text-white rounded disabled:opacity-50'>
              {isSaving ? "Saving..." : isEditing ? "Update Deck" : "Save Deck"}
            </button>
          </div>
        </div>

        <DeckCardList
          cards={cards}
          deckCards={deckCards}
          onAddCard={handleAddCard}
          onRemoveCard={handleRemoveCard}
          onRemoveAllCopies={handleRemoveAllCopies}
        />

        <DeckStats cards={cards} deckCards={deckCards} />
      </div>

      {/* Right Column - Card Browser */}
      <div className='lg:col-span-2'>
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            Card Browser
          </h3>

          <CardSearch cards={cards} onSearchResults={setFilteredCards} />

          <div className='mt-4'>
            {filteredCards.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3'>
                {filteredCards.map((card) => {
                  const deckCard = deckCards.find(
                    (dc) => dc.cardId === card.id
                  );
                  const quantity = deckCard?.quantity || 0;

                  return (
                    <div key={card.id} className='relative'>
                      <div
                        className='cursor-pointer hover:opacity-80 transition-opacity'
                        onClick={() => handleAddCard(card.id)}>
                        <div className='relative w-full aspect-[3/4] rounded-md overflow-hidden'>
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className='object-cover w-full h-full'
                          />
                        </div>
                      </div>

                      {quantity > 0 && (
                        <div className='absolute top-1 right-1 bg-algomancy-purple text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center'>
                          {quantity}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-12'>
                <p className='text-xl text-gray-400'>
                  No cards found matching your search criteria.
                </p>
                <p className='text-gray-500 mt-2'>
                  Try adjusting your search terms.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
