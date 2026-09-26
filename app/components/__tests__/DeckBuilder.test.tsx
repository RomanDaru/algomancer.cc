import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import DeckBuilder from "../DeckBuilder";
import type { Card } from "@/app/lib/types/card";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const toastError = jest.fn();
const cardBrowserRender = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: (...args: unknown[]) => toastError(...args) },
}));

jest.mock("../GuestModePrompt", () => () => null);
jest.mock("../DeckStats", () => function MockDeckStats() {
  return <div>Statistics panel</div>;
});
jest.mock("../DeckViewer", () => function MockDeckViewer() {
  return <div>Deck contents</div>;
});
jest.mock("../DeckCardBrowser", () => {
  return function MockDeckCardBrowser(props: {
    onAddToDeck: (cardId: string) => void;
  }) {
    cardBrowserRender(props);
    return (
      <div data-testid='card-browser'>
        <button type='button' onClick={() => props.onAddToDeck("card-1")}>
          Add test card
        </button>
      </div>
    );
  };
});

const cards: Card[] = [
  {
    id: "card-1",
    name: "Test Card",
    element: { type: "Fire", symbol: "" },
    manaCost: 1,
    stats: { power: 1, defense: 1, affinity: {} },
    timing: { type: "Standard", description: "" },
    typeAndAttributes: { mainType: "Unit", subType: "", attributes: [] },
    abilities: [],
    set: { symbol: "TST", name: "Test", complexity: "Common" },
    imageUrl: "/test.png",
  },
];

describe("DeckBuilder mobile workflow", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    jest.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<DeckBuilder cards={cards} />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  const tab = (name: string) =>
    container.querySelector<HTMLButtonElement>(`#mobile-deck-tab-${name}`)!;
  const panel = (name: string) =>
    container.querySelector<HTMLElement>(`#mobile-deck-panel-${name}`)!;

  it("renders one card browser and switches the three editor tabs", async () => {
    expect(cardBrowserRender).toHaveBeenCalledTimes(1);
    expect(tab("builder")).toHaveAttribute("aria-selected", "true");
    expect(panel("builder")).toHaveClass("block");
    expect(panel("information")).toHaveClass("hidden");

    await act(async () => tab("information").click());

    expect(tab("information")).toHaveAttribute("aria-selected", "true");
    expect(panel("information")).toHaveClass("block");
    expect(panel("builder")).toHaveClass("hidden");
  });

  it("supports arrow-key navigation between tabs", async () => {
    tab("builder").focus();
    await act(async () => {
      tab("builder").dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      );
    });

    expect(tab("information")).toHaveFocus();
    expect(tab("information")).toHaveAttribute("aria-selected", "true");
  });

  it("updates the sticky summary and announces added cards", async () => {
    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Add test card"
    )!;
    await act(async () => addButton.click());

    expect(container).toHaveTextContent("Main 1 · Sideboard 0/15");
    expect(container).toHaveTextContent("Test Card added to Main Deck");
  });

  it("shows a toast instead of adding a card beyond the copy limit", async () => {
    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Add test card"
    )!;

    await act(async () => addButton.click());
    await act(async () => addButton.click());
    await act(async () => addButton.click());

    expect(toastError).toHaveBeenCalledWith(
      "Maximum 2 copies in this section",
      { id: "deck-limit-main-card-1" }
    );
  });

  it("opens Deck Information when save validation needs a name", async () => {
    const stickySave = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Save Deck" && button.closest(".fixed")
    )!;
    await act(async () => stickySave.click());

    expect(toastError).toHaveBeenCalledWith("Please enter a deck name");
    expect(tab("information")).toHaveAttribute("aria-selected", "true");
  });
});
