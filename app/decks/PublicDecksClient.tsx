"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DeckBadge from "@/app/components/DeckBadge";
import DeckGrid from "@/app/components/DeckGrid";
import {
  DECK_BADGE_VALUES,
  PUBLIC_DECKS_INITIAL_VISIBLE,
  PUBLIC_DECKS_LOAD_MORE_STEP,
  PUBLIC_DECKS_PAGE_SIZE,
  type DeckBadge as DeckBadgeType,
} from "@/app/lib/constants";
import ElementIcon from "@/app/components/ElementIcon";
import { ElementType } from "@/app/lib/utils/elements";
import { Card } from "@/app/lib/types/card";
import {
  DeckSortBy,
  DeckWithUserInfo,
  PaginatedDeckResponse,
} from "@/app/lib/types/deckBrowse";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const BASIC_ELEMENTS: ElementType[] = [
  "Fire",
  "Water",
  "Earth",
  "Wood",
  "Metal",
  "Dark",
  "Light",
];

async function fetchDeckPage({
  sortBy,
  searchQuery,
  cursor,
  signal,
  elements,
  badges,
  cardId,
}: {
  sortBy: DeckSortBy;
  searchQuery?: string;
  cursor?: string | null;
  signal?: AbortSignal;
  elements?: string[];
  badges?: string[];
  cardId?: string;
}): Promise<PaginatedDeckResponse> {
  const params = new URLSearchParams({
    limit: PUBLIC_DECKS_PAGE_SIZE.toString(),
    withMeta: "1",
  });

  if (!cardId) {
    params.set("sort", sortBy);
  }

  if (searchQuery) {
    params.set("q", searchQuery);
  }

  if (cursor) {
    params.set("cursor", cursor);
  }

  if (elements && elements.length > 0) {
    params.set("elements", elements.join(","));
  }

  if (badges && badges.length > 0) {
    params.set("badges", badges.join(","));
  }

  const endpoint = cardId
    ? `/api/decks/card/${cardId}?${params.toString()}`
    : `/api/decks/public?${params.toString()}`;
  const response = await fetch(endpoint, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load decks");
  }

  return (await response.json()) as PaginatedDeckResponse;
}

function mergeDeckPages(
  currentDecks: DeckWithUserInfo[],
  nextDecks: DeckWithUserInfo[]
) {
  const seenDeckIds = new Set(
    currentDecks.map((item) => item.deck._id.toString())
  );
  const mergedDecks = [...currentDecks];

  for (const item of nextDecks) {
    const deckId = item.deck._id.toString();
    if (seenDeckIds.has(deckId)) {
      continue;
    }

    seenDeckIds.add(deckId);
    mergedDecks.push(item);
  }

  return mergedDecks;
}

interface Props {
  initialResponse: PaginatedDeckResponse;
  filteredCard?: Card | null;
  cardId?: string;
  isAuthenticated: boolean;
}

export default function PublicDecksClient({
  initialResponse,
  filteredCard,
  cardId,
  isAuthenticated,
}: Props) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedDecks, setLoadedDecks] = useState(initialResponse.decks);
  const [hasMoreServerResults, setHasMoreServerResults] = useState(
    initialResponse.hasMore
  );
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialResponse.nextCursor
  );
  const [totalDecks, setTotalDecks] = useState(initialResponse.total);
  const [apiWarnings, setApiWarnings] = useState(initialResponse.warnings);
  const [isFetchingDecks, setIsFetchingDecks] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sortBy, setSortBy] = useState<DeckSortBy>("newest");
  const [sortTransition, setSortTransition] = useState(false);
  const [selectedElements, setSelectedElements] = useState<ElementType[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<DeckBadgeType[]>([]);
  const [visibleCount, setVisibleCount] = useState(PUBLIC_DECKS_INITIAL_VISIBLE);
  const [openMenu, setOpenMenu] = useState<"elements" | "badges" | null>(null);

  const trimmedQuery = searchQuery.trim();
  const shouldUseInitialResponse =
    !filteredCard &&
    sortBy === "newest" &&
    !trimmedQuery &&
    selectedElements.length === 0 &&
    selectedBadges.length === 0;

  const handleSortChange = (newSortBy: DeckSortBy) => {
    if (newSortBy === sortBy) {
      return;
    }

    setSortTransition(true);
    setSortBy(newSortBy);
    setTimeout(() => setSortTransition(false), 300);
  };

  useEffect(() => {
    setLoadedDecks(initialResponse.decks);
    setHasMoreServerResults(initialResponse.hasMore);
    setNextCursor(initialResponse.nextCursor);
    setTotalDecks(initialResponse.total);
    setApiWarnings(initialResponse.warnings);
  }, [initialResponse]);

  useEffect(() => {
    setVisibleCount(PUBLIC_DECKS_INITIAL_VISIBLE);
  }, [
    sortBy,
    selectedBadges,
    selectedElements,
    filteredCard?.id,
    trimmedQuery,
    initialResponse.decks.length,
  ]);

  useEffect(() => {
    if (filteredCard || shouldUseInitialResponse) {
      setLoadedDecks(initialResponse.decks);
      setHasMoreServerResults(initialResponse.hasMore);
      setNextCursor(initialResponse.nextCursor);
      setTotalDecks(initialResponse.total);
      setApiWarnings(initialResponse.warnings);
      setSearchError("");
      setIsFetchingDecks(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsFetchingDecks(true);
        setSearchError("");

        const response = await fetchDeckPage({
          sortBy,
          searchQuery: trimmedQuery || undefined,
          elements: selectedElements,
          badges: selectedBadges,
          signal: controller.signal,
        });

        setLoadedDecks(response.decks);
        setHasMoreServerResults(response.hasMore);
        setNextCursor(response.nextCursor);
        setTotalDecks(response.total);
        setApiWarnings(response.warnings);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("Failed to fetch decks:", error);
        setSearchError(
          trimmedQuery
            ? "Search is temporarily unavailable."
            : "Failed to load decks."
        );
      } finally {
        setIsFetchingDecks(false);
      }
    }, trimmedQuery ? 250 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [
    filteredCard,
    initialResponse,
    selectedBadges,
    selectedElements,
    shouldUseInitialResponse,
    sortBy,
    trimmedQuery,
  ]);

  useEffect(() => {
    if (apiWarnings.length === 0) {
      return;
    }

    console.warn("Deck browse API warnings:", apiWarnings);
  }, [apiWarnings]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick, true);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick, true);
  }, []);

  const toggleElement = (element: ElementType) => {
    setSelectedElements((prev) =>
      prev.includes(element)
        ? prev.filter((item) => item !== element)
        : [...prev, element]
    );
  };

  const clearAllElements = () => {
    setSelectedElements([]);
  };

  const toggleBadge = (badge: DeckBadgeType) => {
    setSelectedBadges((prev) =>
      prev.includes(badge)
        ? prev.filter((item) => item !== badge)
        : [...prev, badge]
    );
  };

  const clearAllBadges = () => {
    setSelectedBadges([]);
  };

  const elementFilterLabel =
    selectedElements.length === 0
      ? "Elements"
      : selectedElements.length === 1
      ? selectedElements[0]
      : `Elements (${selectedElements.length})`;

  const badgeFilterLabel =
    selectedBadges.length === 0
      ? "Deck Type"
      : selectedBadges.length === 1
      ? selectedBadges[0]
      : `Deck Type (${selectedBadges.length})`;

  const displayedDecks = useMemo(
    () => loadedDecks.slice(0, visibleCount),
    [loadedDecks, visibleCount]
  );
  const displayedDeckCount = Math.min(displayedDecks.length, totalDecks);
  const canLoadMore = loadedDecks.length > visibleCount || hasMoreServerResults;

  const handleLoadMore = async () => {
    if (loadedDecks.length > visibleCount) {
      setVisibleCount((prev) =>
        Math.min(prev + PUBLIC_DECKS_LOAD_MORE_STEP, loadedDecks.length)
      );
      return;
    }

    if (isFetchingDecks || !hasMoreServerResults || !nextCursor) {
      return;
    }

    try {
      setIsFetchingDecks(true);
      setSearchError("");

      const response = await fetchDeckPage({
        sortBy,
        searchQuery: filteredCard ? undefined : trimmedQuery || undefined,
        cursor: nextCursor,
        elements: filteredCard ? undefined : selectedElements,
        badges: filteredCard ? undefined : selectedBadges,
        cardId,
      });

      setLoadedDecks((prev) => mergeDeckPages(prev, response.decks));
      setHasMoreServerResults(response.hasMore);
      setNextCursor(response.nextCursor);
      setTotalDecks(response.total);
      setApiWarnings(response.warnings);
      setVisibleCount((prev) => prev + PUBLIC_DECKS_LOAD_MORE_STEP);
    } catch (error) {
      console.error("Failed to load more decks:", error);
      setSearchError("Failed to load more decks.");
    } finally {
      setIsFetchingDecks(false);
    }
  };

  return (
    <div className='mx-auto max-w-[95%] bg-background px-6 py-8'>
      <div className='mb-6'>
        {filteredCard ? (
          <div className='flex items-center'>
            <Link
              href='/decks'
              className='mr-3 text-algomancy-purple hover:text-algomancy-gold'>
              {"<-"} Back to All Decks
            </Link>
            <h1 className='text-2xl font-bold text-white'>
              Decks with {filteredCard.name}
            </h1>
          </div>
        ) : (
          <>
            <div>
              <h1 className='text-2xl font-bold text-white'>Public Decks</h1>
            </div>
            <div
              ref={toolbarRef}
              className='mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.8fr)_170px_170px_170px] lg:items-center'>
              <div className='relative w-full min-w-0'>
                <MagnifyingGlassIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <input
                  type='search'
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='Search by deck, author, or card'
                  aria-label='Search decks'
                  className='w-full rounded-md border border-algomancy-purple/30 bg-algomancy-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500'
                />
              </div>

              <div className='relative w-full'>
                <button
                  type='button'
                  onClick={() =>
                    setOpenMenu((prev) => (prev === "elements" ? null : "elements"))
                  }
                  aria-label='Filter by elements'
                  className='inline-flex w-full items-center justify-between rounded-md border border-algomancy-purple/30 bg-algomancy-dark px-3 py-2 text-sm text-white'>
                  <span className='truncate'>{elementFilterLabel}</span>
                  <ChevronDownIcon className='ml-3 h-4 w-4 shrink-0 text-gray-400' />
                </button>
                {openMenu === "elements" && (
                  <div className='absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-algomancy-purple/30 bg-algomancy-darker p-3 shadow-xl lg:right-auto lg:w-[220px]'>
                    <div className='space-y-2'>
                      {BASIC_ELEMENTS.map((element) => {
                        const isSelected = selectedElements.includes(element);
                        return (
                          <button
                            key={element}
                            type='button'
                            onClick={() => toggleElement(element)}
                            className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors ${
                              isSelected
                                ? "bg-algomancy-purple/20 text-white"
                                : "text-gray-300 hover:bg-white/5"
                            }`}>
                            <span className='flex items-center gap-2'>
                              <ElementIcon
                                element={element}
                                size={20}
                                showTooltip={false}
                              />
                              {element}
                            </span>
                            {isSelected && (
                              <span className='text-xs text-algomancy-gold'>
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selectedElements.length > 0 && (
                      <button
                        type='button'
                        onClick={clearAllElements}
                        className='mt-3 text-xs text-algomancy-purple transition-colors hover:text-algomancy-gold'>
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className='relative w-full'>
                <button
                  type='button'
                  onClick={() =>
                    setOpenMenu((prev) => (prev === "badges" ? null : "badges"))
                  }
                  aria-label='Filter by deck type'
                  className='inline-flex w-full items-center justify-between rounded-md border border-algomancy-purple/30 bg-algomancy-dark px-3 py-2 text-sm text-white'>
                  <span className='truncate'>{badgeFilterLabel}</span>
                  <ChevronDownIcon className='ml-3 h-4 w-4 shrink-0 text-gray-400' />
                </button>
                {openMenu === "badges" && (
                  <div className='absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-algomancy-purple/30 bg-algomancy-darker p-3 shadow-xl lg:right-auto lg:w-[240px]'>
                    <div className='flex flex-wrap gap-2'>
                      {DECK_BADGE_VALUES.map((badge) => {
                        const isSelected = selectedBadges.includes(badge);
                        return (
                          <button
                            key={badge}
                            type='button'
                            onClick={() => toggleBadge(badge)}
                            className={`rounded-full transition-opacity ${
                              isSelected
                                ? "opacity-100"
                                : "opacity-65 hover:opacity-100"
                            }`}
                            aria-pressed={isSelected}>
                            <DeckBadge badge={badge} />
                          </button>
                        );
                      })}
                    </div>
                    {selectedBadges.length > 0 && (
                      <button
                        type='button'
                        onClick={clearAllBadges}
                        className='mt-3 text-xs text-algomancy-purple transition-colors hover:text-algomancy-gold'>
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className='w-full'>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    handleSortChange(event.target.value as DeckSortBy)
                  }
                  aria-label='Sort decks'
                  className='w-full rounded-md border border-algomancy-purple/30 bg-algomancy-dark px-3 py-2 text-sm text-white'>
                  <option value='newest'>Sort: Newest</option>
                  <option value='popular'>Sort: Popular</option>
                  <option value='liked'>Sort: Most Liked</option>
                </select>
              </div>
            </div>

            <div className='mt-3 flex min-h-4 items-center justify-between gap-3 text-xs text-gray-400'>
              <p
                className='min-w-0'
                data-testid='deck-results-summary'>
                Showing {displayedDeckCount} of {totalDecks} public decks
              </p>
              <div className='min-w-[8rem] text-right'>
                {isFetchingDecks && (
                  <span className='inline-flex items-center gap-2 text-gray-400'>
                    <span
                      aria-hidden='true'
                      className='h-2 w-2 rounded-full bg-algomancy-gold animate-pulse'
                    />
                    {trimmedQuery ? "Searching..." : "Loading..."}
                  </span>
                )}
              </div>
            </div>

            {(searchError || apiWarnings.length > 0) && (
              <div className='mt-2 text-sm'>
                {searchError && (
                  <p className='text-red-400'>{searchError}</p>
                )}
                {apiWarnings.includes("limit_capped_to_max") && (
                  <p className='text-amber-300'>
                    Backend capped this request to the maximum page size.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {filteredCard && (
        <div className='mb-6 rounded-lg border border-algomancy-purple/30 bg-algomancy-dark p-4'>
          <div className='flex items-center'>
            <div className='relative mr-4 h-16 w-12 overflow-hidden rounded'>
              <img
                src={filteredCard.imageUrl}
                alt={filteredCard.name}
                className='h-full w-full object-cover'
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
              <p className='mt-1 text-xs text-gray-400'>
                Showing {displayedDeckCount} of {totalDecks}{" "}
                decks containing this card
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`transition-all duration-300 ${
          sortTransition ? "scale-95 opacity-50" : "scale-100 opacity-100"
        }`}>
        <DeckGrid
          decksWithUserInfo={displayedDecks}
          emptyMessage={
            filteredCard
              ? `No decks found containing ${filteredCard.name}`
              : trimmedQuery
              ? "No public decks matched your search"
              : selectedElements.length > 0 || selectedBadges.length > 0
              ? "No decks match the current filters"
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
            isAuthenticated ? "Create a Deck" : "Try Deck Builder (Guest Mode)"
          }
          columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          className='py-4'
        />
      </div>

      {canLoadMore && (
        <div className='mt-6 text-center'>
          <button
            type='button'
            onClick={handleLoadMore}
            disabled={isFetchingDecks}
            data-testid='load-more-decks'
            className='inline-flex items-center justify-center rounded-md bg-algomancy-purple/30 px-4 py-2 text-sm text-white transition-colors hover:bg-algomancy-purple/50 disabled:cursor-not-allowed disabled:opacity-60'>
            {isFetchingDecks ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
