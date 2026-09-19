import { revalidateTag } from "next/cache";
import { cardDbService } from "@/app/lib/db/services/cardDbService";
import {
  CARD_CATALOG_CACHE_TAG,
  cardService,
} from "@/app/lib/services/cardService";
import type { Card } from "@/app/lib/types/card";

jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((callback: () => unknown) => callback),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/lib/db/services/cardDbService", () => ({
  cardDbService: {
    getAllCards: jest.fn(),
    saveCard: jest.fn(),
    importCards: jest.fn(),
    getHighestIndex: jest.fn(),
  },
}));

const card = {
  id: "test-card",
  name: "Test Card",
} as Card;

describe("cardService catalog cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cardDbService.getAllCards as jest.Mock).mockResolvedValue([card]);
  });

  it("serves individual and batch card reads from the cached catalog", async () => {
    await expect(cardService.getCardById(card.id)).resolves.toEqual(card);
    await expect(
      cardService.getCardsByIds([card.id, "missing-card"])
    ).resolves.toEqual([card]);

    expect(cardDbService.getAllCards).toHaveBeenCalledTimes(2);
  });

  it("invalidates the shared catalog tag after a successful save", async () => {
    (cardDbService.saveCard as jest.Mock).mockResolvedValue(card);

    await expect(cardService.saveCard(card)).resolves.toEqual(card);

    expect(revalidateTag).toHaveBeenCalledWith(CARD_CATALOG_CACHE_TAG);
  });

  it("invalidates the shared catalog tag after a successful import", async () => {
    (cardDbService.importCards as jest.Mock).mockResolvedValue(1);

    await expect(cardService.importCards([card])).resolves.toBe(1);

    expect(revalidateTag).toHaveBeenCalledWith(CARD_CATALOG_CACHE_TAG);
  });
});
