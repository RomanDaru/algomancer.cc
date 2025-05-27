"use client";

import { useState, useEffect, useCallback } from "react";

interface UseInfiniteScrollProps<T> {
  items: T[];
  itemsPerPage: number;
  initialLoad?: number;
}

export function useInfiniteScroll<T>({
  items,
  itemsPerPage,
  initialLoad = 50
}: UseInfiniteScrollProps<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initialize with first batch
  useEffect(() => {
    const initialItems = items.slice(0, initialLoad);
    setDisplayedItems(initialItems);
    setCurrentPage(Math.ceil(initialLoad / itemsPerPage));
    setHasMore(items.length > initialLoad);
  }, [items, itemsPerPage, initialLoad]);

  // Load more items
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate slight delay for smooth UX
    setTimeout(() => {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newItems = items.slice(startIndex, endIndex);
      
      if (newItems.length > 0) {
        setDisplayedItems(prev => [...prev, ...newItems]);
        setCurrentPage(prev => prev + 1);
        setHasMore(endIndex < items.length);
      } else {
        setHasMore(false);
      }
      
      setIsLoading(false);
    }, 100);
  }, [items, currentPage, itemsPerPage, isLoading, hasMore]);

  // Reset when items change (e.g., search/filter)
  useEffect(() => {
    const initialItems = items.slice(0, initialLoad);
    setDisplayedItems(initialItems);
    setCurrentPage(Math.ceil(initialLoad / itemsPerPage));
    setHasMore(items.length > initialLoad);
  }, [items]);

  return {
    displayedItems,
    loadMore,
    isLoading,
    hasMore,
    totalItems: items.length,
    displayedCount: displayedItems.length
  };
}
