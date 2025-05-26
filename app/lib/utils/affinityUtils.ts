import { Card, Affinity } from "../types/card";
import { DeckCard } from "../types/user";

/**
 * Utility functions for calculating affinity requirements in decks
 */

export interface AffinityRequirements {
  fire: number;
  water: number;
  earth: number;
  wood: number;
  metal: number;
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
  const totalAffinity: AffinityRequirements = {
    fire: 0,
    water: 0,
    earth: 0,
    wood: 0,
    metal: 0,
  };

  deckCards.forEach((deckCard) => {
    const card = cards.find((c) => c.id === deckCard.cardId);
    if (card && card.stats.affinity) {
      const affinity = card.stats.affinity;
      const quantity = deckCard.quantity;

      // Add affinity requirements multiplied by quantity
      totalAffinity.fire += (affinity.fire || 0) * quantity;
      totalAffinity.water += (affinity.water || 0) * quantity;
      totalAffinity.earth += (affinity.earth || 0) * quantity;
      totalAffinity.wood += (affinity.wood || 0) * quantity;
      totalAffinity.metal += (affinity.metal || 0) * quantity;
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
  const peakAffinity: AffinityRequirements = {
    fire: 0,
    water: 0,
    earth: 0,
    wood: 0,
    metal: 0,
  };

  deckCards.forEach((deckCard) => {
    const card = cards.find((c) => c.id === deckCard.cardId);
    if (card && card.stats.affinity) {
      const affinity = card.stats.affinity;

      // Update peak values if this card has higher requirements
      peakAffinity.fire = Math.max(peakAffinity.fire, affinity.fire || 0);
      peakAffinity.water = Math.max(peakAffinity.water, affinity.water || 0);
      peakAffinity.earth = Math.max(peakAffinity.earth, affinity.earth || 0);
      peakAffinity.wood = Math.max(peakAffinity.wood, affinity.wood || 0);
      peakAffinity.metal = Math.max(peakAffinity.metal, affinity.metal || 0);
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
      const manaCost = card.manaCost;
      const affinity = card.stats.affinity;
      const quantity = deckCard.quantity;

      // Initialize mana cost entry if it doesn't exist
      if (!affinityByManaCost[manaCost]) {
        affinityByManaCost[manaCost] = {
          fire: 0,
          water: 0,
          earth: 0,
          wood: 0,
          metal: 0,
        };
      }

      // Add affinity requirements for this mana cost
      affinityByManaCost[manaCost].fire += (affinity.fire || 0) * quantity;
      affinityByManaCost[manaCost].water += (affinity.water || 0) * quantity;
      affinityByManaCost[manaCost].earth += (affinity.earth || 0) * quantity;
      affinityByManaCost[manaCost].wood += (affinity.wood || 0) * quantity;
      affinityByManaCost[manaCost].metal += (affinity.metal || 0) * quantity;
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
export function hasAffinityRequirements(affinity: AffinityRequirements): boolean {
  return (
    affinity.fire > 0 ||
    affinity.water > 0 ||
    affinity.earth > 0 ||
    affinity.wood > 0 ||
    affinity.metal > 0
  );
}

/**
 * Get non-zero affinity requirements as an array of [element, value] pairs
 */
export function getNonZeroAffinityEntries(
  affinity: AffinityRequirements
): Array<[string, number]> {
  return Object.entries(affinity).filter(([_, value]) => value > 0);
}
