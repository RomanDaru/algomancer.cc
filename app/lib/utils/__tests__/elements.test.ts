import { Card } from "@/app/lib/types/card";
import {
  getAllDeckElements,
  PRIMARY_DECK_ELEMENTS,
} from "@/app/lib/utils/elements";

function buildCard(id: string, elementType: Card["element"]["type"]): Card {
  return {
    id,
    name: `Card ${id}`,
    manaCost: 1,
    element: {
      type: elementType,
      symbol: elementType,
    },
    stats: {
      power: 0,
      defense: 0,
      affinity: {},
    },
    timing: {
      type: "Standard",
      description: "",
    },
    typeAndAttributes: {
      mainType: "Unit",
      subType: "",
      attributes: [],
    },
    abilities: [],
    set: {
      symbol: "TST",
      name: "Test Set",
      complexity: "Common",
    },
    imageUrl: "/test.png",
  };
}

describe("elements utils", () => {
  it("includes Dark and Light in the shared primary deck elements list", () => {
    expect(PRIMARY_DECK_ELEMENTS).toEqual(
      expect.arrayContaining(["Dark", "Light"])
    );
  });

  it("extracts Dark and Light from single and hybrid card elements", () => {
    const elements = getAllDeckElements([
      { card: buildCard("dark-1", "Dark"), quantity: 1 },
      { card: buildCard("light-1", "Fire/Light"), quantity: 1 },
    ]);

    expect(elements).toEqual(expect.arrayContaining(["Dark", "Fire", "Light"]));
  });
});
