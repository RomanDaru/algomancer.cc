"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  threshold?: number;
}

export default function InfiniteScrollTrigger({
  onLoadMore,
  isLoading,
  hasMore,
  threshold = 0.1
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && hasMore) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin: '100px' // Start loading 100px before the trigger comes into view
      }
    );

    observer.observe(trigger);

    return () => {
      observer.unobserve(trigger);
    };
  }, [onLoadMore, isLoading, hasMore, threshold]);

  if (!hasMore) return null;

  return (
    <div
      ref={triggerRef}
      className="flex justify-center items-center py-8"
    >
      {isLoading ? (
        <div className="flex items-center space-x-2 text-algomancy-purple">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-algomancy-purple"></div>
          <span className="text-sm">Loading more cards...</span>
        </div>
      ) : (
        <div className="text-gray-400 text-sm">
          Scroll down to load more cards
        </div>
      )}
    </div>
  );
}
