/**
 * Element types and utilities for Algomancy
 */

import { PrimaryElementType, Card } from "../types/card";

// For our UI purposes, we'll use the primary elements plus Colorless.
export type ElementType = PrimaryElementType | "Colorless";

export interface ElementInfo {
  name: ElementType;
  color: string;
  imageUrl: string;
  textColor: string; // For text that appears on top of the element color
}

// Element information including colors and image URLs
export const ELEMENTS: Record<ElementType, ElementInfo> = {
  Fire: {
    name: "Fire",
    color: "#EC2826",
    imageUrl:
      "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1773229891/Fire_Resource_v2_uvygtp.png",
    textColor: "white",
  },
  Water: {
    name: "Water",
    color: "#5ACBF3",
    imageUrl:
      "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1773229889/Water_Resource_v2_qxgfo6.png",
    textColor: "black",
  },
  Earth: {
    name: "Earth",
    color: "#F38F30",
    imageUrl:
      "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1773229888/Earth_Resource_v2_axuty8.png",
    textColor: "black",
  },
  Wood: {
    name: "Wood",
    color: "#6DBF59",
    imageUrl:
      "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1773229886/Wood_Resource_v2_dizqmo.png",
    textColor: "black",
  },
  Metal: {
    name: "Metal",
    color: "#D7D9D9",
    imageUrl:
      "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1773229885/Metal_Resource_v2_r64wvn.png",
    textColor: "black",
  },
  Dark: {
    name: "Dark",
    color: "#4B2E83",
    imageUrl:
      "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1773228351/Dark_Resource_vqcbuy.png",
    textColor: "white",
  },
  Light: {
    name: "Light",
    color: "#F7E7A5",
    imageUrl:
      "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1773228647/Light_Resource_csdngl.png",
    textColor: "black",
  },
  Colorless: {
    name: "Colorless",
    color: "#9B7CB9", // Using a purple color for colorless
    imageUrl: "", // No specific image for colorless
    textColor: "white",
  },
};

/**
 * Get ALL elements present in a deck (including hybrid elements)
 * @param cards Array of cards in the deck
 * @returns Array of all element types present in the deck
 */
export function getAllDeckElements(
  cards: { card: Card; quantity: number }[]
): ElementType[] {
  if (!cards || cards.length === 0) {
    return ["Colorless"];
  }

  const allElementsInDeck = new Set<ElementType>();
  const validPrimaryElements = new Set<ElementType>([
    "Fire",
    "Water",
    "Earth",
    "Wood",
    "Metal",
    "Dark",
    "Light",
  ]);

  cards.forEach(({ card }) => {
    if (card.element && card.element.type) {
      const elementType = card.element.type;
      // Handle both single and hybrid elements
      if (elementType.includes("/")) {
        // Hybrid element - add both parts
        const parts = elementType.split("/");
        parts.forEach((part) => {
          const trimmedPart = part.trim();
          if (validPrimaryElements.has(trimmedPart as ElementType)) {
            allElementsInDeck.add(trimmedPart as ElementType);
          }
        });
      } else {
        if (validPrimaryElements.has(elementType as ElementType)) {
          allElementsInDeck.add(elementType as ElementType);
        }
      }
    }
  });

  const result = Array.from(allElementsInDeck);
  return result.length > 0 ? result : ["Colorless"];
}

/**
 * Get the dominant elements in a deck based on single-element cards only
 * @param cards Array of cards in the deck
 * @param maxElements Maximum number of elements to return
 * @returns Array of element types sorted by frequency (based on single-element cards only)
 */
export function getDeckElements(
  cards: { card: Card; quantity: number }[],
  maxElements: number = 3
): ElementType[] {
  if (!cards || cards.length === 0) {
    return ["Colorless"];
  }

  // Count elements from single-element cards only
  const elementCounts: Record<string, number> = {};
  const validPrimaryElements = new Set<ElementType>([
    "Fire",
    "Water",
    "Earth",
    "Wood",
    "Metal",
    "Dark",
    "Light",
  ]);

  cards.forEach(({ card, quantity }) => {
    // Check if card has element information
    if (card.element) {
      // Extract the element type(s) from the card
      const elementType = card.element.type;

      // Only count single-element cards (ignore hybrid/multicolor cards)
      if (
        !elementType.includes("/") &&
        validPrimaryElements.has(elementType as ElementType)
      ) {
        elementCounts[elementType] =
          (elementCounts[elementType] || 0) + quantity;
      }
      // Skip hybrid elements - we don't count them for deck element representation
    }
  });

  // Sort elements by count (descending)
  const sortedElements = Object.entries(elementCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([element]) => element as ElementType)
    .slice(0, maxElements);

  return sortedElements.length > 0 ? sortedElements : ["Colorless"];
}

/**
 * Generate a CSS gradient based on deck elements
 * @param elements Array of element types
 * @param direction Gradient direction (default: '135deg' for diagonal)
 * @param vibrant Whether to use more vibrant colors (default: false)
 * @returns CSS gradient string
 */
export function generateElementGradient(
  elements: ElementType[],
  direction: string = "135deg",
  vibrant: boolean = false
): string {
  if (!elements || elements.length === 0) {
    return `linear-gradient(${direction}, #1a1a2e, #16213e)`; // Default dark gradient
  }

  if (elements.length === 1) {
    const color = ELEMENTS[elements[0]].color;
    const brightColor = adjustColorBrightness(color, vibrant ? 15 : 0); // Brighten for vibrant mode

    // For single element, create a gradient from the color to a slightly darker version
    return `linear-gradient(${direction}, ${brightColor}, ${adjustColorBrightness(
      color,
      vibrant ? -15 : -30
    )})`;
  }

  // For multiple elements, create a gradient using their colors
  const colorStops = elements
    .map((element, index) => {
      const percent = index * (100 / (elements.length - 1));
      const color = ELEMENTS[element].color;
      // Brighten colors for vibrant mode
      const adjustedColor = vibrant ? adjustColorBrightness(color, 10) : color;
      return `${adjustedColor} ${percent}%`;
    })
    .join(", ");

  return `linear-gradient(${direction}, ${colorStops})`;
}

/**
 * Adjust color brightness
 * @param hex Hex color
 * @param percent Percentage to adjust (-100 to 100)
 * @returns Adjusted hex color
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  // Adjust brightness
  r = Math.min(255, Math.max(0, r + (percent / 100) * 255));
  g = Math.min(255, Math.max(0, g + (percent / 100) * 255));
  b = Math.min(255, Math.max(0, b + (percent / 100) * 255));

  // Convert back to hex
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
    .toString(16)
    .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}
