// Card data model for Algomancy cards

// Basic elements
export type BasicElementType = "Fire" | "Water" | "Earth" | "Wood" | "Metal";

// Hybrid elements (all possible combinations of two basic elements)
export type HybridElementType =
  | "Fire/Water"
  | "Water/Fire"
  | "Fire/Earth"
  | "Earth/Fire"
  | "Fire/Wood"
  | "Wood/Fire"
  | "Fire/Metal"
  | "Metal/Fire"
  | "Water/Earth"
  | "Earth/Water"
  | "Water/Wood"
  | "Wood/Water"
  | "Water/Metal"
  | "Metal/Water"
  | "Earth/Wood"
  | "Wood/Earth"
  | "Earth/Metal"
  | "Metal/Earth"
  | "Wood/Metal"
  | "Metal/Wood";

// Combined element type (either basic or hybrid)
export type ElementType = BasicElementType | HybridElementType;
export type TimingType = "Standard" | "Haste" | "Battle" | "Virus";
export type CardType =
  | "Unit"
  | "Spell"
  | "Resource"
  | "Token"
  | "Spell Token"
  | "Spell Unit";
export type ComplexityType = "Common" | "Uncommon" | "Rare" | "Mythic";

export interface Element {
  type: ElementType;
  symbol: string;
  secondarySymbol?: string; // For hybrid cards
}

export interface Affinity {
  fire?: number;
  water?: number;
  earth?: number;
  wood?: number;
  metal?: number;
}

export interface Stats {
  power: number;
  defense: number;
  affinity: Affinity;
}

export interface Timing {
  type: TimingType;
  description: string;
}

export type CardAttribute =
  | "Alluring"
  | "Balanced"
  | "Burst"
  | "Deadly"
  | "Electric"
  | "Evasive"
  | "Feeble"
  | "Flying"
  | "Inverted"
  | "Piercing"
  | "Poisonous"
  | "Poisonous Swift"
  | "Powerful"
  | "Reaping"
  | "Resonant"
  | "Sluggish"
  | "Sneaky"
  | "Swift"
  | "Thieving"
  | "Tough"
  | "Unaware"
  | "Unstable"
  | "Vulnerable"
  | string; // Allow for future attributes

export type AttributeColor = "yellow" | "pink";

export interface AttributeInfo {
  name: CardAttribute;
  color: AttributeColor;
}

export const CARD_ATTRIBUTES: Record<string, AttributeInfo> = {
  ALLURING: { name: "Alluring", color: "yellow" },
  BALANCED: { name: "Balanced", color: "yellow" },
  BURST: { name: "Burst", color: "pink" },
  DEADLY: { name: "Deadly", color: "yellow" },
  ELECTRIC: { name: "Electric", color: "yellow" },
  EVASIVE: { name: "Evasive", color: "yellow" },
  FEEBLE: { name: "Feeble", color: "yellow" },
  FLYING: { name: "Flying", color: "yellow" },
  INVERTED: { name: "Inverted", color: "yellow" },
  PIERCING: { name: "Piercing", color: "yellow" },
  POISONOUS: { name: "Poisonous", color: "yellow" },
  POISONOUS_SWIFT: { name: "Poisonous Swift", color: "yellow" },
  POWERFUL: { name: "Powerful", color: "yellow" },
  REAPING: { name: "Reaping", color: "yellow" },
  RESONANT: { name: "Resonant", color: "yellow" },
  SLUGGISH: { name: "Sluggish", color: "yellow" },
  SNEAKY: { name: "Sneaky", color: "yellow" },
  SWIFT: { name: "Swift", color: "yellow" },
  THIEVING: { name: "Thieving", color: "yellow" },
  TOUGH: { name: "Tough", color: "yellow" },
  UNAWARE: { name: "Unaware", color: "yellow" },
  UNSTABLE: { name: "Unstable", color: "pink" },
  VULNERABLE: { name: "Vulnerable", color: "yellow" },
};

export interface TypeAndAttributes {
  mainType: CardType;
  subType: string;
  attributes: CardAttribute[]; // Renamed from modifiers to attributes
}

export interface Set {
  symbol: string;
  name: string;
  complexity: ComplexityType;
}

export interface Card {
  id: string;
  name: string;
  manaCost: number;
  element: Element;
  stats: Stats;
  timing: Timing;
  typeAndAttributes: TypeAndAttributes;
  abilities: string[];
  set: Set;
  imageUrl: string;
  flavorText?: string;
  currentIndex?: number; // Added for tracking in the card entry helper
}

// Constants
// Basic elements
export const BASIC_ELEMENTS: Record<string, BasicElementType> = {
  FIRE: "Fire",
  WATER: "Water",
  EARTH: "Earth",
  WOOD: "Wood",
  METAL: "Metal",
};

// Hybrid elements
export const HYBRID_ELEMENTS: Record<string, HybridElementType> = {
  FIRE_WATER: "Fire/Water",
  WATER_FIRE: "Water/Fire",
  FIRE_EARTH: "Fire/Earth",
  EARTH_FIRE: "Earth/Fire",
  FIRE_WOOD: "Fire/Wood",
  WOOD_FIRE: "Wood/Fire",
  FIRE_METAL: "Fire/Metal",
  METAL_FIRE: "Metal/Fire",
  WATER_EARTH: "Water/Earth",
  EARTH_WATER: "Earth/Water",
  WATER_WOOD: "Water/Wood",
  WOOD_WATER: "Wood/Water",
  WATER_METAL: "Water/Metal",
  METAL_WATER: "Metal/Water",
  EARTH_WOOD: "Earth/Wood",
  WOOD_EARTH: "Wood/Earth",
  EARTH_METAL: "Earth/Metal",
  METAL_EARTH: "Metal/Earth",
  WOOD_METAL: "Wood/Metal",
  METAL_WOOD: "Metal/Wood",
};

// Combined elements (both basic and hybrid)
export const ELEMENTS: Record<string, ElementType> = {
  ...BASIC_ELEMENTS,
  ...HYBRID_ELEMENTS,
};

export const TIMING: Record<string, TimingType> = {
  STANDARD: "Standard",
  HASTE: "Haste",
  BATTLE: "Battle",
  VIRUS: "Virus",
};

export const CARD_TYPES: Record<string, CardType> = {
  UNIT: "Unit",
  SPELL: "Spell",
  RESOURCE: "Resource",
  TOKEN: "Token",
  SPELL_TOKEN: "Spell Token",
  SPELL_UNIT: "Spell Unit",
};
