import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import CardSearch from "../CardSearch";
import type { Card } from "@/app/lib/types/card";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

function card(id: string, element: Card["element"]["type"], mainType: Card["typeAndAttributes"]["mainType"]): Card {
  return {
    id, name: id, element: { type: element, symbol: "" }, manaCost: 1,
    stats: { power: 1, defense: 1, affinity: {} },
    timing: { type: "Standard", description: "" },
    typeAndAttributes: { mainType, subType: "", attributes: [] },
    abilities: [], set: { symbol: "TST", name: "Test", complexity: "Common" },
    imageUrl: "/test.png",
  };
}

const cards = [
  card("Generic Unit", "Colorless", "Unit"),
  card("Neutral Token", "Colorless", "Token"),
  // Mentioning colorless in text must not make a Fire card match the element.
  { ...card("Fire Unit", "Fire", "Unit"), abilities: ["Create a colorless token."] },
  card("Water Unit", "Water", "Unit"),
];

describe("CardSearch Colorless support", () => {
  let container: HTMLDivElement;
  let root: Root;
  let onSearchResults: jest.Mock;

  beforeEach(async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    onSearchResults = jest.fn();
    await act(async () => {
      root.render(<CardSearch cards={cards} onSearchResults={onSearchResults} />);
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function search(value: string) {
    const input = container.querySelector("input")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  function results() {
    const lastCall = onSearchResults.mock.calls.at(-1)!;
    return (lastCall[0] as Card[]).map((item) => item.id);
  }

  it("recognizes typed Colorless case-insensitively as an element", async () => {
    await search("  cOlOrLeSs  ");
    expect(results()).toEqual(["Generic Unit", "Neutral Token"]);
  });

  it("combines Colorless with a card type", async () => {
    await search("Colorless Token");
    expect(results()).toEqual(["Neutral Token"]);
  });

  it("offers a Colorless quick filter that can be toggled off", async () => {
    const button = Array.from(container.querySelectorAll("button"))
      .find((item) => item.textContent === "Colorless")!;
    expect(button).toBeDefined();
    await act(async () => button.click());
    expect(results()).toEqual(["Generic Unit", "Neutral Token"]);
    await act(async () => button.click());
    expect(results()).toEqual(cards.map((item) => item.id));
  });

  it("preserves any/all matching when Colorless is combined with another element", async () => {
    await search("Fire Colorless");
    expect(results()).toEqual(["Generic Unit", "Neutral Token", "Fire Unit"]);
    const select = container.querySelector("select")!;
    await act(async () => {
      select.value = "all";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(results()).toEqual([]);
  });
});
