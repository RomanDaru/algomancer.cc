import oracle from "@/data/oracle/2026-09-21.json";
import { Card } from "../../types/card";
import { OracleCard, currentDraft, effectiveStatus, makeBackup, newEntry, parseBackup, proposedDraft, validateDraft } from "../oracleReview";

const card: Card = {
  id: "air-plant", name: "Air Plant", manaCost: 7,
  element: { type: "Light/Wood", symbol: "L", secondarySymbol: "G" },
  stats: { power: 2, defense: 4, affinity: { light: 1, wood: 1 } },
  timing: { type: "Standard", description: "" },
  typeAndAttributes: { mainType: "Unit", subType: "Cosmic Plant", attributes: ["Flying"] },
  abilities: [], set: { name: "Light & Dark", symbol: "L", complexity: "Complex" },
  imageUrl: "/test.jpg", rulesVersion: 2,
};
const source = (id: string) => oracle.find(item => item.algomancer_id === id)! as OracleCard;

describe("oracle review proposals", () => {
  it("preserves Prophecy as a separate alternative cost and keeps image-confirmed metadata", () => {
    const draft = proposedDraft(card, source("air-plant"));
    expect(draft.manaCost).toBe("7");
    expect(draft.prophecy).toEqual({ mana: "2", affinity: "light: 1, wood: 1", condition: "Your units have four unique costs." });
    expect(draft.rulesText).toBe(source("air-plant").text_plain);
    expect(draft.setName).toBe("Light & Dark");
    expect(draft.complexity).toBe("Complex");
    expect(draft.subType).toBe("Cosmic Plant");
    expect(validateDraft(draft)).toEqual([]);
    expect(currentDraft(card).prophecy).toBeNull();
  });

  it("preserves zero Prophecy cost, X costs, and X unit stats", () => {
    expect(proposedDraft(card, source("the-foretold")).prophecy!.mana).toBe("0");
    const draft = proposedDraft(card, { ...source("air-plant"), mana_cost: "X", power: "X", toughness: "X" });
    expect([draft.manaCost, draft.power, draft.defense]).toEqual(["X", "X", "X"]);
    expect(validateDraft(draft)).toEqual([]);
  });

  it("does not import spurious combat stats into a spell or classify a resource as a unit", () => {
    const spell = { ...card, typeAndAttributes: { mainType: "Spell" as const, subType: "Alien", attributes: [] } };
    const draft = proposedDraft(spell, source("abduct"));
    expect([draft.power, draft.defense]).toEqual(["", ""]);
    const resource = { ...card, typeAndAttributes: { mainType: "Resource" as const, subType: "Wood", attributes: [] } };
    expect(proposedDraft(resource, source("dormant-resource"))).toMatchObject({ mainType: "Resource", subType: "Wood", power: "", defense: "" });
  });

  it("keeps Augment once distinct from Graft and extracts printed attributes separately", () => {
    expect(proposedDraft(card, source("deferral-drone")).rulesText).toContain("AUGMENT 1X:");
    expect(proposedDraft(card, source("proph")).rulesText).toContain("GRAFT1:");
    const draft = proposedDraft(card, source("aberrant-statweaver"));
    expect(draft.attributes).toContain("Unstable");
    expect(draft.timing).toBe("Virus");
    expect(draft.subType).not.toContain("Unstable");
  });

  it("invalidates approval when live text, image or rules version changes", () => {
    const entry = { ...newEntry(card, source("air-plant")), status: "approved" as const };
    expect(effectiveStatus(entry, card)).toBe("approved");
    expect(effectiveStatus(entry, { ...card, abilities: ["Changed"] })).toBe("pending");
    expect(effectiveStatus(entry, { ...card, imageUrl: "/new.jpg" })).toBe("pending");
    expect(effectiveStatus(entry, { ...card, rulesVersion: 3 })).toBe("pending");
  });

  it("round trips reviewed drafts and rejects another batch, unknown IDs and malformed approvals", () => {
    const entry = { ...newEntry(card, source("air-plant")), note: "Checked scan", status: "approved" as const };
    const backup = makeBackup("batch", { [card.id]: entry }, card.id);
    const allowed = new Set([card.id]);
    expect(parseBackup(JSON.parse(JSON.stringify(backup)), "batch", allowed)).toEqual(backup);
    expect(() => parseBackup(backup, "other-batch", allowed)).toThrow("loaded oracle export");
    expect(() => parseBackup(backup, "batch", new Set())).toThrow("Invalid review entry");
    expect(() => parseBackup({ ...backup, entries: { [card.id]: { ...entry, draft: { ...entry.draft, manaCost: "oops" } } } }, "batch", allowed)).toThrow("invalid values");
  });
});
