/** @jest-environment node */
import { MongoMemoryServer } from "mongodb-memory-server";
import { ObjectId } from "mongodb";
import { Card } from "@/app/lib/types/card";

jest.setTimeout(20000);

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "hammer-of-justice",
    name: "Hammer of Justice",
    manaCost: 6,
    element: {
      type: "Light/Earth",
      symbol: "L",
      secondarySymbol: "E",
    },
    stats: {
      power: 10,
      defense: 5,
      affinity: {},
    },
    timing: {
      type: "Standard",
      description: "Play during your main phase.",
    },
    typeAndAttributes: {
      mainType: "Unit",
      subType: "Guardian",
      attributes: ["Tough"],
    },
    abilities: ["When this enters play, draw a card."],
    set: {
      symbol: "BT1",
      name: "Beta Test",
      complexity: "Rare",
    },
    imageUrl: "https://example.com/hammer-v1.jpg",
    rulesVersion: 1,
    rulesUpdatedAt: new Date("2026-01-01T00:00:00.000Z"),
    assetUpdatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function toCardDocument(card: Card) {
  const { id, ...rest } = card;
  return {
    originalId: id,
    ...rest,
  };
}

describe("adminCardService.updateCardWithReview", () => {
  let mongo: MongoMemoryServer;
  let connectToDatabase: typeof import("@/app/lib/db/mongodb").connectToDatabase;
  let disconnectFromDatabase: typeof import("@/app/lib/db/mongodb").disconnectFromDatabase;
  let mongoose: typeof import("@/app/lib/db/mongodb").default;
  let adminCardService: typeof import("@/app/lib/services/adminCardService").adminCardService;
  let CardModel: typeof import("@/app/lib/db/models/Card").CardModel;
  let DeckModel: typeof import("@/app/lib/db/models/Deck").DeckModel;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    jest.resetModules();

    const mongodb = await import("@/app/lib/db/mongodb");
    connectToDatabase = mongodb.connectToDatabase;
    disconnectFromDatabase = mongodb.disconnectFromDatabase;
    mongoose = mongodb.default;

    ({ adminCardService } = await import("@/app/lib/services/adminCardService"));
    ({ CardModel } = await import("@/app/lib/db/models/Card"));
    ({ DeckModel } = await import("@/app/lib/db/models/Deck"));

    await connectToDatabase();
  });

  afterAll(async () => {
    if (mongoose?.connection?.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await disconnectFromDatabase();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([CardModel.deleteMany({}), DeckModel.deleteMany({})]);
  });

  it("bumps rules version and flags impacted decks for gameplay changes", async () => {
    const baseCard = createCard();
    await CardModel.create(toCardDocument(baseCard));

    const ownerId = new ObjectId();
    const otherOwnerId = new ObjectId();
    await DeckModel.create([
      {
        name: "Judgement Build",
        userId: ownerId,
        cards: [{ cardId: baseCard.id, quantity: 3 }],
        deckElements: ["Light", "Earth"],
        totalCards: 3,
        isPublic: true,
      },
      {
        name: "Private Hammer Tech",
        userId: otherOwnerId,
        cards: [{ cardId: baseCard.id, quantity: 2 }],
        deckElements: ["Light", "Earth"],
        totalCards: 2,
        isPublic: false,
      },
    ]);

    const result = await adminCardService.updateCardWithReview({
      card: createCard({
        stats: {
          power: 10,
          defense: 3,
          affinity: {},
        },
        imageUrl: "https://example.com/hammer-v2.jpg",
      }),
      changeMode: "auto",
    });

    expect(result).not.toBeNull();
    expect(result?.changeScope).toBe("rules");
    expect(result?.flaggedDecksCount).toBe(2);
    expect(result?.flaggedPublicDecksCount).toBe(1);
    expect(result?.card.rulesVersion).toBe(2);

    const updatedDecks = await DeckModel.find().sort({ name: 1 });
    expect(updatedDecks).toHaveLength(2);
    expect(updatedDecks[0].needsReview).toBe(true);
    expect(updatedDecks[0].reviewFlags).toHaveLength(1);
    expect(updatedDecks[0].reviewFlags[0].cardId).toBe(baseCard.id);
    expect(updatedDecks[0].reviewFlags[0].changeSummary).toContain(
      "Stats: 10/5 -> 10/3"
    );
  });

  it("updates asset metadata without flagging decks for image-only changes", async () => {
    const baseCard = createCard();
    await CardModel.create(toCardDocument(baseCard));

    await DeckModel.create({
      name: "Judgement Build",
      userId: new ObjectId(),
      cards: [{ cardId: baseCard.id, quantity: 3 }],
      deckElements: ["Light", "Earth"],
      totalCards: 3,
      isPublic: true,
    });

    const result = await adminCardService.updateCardWithReview({
      card: createCard({
        imageUrl: "https://example.com/hammer-v2.jpg",
      }),
      changeMode: "auto",
    });

    expect(result).not.toBeNull();
    expect(result?.changeScope).toBe("asset");
    expect(result?.flaggedDecksCount).toBe(0);
    expect(result?.card.rulesVersion).toBe(1);

    const updatedDeck = await DeckModel.findOne({ name: "Judgement Build" });
    expect(updatedDeck?.needsReview).toBe(false);
    expect(updatedDeck?.reviewFlags).toHaveLength(0);
  });
});
