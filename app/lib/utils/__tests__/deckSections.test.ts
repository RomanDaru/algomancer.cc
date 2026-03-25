import { DECK_CONSTRUCTION_RULES } from "../../constants";
import {
  canAddCardToSection,
  canMoveCardBetweenSections,
  moveCardBetweenSections,
  normalizeDeckSections,
  validateDeckSections,
} from "../deckSections";

describe("deckSections", () => {
  it("blocks adding a third total copy across main deck and sideboard", () => {
    expect(
      canAddCardToSection({
        section: "sideboard",
        cards: [{ cardId: "card-1", quantity: 2 }],
        sideboard: [],
        cardId: "card-1",
      })
    ).toBe(false);

    expect(
      canAddCardToSection({
        section: "sideboard",
        cards: [{ cardId: "card-1", quantity: 1 }],
        sideboard: [{ cardId: "card-1", quantity: 1 }],
        cardId: "card-1",
      })
    ).toBe(false);
  });

  it("allows moving a copy between sections when the final state is legal", () => {
    expect(
      canMoveCardBetweenSections({
        from: "sideboard",
        cards: [{ cardId: "card-1", quantity: 1 }],
        sideboard: [{ cardId: "card-1", quantity: 1 }],
        cardId: "card-1",
      })
    ).toBe(true);

    expect(
      moveCardBetweenSections({
        from: "sideboard",
        cards: [{ cardId: "card-1", quantity: 1 }],
        sideboard: [{ cardId: "card-1", quantity: 1 }],
        cardId: "card-1",
      })
    ).toEqual({
      cards: [{ cardId: "card-1", quantity: 2 }],
      sideboard: [],
    });
  });

  it("normalizes duplicate entries before validating sideboard limits", () => {
    const sideboardCards = Array.from({
      length: DECK_CONSTRUCTION_RULES.maxSideboardCards + 1,
    }).map((_, index) => ({
      cardId: `card-${index + 1}`,
      quantity: 1,
    }));

    const normalized = normalizeDeckSections({
      cards: [
        { cardId: "card-1", quantity: 1 },
        { cardId: "card-1", quantity: 1 },
      ],
      sideboard: sideboardCards,
    });
    const validation = validateDeckSections(normalized);

    expect(normalized.cards).toEqual([{ cardId: "card-1", quantity: 2 }]);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain(
      `Sideboard cannot contain more than ${DECK_CONSTRUCTION_RULES.maxSideboardCards} cards`
    );
  });
});
