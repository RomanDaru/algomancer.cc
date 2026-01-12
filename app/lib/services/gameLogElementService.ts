import type { BasicElementType } from "@/app/lib/types/card";
import { BASIC_ELEMENTS } from "@/app/lib/types/card";
import type { GameLogConstructed } from "@/app/lib/types/gameLog";
import { parseAlgomancerDeckId } from "@/app/lib/utils/deckUrl";
import { deckDbService } from "@/app/lib/db/services/deckDbService";
import { connectToDatabase } from "@/app/lib/db/mongodb";
import type { DeckCard } from "@/app/lib/types/user";

const BASIC_ELEMENT_SET = new Set(Object.values(BASIC_ELEMENTS));
const BASIC_ELEMENT_LIST = Object.values(BASIC_ELEMENTS);

const resolveElementsFromCards = async (
  cards: DeckCard[]
): Promise<BasicElementType[]> => {
  if (!Array.isArray(cards) || cards.length === 0) return [];

  const uniqueCardIds = Array.from(
    new Set(cards.map((card) => card.cardId).filter(Boolean))
  );
  if (uniqueCardIds.length === 0) return [];

  const { db } = await connectToDatabase();
  const cardDocs = await db
    .collection("cards")
    .find(
      { originalId: { $in: uniqueCardIds } },
      { projection: { "element.type": 1 } }
    )
    .toArray();

  const elementSet = new Set<BasicElementType>();
  cardDocs.forEach((card) => {
    const elementType = card?.element?.type;
    if (typeof elementType !== "string") return;
    const parts = elementType.includes("/") ? elementType.split("/") : [elementType];
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (BASIC_ELEMENT_SET.has(trimmed)) {
        elementSet.add(trimmed as BasicElementType);
      }
    });
  });

  return BASIC_ELEMENT_LIST.filter((element) => elementSet.has(element));
};

export const resolveConstructedElements = async (
  constructed?: GameLogConstructed
): Promise<BasicElementType[]> => {
  if (!constructed) return [];

  let deckId: string | null = constructed.deckId
    ? constructed.deckId.toString()
    : null;

  if (!deckId && typeof constructed.externalDeckUrl === "string") {
    deckId = parseAlgomancerDeckId(constructed.externalDeckUrl) || null;
  }

  if (!deckId) return [];

  const deck = await deckDbService.getDeckById(deckId);
  const elements = Array.isArray(deck?.deckElements) ? deck.deckElements : [];

  const normalized = elements.filter((element): element is BasicElementType =>
    BASIC_ELEMENT_SET.has(element)
  );

  if (normalized.length > 0) {
    return normalized;
  }

  if (Array.isArray(deck?.cards) && deck.cards.length > 0) {
    return resolveElementsFromCards(deck.cards);
  }

  return [];
};
