import { parseCardValue, parseAffinity, compareCardValues, manaBucket, hasCombatStats } from "../cardValues";
import { normalizeOracleText } from "../oracleText";
import { CardModel, convertDocumentToCard } from "../../db/models/Card";
import { didCardRulesChange } from "../cardChange";
import type { Card } from "../../types/card";

const card: Card = {
  id: "test", name: "Test", manaCost: "X", imageUrl: "/test.png",
  element: { type: "Light", symbol: "L" }, stats: { power: "X", defense: 2, affinity: { prismite: 1 } },
  typeAndAttributes: { mainType: "Spell Unit", subType: "", attributes: [] },
  timing: { type: "Standard", description: "" }, set: { name: "Test", symbol: "T", complexity: "Common" }, abilities: [],
  prophecy: { manaCost: 0, affinity: { light: 1 }, condition: "One turn." }, augmentTransfers: ["Flying"],
};
test("X is explicit and distinct from a zero cost, including sorting and mana curves", () => {
  expect(parseCardValue("x")).toBe("X"); expect(parseCardValue("0")).toBe(0);
  expect(parseCardValue("-2", true)).toBe(-2);
  for (const invalid of ["", "foo", "-1", "1.5", "Infinity"]) expect(() => parseCardValue(invalid)).toThrow();
  expect([3, "X", 0, 1, "X"].sort((a, b) => compareCardValues(a as number | "X", b as number | "X"))).toEqual(["X", "X", 0, 1, 3]);
  expect(manaBucket(card)).toBe(-1); expect(manaBucket({ manaCost: 0 })).toBe(0);
  expect(hasCombatStats(card)).toBe(true);
});
test("notation cleanup preserves choices, costs and timing and distinguishes Augment 1X from Graft1", () => {
  expect(normalizeOracleText("/[unit {i1}or spell]")).toBe("[unit or spell]");
  expect(normalizeOracleText("Ambush [4bb] [Pay X life] {Battle}")).toBe("Ambush [4; Water 2] [Pay X life] Battle");
  expect(normalizeOracleText("AUGMENT 1X: Gain 4 debt. GRAFT1: Draw a card.")).toBe("AUGMENT 1X: Gain 4 debt. GRAFT1: Draw a card.");
  expect(parseAffinity("light: 2, prismite: 1")).toEqual({ light: 2, prismite: 1 });
  expect(() => parseAffinity("light: 1, light: 2")).toThrow();
});
test("schema round trips all new fields and rejects invalid costs", () => {
  const { id, ...data } = card;
  const doc = new CardModel({ ...data, originalId: id });
  expect(doc.validateSync()).toBeUndefined();
  expect(convertDocumentToCard(doc)).toMatchObject(card);
  expect(new CardModel({ ...data, originalId: id, manaCost: "oops" }).validateSync()).toBeDefined();
  expect(new CardModel({ ...data, originalId: id, manaCost: -1 }).validateSync()).toBeDefined();
  expect(didCardRulesChange(card, { ...card, prophecy: null })).toBe(true);
  expect(didCardRulesChange(card, { ...card, augmentTransfers: [] })).toBe(true);
});
