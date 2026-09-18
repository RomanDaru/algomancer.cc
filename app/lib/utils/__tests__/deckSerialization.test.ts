import { serializeDeckPayload } from "../deckSerialization";

describe("serializeDeckPayload", () => {
  it("removes sensitive deck identifiers recursively", () => {
    const payload = {
      decks: [
        {
          deck: {
            _id: "deck-1",
            viewedBy: ["203.0.113.10-session"],
            likedBy: ["user-1"],
            cards: [{ cardId: "card-1", quantity: 2 }],
          },
          isLikedByCurrentUser: true,
        },
      ],
    };

    const result = serializeDeckPayload(payload);

    expect(result).toEqual({
      decks: [
        {
          deck: {
            _id: "deck-1",
            cards: [{ cardId: "card-1", quantity: 2 }],
          },
          isLikedByCurrentUser: true,
        },
      ],
    });
    expect(payload.decks[0].deck.viewedBy).toEqual([
      "203.0.113.10-session",
    ]);
    expect(payload.decks[0].deck.likedBy).toEqual(["user-1"]);
  });

  it("keeps unrelated similarly named fields", () => {
    const payload = {
      deck: {
        views: 12,
        likes: 4,
        isLikedByCurrentUser: true,
      },
    };

    expect(serializeDeckPayload(payload)).toEqual(payload);
  });
});
