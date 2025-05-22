"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import CardSearch from "./CardSearch";
import CardGrid from "./CardGrid";
import DeckViewer from "./DeckViewer";
import DeckStats from "./DeckStats";
import CardHoverPreview from "./CardHoverPreview";
import GuestModePrompt from "./GuestModePrompt";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { GuestDeckManager } from "@/app/lib/utils/guestDeckManager";

interface DeckBuilderProps {
  cards: Card[];
  initialDeckName?: string;
  initialDeckDescription?: string;
  initialDeckCards?: DeckCard[];
  initialIsPublic?: boolean;
  deckId?: string;
  isEditing?: boolean;
  isGuestMode?: boolean;
}

export default function DeckBuilder({
  cards,
  initialDeckName = "",
  initialDeckDescription = "",
  initialDeckCards = [],
  initialIsPublic = false,
  deckId,
  isEditing = false,
  isGuestMode = false,
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
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  // Maximum number of copies of a card allowed in a deck
  const MAX_COPIES = 4;

  // Load guest deck data on mount if in guest mode
  useEffect(() => {
    if (isGuestMode && !isEditing) {
      const guestDeck = GuestDeckManager.loadGuestDeck();
      if (guestDeck) {
        setDeckName(guestDeck.name);
        setDeckDescription(guestDeck.description);
        setDeckCards(guestDeck.cards);
        setIsPublic(guestDeck.isPublic);
      }
    }
  }, [isGuestMode, isEditing]);

  // Auto-save guest deck changes
  useEffect(() => {
    if (
      isGuestMode &&
      !isEditing &&
      (deckName || deckDescription || deckCards.length > 0)
    ) {
      const timeoutId = setTimeout(() => {
        try {
          GuestDeckManager.saveGuestDeck({
            name: deckName || "Untitled Deck",
            description: deckDescription,
            cards: deckCards,
            isPublic,
          });
        } catch (error) {
          console.error("Failed to auto-save guest deck:", error);
        }
      }, 1000); // Debounce auto-save by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [deckName, deckDescription, deckCards, isPublic, isGuestMode, isEditing]);

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

    // If in guest mode, show prompt to sign in
    if (isGuestMode) {
      setShowGuestPrompt(true);
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
      {/* Guest Mode Prompt */}
      {isGuestMode && (
        <div className='lg:col-span-3'>
          <GuestModePrompt
            deckName={deckName}
            variant='banner'
            onDismiss={() => setShowGuestPrompt(false)}
          />
        </div>
      )}

      {/* Guest Mode Modal Prompt */}
      {showGuestPrompt && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg max-w-md w-full'>
            <GuestModePrompt
              deckName={deckName}
              variant='modal'
              showDismiss={true}
              onDismiss={() => setShowGuestPrompt(false)}
            />
          </div>
        </div>
      )}

      {/* Left Column - Deck Info and Stats */}
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
              className={`w-full py-2 rounded disabled:opacity-50 transition-colors cursor-pointer hover:cursor-pointer ${
                isGuestMode
                  ? "bg-algomancy-gold hover:bg-algomancy-gold-dark text-black"
                  : "bg-algomancy-purple hover:bg-algomancy-purple-dark text-white"
              }`}>
              {isSaving
                ? "Saving..."
                : isGuestMode
                ? "Sign In to Save Deck"
                : isEditing
                ? "Update Deck"
                : "Save Deck"}
            </button>
          </div>
        </div>

        <DeckStats cards={cards} deckCards={deckCards} />
      </div>

      {/* Right Column - Card Browser and Deck Viewer */}
      <div className='lg:col-span-2'>
        {/* Card Browser - Limited to 2 rows */}
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            Card Browser
          </h3>

          <CardSearch cards={cards} onSearchResults={setFilteredCards} />

          <div className='mt-4'>
            {filteredCards.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[320px] overflow-y-auto'>
                {filteredCards.map((card) => {
                  const deckCard = deckCards.find(
                    (dc) => dc.cardId === card.id
                  );
                  const quantity = deckCard?.quantity || 0;

                  return (
                    <CardHoverPreview
                      key={card.id}
                      card={card}
                      onClick={() => handleAddCard(card.id)}>
                      <div className='relative'>
                        <div className='cursor-pointer hover:opacity-80 transition-opacity'>
                          <div className='relative w-full aspect-[3/4] rounded-md overflow-hidden'>
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className='object-cover w-full h-full'
                            />
                            {quantity > 0 && (
                              <div className='absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xs font-medium rounded-md px-1.5 py-0.5 flex items-center justify-center'>
                                {quantity}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHoverPreview>
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

        {/* Unified Deck Viewer with multiple view options */}
        <DeckViewer
          cards={cards}
          deckCards={deckCards}
          onAddCard={handleAddCard}
          onRemoveCard={handleRemoveCard}
          onRemoveAllCopies={handleRemoveAllCopies}
        />
      </div>
    </div>
  );
}
