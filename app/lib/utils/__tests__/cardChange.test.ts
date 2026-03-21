import { Card } from "../../types/card";
import {
  buildCardChangeSummary,
  didCardAssetsChange,
  didCardRulesChange,
  resolveCardChangeScope,
} from "../cardChange";

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "hammer-of-justice",
    name: "Hammer of Justice",
    manaCost: 6,
    element: {
      type: "Light/Earth",
      symbol: "L",
      secondarySymbol: "E",
    },
    stats: {
      power: 10,
      defense: 5,
      affinity: {},
    },
    timing: {
      type: "Standard",
      description: "Play during your main phase.",
    },
    typeAndAttributes: {
      mainType: "Unit",
      subType: "Guardian",
      attributes: ["Tough"],
    },
    abilities: ["When this enters play, draw a card."],
    set: {
      symbol: "BT1",
      name: "Beta Test",
      complexity: "Rare",
    },
    imageUrl: "https://example.com/hammer-v1.jpg",
    ...overrides,
  };
}

describe("cardChange utilities", () => {
  it("detects rules changes separately from asset changes", () => {
    const previousCard = createCard();
    const nextCard = createCard({
      stats: {
        power: 10,
        defense: 3,
        affinity: {},
      },
      imageUrl: "https://example.com/hammer-v2.jpg",
    });

    expect(didCardRulesChange(previousCard, nextCard)).toBe(true);
    expect(didCardAssetsChange(previousCard, nextCard)).toBe(true);
    expect(resolveCardChangeScope(previousCard, nextCard, "auto")).toBe(
      "rules"
    );
    expect(buildCardChangeSummary(previousCard, nextCard, "rules")).toContain(
      "Stats: 10/5 -> 10/3"
    );
  });

  it("treats image-only updates as asset changes", () => {
    const previousCard = createCard();
    const nextCard = createCard({
      imageUrl: "https://example.com/hammer-v2.jpg",
    });

    expect(didCardRulesChange(previousCard, nextCard)).toBe(false);
    expect(didCardAssetsChange(previousCard, nextCard)).toBe(true);
    expect(resolveCardChangeScope(previousCard, nextCard, "auto")).toBe(
      "asset"
    );
  });

  it("allows an explicit asset-only override for mixed changes", () => {
    const previousCard = createCard();
    const nextCard = createCard({
      stats: {
        power: 10,
        defense: 3,
        affinity: {},
      },
      imageUrl: "https://example.com/hammer-v2.jpg",
    });

    expect(resolveCardChangeScope(previousCard, nextCard, "asset")).toBe(
      "asset"
    );
  });
});
