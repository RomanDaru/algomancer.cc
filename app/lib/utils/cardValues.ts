import { Affinity, AFFINITY_ELEMENTS, Card, CardValue } from "../types/card";

export function isCardValue(value: unknown): value is CardValue {
  return value === "X" || (typeof value === "number" && Number.isSafeInteger(value));
}

export function parseCardValue(value: string, allowNegative = false): CardValue {
  const text = value.trim().toUpperCase();
  if (text === "X") return "X";
  if (!(allowNegative ? /^-?\d+$/ : /^\d+$/).test(text) || !Number.isSafeInteger(Number(text))) {
    throw new Error("Enter a whole number or X.");
  }
  return Number(text);
}

/** X gets its own bucket before zero; it is never a free spell. */
export function manaBucket(card: Pick<Card, "manaCost">): number {
  return card.manaCost === "X" ? -1 : card.manaCost;
}

export function compareCardValues(a: CardValue, b: CardValue): number {
  return (a === "X" ? -Infinity : a) === (b === "X" ? -Infinity : b) ? 0 :
    a === "X" ? -1 : b === "X" ? 1 : a - b;
}

export function hasCombatStats(card: Pick<Card, "typeAndAttributes">): boolean {
  return ["Unit", "Spell Unit", "Token"].includes(card.typeAndAttributes.mainType);
}

export function formatAffinity(affinity: Affinity): string {
  return AFFINITY_ELEMENTS.filter(element => (affinity[element] || 0) > 0)
    .map(element => `${element[0].toUpperCase()}${element.slice(1)} ${affinity[element]}`).join(", ");
}

export function parseAffinity(value: string): Affinity {
  const result: Affinity = {};
  for (const item of value.split(",").map(part => part.trim()).filter(Boolean)) {
    const match = /^([a-z]+):\s*(\d+)$/.exec(item);
    const element = match?.[1] as keyof Affinity;
    if (!match || !AFFINITY_ELEMENTS.includes(element) || element in result || !Number.isSafeInteger(Number(match[2]))) {
      throw new Error("Use unique affinity counts, e.g. light: 1, wood: 1.");
    }
    result[element] = Number(match[2]);
  }
  return result;
}
