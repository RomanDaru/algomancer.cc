"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import {
  DECK_BADGE_VALUES,
  DECK_CONSTRUCTION_RULES,
  DeckBadge,
} from "@/app/lib/constants";
import DeckViewer from "./DeckViewer";
import DeckStats from "./DeckStats";
import GuestModePrompt from "./GuestModePrompt";
import DeckCardBrowser from "./DeckCardBrowser";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { GuestDeckManager } from "@/app/lib/utils/guestDeckManager";
import { validateAndNormalizeYouTubeUrl } from "@/app/lib/utils/youtube";
import { getAllDeckElements } from "@/app/lib/utils/elements";
import {
  addCardToSection,
  canAddCardToSection,
  DeckSection,
  getDeckSectionTotal,
  moveCardBetweenSections,
  normalizeDeckSections,
  removeAllCopiesFromSection,
  removeCardFromSection,
  validateDeckSections,
} from "@/app/lib/utils/deckSections";

interface DeckBuilderProps {
  cards: Card[];
  initialDeckName?: string;
  initialDeckDescription?: string;
  initialYouTubeUrl?: string;
  initialDeckCards?: DeckCard[];
  initialSideboardCards?: DeckCard[];
  initialIsPublic?: boolean;
  initialDeckBadges?: DeckBadge[];
  deckId?: string;
  isEditing?: boolean;
  isGuestMode?: boolean;
}

export default function DeckBuilder({
  cards,
  initialDeckName = "",
  initialDeckDescription = "",
  initialYouTubeUrl = "",
  initialDeckCards = [],
  initialSideboardCards = [],
  initialIsPublic = true,
  initialDeckBadges = [],
  deckId,
  isEditing = false,
  isGuestMode = false,
}: DeckBuilderProps) {
  const router = useRouter();
  const [deckName, setDeckName] = useState(initialDeckName);
  const [deckDescription, setDeckDescription] = useState(
    initialDeckDescription
  );
  const [youtubeUrl, setYoutubeUrl] = useState(initialYouTubeUrl);
  const [deckSections, setDeckSections] = useState(() =>
    normalizeDeckSections({
      cards: initialDeckCards,
      sideboard: initialSideboardCards,
    })
  );
  const [deckBadges, setDeckBadges] = useState<DeckBadge[]>(
    initialDeckBadges
  );
  const [filteredCards, setFilteredCards] = useState<Card[]>(cards);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const deckCards = deckSections.cards;
  const sideboardCards = deckSections.sideboard;
  const mainDeckCount = getDeckSectionTotal(deckCards);
  const sideboardCount = getDeckSectionTotal(sideboardCards);
  const deckElements = useMemo(() => {
    if (deckCards.length === 0) return [];

    const cardsWithQuantities = deckCards
      .map((deckCard) => {
        const card = cards.find((entry) => entry.id === deckCard.cardId);
        return card ? { card, quantity: deckCard.quantity } : null;
      })
      .filter(
        (entry): entry is { card: Card; quantity: number } => Boolean(entry)
      );

    return getAllDeckElements(cardsWithQuantities).filter(
      (element) => element !== "Colorless"
    );
  }, [cards, deckCards]);

  const deckBadgeOptions = DECK_BADGE_VALUES;
  const maxDeckBadges = 2;

  const toggleDeckBadge = (badge: DeckBadge) => {
    setDeckBadges((prev) => {
      if (prev.includes(badge)) {
        return prev.filter((item) => item !== badge);
      }
      if (prev.length >= maxDeckBadges) {
        return prev;
      }
      return [...prev, badge];
    });
  };

  useEffect(() => {
    if (isGuestMode && !isEditing) {
      const guestDeck = GuestDeckManager.loadGuestDeck();
      if (guestDeck) {
        setDeckName(guestDeck.name);
        setDeckDescription(guestDeck.description);
        setDeckBadges(guestDeck.deckBadges ?? []);
        setDeckSections(
          normalizeDeckSections({
            cards: guestDeck.cards,
            sideboard: guestDeck.sideboard,
          })
        );
        setIsPublic(guestDeck.isPublic);
      }
    }
  }, [isGuestMode, isEditing]);

  useEffect(() => {
    if (
      isGuestMode &&
      !isEditing &&
      (deckName ||
        deckDescription ||
        deckCards.length > 0 ||
        sideboardCards.length > 0)
    ) {
      const timeoutId = setTimeout(() => {
        try {
          GuestDeckManager.saveGuestDeck({
            name: deckName || "Untitled Deck",
            description: deckDescription,
            deckBadges,
            cards: deckCards,
            sideboard: sideboardCards,
            isPublic,
          });
        } catch (error) {
          console.error("Failed to auto-save guest deck:", error);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    deckName,
    deckDescription,
    deckBadges,
    deckCards,
    sideboardCards,
    isPublic,
    isGuestMode,
    isEditing,
  ]);

  const canAddToSection = (cardId: string, section: DeckSection) =>
    canAddCardToSection({
      section,
      cards: deckCards,
      sideboard: sideboardCards,
      cardId,
      amount: 1,
    });

  const handleAddCard = (cardId: string, section: DeckSection) => {
    setDeckSections((prev) => {
      if (
        !canAddCardToSection({
          section,
          cards: prev.cards,
          sideboard: prev.sideboard,
          cardId,
          amount: 1,
        })
      ) {
        return prev;
      }

      return {
        cards:
          section === "main"
            ? addCardToSection(prev.cards, cardId, 1)
            : prev.cards,
        sideboard:
          section === "sideboard"
            ? addCardToSection(prev.sideboard, cardId, 1)
            : prev.sideboard,
      };
    });
  };

  const handleRemoveCard = (cardId: string, section: DeckSection) => {
    setDeckSections((prev) => ({
      cards:
        section === "main"
          ? removeCardFromSection(prev.cards, cardId, 1)
          : prev.cards,
      sideboard:
        section === "sideboard"
          ? removeCardFromSection(prev.sideboard, cardId, 1)
          : prev.sideboard,
    }));
  };

  const handleRemoveAllCopies = (cardId: string, section: DeckSection) => {
    setDeckSections((prev) => ({
      cards:
        section === "main"
          ? removeAllCopiesFromSection(prev.cards, cardId)
          : prev.cards,
      sideboard:
        section === "sideboard"
          ? removeAllCopiesFromSection(prev.sideboard, cardId)
          : prev.sideboard,
    }));
  };

  const handleMoveCard = (cardId: string, from: DeckSection) => {
    setDeckSections((prev) =>
      moveCardBetweenSections({
        from,
        cards: prev.cards,
        sideboard: prev.sideboard,
        cardId,
        amount: 1,
      })
    );
  };

  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      toast.error("Please enter a deck name");
      return;
    }

    if (deckCards.length === 0) {
      toast.error("Please add at least one card to your main deck");
      return;
    }

    const validation = validateDeckSections({
      cards: deckCards,
      sideboard: sideboardCards,
    });

    if (!validation.isValid) {
      toast.error(validation.errors[0] || "Invalid deck configuration");
      return;
    }

    let normalizedYouTubeUrl = "";
    if (youtubeUrl.trim()) {
      const validatedUrl = validateAndNormalizeYouTubeUrl(youtubeUrl.trim());
      if (!validatedUrl) {
        toast.error("Please enter a valid YouTube URL");
        return;
      }
      normalizedYouTubeUrl = validatedUrl;
    }

    if (isGuestMode) {
      setShowGuestPrompt(true);
      return;
    }

    setIsSaving(true);

    try {
      const deckData = {
        name: deckName,
        description: deckDescription,
        youtubeUrl: normalizedYouTubeUrl,
        deckBadges,
        cards: deckCards,
        sideboard: sideboardCards,
        isPublic,
      };

      const response =
        isEditing && deckId
          ? await fetch(`/api/decks/${deckId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(deckData),
            })
          : await fetch("/api/decks", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(deckData),
            });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save deck");
      }

      const savedDeck = await response.json();

      toast.success(
        isEditing ? "Deck updated successfully" : "Deck created successfully"
      );

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

  const renderDeckInfoPanel = (idSuffix: string) => (
    <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
      <h3 className='text-lg font-semibold text-white mb-4'>Deck Information</h3>

      <div className='space-y-4'>
        <div>
          <label
            htmlFor={`deckName${idSuffix}`}
            className='block text-sm font-medium text-gray-300 mb-1'>
            Deck Name
          </label>
          <input
            type='text'
            id={`deckName${idSuffix}`}
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className='w-full p-2 bg-algomancy-dark border border-algomancy-purple/30 rounded text-white'
            placeholder='Enter deck name'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-300 mb-1'>
            Deck Badges
          </label>
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => setDeckBadges([])}
              className={`px-3 py-1 text-xs rounded-full border ${
                deckBadges.length === 0
                  ? "bg-algomancy-gold/60 border-algomancy-gold text-white"
                  : "bg-algomancy-dark border-algomancy-gold/30 hover:bg-algomancy-gold/20"
              }`}>
              Clear
            </button>
            {deckBadgeOptions.map((badge) => {
              const isActive = deckBadges.includes(badge);
              const isDisabled =
                !isActive && deckBadges.length >= maxDeckBadges;
              return (
                <button
                  key={badge}
                  type='button'
                  onClick={() => toggleDeckBadge(badge)}
                  disabled={isDisabled}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    isActive
                      ? "bg-algomancy-purple/50 border-algomancy-purple text-white"
                      : "bg-algomancy-dark border-algomancy-purple/30 hover:bg-algomancy-purple/20"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {badge}
                </button>
              );
            })}
          </div>
          <p className='text-xs text-gray-400 mt-1'>
            Pick up to {maxDeckBadges} badges to show on your deck.
          </p>
        </div>

        <div>
          <label
            htmlFor={`deckDescription${idSuffix}`}
            className='block text-sm font-medium text-gray-300 mb-1'>
            Description
          </label>
          <textarea
            id={`deckDescription${idSuffix}`}
            value={deckDescription}
            onChange={(e) => setDeckDescription(e.target.value)}
            className='w-full p-2 bg-algomancy-dark border border-algomancy-purple/30 rounded text-white h-24'
            placeholder='Enter deck description'
          />
        </div>

        <div>
          <label
            htmlFor={`youtubeUrl${idSuffix}`}
            className='block text-sm font-medium text-gray-300 mb-1'>
            YouTube Video URL (Optional)
          </label>
          <input
            type='url'
            id={`youtubeUrl${idSuffix}`}
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className='w-full p-2 bg-algomancy-dark border border-algomancy-purple/30 rounded text-white'
            placeholder='https://www.youtube.com/watch?v=...'
          />
          <p className='text-xs text-gray-400 mt-1'>
            Add a YouTube video to showcase your deck in action
          </p>
        </div>

        <div className='flex items-center'>
          <input
            type='checkbox'
            id={`isPublic${idSuffix}`}
            checked={!isPublic}
            onChange={(e) => setIsPublic(!e.target.checked)}
            className='mr-2'
          />
          <label htmlFor={`isPublic${idSuffix}`} className='text-sm text-gray-300'>
            Make this deck private
          </label>
        </div>

        <div className='rounded-md border border-white/10 bg-black/10 p-3 text-xs text-gray-300'>
          <div className='flex items-center justify-between'>
            <span>Main Deck</span>
            <span>{mainDeckCount} cards</span>
          </div>
          <div className='mt-2 flex items-center justify-between'>
            <span>Sideboard</span>
            <span>
              {sideboardCount}/{DECK_CONSTRUCTION_RULES.maxSideboardCards}
            </span>
          </div>
          <p className='mt-3 text-gray-400'>
            Max {DECK_CONSTRUCTION_RULES.maxCopiesPerCardTotal} total copies of a
            card across both zones.
          </p>
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
  );

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      {isGuestMode && (
        <div className='lg:col-span-3'>
          <GuestModePrompt
            deckName={deckName}
            variant='banner'
            onDismiss={() => setShowGuestPrompt(false)}
          />
        </div>
      )}

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

      <div className='lg:hidden lg:col-span-2 order-1'>
        <DeckCardBrowser
          cards={cards}
          filteredCards={filteredCards}
          deckCards={deckCards}
          sideboardCards={sideboardCards}
          deckElements={deckElements}
          onSearchResults={setFilteredCards}
          onAddToDeck={(cardId) => handleAddCard(cardId, "main")}
          onAddToSideboard={(cardId) => handleAddCard(cardId, "sideboard")}
          canAddToDeck={(cardId) => canAddToSection(cardId, "main")}
          canAddToSideboard={(cardId) => canAddToSection(cardId, "sideboard")}
          useHoverPreview={false}
          maxHeightClassName='max-h-[600px]'
          gridClassName='grid-cols-2 sm:grid-cols-3'
        />
      </div>

      <div className='lg:hidden order-2'>
        <DeckViewer
          cards={cards}
          deckCards={deckCards}
          sideboardCards={sideboardCards}
          onAddCard={handleAddCard}
          onRemoveCard={handleRemoveCard}
          onRemoveAllCopies={handleRemoveAllCopies}
          onMoveCard={handleMoveCard}
        />
      </div>

      <div className='lg:hidden space-y-4 order-3'>
        {renderDeckInfoPanel("-mobile")}
        <DeckStats cards={cards} deckCards={deckCards} />
      </div>

      <div className='hidden lg:block lg:col-span-1 space-y-4'>
        {renderDeckInfoPanel("")}
        <DeckStats cards={cards} deckCards={deckCards} />
      </div>

      <div className='hidden lg:block lg:col-span-2'>
        <DeckCardBrowser
          cards={cards}
          filteredCards={filteredCards}
          deckCards={deckCards}
          sideboardCards={sideboardCards}
          deckElements={deckElements}
          onSearchResults={setFilteredCards}
          onAddToDeck={(cardId) => handleAddCard(cardId, "main")}
          onAddToSideboard={(cardId) => handleAddCard(cardId, "sideboard")}
          canAddToDeck={(cardId) => canAddToSection(cardId, "main")}
          canAddToSideboard={(cardId) => canAddToSection(cardId, "sideboard")}
        />

        <DeckViewer
          cards={cards}
          deckCards={deckCards}
          sideboardCards={sideboardCards}
          onAddCard={handleAddCard}
          onRemoveCard={handleRemoveCard}
          onRemoveAllCopies={handleRemoveAllCopies}
          onMoveCard={handleMoveCard}
        />
      </div>
    </div>
  );
}
