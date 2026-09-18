const SENSITIVE_DECK_FIELDS = new Set(["viewedBy", "likedBy"]);

/**
 * Convert a deck payload to JSON-safe data while removing viewer and liker
 * identifiers at the server-to-client boundary. The redaction is recursive so
 * it also covers paginated responses and objects that contain nested decks.
 */
export function serializeDeckPayload<T>(payload: T): T {
  const serialized = JSON.stringify(payload, (key, value) =>
    SENSITIVE_DECK_FIELDS.has(key) ? undefined : value
  );

  if (serialized === undefined) {
    return payload;
  }

  return JSON.parse(serialized) as T;
}
