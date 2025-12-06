"use client";

import { Card as CardType } from "@/app/lib/types/card";
import Card from "./Card";
import { useState, useRef, useEffect, useMemo } from "react";
import CardDetails from "./CardDetails";
import CardSearch from "./CardSearch";
import InfiniteScrollTrigger from "./InfiniteScrollTrigger";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
// Tree-shaking optimized imports
import {
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

type SortKey = "manaCost" | "power" | "defense" | "element";
type SortDirection = "asc" | "desc";
type SortConfig = Record<SortKey, SortDirection | null>;

const SORT_OPTIONS = [
  { key: "manaCost", label: "Mana Value", shortLabel: "Mana" },
  { key: "power", label: "Power", shortLabel: "Pow" },
  { key: "defense", label: "Defense", shortLabel: "Def" },
  { key: "element", label: "Element", shortLabel: "Elem" },
] as const;

const SORT_OPTION_LOOKUP = SORT_OPTIONS.reduce((acc, option) => {
  acc[option.key] = option;
  return acc;
}, {} as Record<SortKey, (typeof SORT_OPTIONS)[number]>);

const DEFAULT_SORT_CONFIG: SortConfig = {
  manaCost: null,
  power: null,
  defense: null,
  element: null,
};

const ACTIVE_SORT_OPTIONS = SORT_OPTIONS.filter(
  (option) => option.key !== "element"
);

const DEFAULT_SORT_PRIORITY: SortKey[] = ACTIVE_SORT_OPTIONS.map(
  (option) => option.key
);

const EXCLUDED_SUBTYPES = new Set([
  "Stolen Card !Resource",
  "Effect !Resource",
]);
const BASE_ELEMENT_PRIORITY = ["Fire", "Water", "Earth", "Wood", "Metal"];

const cycleSortDirection = (
  direction: SortDirection | null
): SortDirection | null => {
  if (direction === null) return "asc";
  if (direction === "asc") return "desc";
  return null;
};

const getElementSortValue = (elementType?: string) => {
  if (!elementType) return Number.MAX_SAFE_INTEGER;
  const [primary, secondary] = elementType.split("/");
  const primaryIndex = BASE_ELEMENT_PRIORITY.indexOf(primary);
  const normalizedPrimary =
    primaryIndex === -1 ? BASE_ELEMENT_PRIORITY.length : primaryIndex;

  if (!secondary) return normalizedPrimary * 100;

  const secondaryIndex = BASE_ELEMENT_PRIORITY.indexOf(secondary);
  const normalizedSecondary =
    secondaryIndex === -1 ? BASE_ELEMENT_PRIORITY.length : secondaryIndex;

  return normalizedPrimary * 100 + normalizedSecondary;
};

const compareNumbers = (
  aValue: number | undefined,
  bValue: number | undefined,
  direction: SortDirection
) => {
  const safeA =
    typeof aValue === "number"
      ? aValue
      : direction === "asc"
      ? Number.MAX_SAFE_INTEGER
      : Number.MIN_SAFE_INTEGER;
  const safeB =
    typeof bValue === "number"
      ? bValue
      : direction === "asc"
      ? Number.MAX_SAFE_INTEGER
      : Number.MIN_SAFE_INTEGER;

  if (safeA === safeB) return 0;
  return direction === "asc" ? safeA - safeB : safeB - safeA;
};

const sortCards = (
  cards: CardType[],
  sortConfig: SortConfig,
  sortPriority: SortKey[]
) => {
  const activeCriteria = sortPriority.filter((key) => sortConfig[key]);
  if (activeCriteria.length === 0) return cards;

  return [...cards].sort((a, b) => {
    for (const key of activeCriteria) {
      const direction = sortConfig[key];
      if (!direction) continue;

      let comparison = 0;
      switch (key) {
        case "manaCost":
          comparison = compareNumbers(a.manaCost, b.manaCost, direction);
          break;
        case "power":
          comparison = compareNumbers(a.stats?.power, b.stats?.power, direction);
          break;
        case "defense":
          comparison = compareNumbers(
            a.stats?.defense,
            b.stats?.defense,
            direction
          );
          break;
        case "element":
          comparison = compareNumbers(
            getElementSortValue(a.element?.type),
            getElementSortValue(b.element?.type),
            direction
          );
          break;
        default:
          break;
      }

      if (comparison !== 0) return comparison;
    }

    return 0;
  });
};

interface CardGridProps {
  cards: CardType[];
}

export default function CardGrid({ cards }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [filteredCards, setFilteredCards] = useState<CardType[]>(cards);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    ...DEFAULT_SORT_CONFIG,
  });
  const [sortPriority, setSortPriority] = useState<SortKey[]>([
    ...DEFAULT_SORT_PRIORITY,
  ]);
  const [viewMode, setViewMode] = useState<"large" | "compact" | "list">(
    "large"
  );
  const modalRef = useRef<HTMLDivElement>(null);

  const hasActiveSort = useMemo(
    () => sortPriority.some((key) => Boolean(sortConfig[key])),
    [sortPriority, sortConfig]
  );

  const processedCards = useMemo(() => {
    if (!isSearchActive && !hasActiveSort) {
      return filteredCards;
    }

    return filteredCards.filter(
      (card) => !EXCLUDED_SUBTYPES.has(card.typeAndAttributes.subType)
    );
  }, [filteredCards, isSearchActive, hasActiveSort]);

  const sortedCards = useMemo(
    () => sortCards(processedCards, sortConfig, sortPriority),
    [processedCards, sortConfig, sortPriority]
  );

  // Infinite scroll hook
  const {
    displayedItems: displayedCards,
    loadMore,
    isLoading,
    hasMore,
    totalItems,
    displayedCount,
  } = useInfiniteScroll({
    items: sortedCards,
    itemsPerPage: 30,
    initialLoad: 50,
  });

  // Handle click outside modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setSelectedCard(null);
      }
    }

    if (selectedCard) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedCard]);

  // Handle escape key press
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCard(null);
      }
    }

    if (selectedCard) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [selectedCard]);

  // Update filtered cards when the original cards array changes
  useEffect(() => {
    setFilteredCards(cards);
  }, [cards]);

  const handleSortToggle = (key: SortKey) => {
    setSortConfig((prev) => {
      const nextDirection = cycleSortDirection(prev[key]);
      setSortPriority((prevPriority) => {
        const withoutKey = prevPriority.filter((item) => item !== key);
        return nextDirection ? [key, ...withoutKey] : [...withoutKey, key];
      });
      return { ...prev, [key]: nextDirection };
    });
  };

  const handleResetSorts = () => {
    setSortConfig({ ...DEFAULT_SORT_CONFIG });
    setSortPriority([...DEFAULT_SORT_PRIORITY]);
  };

  // Keep user-selected view mode stable; no auto-coercion on resize

  return (
    <div className='w-full'>
      {/* Search Component */}
      <CardSearch
        cards={cards}
        onSearchResults={setFilteredCards}
        onSearchActiveChange={setIsSearchActive}
      />

      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <span className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
          Sort by
        </span>
        {ACTIVE_SORT_OPTIONS.map((option) => {
          const direction = sortConfig[option.key];
          const isActive = Boolean(direction);
          return (
            <button
              type='button'
              key={option.key}
              onClick={() => handleSortToggle(option.key)}
              aria-pressed={isActive}
              title={`${option.label} sort`}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                isActive
                  ? "border-algomancy-purple bg-algomancy-purple/20 text-white"
                  : "border-algomancy-purple/30 text-gray-300 hover:border-algomancy-purple/60"
              }`}>
              <span>{option.shortLabel}</span>
              {direction === "asc" ? (
                <ArrowUpIcon className='h-4 w-4' />
              ) : direction === "desc" ? (
                <ArrowDownIcon className='h-4 w-4' />
              ) : (
                <ArrowsUpDownIcon className='h-4 w-4 text-gray-400' />
              )}
            </button>
          );
        })}
        <button
          type='button'
          onClick={handleResetSorts}
          className='text-xs font-semibold uppercase tracking-wide text-gray-400 underline-offset-2 hover:text-white'>
          Reset
        </button>
      </div>

      {/* Results Count and View Toggle */}
      <div className='mb-4 flex justify-between items-center'>
        <div className='text-gray-300'>
          {!isSearchActive ? (
            <p>
              Showing {displayedCount} of {totalItems} cards
            </p>
          ) : (
            <p>
              Found {totalItems} cards - Showing {displayedCount}
            </p>
          )}
        </div>

        {/* View Toggle: List, Compact, Large (consistent across breakpoints) */}
        <div className='flex space-x-2'>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list"
                ? "bg-algomancy-purple text-white"
                : "bg-algomancy-dark text-gray-400 hover:text-white"
            }`}
            title='List View'
            aria-label='List View'
            aria-pressed={viewMode === "list"}>
            <ListBulletIcon className='w-5 h-5' aria-hidden='true' />
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={`p-2 rounded ${
              viewMode === "compact"
                ? "bg-algomancy-purple text-white"
                : "bg-algomancy-dark text-gray-400 hover:text-white"
            }`}
            title='Compact View'
            aria-label='Compact View'
            aria-pressed={viewMode === "compact"}>
            <Squares2X2Icon className='w-5 h-5' aria-hidden='true' />
          </button>
          <button
            onClick={() => setViewMode("large")}
            className={`p-2 rounded ${
              viewMode === "large"
                ? "bg-algomancy-purple text-white"
                : "bg-algomancy-dark text-gray-400 hover:text-white"
            }`}
            title='Large View'
            aria-label='Large View'
            aria-pressed={viewMode === "large"}>
            <ViewColumnsIcon className='w-5 h-5' aria-hidden='true' />
          </button>
        </div>
      </div>

      {/* Card Grid - Responsive layout based on view mode */}
      {totalItems > 0 ? (
        <>
          <div
            className={`${
              viewMode === "list"
                ? "space-y-2"
                : `grid gap-2 sm:gap-4 ${
                    viewMode === "large"
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6"
                      : "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12"
                  }`
            }`}>
            {displayedCards.map((card, index) => (
              <div key={card.id}>
                <Card
                  card={card}
                  onClick={() => setSelectedCard(card)}
                  viewMode={viewMode}
                  priority={index < 6} // Prioritize first 6 cards (above-the-fold)
                />
              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          <InfiniteScrollTrigger
            onLoadMore={loadMore}
            isLoading={isLoading}
            hasMore={hasMore}
          />
        </>
      ) : (
        <div className='text-center py-12'>
          <p className='text-xl text-gray-400'>
            No cards found matching your search criteria.
          </p>
          <p className='text-gray-500 mt-2'>Try adjusting your search terms.</p>
        </div>
      )}

      {/* Card Details Modal */}
      {selectedCard && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div
            ref={modalRef}
            className='relative bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6 max-w-6xl w-full max-h-[95vh] overflow-y-auto custom-scrollbar'>
            <CardDetails
              card={selectedCard}
              onClose={() => setSelectedCard(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}



