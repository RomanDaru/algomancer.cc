import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cardsPath = path.join(__dirname, "new_cards.json");
const templatePath = path.join(__dirname, "manual-overrides.template.json");

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

const template = {};

for (const card of cards) {
  template[card.id] = {
    name: card.name,
    elementType: "",
  };
}

fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
console.log(`Created template for ${cards.length} cards at ${templatePath}`);
