/** @jest-environment node */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { revalidateTag } from "next/cache";
import { GET } from "../route";
import { POST as importCards } from "../import/route";
import { cardDbService } from "@/app/lib/db/services/cardDbService";
import { CARD_CATALOG_CACHE_TAG } from "@/app/lib/services/cardService";
import type { Card } from "@/app/lib/types/card";

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((callback: () => unknown) => callback),
  revalidateTag: jest.fn(),
}));
jest.mock("@/app/lib/db/services/cardDbService", () => ({
  cardDbService: { getAllCards: jest.fn(), importCards: jest.fn() },
}));

const colorlessElement: Card["element"] = {
  type: "Colorless",
  symbol: "/images/elements/colorless.png",
};
const card = { id: "generic-unit", name: "Generic Unit", element: colorlessElement };
const request = (cards: unknown) => new NextRequest("http://localhost/api/cards/import", {
  method: "POST",
  body: JSON.stringify(cards),
  headers: { "Content-Type": "application/json" },
});

describe("catalog cache HTTP boundaries", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: "admin", isAdmin: true } });
  });

  it("invalidates the catalog after an authorized import finishes writing", async () => {
    jest.mocked(cardDbService.importCards).mockImplementation(async () => {
      expect(revalidateTag).not.toHaveBeenCalled();
      return 1;
    });

    const response = await importCards(request([card]));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, count: 1 });
    expect(cardDbService.importCards).toHaveBeenCalledWith([card]);
    expect(revalidateTag).toHaveBeenCalledWith(CARD_CATALOG_CACHE_TAG);
  });

  it("does not write or invalidate the catalog for non-admin callers", async () => {
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: "player", isAdmin: false } });

    expect((await importCards(request([card]))).status).toBe(403);
    expect(cardDbService.importCards).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("does not write or invalidate the catalog for an empty import", async () => {
    expect((await importCards(request([]))).status).toBe(400);
    expect(cardDbService.importCards).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("serves colorless cards without allowing a second HTTP response cache", async () => {
    jest.mocked(cardDbService.getAllCards).mockResolvedValue([card as Card]);

    const response = await GET(new NextRequest("http://localhost/api/cards"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual([card]);
  });
});
