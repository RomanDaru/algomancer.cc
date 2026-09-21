import { Card } from "../types/card";

/** Review proposals deliberately have their own schema. They are NOT Card updates. */
export interface OracleCard {
  name: string;
  algomancer_id: string | null;
  set: string;
  mana_cost: string;
  affinity: Record<string, number | undefined>;
  power: string | null;
  toughness: string | null;
  type_line: string;
  main_kind: string;
  timing: string;
  attributes: string[];
  virus: boolean;
  burst: boolean;
  augment_transfers: string[];
  text: string;
  text_plain: string;
  alternative_cost: { cost: string; mana: number; condition: string } | null;
  complexity: string;
  notes: string;
}

export const REVIEW_FIELDS = {
  name: "Name", manaCost: "Mana cost", affinity: "Affinity",
  mainType: "Card type", subType: "Subtypes", attributes: "Attributes",
  power: "Power", defense: "Defense", timing: "Timing",
  rulesText: "Rules text", augmentTransfers: "Attributes transferred by Augment",
  setName: "Set", complexity: "Complexity",
} as const;
export type ReviewField = keyof typeof REVIEW_FIELDS;
export type ReviewDraft = Record<ReviewField, string> & {
  prophecy: { mana: string; affinity: string; condition: string } | null;
};
export type ReviewStatus = "pending" | "approved" | "deferred" | "kept";
export interface ReviewEntry {
  cardId: string;
  baseline: ReviewDraft;
  baselineImage: string;
  baselineVersion: number;
  draft: ReviewDraft;
  status: ReviewStatus;
  note: string;
  updatedAt: string;
}
export interface ReviewBackup {
  format: "algomancer-oracle-review";
  version: 1;
  purpose: "review-only";
  batchId: string;
  attribution: string;
  entries: Record<string, ReviewEntry>;
  selectedId: string;
}

export const ATTRIBUTION = "Algomancy card text and art © Caleb Gannon. Oracle transcription supplied by algomancy.online, 2026-09-21. See data/oracle/NOTICE.md.";
const PIPS: Record<string, string> = { r: "fire", b: "water", e: "earth", g: "wood", m: "metal", d: "dark", l: "light", p: "prismite" };
const ELEMENTS = Object.values(PIPS);

export function affinityText(affinity: Record<string, number | undefined>): string {
  // Legacy catalog records sometimes use capitalized element names.
  return Object.entries(affinity).filter(([, count]) => typeof count === "number" && count > 0)
    .map(([element, count]) => [element.toLowerCase(), count] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([element, count]) => `${element}: ${count}`).join(", ");
}

function prophecyAffinity(pips: string): string {
  const result: Record<string, number> = {};
  for (const pip of pips) {
    const element = PIPS[pip] || pip;
    result[element] = (result[element] || 0) + 1;
  }
  return affinityText(result);
}

export function currentDraft(card: Card): ReviewDraft {
  const unit = /Unit|Token/.test(card.typeAndAttributes.mainType) && card.typeAndAttributes.mainType !== "Spell Token";
  return {
    name: card.name, manaCost: String(card.manaCost),
    affinity: affinityText({ ...card.stats.affinity }),
    mainType: card.typeAndAttributes.mainType, subType: card.typeAndAttributes.subType,
    attributes: card.typeAndAttributes.attributes.join(", "),
    power: unit ? String(card.stats.power) : "", defense: unit ? String(card.stats.defense) : "",
    timing: card.timing.type, rulesText: card.abilities.join("\n"),
    augmentTransfers: (card.augmentTransfers || []).join(", "),
    prophecy: card.prophecy ? { mana: String(card.prophecy.manaCost), affinity: affinityText({ ...card.prophecy.affinity }), condition: card.prophecy.condition } : null,
    setName: card.set.name, complexity: card.set.complexity,
  };
}

export function proposedDraft(card: Card, source: OracleCard): ReviewDraft {
  const original = currentDraft(card);
  const mainTypes: Record<string, string> = { unit: "Unit", spell: "Spell", spellUnit: "Spell Unit", spellToken: "Spell Token", resource: "Resource", token: "Token" };
  // Resources/tokens in this export are sometimes misclassified as ordinary units.
  const special = ["Resource", "Token", "Spell Token"].includes(original.mainType);
  const mainType = special ? original.mainType : mainTypes[source.main_kind] || original.mainType;
  const hasStats = /Unit|Token/.test(mainType) && mainType !== "Spell Token";
  const typeAttributes = [...source.type_line.matchAll(/\{([^}]+)\}/g)]
    .map(match => match[1]).filter(value => !["Haste", "Battle", "Virus"].includes(value));
  const attributes = Array.from(new Set([...source.attributes, ...typeAttributes, ...(source.burst ? ["Burst"] : [])]));
  const subType = source.type_line.replace(/\{[^}]*\}|\[[^\]]*\]/g, "")
    .replace(/\b(Spell|Unit|Token|Resource)\b/g, "").replace(/\s+/g, " ").trim();
  return {
    ...original,
    name: source.name, manaCost: source.mana_cost,
    affinity: affinityText(source.affinity), mainType,
    subType: special ? original.subType : subType,
    attributes: special ? original.attributes : attributes.join(", "),
    power: hasStats ? source.power ?? "" : "", defense: hasStats ? source.toughness ?? "" : "",
    timing: source.virus ? "Virus" : ({ deploy: "Standard", battle: "Battle", haste: "Haste" }[source.timing] || original.timing),
    rulesText: source.text_plain, augmentTransfers: source.augment_transfers.join(", "),
    prophecy: source.alternative_cost ? {
      mana: String(source.alternative_cost.mana), affinity: prophecyAffinity(source.alternative_cost.cost),
      condition: source.alternative_cost.condition,
    } : null,
    // The export's set/complexity labels are not reliable replacements for our metadata.
    setName: original.setName, complexity: original.complexity,
  };
}

export function newEntry(card: Card, source: OracleCard): ReviewEntry {
  return {
    cardId: card.id, baseline: currentDraft(card), baselineImage: card.imageUrl,
    baselineVersion: card.rulesVersion || 1, draft: proposedDraft(card, source),
    status: "pending", note: "", updatedAt: "",
  };
}

function equalDraft(a: ReviewDraft, b: ReviewDraft): boolean {
  return Object.keys(REVIEW_FIELDS).every(key => a[key as ReviewField] === b[key as ReviewField]) &&
    a.prophecy?.mana === b.prophecy?.mana && a.prophecy?.affinity === b.prophecy?.affinity &&
    a.prophecy?.condition === b.prophecy?.condition;
}

export function isStale(entry: ReviewEntry, card: Card): boolean {
  return !equalDraft(entry.baseline, currentDraft(card)) ||
    entry.baselineImage !== card.imageUrl || entry.baselineVersion !== (card.rulesVersion || 1);
}

export function hasChanges(entry: ReviewEntry): boolean {
  return !equalDraft(entry.baseline, entry.draft);
}

export function effectiveStatus(entry: ReviewEntry, card: Card): ReviewStatus {
  return isStale(entry, card) ? "pending" : entry.status;
}

export function validateDraft(draft: ReviewDraft): string[] {
  const errors: string[] = [];
  const cost = /^(\d+|X)$/;
  if (!draft.name.trim()) errors.push("Enter a card name.");
  if (!cost.test(draft.manaCost)) errors.push("Mana cost must be a whole number or X.");
  if (!["Unit", "Spell", "Spell Unit", "Spell Token", "Token", "Resource"].includes(draft.mainType)) errors.push("Choose a supported card type.");
  if (!["Standard", "Haste", "Battle", "Virus"].includes(draft.timing)) errors.push("Choose a supported timing.");
  const hasStats = /Unit|Token/.test(draft.mainType) && draft.mainType !== "Spell Token";
  for (const field of ["power", "defense"] as const) {
    if (hasStats && !/^(-?\d+|X)$/.test(draft[field])) errors.push(`${REVIEW_FIELDS[field]} must be an integer or X for a unit/token.`);
    if (!hasStats && draft[field] !== "") errors.push(`Leave ${REVIEW_FIELDS[field].toLowerCase()} empty for a ${draft.mainType}.`);
  }
  const checkAffinity = (value: string, label: string) => {
    const seen = new Set<string>();
    for (const item of value.split(",").map(s => s.trim()).filter(Boolean)) {
      const match = /^([a-z]+):\s*(\d+)$/.exec(item);
      if (!match || !ELEMENTS.includes(match[1]) || seen.has(match[1])) {
        errors.push(`${label}: use unique element counts, for example light: 1, wood: 1.`); break;
      }
      seen.add(match[1]);
    }
  };
  checkAffinity(draft.affinity, "Affinity");
  if (draft.prophecy) {
    if (!cost.test(draft.prophecy.mana)) errors.push("Prophecy mana must be a whole number or X.");
    if (!draft.prophecy.condition.trim()) errors.push("Enter the Prophecy condition.");
    checkAffinity(draft.prophecy.affinity, "Prophecy affinity");
  }
  return errors;
}

export function sourceWarnings(card: Card, source: OracleCard): string[] {
  const warnings: string[] = [];
  if (source.set !== card.set.name || source.complexity !== card.set.complexity) warnings.push(`Set/complexity kept from our catalog. Export says: ${source.set || "no set"} / ${source.complexity}. Check the image before changing them.`);
  if (!/Unit|Token/.test(card.typeAndAttributes.mainType) && (source.power !== null || source.toughness !== null)) warnings.push("The export includes combat stats for a non-unit. These were left out of the proposal.");
  if (["Resource", "Token", "Spell Token"].includes(card.typeAndAttributes.mainType)) warnings.push("Special card: type/subtypes/attributes kept from our catalog. Check the source classification manually.");
  if (/[\[{}]/.test(source.text_plain)) warnings.push("The source text still contains notation. Check symbols, costs and reminder text against the image.");
  if (source.alternative_cost || source.mana_cost === "X" || source.augment_transfers.length) warnings.push("Check the full cost, separate Prophecy cost and Augment transfers before approving.");
  if (source.notes) warnings.push(source.notes);
  return warnings;
}

export function makeBackup(batchId: string, entries: Record<string, ReviewEntry>, selectedId: string): ReviewBackup {
  return { format: "algomancer-oracle-review", version: 1, purpose: "review-only", batchId, attribution: ATTRIBUTION, entries, selectedId };
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validDraft(value: unknown): value is ReviewDraft {
  if (!object(value) || !Object.keys(REVIEW_FIELDS).every(key => typeof value[key] === "string" && (value[key] as string).length < 50000)) return false;
  return value.prophecy === null || (object(value.prophecy) &&
    ["mana", "affinity", "condition"].every(key => typeof (value.prophecy as Record<string, unknown>)[key] === "string"));
}

/** Restore only this exact source batch; a renamed card is never matched by name. */
export function parseBackup(input: unknown, batchId: string, allowedIds: Set<string>): ReviewBackup {
  if (!object(input) || input.format !== "algomancer-oracle-review" || input.version !== 1 || input.purpose !== "review-only" || input.batchId !== batchId || !object(input.entries)) {
    throw new Error("This is not a review backup for the loaded oracle export.");
  }
  const entries: Record<string, ReviewEntry> = {};
  for (const [id, entry] of Object.entries(input.entries)) {
    if (!allowedIds.has(id) || !object(entry) || entry.cardId !== id || !validDraft(entry.baseline) || !validDraft(entry.draft) ||
      typeof entry.baselineImage !== "string" || typeof entry.baselineVersion !== "number" ||
      typeof entry.note !== "string" || typeof entry.updatedAt !== "string" ||
      !["pending", "approved", "deferred", "kept"].includes(String(entry.status))) {
      throw new Error(`Invalid review entry: ${id}. No progress was imported.`);
    }
    if (entry.status === "approved" && validateDraft(entry.draft).length) throw new Error(`Approved entry ${id} contains invalid values.`);
    entries[id] = entry as unknown as ReviewEntry;
  }
  return makeBackup(batchId, entries, typeof input.selectedId === "string" && allowedIds.has(input.selectedId) ? input.selectedId : "");
}
