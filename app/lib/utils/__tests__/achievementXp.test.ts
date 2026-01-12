import {
  calculateBonusXp,
  calculateDeckCreateXp,
  calculateLikeXp,
  calculateLogXp,
  getMaxDecksPerDay,
} from "@/app/lib/utils/achievementXp";

describe("achievementXp utils", () => {
  it("calculates bonus XP from likes and deck creation with daily caps", () => {
    const result = calculateBonusXp({
      totalLikes: 8,
      deckCounts: [{ count: 6 }, { count: 2 }],
      totalLogs: 3,
    });

    expect(result.likeXp).toBe(40);
    expect(result.deckXp).toBe(70);
    expect(result.logXp).toBe(15);
    expect(result.totalBonusXp).toBe(125);
  });

  it("caps deck creation XP per day", () => {
    const deckXp = calculateDeckCreateXp([{ count: 6 }], 10, 50);
    expect(deckXp).toBe(50);
  });

  it("guards against non-positive inputs", () => {
    expect(calculateLikeXp(-3, 5)).toBe(0);
    expect(calculateLogXp(-2, 5)).toBe(0);
    expect(getMaxDecksPerDay(0, 10)).toBe(0);
    expect(calculateDeckCreateXp([{ count: 2 }], 0, 50)).toBe(0);
  });
});
