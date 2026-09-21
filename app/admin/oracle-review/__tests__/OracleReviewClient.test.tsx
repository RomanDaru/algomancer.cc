import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import OracleReviewClient from "../OracleReviewClient";
import { Card } from "@/app/lib/types/card";
import { newEntry, makeBackup, OracleCard } from "@/app/lib/utils/oracleReview";
import oracle from "@/data/oracle/2026-09-21.json";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
jest.mock("@/app/components/admin/AdminTabs", () => () => null);
const card: Card = {
  id: "air-plant", name: "Air Plant", manaCost: 7,
  element: { type: "Light/Wood", symbol: "L" }, stats: { power: 2, defense: 4, affinity: { light: 1, wood: 1 } },
  timing: { type: "Standard", description: "" }, typeAndAttributes: { mainType: "Unit", subType: "Cosmic Plant", attributes: ["Flying"] },
  abilities: [], set: { name: "Light & Dark", symbol: "L", complexity: "Complex" }, imageUrl: "/test.jpg", rulesVersion: 2,
};
const source = oracle.find(item => item.algomancer_id === card.id)! as OracleCard;
const storageKey = "algomancer:oracle-review:v1:admin:batch";

describe("oracle review workflow", () => {
  let container: HTMLDivElement;
  let root: Root;
  const originalFetch = global.fetch;
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div"); document.body.appendChild(container);
    root = createRoot(container);
    global.fetch = jest.fn();
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove(); global.fetch = originalFetch;
    jest.restoreAllMocks();
  });
  const render = async (cards = [card], sources = [source]) => {
    await act(async () => root.render(<OracleReviewClient userId='admin' cards={cards} oracle={sources} batchId='batch' />));
  };
  const button = (text: string) => Array.from(container.querySelectorAll("button")).find(item => item.textContent === text)!;
  const change = async (selector: string, value: string) => {
    const input = container.querySelector(selector)!;
    await act(async () => {
      const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  it("edits and approves a draft, restores it after remount, and never writes to the API", async () => {
    await render();
    await change("#review-rulesText", "Corrected rules text.");
    await act(async () => button("Approve draft & next").click());
    const saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.entries[card.id]).toMatchObject({ status: "approved", draft: { rulesText: "Corrected rules text.", prophecy: { mana: "2" } } });
    expect(global.fetch).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    root = createRoot(container);
    await render();
    expect(container.querySelector<HTMLTextAreaElement>("#review-rulesText")!.value).toBe("Corrected rules text.");
    expect(container.textContent).toContain("1 approved");
    await change("#review-manaCost", "6");
    expect(JSON.parse(localStorage.getItem(storageKey)!).entries[card.id].status).toBe("pending");
    expect(button("Download approved (0)").disabled).toBe(true);
  });

  it("moves to the next card when deferring and keeps notes", async () => {
    const second = { ...card, id: "second", name: "Second" };
    await render([card, second], [source, { ...source, algomancer_id: "second", name: "Second" }]);
    await change('textarea[aria-label="Review note"]', "Check the latest image");
    await act(async () => button("Check later & next").click());
    expect(container.querySelector("h2")!.textContent).toBe("Second");
    expect(JSON.parse(localStorage.getItem(storageKey)!).entries[card.id]).toMatchObject({ status: "deferred", note: "Check the latest image" });
  });

  it("requires another review after a catalog change and blocks invalid values", async () => {
    const entry = { ...newEntry(card, source), status: "approved" as const };
    localStorage.setItem(storageKey, JSON.stringify(makeBackup("batch", { [card.id]: entry }, card.id)));
    await render([{ ...card, rulesVersion: 3 }]);
    expect(button("Approve draft & next").disabled).toBe(true);
    expect(container.textContent).toContain("0 approved");
    await act(async () => button("I have checked the current version").click());
    await change("#review-manaCost", "bad cost");
    expect(button("Approve draft & next").disabled).toBe(true);
    await change("#review-manaCost", "X");
    expect(button("Approve draft & next").disabled).toBe(false);
  });

  it("does not overwrite corrupt saved progress and reports storage failures", async () => {
    localStorage.setItem(storageKey, "broken JSON");
    await render();
    expect(container.textContent).toContain("Nothing has been overwritten");
    expect(button("Approve draft & next").disabled).toBe(true);
    expect(localStorage.getItem(storageKey)).toBe("broken JSON");
  });

  it("keeps unsaved edits available for download when browser storage is full", async () => {
    await render();
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    await change("#review-rulesText", "Unsaved correction");
    expect(container.textContent).toContain("Not saved to browser storage");
    expect(container.querySelector<HTMLTextAreaElement>("#review-rulesText")!.value).toBe("Unsaved correction");
    expect(button("Download backup").disabled).toBe(false);
  });

  it("excludes missing IDs and ambiguous duplicate IDs from review", async () => {
    await render([card], [source, source, { ...source, algomancer_id: null, name: "Helper" }]);
    expect(container.textContent).toContain("0 matched");
    expect(container.textContent).toContain("Unmatched or ambiguous export entries (3)");
    expect(container.querySelector("#review-name")).toBeNull();
  });
});
