/** @jest-environment node */
import { MongoMemoryServer } from "mongodb-memory-server";

jest.setTimeout(20000);

describe("achievementService.refreshUserXp", () => {
  let mongo: MongoMemoryServer;
  let connectToDatabase: typeof import("@/app/lib/db/mongodb").connectToDatabase;
  let disconnectFromDatabase: typeof import("@/app/lib/db/mongodb").disconnectFromDatabase;
  let achievementService: typeof import("@/app/lib/services/achievementService").achievementService;
  let UserModel: typeof import("@/app/lib/db/models/User").UserModel;
  let DeckModel: typeof import("@/app/lib/db/models/Deck").DeckModel;
  let UserBadgeModel: typeof import("@/app/lib/db/models/UserBadge").UserBadgeModel;
  let mongoose: typeof import("@/app/lib/db/mongodb").default;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    jest.resetModules();

    const mongodb = await import("@/app/lib/db/mongodb");
    connectToDatabase = mongodb.connectToDatabase;
    disconnectFromDatabase = mongodb.disconnectFromDatabase;
    mongoose = mongodb.default;

    ({ achievementService } = await import(
      "@/app/lib/services/achievementService"
    ));
    ({ UserModel } = await import("@/app/lib/db/models/User"));
    ({ DeckModel } = await import("@/app/lib/db/models/Deck"));
    ({ UserBadgeModel } = await import("@/app/lib/db/models/UserBadge"));

    await connectToDatabase();
  });

  afterAll(async () => {
    if (mongoose?.connection?.db) {
      await mongoose.connection.db.dropDatabase();
    }
    if (disconnectFromDatabase) {
      await disconnectFromDatabase();
    }
    if (mongo) {
      await mongo.stop();
    }
  });

  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      DeckModel.deleteMany({}),
      UserBadgeModel.deleteMany({}),
    ]);
  });

  it("adds like XP and deck creation XP with daily caps", async () => {
    const user = await UserModel.create({
      name: "Test User",
      email: "test@example.com",
    });
    const userId = user._id;

    const dayOne = new Date("2024-01-01T12:00:00Z");
    const dayTwo = new Date("2024-01-02T12:00:00Z");

    const deckDocs = [];
    for (let i = 0; i < 6; i += 1) {
      deckDocs.push({
        name: `Deck ${i}`,
        userId,
        cards: [],
        deckElements: ["Fire"],
        isPublic: true,
        likes: 1,
        createdAt: dayOne,
        updatedAt: dayOne,
      });
    }
    for (let i = 0; i < 2; i += 1) {
      deckDocs.push({
        name: `Deck B${i}`,
        userId,
        cards: [],
        deckElements: ["Water"],
        isPublic: true,
        likes: 1,
        createdAt: dayTwo,
        updatedAt: dayTwo,
      });
    }

    await DeckModel.collection.insertMany(deckDocs);

    const totalXp = await achievementService.refreshUserXp(userId.toString());
    expect(totalXp).toBe(110);

    const updated = await UserModel.findById(userId, { achievementXp: 1 });
    expect(updated?.achievementXp).toBe(110);
  });
});
