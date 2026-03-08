import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

const cardsPath = path.join(__dirname, "new_cards.json");
const cloudinaryListPath = path.join(projectRoot, "scripts", "cloudinary-images.json");

const cloudinaryIdOverrides = {
  "blight-s-end": "blights-end",
  "mobius-s-corruption": "mobiuss-corruption",
  sarcophage: "sacrophage",
  "thought-extraction": "tought-extraction",
  thoughtripper: "toughtripper",
};

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
const images = JSON.parse(fs.readFileSync(cloudinaryListPath, "utf8"));

function getImageBase(publicId) {
  return path.basename(publicId);
}

function findByPrefix(prefix) {
  return images.find((img) => {
    const base = getImageBase(img.public_id);
    return base === prefix || base.startsWith(`${prefix}_`);
  });
}

const unmatched = [];

for (const card of cards) {
  const key = cloudinaryIdOverrides[card.id] || card.id;
  const match = findByPrefix(key);

  if (!match) {
    unmatched.push({ id: card.id, name: card.name, expectedKey: key });
    continue;
  }

  card.imageUrl = match.url;
}

fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

console.log(`Updated Cloudinary URLs for ${cards.length - unmatched.length} cards.`);

if (unmatched.length > 0) {
  console.log("Unmatched cards:");
  console.log(JSON.stringify(unmatched, null, 2));
}
