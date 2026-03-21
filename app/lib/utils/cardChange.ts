import {
  Card,
  CardChangeMode,
  CardChangeScope,
} from "../types/card";

function normalizeAbilities(abilities: string[]): string[] {
  return abilities.map((ability) => ability.trim()).filter(Boolean);
}

function normalizeAttributes(attributes: string[]): string[] {
  return attributes.map((attribute) => attribute.trim()).filter(Boolean).sort();
}

function getRulesFingerprint(card: Card) {
  return JSON.stringify({
    name: card.name,
    manaCost: card.manaCost,
    element: card.element,
    stats: card.stats,
    timing: card.timing,
    mainType: card.typeAndAttributes.mainType,
    subType: card.typeAndAttributes.subType,
    attributes: normalizeAttributes(card.typeAndAttributes.attributes || []),
    abilities: normalizeAbilities(card.abilities || []),
  });
}

function getAssetFingerprint(card: Card) {
  return JSON.stringify({
    imageUrl: card.imageUrl,
    flavorText: card.flavorText || "",
    set: card.set,
  });
}

function addIfChanged(
  changes: string[],
  condition: boolean,
  message: string
) {
  if (condition) {
    changes.push(message);
  }
}

export function didCardRulesChange(previousCard: Card, nextCard: Card): boolean {
  return getRulesFingerprint(previousCard) !== getRulesFingerprint(nextCard);
}

export function didCardAssetsChange(previousCard: Card, nextCard: Card): boolean {
  return getAssetFingerprint(previousCard) !== getAssetFingerprint(nextCard);
}

export function resolveCardChangeScope(
  previousCard: Card | null,
  nextCard: Card,
  requestedMode: CardChangeMode = "auto"
): CardChangeScope {
  if (!previousCard) {
    return "none";
  }

  if (requestedMode === "rules") {
    return "rules";
  }

  if (requestedMode === "asset") {
    return didCardAssetsChange(previousCard, nextCard) ||
      didCardRulesChange(previousCard, nextCard)
      ? "asset"
      : "none";
  }

  if (didCardRulesChange(previousCard, nextCard)) {
    return "rules";
  }

  if (didCardAssetsChange(previousCard, nextCard)) {
    return "asset";
  }

  return "none";
}

export function buildCardChangeSummary(
  previousCard: Card | null,
  nextCard: Card,
  scope: CardChangeScope,
  customSummary?: string
): string {
  const trimmedCustomSummary = customSummary?.trim();
  if (trimmedCustomSummary) {
    return trimmedCustomSummary;
  }

  if (!previousCard || scope === "none") {
    return "Card record was updated.";
  }

  const changes: string[] = [];

  addIfChanged(
    changes,
    previousCard.name !== nextCard.name,
    `Name: ${previousCard.name} -> ${nextCard.name}`
  );
  addIfChanged(
    changes,
    previousCard.manaCost !== nextCard.manaCost,
    `Mana: ${previousCard.manaCost} -> ${nextCard.manaCost}`
  );
  addIfChanged(
    changes,
    previousCard.stats.power !== nextCard.stats.power ||
      previousCard.stats.defense !== nextCard.stats.defense,
    `Stats: ${previousCard.stats.power}/${previousCard.stats.defense} -> ${nextCard.stats.power}/${nextCard.stats.defense}`
  );
  addIfChanged(
    changes,
    previousCard.element.type !== nextCard.element.type,
    `Element: ${previousCard.element.type} -> ${nextCard.element.type}`
  );
  addIfChanged(
    changes,
    previousCard.timing.type !== nextCard.timing.type ||
      previousCard.timing.description !== nextCard.timing.description,
    "Timing updated"
  );
  addIfChanged(
    changes,
    previousCard.typeAndAttributes.mainType !==
      nextCard.typeAndAttributes.mainType ||
      previousCard.typeAndAttributes.subType !==
        nextCard.typeAndAttributes.subType,
    "Type updated"
  );
  addIfChanged(
    changes,
    JSON.stringify(
      normalizeAttributes(previousCard.typeAndAttributes.attributes || [])
    ) !==
      JSON.stringify(
        normalizeAttributes(nextCard.typeAndAttributes.attributes || [])
      ),
    "Attributes updated"
  );
  addIfChanged(
    changes,
    JSON.stringify(normalizeAbilities(previousCard.abilities || [])) !==
      JSON.stringify(normalizeAbilities(nextCard.abilities || [])),
    "Abilities updated"
  );
  addIfChanged(
    changes,
    previousCard.imageUrl !== nextCard.imageUrl,
    "Card art updated"
  );
  addIfChanged(
    changes,
    (previousCard.flavorText || "") !== (nextCard.flavorText || ""),
    "Flavor text updated"
  );

  if (changes.length === 0) {
    return scope === "rules"
      ? "Card gameplay data was updated."
      : "Card visuals or supporting text were updated.";
  }

  return changes.slice(0, 3).join(" | ");
}
