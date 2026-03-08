import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cardsPath = path.join(__dirname, "new_cards.json");
const outputPath = path.join(__dirname, "manual-overrides.json");

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

const starterOverrides = {};

for (const card of cards) {
  const detectedElement = card.element?.type || "Colorless";
  let elementType = "Dark";

  if (!["Dark", "Colorless"].includes(detectedElement)) {
    elementType = `Dark/${detectedElement}`;
  }

  starterOverrides[card.id] = { elementType };
}

fs.writeFileSync(outputPath, JSON.stringify(starterOverrides, null, 2));
console.log(`Created starter dark overrides for ${cards.length} cards at ${outputPath}`);
