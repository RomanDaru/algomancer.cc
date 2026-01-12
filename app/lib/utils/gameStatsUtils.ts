import type { StatsBreakdown, StatsRankedList } from "../types/gameStats";

export const DEFAULT_MIN_SAMPLE_SIZE = 5;
export const DEFAULT_MAX_RANKED = 10;

export const computeWinRate = (wins: number, losses: number) => {
  const total = wins + losses;
  return total > 0 ? wins / total : 0;
};

export const normalizeBreakdown = <T extends StatsBreakdown>(item: T): T => {
  return {
    ...item,
    winRate: computeWinRate(item.wins, item.losses),
  };
};

export const buildRankedLists = <T extends StatsBreakdown>(
  items: T[],
  options?: { minSampleSize?: number; maxResults?: number }
): StatsRankedList<T> => {
  const minSampleSize = options?.minSampleSize ?? DEFAULT_MIN_SAMPLE_SIZE;
  const maxResults = options?.maxResults ?? DEFAULT_MAX_RANKED;
  const normalized = items.map(normalizeBreakdown);
  const mostPlayed = [...normalized]
    .sort((a, b) => b.total - a.total)
    .slice(0, maxResults);
  const highestWinRate = normalized
    .filter((item) => item.total >= minSampleSize)
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.total - a.total;
    })
    .slice(0, maxResults);

  return { mostPlayed, highestWinRate, minSampleSize };
};
