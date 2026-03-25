import { DECK_CONSTRUCTION_RULES } from "../constants";
import { Deck, DeckCard } from "../types/user";

export type DeckSection = "main" | "sideboard";

type DeckSections = {
  cards?: DeckCard[];
  sideboard?: DeckCard[];
};

function sanitizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.max(0, Math.floor(quantity));
}

export function normalizeDeckSection(cards: DeckCard[] = []): DeckCard[] {
  const mergedCards = new Map<string, number>();

  for (const card of cards) {
    if (!card?.cardId) {
      continue;
    }

    const quantity = sanitizeQuantity(card.quantity);
    if (quantity <= 0) {
      continue;
    }

    mergedCards.set(card.cardId, (mergedCards.get(card.cardId) || 0) + quantity);
  }

  return [...mergedCards.entries()].map(([cardId, quantity]) => ({
    cardId,
    quantity,
  }));
}

export function normalizeDeckSections({
  cards = [],
  sideboard = [],
}: DeckSections): { cards: DeckCard[]; sideboard: DeckCard[] } {
  return {
    cards: normalizeDeckSection(cards),
    sideboard: normalizeDeckSection(sideboard),
  };
}

export function getDeckSectionTotal(cards: DeckCard[] = []): number {
  return cards.reduce((sum, card) => sum + sanitizeQuantity(card.quantity), 0);
}

export function getDeckCardQuantity(
  cards: DeckCard[] = [],
  cardId: string
): number {
  return cards.find((card) => card.cardId === cardId)?.quantity || 0;
}

export function getCardTotalQuantityAcrossSections(
  cards: DeckCard[] = [],
  sideboard: DeckCard[] = [],
  cardId: string
): number {
  return (
    getDeckCardQuantity(cards, cardId) + getDeckCardQuantity(sideboard, cardId)
  );
}

export function getDeckCardIds(
  deckLike: Pick<Deck, "cards"> & Partial<Pick<Deck, "sideboard">>
): string[] {
  return [...new Set([...(deckLike.cards || []), ...(deckLike.sideboard || [])].map((card) => card.cardId))];
}

export function canAddCardToSection({
  section,
  cards = [],
  sideboard = [],
  cardId,
  amount = 1,
}: DeckSections & {
  section: DeckSection;
  cardId: string;
  amount?: number;
}): boolean {
  const normalizedAmount = sanitizeQuantity(amount);

  if (!cardId || normalizedAmount <= 0) {
    return false;
  }

  const normalizedSections = normalizeDeckSections({ cards, sideboard });
  const targetSection =
    section === "main" ? normalizedSections.cards : normalizedSections.sideboard;

  const targetQuantity = getDeckCardQuantity(targetSection, cardId);
  const totalQuantity = getCardTotalQuantityAcrossSections(
    normalizedSections.cards,
    normalizedSections.sideboard,
    cardId
  );

  if (
    targetQuantity + normalizedAmount >
    DECK_CONSTRUCTION_RULES.maxCopiesPerCardPerZone
  ) {
    return false;
  }

  if (
    totalQuantity + normalizedAmount >
    DECK_CONSTRUCTION_RULES.maxCopiesPerCardTotal
  ) {
    return false;
  }

  if (section === "sideboard") {
    const nextSideboardTotal =
      getDeckSectionTotal(normalizedSections.sideboard) + normalizedAmount;

    if (nextSideboardTotal > DECK_CONSTRUCTION_RULES.maxSideboardCards) {
      return false;
    }
  }

  return true;
}

export function addCardToSection(
  cards: DeckCard[] = [],
  cardId: string,
  amount: number = 1
): DeckCard[] {
  const normalizedCards = normalizeDeckSection(cards);
  const normalizedAmount = sanitizeQuantity(amount);

  if (!cardId || normalizedAmount <= 0) {
    return normalizedCards;
  }

  const existingCardIndex = normalizedCards.findIndex(
    (card) => card.cardId === cardId
  );

  if (existingCardIndex === -1) {
    return [...normalizedCards, { cardId, quantity: normalizedAmount }];
  }

  const updatedCards = [...normalizedCards];
  updatedCards[existingCardIndex] = {
    ...updatedCards[existingCardIndex],
    quantity: updatedCards[existingCardIndex].quantity + normalizedAmount,
  };

  return updatedCards;
}

export function removeCardFromSection(
  cards: DeckCard[] = [],
  cardId: string,
  amount: number = 1
): DeckCard[] {
  const normalizedCards = normalizeDeckSection(cards);
  const normalizedAmount = sanitizeQuantity(amount);

  if (!cardId || normalizedAmount <= 0) {
    return normalizedCards;
  }

  const existingCardIndex = normalizedCards.findIndex(
    (card) => card.cardId === cardId
  );

  if (existingCardIndex === -1) {
    return normalizedCards;
  }

  const updatedQuantity =
    normalizedCards[existingCardIndex].quantity - normalizedAmount;

  if (updatedQuantity <= 0) {
    return normalizedCards.filter((card) => card.cardId !== cardId);
  }

  const updatedCards = [...normalizedCards];
  updatedCards[existingCardIndex] = {
    ...updatedCards[existingCardIndex],
    quantity: updatedQuantity,
  };

  return updatedCards;
}

export function removeAllCopiesFromSection(
  cards: DeckCard[] = [],
  cardId: string
): DeckCard[] {
  return normalizeDeckSection(cards).filter((card) => card.cardId !== cardId);
}

export function moveCardBetweenSections({
  from,
  cards = [],
  sideboard = [],
  cardId,
  amount = 1,
}: DeckSections & {
  from: DeckSection;
  cardId: string;
  amount?: number;
}): { cards: DeckCard[]; sideboard: DeckCard[] } {
  const normalizedSections = normalizeDeckSections({ cards, sideboard });
  const normalizedAmount = sanitizeQuantity(amount);
  const sourceKey = from === "main" ? "cards" : "sideboard";
  const sourceSection = normalizedSections[sourceKey];

  if (
    !cardId ||
    normalizedAmount <= 0 ||
    getDeckCardQuantity(sourceSection, cardId) < normalizedAmount
  ) {
    return normalizedSections;
  }

  const sectionsAfterRemoval = {
    cards:
      from === "main"
        ? removeCardFromSection(normalizedSections.cards, cardId, normalizedAmount)
        : normalizedSections.cards,
    sideboard:
      from === "sideboard"
        ? removeCardFromSection(
            normalizedSections.sideboard,
            cardId,
            normalizedAmount
          )
        : normalizedSections.sideboard,
  };

  if (
    !canAddCardToSection({
      section: from === "main" ? "sideboard" : "main",
      cards: sectionsAfterRemoval.cards,
      sideboard: sectionsAfterRemoval.sideboard,
      cardId,
      amount: normalizedAmount,
    })
  ) {
    return normalizedSections;
  }

  return {
    cards:
      from === "main"
        ? sectionsAfterRemoval.cards
        : addCardToSection(sectionsAfterRemoval.cards, cardId, normalizedAmount),
    sideboard:
      from === "main"
        ? addCardToSection(
            sectionsAfterRemoval.sideboard,
            cardId,
            normalizedAmount
          )
        : sectionsAfterRemoval.sideboard,
  };
}

export function canMoveCardBetweenSections({
  from,
  cards = [],
  sideboard = [],
  cardId,
  amount = 1,
}: DeckSections & {
  from: DeckSection;
  cardId: string;
  amount?: number;
}): boolean {
  const normalizedSections = normalizeDeckSections({ cards, sideboard });
  const movedSections = moveCardBetweenSections({
    from,
    cards: normalizedSections.cards,
    sideboard: normalizedSections.sideboard,
    cardId,
    amount,
  });

  return (
    JSON.stringify(movedSections.cards) !== JSON.stringify(normalizedSections.cards) ||
    JSON.stringify(movedSections.sideboard) !== JSON.stringify(normalizedSections.sideboard)
  );
}

export function validateDeckSections({
  cards = [],
  sideboard = [],
}: DeckSections): {
  isValid: boolean;
  errors: string[];
  mainDeckCount: number;
  sideboardCount: number;
} {
  const normalizedSections = normalizeDeckSections({ cards, sideboard });
  const errors: string[] = [];
  const mainDeckCount = getDeckSectionTotal(normalizedSections.cards);
  const sideboardCount = getDeckSectionTotal(normalizedSections.sideboard);
  const cardIds = new Set([
    ...normalizedSections.cards.map((card) => card.cardId),
    ...normalizedSections.sideboard.map((card) => card.cardId),
  ]);

  if (sideboardCount > DECK_CONSTRUCTION_RULES.maxSideboardCards) {
    errors.push(
      `Sideboard cannot contain more than ${DECK_CONSTRUCTION_RULES.maxSideboardCards} cards`
    );
  }

  for (const deckCard of normalizedSections.cards) {
    if (
      deckCard.quantity > DECK_CONSTRUCTION_RULES.maxCopiesPerCardPerZone
    ) {
      errors.push(
        `Main deck cannot contain more than ${DECK_CONSTRUCTION_RULES.maxCopiesPerCardPerZone} copies of a card`
      );
      break;
    }
  }

  for (const sideboardCard of normalizedSections.sideboard) {
    if (
      sideboardCard.quantity > DECK_CONSTRUCTION_RULES.maxCopiesPerCardPerZone
    ) {
      errors.push(
        `Sideboard cannot contain more than ${DECK_CONSTRUCTION_RULES.maxCopiesPerCardPerZone} copies of a card`
      );
      break;
    }
  }

  for (const cardId of cardIds) {
    if (
      getCardTotalQuantityAcrossSections(
        normalizedSections.cards,
        normalizedSections.sideboard,
        cardId
      ) > DECK_CONSTRUCTION_RULES.maxCopiesPerCardTotal
    ) {
      errors.push(
        `A card cannot appear more than ${DECK_CONSTRUCTION_RULES.maxCopiesPerCardTotal} times across deck and sideboard`
      );
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    mainDeckCount,
    sideboardCount,
  };
}
