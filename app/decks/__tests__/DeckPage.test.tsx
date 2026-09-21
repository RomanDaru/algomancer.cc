import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { toPng } from "html-to-image";
import DeckPage from "../[id]/page";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "owner" } } }),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("html-to-image", () => ({ toPng: jest.fn() }));
jest.mock("@/app/components/LikeButton", () => () => null);
jest.mock("@/app/components/ShareButton", () => () => null);
jest.mock("@/app/components/ElementIcons", () => () => null);
jest.mock("@/app/components/UserNameWithRank", () => () => null);
jest.mock("@/app/components/DeckBadge", () => () => null);
jest.mock("@/app/components/DeckReviewNotice", () => () => null);
jest.mock("@/app/components/YouTubeEmbed", () => () => <div>Showcase video</div>);
jest.mock("@/app/components/DeckStats", () => () => <h2>Deck Statistics</h2>);
jest.mock("@/app/components/DeckDetailViewer", () => {
  const React = jest.requireActual("react");
  return function TestDeckViewer() {
    const [large, setLarge] = React.useState(false);
    return (
      <button onClick={() => setLarge(true)}>
        {large ? "Large card images" : "Deck Contents"}
      </button>
    );
  };
});

const params = { id: "deck-one" };
const payload = {
  deck: {
    _id: params.id,
    userId: "owner",
    name: "Test deck",
    description: "Deck description",
    youtubeUrl: "https://www.youtube.com/watch?v=test",
    createdAt: "2026-09-20T10:00:00.000Z",
    cards: [],
    sideboard: [],
    isPublic: false,
  },
  cards: [],
};

describe("deck detail tabs", () => {
  let container: HTMLDivElement;
  let root: Root;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    global.fetch = originalFetch;
  });

  const tab = (name: string) =>
    container.querySelector<HTMLButtonElement>(`#deck-tab-${name}`)!;
  const panel = (name: string) =>
    container.querySelector<HTMLElement>(`#deck-panel-${name}`)!;
  const click = async (element: HTMLElement) => {
    await act(async () => element.click());
  };
  const render = async () => {
    await act(async () => root.render(<DeckPage params={params} />));
  };

  it("starts on Deck and separates composition statistics from the Results placeholder", async () => {
    await render();
    expect(panel("deck")).toBeVisible();
    expect(panel("deck")).toHaveTextContent("Deck description");
    expect(panel("deck")).toHaveTextContent("Showcase video");
    expect(panel("stats")).not.toBeVisible();
    expect(panel("results")).not.toBeVisible();

    await click(tab("stats"));
    expect(panel("stats")).toBeVisible();
    expect(panel("stats")).toHaveTextContent("Deck Statistics");
    expect(panel("deck")).not.toBeVisible();

    await click(tab("results"));
    expect(panel("results")).toBeVisible();
    expect(panel("results")).toHaveTextContent("Results tracking for this deck is not available yet.");
    expect(panel("stats")).not.toBeVisible();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/decks/deck-one");
  });

  it("supports keyboard navigation with one tab stop and linked panels", async () => {
    await render();
    tab("deck").focus();
    const key = async (name: string, value: string) => {
      await act(async () => {
        tab(name).dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true }));
      });
    };
    await key("deck", "ArrowLeft");
    expect(tab("results")).toHaveFocus();
    expect(tab("results")).toHaveAttribute("aria-selected", "true");
    expect(tab("deck")).toHaveAttribute("tabindex", "-1");
    expect(tab("results")).toHaveAttribute("aria-controls", panel("results").id);
    await key("results", "ArrowRight");
    expect(tab("deck")).toHaveFocus();
    await key("deck", "End");
    expect(tab("results")).toHaveFocus();
    await key("results", "Home");
    expect(tab("deck")).toHaveFocus();
  });

  it("preserves the deck view and reveals it before exporting from Results", async () => {
    await render();
    await click(panel("deck").querySelector("button")!);
    await click(tab("results"));
    (toPng as jest.Mock).mockImplementation(async (target: HTMLElement) => {
      expect(target).toBeVisible();
      expect(target).toHaveTextContent("Large card images");
      expect(target).not.toHaveTextContent("Game results");
      return "data:image/png;base64,preview";
    });
    const options = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Options"))!;
    await click(options);
    const exportButton = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
      .find((button) => button.textContent?.includes("Export as Image"))!;
    await click(exportButton);
    expect(toPng).toHaveBeenCalledTimes(1);
    expect(tab("deck")).toHaveAttribute("aria-selected", "true");
    expect(panel("deck")).toHaveTextContent("Large card images");
  });

  it("does not expose panels when the server refuses access to a private deck", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403 });
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await render();
      expect(container).toHaveTextContent("You don't have permission to view this deck");
      expect(container.querySelector('[role="tablist"]')).toBeNull();
      expect(container).not.toHaveTextContent("Deck description");
    } finally {
      errorLog.mockRestore();
    }
  });
});
