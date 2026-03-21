import { DeckSortBy, DeckWithUserInfo, DecodedDeckCursor } from "../types/deckBrowse";

type SortField = "createdAt" | "views" | "likes";

function getObjectIdString(value: DeckWithUserInfo["deck"]["_id"]) {
  return value.toString();
}

export function getDeckSortField(sortBy: DeckSortBy): SortField {
  if (sortBy === "popular") {
    return "views";
  }

  if (sortBy === "liked") {
    return "likes";
  }

  return "createdAt";
}

export function getDeckSortValue(
  item: DeckWithUserInfo,
  sortBy: DeckSortBy
): number {
  if (sortBy === "popular") {
    return item.deck.views || 0;
  }

  if (sortBy === "liked") {
    return item.deck.likes || 0;
  }

  return new Date(item.deck.createdAt).getTime();
}

export function encodeDeckCursor(
  item: DeckWithUserInfo,
  sortBy: DeckSortBy
): string {
  const payload: DecodedDeckCursor = {
    sortBy,
    sortValue: getDeckSortValue(item, sortBy),
    id: getObjectIdString(item.deck._id),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeDeckCursor(
  cursor: string,
  expectedSortBy?: DeckSortBy
): DecodedDeckCursor {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as Partial<DecodedDeckCursor>;

    if (
      !payload ||
      typeof payload.sortBy !== "string" ||
      typeof payload.sortValue !== "number" ||
      typeof payload.id !== "string"
    ) {
      throw new Error("Invalid cursor payload");
    }

    if (
      !["popular", "newest", "liked"].includes(payload.sortBy) ||
      (expectedSortBy && payload.sortBy !== expectedSortBy)
    ) {
      throw new Error("Cursor sort mismatch");
    }

    return payload as DecodedDeckCursor;
  } catch (error) {
    throw new Error("Invalid cursor", { cause: error });
  }
}

export function isDeckAfterCursor(
  item: DeckWithUserInfo,
  cursor: DecodedDeckCursor,
  sortBy: DeckSortBy
) {
  const sortValue = getDeckSortValue(item, sortBy);
  const deckId = getObjectIdString(item.deck._id);

  if (sortValue < cursor.sortValue) {
    return true;
  }

  if (sortValue > cursor.sortValue) {
    return false;
  }

  return deckId < cursor.id;
}
