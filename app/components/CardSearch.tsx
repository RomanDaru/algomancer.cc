"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CARD_TYPES,
  BASIC_ELEMENTS,
  SPECIAL_ELEMENTS,
  TIMING,
} from "@/app/lib/types/card";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const ELEMENT_TYPES = [
  ...Object.values(BASIC_ELEMENTS),
  ...Object.values(SPECIAL_ELEMENTS),
  "Colorless",
];
const ELEMENT_TERM_SET = new Set(
  ELEMENT_TYPES.map((element) => element.toLowerCase())
);

interface CardSearchProps {
  cards: Card[];
  onSearchResults: (filteredCards: Card[]) => void;
  onSearchActiveChange?: (isActive: boolean) => void;
  deckElements?: string[];
  mobileFilterSheet?: boolean;
}

export default function CardSearch({
  cards,
  onSearchResults,
  onSearchActiveChange,
  deckElements,
  mobileFilterSheet = false,
}: CardSearchProps) {
  const [elementMatchMode, setElementMatchMode] = useState<
    "any" | "all" | "exact"
  >("any");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [onlyDeckElements, setOnlyDeckElements] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Common filter categories
  const elementTypes = ELEMENT_TYPES;
  const cardTypes = Object.values(CARD_TYPES);
  const timingTypes = Object.values(TIMING);
  const commonAttributes = ["Flying", "Swift", "Deadly", "Unstable", "Burst"];
  const manaCosts = ["X", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const normalizedDeckElements = useMemo(
    () =>
      (deckElements ?? [])
        .map((element) => element.toLowerCase())
        .filter((element) => ELEMENT_TERM_SET.has(element)),
    [deckElements]
  );
  const hasDeckElements = normalizedDeckElements.length > 0;
  const activeFilterCount =
    activeKeywords.length + (onlyDeckElements ? 1 : 0);

  useEffect(() => {
    if (!hasDeckElements && onlyDeckElements) {
      setOnlyDeckElements(false);
    }
  }, [hasDeckElements, onlyDeckElements]);

  useEffect(() => {
    if (!showFilters) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowFilters(false);
        filterButtonRef.current?.focus();
      }
    };

    const shouldLockPage =
      mobileFilterSheet &&
      (typeof window.matchMedia !== "function" ||
        window.matchMedia("(max-width: 1023px)").matches);
    const previousOverflow = document.body.style.overflow;
    if (shouldLockPage) {
      document.body.style.overflow = "hidden";
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      if (shouldLockPage) {
        document.body.style.overflow = previousOverflow;
      }
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileFilterSheet, showFilters]);

  // Perform search whenever the search term changes
  useEffect(() => {
    const deckElementSet = new Set(normalizedDeckElements);
    const matchesDeckElements = (card: Card) => {
      if (!onlyDeckElements || deckElementSet.size === 0) {
        return true;
      }

      const cardElements = (card.element?.type || "")
        .split("/")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean);

      if (cardElements.length === 0) {
        return false;
      }

      return cardElements.every((element) => deckElementSet.has(element));
    };

    if (!searchTerm.trim()) {
      // If search is empty, return all cards and clear active keywords
      const filteredCards = onlyDeckElements
        ? cards.filter((card) => matchesDeckElements(card))
        : cards;
      onSearchResults(filteredCards);
      setActiveKeywords((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    // Parse search terms, preserving quoted phrases
    const searchTerms = parseSearchTerms(searchTerm);
    const elementTerms = searchTerms.filter((term) =>
      ELEMENT_TERM_SET.has(term)
    );
    const otherTerms = searchTerms.filter(
      (term) => !ELEMENT_TERM_SET.has(term)
    );

    // Update active keywords
    setActiveKeywords(searchTerms);

    const filteredCards = cards.filter((card) => {
      if (!matchesDeckElements(card)) {
        return false;
      }

      if (elementTerms.length > 0) {
        const cardElements = (card.element?.type || "")
          .split("/")
          .map((part) => part.trim().toLowerCase())
          .filter(Boolean);
        const uniqueElementTerms = Array.from(new Set(elementTerms));
        const uniqueCardElements = Array.from(new Set(cardElements));
        const matchesElement =
          elementMatchMode === "all"
            ? uniqueElementTerms.every((term) =>
                uniqueCardElements.includes(term)
              )
            : elementMatchMode === "exact"
            ? uniqueElementTerms.length === uniqueCardElements.length &&
              uniqueElementTerms.every((term) =>
                uniqueCardElements.includes(term)
              )
            : uniqueElementTerms.some((term) =>
                uniqueCardElements.includes(term)
              );
        if (!matchesElement) {
          return false;
        }
      }

      // Check if the card matches ALL non-element search terms
      return otherTerms.every((term) => {
        // For exact card type matches (multi-word types like "Spell Token" or "Spell Unit")
        if (term.includes(" ")) {
          // Check if the term matches the mainType exactly
          if (card.typeAndAttributes.mainType.toLowerCase() === term) {
            return true;
          }

          // Split the term into parts (e.g., "Spell Unit" -> ["spell", "unit"])
          const termParts = term.split(" ");

          // Check if one part matches mainType and the other matches subType
          // This handles cases like "Spell Unit" where mainType is "Unit" and subType contains "Spell"
          if (termParts.length === 2) {
            const [part1, part2] = termParts;

            // Check if part1 is in subType and part2 is mainType
            if (
              card.typeAndAttributes.subType.toLowerCase().includes(part1) &&
              card.typeAndAttributes.mainType.toLowerCase() === part2
            ) {
              return true;
            }

            // Check if part2 is in subType and part1 is mainType
            if (
              card.typeAndAttributes.subType.toLowerCase().includes(part2) &&
              card.typeAndAttributes.mainType.toLowerCase() === part1
            ) {
              return true;
            }
          }
        }

        // Search by name
        if (card.name.toLowerCase().includes(term)) return true;

        // Search by card type (Unit, Spell, etc.)
        if (card.typeAndAttributes.mainType.toLowerCase().includes(term))
          return true;

        // Search by subtype (Beast, Elemental, etc.)
        if (card.typeAndAttributes.subType.toLowerCase().includes(term))
          return true;

        // Search by timing type (Standard, Haste, Battle, Virus)
        if (term.startsWith("timing:")) {
          const timingQuery = term.substring(7).toLowerCase(); // Remove "timing:" prefix
          return card.timing.type.toLowerCase() === timingQuery;
        }

        // Also allow direct timing search without prefix
        if (card.timing.type.toLowerCase().includes(term)) return true;

        // Search by attributes (Flying, Swift, etc.)
        if (
          card.typeAndAttributes.attributes.some((attr) =>
            attr.toLowerCase().includes(term)
          )
        )
          return true;

        // Search by abilities text
        if (
          card.abilities.some((ability) => ability.toLowerCase().includes(term))
        )
          return true;

        // Search by flavor text
        if (card.flavorText && card.flavorText.toLowerCase().includes(term))
          return true;

        // Search by rarity/complexity
        if (card.set.complexity.toLowerCase().includes(term)) return true;

        // Full mana cost and the alternative Prophecy cost are distinct.
        if (term.startsWith("mana:") || term.startsWith("prophecy:")) {
          const [kind, query] = term.split(":");
          const cost = kind === "mana" ? card.manaCost : card.prophecy?.manaCost;
          if (query === "x") return cost === "X";
          if (query === "10+") return typeof cost === "number" && cost >= 10;
          return /^\d+$/.test(query) && cost === Number(query);
        }
        if (card.prophecy && (term === "prophecy" || card.prophecy.condition.toLowerCase().includes(term))) return true;
        if (card.augmentTransfers?.some((attribute) => attribute.toLowerCase().includes(term))) return true;

        return false;
      });
    });

    onSearchResults(filteredCards);
  }, [
    searchTerm,
    cards,
    onSearchResults,
    onlyDeckElements,
    normalizedDeckElements,
    elementMatchMode,
  ]);

  useEffect(() => {
    onSearchActiveChange?.(isSearching);
  }, [isSearching, onSearchActiveChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsSearching(e.target.value.trim() !== "");
  };

  const clearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    setActiveKeywords([]);
  };

  const clearAllFilters = () => {
    clearSearch();
    setOnlyDeckElements(false);
  };

  // Helper function to parse search terms, preserving quoted phrases
  const parseSearchTerms = (input: string): string[] => {
    const terms: string[] = [];
    let currentTerm = "";
    let inQuotes = false;

    // Add quotes around multi-word card types if they're not already quoted
    const processedInput = input.replace(
      /(Spell Token|Spell Unit)(?!")/g,
      '"$1"'
    );

    for (let i = 0; i < processedInput.length; i++) {
      const char = processedInput[i];

      if (char === '"') {
        inQuotes = !inQuotes;
        // Don't include the quote marks in the terms
        continue;
      }

      if (char === " " && !inQuotes) {
        if (currentTerm) {
          terms.push(currentTerm.toLowerCase());
          currentTerm = "";
        }
      } else {
        currentTerm += char;
      }
    }

    if (currentTerm) {
      terms.push(currentTerm.toLowerCase());
    }

    return terms.filter((term) => term.length > 0);
  };

  const applyFilter = (filter: string) => {
    // Get current search terms, preserving phrases
    const currentTerms = parseSearchTerms(searchTerm);

    // Check if the filter is already in the search
    const filterLower = filter.toLowerCase();
    const filterIndex = currentTerms.findIndex((term) => term === filterLower);

    if (filterIndex >= 0) {
      // Filter exists, remove it (toggle off)
      currentTerms.splice(filterIndex, 1);
    } else {
      // Filter doesn't exist, add it (toggle on)
      currentTerms.push(filterLower);
    }

    // Reconstruct the search term, adding quotes around multi-word terms
    const newSearchTerm = currentTerms
      .map((term) => (term.includes(" ") ? `"${term}"` : term))
      .join(" ");

    setSearchTerm(newSearchTerm);
    setIsSearching(newSearchTerm.length > 0);
  };

  return (
    <div className='mb-6'>
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
          <MagnifyingGlassIcon className='w-5 h-5 text-gray-400' />
        </div>
        <input
          type='text'
          className='block w-full p-4 pl-10 pr-20 text-sm text-white border border-algomancy-purple/30 rounded-lg bg-algomancy-darker focus:ring-algomancy-purple focus:border-algomancy-purple'
          placeholder={
            mobileFilterSheet
              ? "Search cards..."
              : 'Search with multiple keywords (e.g., "Fire Swift", "Battle" timing, or "mana:3" for 3-cost cards)'
          }
          value={searchTerm}
          onChange={handleSearchChange}
          aria-label='Search cards'
        />
        {activeKeywords.length > 1 && (
          <div className='absolute top-1/2 right-20 transform -translate-y-1/2 bg-algomancy-purple/80 text-white text-xs px-2 py-1 rounded-full'>
            {activeKeywords.length} keywords
          </div>
        )}
        <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
          {isSearching && (
            <button
              type='button'
              className='mr-2'
              onClick={clearSearch}
              title='Clear search'>
              <XMarkIcon className='w-5 h-5 text-gray-400 hover:text-white' />
            </button>
          )}
          <button
            ref={filterButtonRef}
            type='button'
            onClick={() => setShowFilters(!showFilters)}
            title={showFilters ? "Hide filters" : "Show filters"}
            aria-label={`${showFilters ? "Hide" : "Show"} card filters${
              activeFilterCount ? ` (${activeFilterCount} active)` : ""
            }`}
            aria-expanded={showFilters}
            aria-controls='card-search-filters'
            className={`${
              showFilters ? "text-algomancy-purple" : "text-gray-400"
            } hover:text-algomancy-purple-light`}>
            <FunnelIcon className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      {mobileFilterSheet && showFilters && (
        <button
          type='button'
          className='fixed inset-0 z-40 bg-black/70 lg:hidden'
          onClick={() => {
            setShowFilters(false);
            filterButtonRef.current?.focus();
          }}
          aria-label='Close card filters'
        />
      )}

      {showFilters && (
        <div
          id='card-search-filters'
          role={mobileFilterSheet && showFilters ? "dialog" : undefined}
          aria-modal={mobileFilterSheet && showFilters ? "true" : undefined}
          aria-labelledby={
            mobileFilterSheet && showFilters
              ? "card-search-filter-title"
              : undefined
          }
          className={`bg-algomancy-darker border border-algomancy-purple/30 p-4 ${
            mobileFilterSheet
              ? "fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto rounded-t-lg lg:static lg:mt-4 lg:max-h-none lg:overflow-visible lg:rounded-lg"
              : "mt-4 rounded-lg"
          }`}>
          {mobileFilterSheet && (
            <div className='mb-4 flex items-center justify-between border-b border-white/10 pb-3'>
              <h3
                id='card-search-filter-title'
                className='text-base font-semibold text-white'>
                Filters
              </h3>
              <div className='flex items-center gap-3'>
                {activeFilterCount > 0 && (
                  <button
                    type='button'
                    onClick={clearAllFilters}
                    className='text-sm text-algomancy-gold hover:text-algomancy-gold-light'>
                    Clear all
                  </button>
                )}
                <button
                  type='button'
                  onClick={() => {
                    setShowFilters(false);
                    filterButtonRef.current?.focus();
                  }}
                  className='rounded-md p-1 text-gray-300 hover:bg-white/5 hover:text-white'
                  aria-label='Close filters'>
                  <XMarkIcon className='h-5 w-5' aria-hidden='true' />
                </button>
              </div>
            </div>
          )}
          {deckElements && (
            <div className='mb-4'>
              <h3 className='text-sm font-semibold text-algomancy-gold mb-2'>
                Deck
              </h3>
              <div className='flex flex-wrap items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setOnlyDeckElements((prev) => !prev)}
                  disabled={!hasDeckElements}
                  aria-pressed={onlyDeckElements}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    onlyDeckElements
                      ? "bg-algomancy-gold/60 border-algomancy-gold text-white"
                      : "bg-algomancy-dark border-algomancy-gold/30 hover:bg-algomancy-gold/20"
                  } ${
                    hasDeckElements
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}>
                  Elements in deck
                </button>
                {!hasDeckElements && (
                  <span className='text-xs text-gray-500'>
                    Add cards to enable.
                  </span>
                )}
              </div>
            </div>
          )}
          <div className='mb-4'>
            <h3 className='mb-2 text-base font-semibold text-algomancy-gold'>
              Elements
            </h3>
            <div className='flex flex-wrap gap-2'>
              {elementTypes.map((element) => {
                const isActive = activeKeywords.some(
                  (k) => k.toLowerCase() === element.toLowerCase()
                );
                return (
                  <button
                    key={element}
                    type='button'
                    onClick={() => applyFilter(element)}
                    aria-pressed={isActive}
                    className={`px-3 py-1 text-sm rounded-md border cursor-pointer ${
                      isActive
                        ? "bg-algomancy-blue/40 border-algomancy-blue text-white"
                        : "bg-algomancy-dark border-algomancy-blue/30 hover:bg-algomancy-blue/20"
                    }`}>
                    {element}
                  </button>
                );
              })}
            </div>
            {activeKeywords.filter((keyword) => ELEMENT_TERM_SET.has(keyword)).length >
              1 && (
              <div className='mt-3 flex flex-wrap items-center gap-3'>
                <label className='flex items-center gap-2 text-sm text-gray-400'>
                  <span>Match</span>
                  <select
                    value={elementMatchMode}
                    onChange={(e) =>
                      setElementMatchMode(
                        e.target.value as "any" | "all" | "exact"
                      )
                    }
                    className='rounded-md border border-white/10 bg-algomancy-dark px-3 py-1 text-sm text-white focus:border-algomancy-purple focus:outline-none'>
                    <option value='any'>Any of these</option>
                    <option value='all'>All of these</option>
                    <option value='exact'>Exactly these</option>
                  </select>
                </label>
                <p className='text-sm text-gray-500'>
                  {elementMatchMode === "all"
                    ? "Cards must include every selected element, but can include more."
                    : elementMatchMode === "exact"
                    ? "Cards must match only the selected elements and nothing else."
                    : "Cards can include any selected element."}
                </p>
              </div>
            )}
          </div>

          <div className='mb-4'>
            <h3 className='mb-2 text-base font-semibold text-algomancy-gold'>
              Card Types
            </h3>
            <div className='flex flex-wrap gap-2'>
              {cardTypes.map((type) => {
                const isActive = activeKeywords.some(
                  (k) => k.toLowerCase() === type.toLowerCase()
                );
                return (
                  <button
                    key={type}
                    type='button'
                    onClick={() => applyFilter(type)}
                    aria-pressed={isActive}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      isActive
                        ? "bg-algomancy-purple/40 border-algomancy-purple text-white"
                        : "bg-algomancy-dark border-algomancy-purple/30 hover:bg-algomancy-purple/20"
                    }`}>
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='mb-4'>
            <h3 className='mb-2 text-base font-semibold text-algomancy-gold'>
              Timing
            </h3>
            <div className='flex flex-wrap gap-2'>
              {timingTypes.map((timing) => {
                const timingString = `timing:${timing}`;
                const isActive = activeKeywords.some(
                  (k) => k.toLowerCase() === timingString.toLowerCase()
                );
                return (
                  <button
                    key={timing}
                    type='button'
                    onClick={() => applyFilter(timingString)}
                    aria-pressed={isActive}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      isActive
                        ? "bg-algomancy-cosmic/40 border-algomancy-cosmic text-white"
                        : "bg-algomancy-dark border-algomancy-cosmic/30 hover:bg-algomancy-cosmic/20"
                    }`}>
                    {timing}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='mb-4'>
            <h3 className='mb-2 text-base font-semibold text-algomancy-gold'>
              Common Attributes
            </h3>
            <div className='flex flex-wrap gap-2'>
              {commonAttributes.map((attr) => {
                const isActive = activeKeywords.some(
                  (k) => k.toLowerCase() === attr.toLowerCase()
                );
                return (
                  <button
                    key={attr}
                    type='button'
                    onClick={() => applyFilter(attr)}
                    aria-pressed={isActive}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      isActive
                        ? "bg-algomancy-teal/40 border-algomancy-teal text-white"
                        : "bg-algomancy-dark border-algomancy-teal/30 hover:bg-algomancy-teal/20"
                    }`}>
                    {attr}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className='mb-2 text-base font-semibold text-algomancy-gold'>
              Mana Cost
            </h3>
            <div className='flex flex-wrap gap-2'>
              {manaCosts.map((cost) => {
                const costString = `mana:${cost}`;
                const isActive = activeKeywords.some(
                  (k) => k.toLowerCase() === costString.toLowerCase()
                );
                return (
                  <button
                    key={typeof cost === "number" ? cost : cost}
                    type='button'
                    onClick={() => applyFilter(costString)}
                    aria-pressed={isActive}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      isActive
                        ? "bg-algomancy-gold/60 border-algomancy-gold text-white"
                        : "bg-algomancy-dark border-algomancy-gold/30 hover:bg-algomancy-gold/20"
                    }`}>
                    {cost}
                  </button>
                );
              })}
              <button
                type='button'
                onClick={() => applyFilter("mana:10+")}
                aria-pressed={activeKeywords.some((k) => k === "mana:10+")}
                className={`px-3 py-1 text-sm rounded-md border ${
                  activeKeywords.some((k) => k === "mana:10+")
                    ? "bg-algomancy-gold/60 border-algomancy-gold text-white"
                    : "bg-algomancy-dark border-algomancy-gold/30 hover:bg-algomancy-gold/20"
                }`}>
                10+
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
