import { Card, Affinity, AFFINITY_ELEMENTS } from "../types/card";
import { DeckCard } from "../types/user";
import { manaBucket } from "./cardValues";

/**
 * Utility functions for calculating affinity requirements in decks
 */

export type AffinityRequirements = Required<Affinity>;

export function createEmptyAffinityRequirements(): AffinityRequirements {
  return { fire: 0, water: 0, earth: 0, wood: 0, metal: 0, dark: 0, light: 0, prismite: 0 };
}

export interface AffinityStats {
  totalAffinity: AffinityRequirements;
  peakAffinity: AffinityRequirements;
  affinityByManaCost: Record<number, AffinityRequirements>;
}

/**
 * Calculate total affinity requirements for a deck
 * This sums up all affinity requirements across all cards (considering quantities)
 */
export function calculateTotalAffinity(
  cards: Card[],
  deckCards: DeckCard[]
): AffinityRequirements {
  const totalAffinity = createEmptyAffinityRequirements();

  deckCards.forEach((deckCard) => {
    const card = cards.find((c) => c.id === deckCard.cardId);
    if (card && card.stats.affinity) {
      const affinity = card.stats.affinity;
      const quantity = deckCard.quantity;

      // Add affinity requirements multiplied by quantity
      for (const element of AFFINITY_ELEMENTS) {
        totalAffinity[element] += (affinity[element] || 0) * quantity;
      }
    }
  });

  return totalAffinity;
}

/**
 * Calculate peak affinity requirements for a deck
 * This finds the highest single-card affinity requirement for each element
 */
export function calculatePeakAffinity(
  cards: Card[],
  deckCards: DeckCard[]
): AffinityRequirements {
  const peakAffinity = createEmptyAffinityRequirements();

  deckCards.forEach((deckCard) => {
    const card = cards.find((c) => c.id === deckCard.cardId);
    if (card && card.stats.affinity) {
      const affinity = card.stats.affinity;

      // Update peak values if this card has higher requirements
      for (const element of AFFINITY_ELEMENTS) {
        peakAffinity[element] = Math.max(peakAffinity[element], affinity[element] || 0);
      }
    }
  });

  return peakAffinity;
}

/**
 * Calculate affinity requirements by mana cost
 * This shows how affinity requirements are distributed across the mana curve
 */
export function calculateAffinityByManaCost(
  cards: Card[],
  deckCards: DeckCard[]
): Record<number, AffinityRequirements> {
  const affinityByManaCost: Record<number, AffinityRequirements> = {};

  deckCards.forEach((deckCard) => {
    const card = cards.find((c) => c.id === deckCard.cardId);
    if (card && card.stats.affinity) {
      const manaCost = manaBucket(card);
      const affinity = card.stats.affinity;
      const quantity = deckCard.quantity;

      // Initialize mana cost entry if it doesn't exist
      if (!affinityByManaCost[manaCost]) {
        affinityByManaCost[manaCost] = createEmptyAffinityRequirements();
      }

      // Add affinity requirements for this mana cost
      for (const element of AFFINITY_ELEMENTS) {
        affinityByManaCost[manaCost][element] += (affinity[element] || 0) * quantity;
      }
    }
  });

  return affinityByManaCost;
}

/**
 * Calculate all affinity statistics for a deck
 */
export function calculateAffinityStats(
  cards: Card[],
  deckCards: DeckCard[]
): AffinityStats {
  return {
    totalAffinity: calculateTotalAffinity(cards, deckCards),
    peakAffinity: calculatePeakAffinity(cards, deckCards),
    affinityByManaCost: calculateAffinityByManaCost(cards, deckCards),
  };
}

/**
 * Check if affinity requirements object has any non-zero values
 */
export function hasAffinityRequirements(affinity: Affinity): boolean {
  return AFFINITY_ELEMENTS.some((element) => (affinity[element] || 0) > 0);
}

/**
 * Get non-zero affinity requirements as an array of [element, value] pairs
 */
export function getNonZeroAffinityEntries(
  affinity: Affinity
): Array<[string, number]> {
  return AFFINITY_ELEMENTS
    .map((element): [string, number] => [element, affinity[element] || 0])
    .filter(([, value]) => value > 0);
}
