import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import CardAdminClient from "../CardAdminClient";
import { Affinity, Card } from "@/app/lib/types/card";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated", data: { user: { id: "admin", isAdmin: true } } }),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("next/image", () => ({ __esModule: true, default: () => null }));
jest.mock("react-hot-toast", () => ({ Toaster: () => null, toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/app/components/admin/AdminTabs", () => () => null);

describe("card admin affinity fields", () => {
  let container: HTMLDivElement;
  let root: Root;
  const originalFetch = global.fetch;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    global.fetch = originalFetch;
  });

  const input = (id: string) => container.querySelector<HTMLInputElement>(`#${id}`)!;
  const change = async (id: string, value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input(id), value);
      input(id).dispatchEvent(new Event("input", { bubbles: true }));
    });
  };
  const save = async () => {
    const button = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Save Card Update")!;
    await act(async () => button.click());
  };

  it.each<Affinity>([{ dark: 2, light: 1 }, {}])("loads, edits and preserves expansion affinity: %j", async affinity => {
    const card: Card = {
      id: "preview", name: "Preview", manaCost: "X",
      element: { type: "Dark/Light", symbol: "D", secondarySymbol: "L" },
      stats: { power: "X", defense: 4, affinity: { ...affinity, prismite: 1 } },
      prophecy: { manaCost: 0, affinity: { light: 1 }, condition: "One turn." },
      augmentTransfers: ["Flying"],
      timing: { type: "Standard", description: "" },
      typeAndAttributes: { mainType: "Unit", subType: "Alien", attributes: [] },
      abilities: [],
      set: { name: "Test", symbol: "T", complexity: "Complex" },
      imageUrl: "https://example.com/card.jpg",
    };
    const savedCards: Card[] = [];
    global.fetch = jest.fn(async (url, options) => {
      let body: unknown = {};
      if (url === "/api/cards") body = [card];
      if (String(url).endsWith("/usage")) body = { totalDecks: 0, publicDecks: 0, privateDecks: 0, sampleDecks: [] };
      if (options?.method === "PUT") {
        const payload = JSON.parse(options.body as string);
        savedCards.push(payload.card);
        body = { card: payload.card, changeScope: "rules", changeSummary: "Test", flaggedDecksCount: 0, flaggedPublicDecksCount: 0 };
      }
      return { ok: true, json: async () => body } as Response;
    });
    await act(async () => root.render(<CardAdminClient />));
    expect(input("affinity-dark").value).toBe(affinity.dark?.toString() || "");
    expect(input("affinity-light").value).toBe(affinity.light?.toString() || "");
    expect(container.querySelector<HTMLSelectElement>("#set-complexity")!.value).toBe("Complex");
    await change("affinity-dark", "3");
    await change("affinity-light", "2");
    await save();
    expect(savedCards[0].stats.affinity).toMatchObject({ dark: 3, light: 2 });
    await change("image-url", "https://example.com/updated.jpg");
    await save();
    expect(savedCards[1].imageUrl).toBe("https://example.com/updated.jpg");
    expect(savedCards[1].stats.affinity).toMatchObject({ dark: 3, light: 2 });
    expect(savedCards[1].set.complexity).toBe("Complex");
    expect(savedCards[1].manaCost).toBe("X");
    expect(savedCards[1].stats.power).toBe("X");
    expect(savedCards[1].stats.affinity.prismite).toBe(1);
    expect(savedCards[1].prophecy).toEqual(card.prophecy);
    expect(savedCards[1].augmentTransfers).toEqual(["Flying"]);
    await change("mana-cost", "invalid");
    await save();
    expect(savedCards).toHaveLength(2);
    await change("mana-cost", "2");
    const checkbox = container.querySelector<HTMLInputElement>("input[type=checkbox]")!;
    await act(async () => checkbox.click());
    await save();
    expect(savedCards[2].prophecy).toBeNull();
  });
});
