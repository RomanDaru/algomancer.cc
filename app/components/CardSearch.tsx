"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CARD_ATTRIBUTES,
  CARD_TYPES,
  ELEMENTS,
  BASIC_ELEMENTS,
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

  // Common filter categories
  const elementTypes = Object.values(BASIC_ELEMENTS);
  const cardTypes = Object.values(CARD_TYPES);
  const commonAttributes = ["Flying", "Swift", "Deadly", "Unstable", "Burst"];

  // Perform search whenever the search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      // If search is empty, return all cards
      onSearchResults(cards);
      return;
    }

    const term = searchTerm.toLowerCase().trim();

    const filteredCards = cards.filter((card) => {
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

      return false;
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
  };

  const applyFilter = (filter: string) => {
    setSearchTerm(filter);
    setIsSearching(true);
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
          placeholder='Search cards by name, type, element, attributes, or text...'
          value={searchTerm}
          onChange={handleSearchChange}
        />
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
              {elementTypes.map((element) => (
                <button
                  key={element}
                  onClick={() => applyFilter(element)}
                  className='px-3 py-1 text-xs rounded-full bg-algomancy-dark border border-algomancy-blue/30 hover:bg-algomancy-blue/20'>
                  {element}
                </button>
              ))}
            </div>
          </div>

          <div className='mb-4'>
            <h3 className='text-sm font-semibold text-algomancy-gold mb-2'>
              Card Types
            </h3>
            <div className='flex flex-wrap gap-2'>
              {cardTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => applyFilter(type)}
                  className='px-3 py-1 text-xs rounded-full bg-algomancy-dark border border-algomancy-purple/30 hover:bg-algomancy-purple/20'>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-algomancy-gold mb-2'>
              Common Attributes
            </h3>
            <div className='flex flex-wrap gap-2'>
              {commonAttributes.map((attr) => (
                <button
                  key={attr}
                  onClick={() => applyFilter(attr)}
                  className='px-3 py-1 text-xs rounded-full bg-algomancy-dark border border-algomancy-teal/30 hover:bg-algomancy-teal/20'>
                  {attr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
