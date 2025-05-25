"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CARD_ATTRIBUTES,
  CARD_TYPES,
  ELEMENTS,
  BASIC_ELEMENTS,
  TIMING,
} from "@/app/lib/types/card";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

interface CardSearchProps {
  cards: Card[];
  onSearchResults: (filteredCards: Card[]) => void;
}

export default function CardSearch({
  cards,
  onSearchResults,
}: CardSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);

  // Common filter categories
  const elementTypes = Object.values(BASIC_ELEMENTS);
  const cardTypes = Object.values(CARD_TYPES);
  const timingTypes = Object.values(TIMING);
  const commonAttributes = ["Flying", "Swift", "Deadly", "Unstable", "Burst"];
  const manaCosts = ["X", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Perform search whenever the search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      // If search is empty, return all cards and clear active keywords
      onSearchResults(cards);
      setActiveKeywords([]);
      return;
    }

    // Parse search terms, preserving quoted phrases
    const searchTerms = parseSearchTerms(searchTerm);

    // Update active keywords
    setActiveKeywords(searchTerms);

    const filteredCards = cards.filter((card) => {
      // Check if the card matches ALL search terms
      return searchTerms.every((term) => {
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

        // Search by element type (Fire, Water, etc.)
        if (card.element.type.toLowerCase().includes(term)) return true;

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

        // Search by mana cost
        if (term.startsWith("mana:")) {
          const costQuery = term.substring(5); // Remove "mana:" prefix

          if (costQuery === "10+") {
            // For 10+, check if mana cost is 10 or greater
            return card.manaCost >= 10;
          } else if (costQuery.toLowerCase() === "x") {
            // For X cost, check if it's a Spell with 0 mana cost (not a token)
            return (
              card.manaCost === 0 &&
              card.typeAndAttributes.mainType === "Spell" &&
              !card.typeAndAttributes.subType.toLowerCase().includes("token")
            );
          } else {
            // For specific mana costs, check for exact match
            const cost = parseInt(costQuery, 10);
            if (!isNaN(cost)) {
              // For 0 cost, exclude X-cost spells
              if (cost === 0) {
                return !(
                  card.manaCost === 0 &&
                  card.typeAndAttributes.mainType === "Spell" &&
                  !card.typeAndAttributes.subType
                    .toLowerCase()
                    .includes("token")
                );
              }
              return card.manaCost === cost;
            }
          }
        }

        return false;
      });
    });

    onSearchResults(filteredCards);
  }, [searchTerm, cards, onSearchResults]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsSearching(e.target.value.trim() !== "");
  };

  const clearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    setActiveKeywords([]);
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
    // Special handling for multi-word filters
    const isMultiWord = filter.includes(" ");
    const filterToApply = isMultiWord ? `"${filter}"` : filter;

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
          placeholder='Search with multiple keywords (e.g., "Fire Swift", "Battle" timing, or "mana:3" for 3-cost cards)'
          value={searchTerm}
          onChange={handleSearchChange}
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
            type='button'
            onClick={() => setShowFilters(!showFilters)}
            title='Show filters'
            className={`${
              showFilters ? "text-algomancy-purple" : "text-gray-400"
            } hover:text-algomancy-purple-light`}>
            <FunnelIcon className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      {showFilters && (
        <div className='mt-4 p-4 bg-algomancy-darker border border-algomancy-purple/30 rounded-lg'>
          <div className='mb-4'>
            <h3 className='text-sm font-semibold text-algomancy-gold mb-2'>
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
                    onClick={() => applyFilter(element)}
                    className={`px-3 py-1 text-xs rounded-full border cursor-pointer ${
                      isActive
                        ? "bg-algomancy-blue/40 border-algomancy-blue text-white"
                        : "bg-algomancy-dark border-algomancy-blue/30 hover:bg-algomancy-blue/20"
                    }`}>
                    {element}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='mb-4'>
            <h3 className='text-sm font-semibold text-algomancy-gold mb-2'>
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
                    onClick={() => applyFilter(type)}
                    className={`px-3 py-1 text-xs rounded-full border ${
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
            <h3 className='text-sm font-semibold text-algomancy-gold mb-2'>
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
                    onClick={() => applyFilter(timingString)}
                    className={`px-3 py-1 text-xs rounded-full border ${
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
            <h3 className='text-sm font-semibold text-algomancy-gold mb-2'>
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
                    onClick={() => applyFilter(attr)}
                    className={`px-3 py-1 text-xs rounded-full border ${
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
            <h3 className='text-sm font-semibold text-algomancy-gold mb-2'>
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
                    onClick={() => applyFilter(costString)}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      isActive
                        ? "bg-algomancy-gold/60 border-algomancy-gold text-white"
                        : "bg-algomancy-dark border-algomancy-gold/30 hover:bg-algomancy-gold/20"
                    }`}>
                    {cost}
                  </button>
                );
              })}
              <button
                onClick={() => applyFilter("mana:10+")}
                className={`px-3 py-1 text-xs rounded-full border ${
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
