import { Affinity, Card } from "../../types/card";
import {
  calculateAffinityStats,
  createEmptyAffinityRequirements,
  getNonZeroAffinityEntries,
  hasAffinityRequirements,
} from "../affinityUtils";

function card(id: string, manaCost: number, affinity: Affinity): Card {
  return {
    id, name: id, manaCost,
    element: { type: "Dark/Light", symbol: "D", secondarySymbol: "L" },
    stats: { power: 1, defense: 1, affinity },
    timing: { type: "Standard", description: "" },
    typeAndAttributes: { mainType: "Unit", subType: "", attributes: [] },
    abilities: [],
    set: { name: "Test", symbol: "T", complexity: "Common" },
    imageUrl: "https://example.com/card.jpg",
  };
}

describe("affinity statistics", () => {
  it("includes Dark/Light in quantity totals, single-card peaks and mana buckets", () => {
    const cards = [
      card("one", 2, { dark: 2, light: 1, fire: 1 }),
      card("two", 2, { dark: 1, light: 3, water: 2 }),
      card("three", 6, { light: 2, metal: 1 }),
    ];
    const stats = calculateAffinityStats(cards, [
      { cardId: "one", quantity: 2 },
      { cardId: "two", quantity: 1 },
      { cardId: "three", quantity: 2 },
      { cardId: "unknown", quantity: 2 },
    ]);

    expect(stats.totalAffinity).toEqual({ fire: 2, water: 2, earth: 0, wood: 0, metal: 2, dark: 5, light: 9, prismite: 0 });
    expect(stats.peakAffinity).toEqual({ fire: 1, water: 2, earth: 0, wood: 0, metal: 1, dark: 2, light: 3, prismite: 0 });
    expect(stats.affinityByManaCost[2]).toMatchObject({ dark: 5, light: 5, fire: 2, water: 2 });
    expect(stats.affinityByManaCost[6]).toMatchObject({ dark: 0, light: 4, metal: 2 });
  });

  it("keeps older cards without expansion affinity compatible", () => {
    const stats = calculateAffinityStats([card("old", 1, { wood: 2 })], [{ cardId: "old", quantity: 2 }]);
    expect(stats.totalAffinity).toMatchObject({ wood: 4, dark: 0, light: 0 });
    expect(stats.peakAffinity).toMatchObject({ wood: 2, dark: 0, light: 0 });
    expect(hasAffinityRequirements({})).toBe(false);
    expect(calculateAffinityStats([], []).totalAffinity).toEqual(createEmptyAffinityRequirements());
  });

  it("shows requirements containing only Dark or Light", () => {
    expect(hasAffinityRequirements({ dark: 1 })).toBe(true);
    expect(hasAffinityRequirements({ light: 2 })).toBe(true);
    expect(getNonZeroAffinityEntries({ dark: 1, light: 2, fire: 0 })).toEqual([
      ["dark", 1], ["light", 2],
    ]);
    expect(hasAffinityRequirements({ dark: 0, light: 0 })).toBe(false);
  });
});
