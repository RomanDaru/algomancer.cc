import {
  buildRankedLists,
  computeWinRate,
  normalizeBreakdown,
} from "../gameStatsUtils";

describe("gameStatsUtils", () => {
  test("computeWinRate ignores draws and handles empty totals", () => {
    expect(computeWinRate(0, 0)).toBe(0);
    expect(computeWinRate(3, 1)).toBeCloseTo(0.75);
  });

  test("normalizeBreakdown adds winRate", () => {
    const result = normalizeBreakdown({
      total: 5,
      wins: 2,
      losses: 2,
      draws: 1,
      winRate: 0,
    });
    expect(result.winRate).toBeCloseTo(0.5);
  });

  test("buildRankedLists respects min sample size and sorts correctly", () => {
    const items = [
      { total: 10, wins: 8, losses: 2, draws: 0, winRate: 0, cardId: "a" },
      { total: 4, wins: 4, losses: 0, draws: 0, winRate: 0, cardId: "b" },
      { total: 12, wins: 6, losses: 6, draws: 0, winRate: 0, cardId: "c" },
    ];

    const result = buildRankedLists(items, { minSampleSize: 5, maxResults: 2 });

    expect(result.mostPlayed.map((item) => item.cardId)).toEqual(["c", "a"]);
    expect(result.highestWinRate.map((item) => item.cardId)).toEqual(["a", "c"]);
    expect(result.minSampleSize).toBe(5);
  });
});
