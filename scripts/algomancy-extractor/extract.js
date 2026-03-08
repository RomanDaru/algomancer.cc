import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

// Načítanie .env premnenných
dotenv.config({ path: path.join(__dirname, ".env") });

// Inicializácia klienta podľa novej @google/genai špecifikácie
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cardsDir = path.join(projectRoot, "public", "images", "cards");
const outputFile = path.join(__dirname, "new_cards.json");
const overridesFile = path.join(__dirname, "manual-overrides.json");
const cloudinaryBase =
  "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1747595000/algomancy/cards";

// Funkcia na konverziu obrázka pre API
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
}

const promptText = `
You are extracting only the minimum reliable data from an Algomancy card image.
Return ONLY a valid JSON object with this exact shape:

{
  "name": "Exact visible card name",
  "manaCost": 0,
  "elementType": "Fire | Water | Earth | Wood | Metal | Colorless | Dark | Light | Fire/Water | Water/Fire | ... | Unknown",
  "power": 0,
  "defense": 0,
  "mainType": "Unit | Spell | Resource | Token | Spell Token | Spell Unit | Unknown",
  "subType": "Visible subtype text or empty string",
  "timingType": "Standard | Haste | Battle | Virus | Unknown"
}

Rules:
- Extract only large, visually reliable data.
- Do NOT try to read affinity pips.
- Do NOT try to read keyword icons like GRAFT or AUGMENT.
- Do NOT extract abilities or rules text.
- Do NOT infer rarity or complexity.
- If something is unclear, use safe defaults:
  - manaCost: 0
  - power: 0
  - defense: 0
  - elementType: "Unknown"
  - mainType: "Unknown"
  - subType: ""
  - timingType: "Unknown"
`;

const allowedMainTypes = new Set([
  "Unit",
  "Spell",
  "Resource",
  "Token",
  "Spell Token",
  "Spell Unit",
]);

const allowedTimingTypes = new Set(["Standard", "Haste", "Battle", "Virus"]);
const allowedElementTypes = new Set([
  "Fire",
  "Water",
  "Earth",
  "Wood",
  "Metal",
  "Colorless",
  "Dark",
  "Light",
  "Dark/Fire",
  "Fire/Dark",
  "Dark/Water",
  "Water/Dark",
  "Dark/Earth",
  "Earth/Dark",
  "Dark/Wood",
  "Wood/Dark",
  "Dark/Metal",
  "Metal/Dark",
  "Light/Fire",
  "Fire/Light",
  "Light/Water",
  "Water/Light",
  "Light/Earth",
  "Earth/Light",
  "Light/Wood",
  "Wood/Light",
  "Light/Metal",
  "Metal/Light",
  "Fire/Water",
  "Water/Fire",
  "Fire/Earth",
  "Earth/Fire",
  "Fire/Wood",
  "Wood/Fire",
  "Fire/Metal",
  "Metal/Fire",
  "Water/Earth",
  "Earth/Water",
  "Water/Wood",
  "Wood/Water",
  "Water/Metal",
  "Metal/Water",
  "Earth/Wood",
  "Wood/Earth",
  "Earth/Metal",
  "Metal/Earth",
  "Wood/Metal",
  "Metal/Wood",
]);

function slugToTitle(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sanitizeCardId(value, fallbackFileName) {
  const fallback = path.parse(fallbackFileName).name;
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMainType(value) {
  const normalized = String(value || "").trim();
  if (allowedMainTypes.has(normalized)) {
    return normalized;
  }

  const lower = normalized.toLowerCase();
  for (const type of allowedMainTypes) {
    if (type.toLowerCase() === lower) {
      return type;
    }
  }

  return "Unit";
}

function normalizeTimingType(value) {
  const normalized = String(value || "").trim();
  if (allowedTimingTypes.has(normalized)) {
    return normalized;
  }

  const lower = normalized.toLowerCase();
  if (lower === "normal" || lower === "unknown" || lower === "") {
    return "Standard";
  }

  for (const type of allowedTimingTypes) {
    if (type.toLowerCase() === lower) {
      return type;
    }
  }

  return "Standard";
}

function getElementSymbolPath(elementName) {
  return `/images/elements/${elementName.toLowerCase()}.png`;
}

function normalizeElement(elementType) {
  const normalized = String(elementType || "").trim();

  if (allowedElementTypes.has(normalized)) {
    if (normalized.includes("/")) {
      const [primary, secondary] = normalized.split("/");
      return {
        type: normalized,
        symbol: getElementSymbolPath(primary),
        secondarySymbol: getElementSymbolPath(secondary),
      };
    }

    return {
      type: normalized,
      symbol: getElementSymbolPath(normalized),
    };
  }

  return {
    type: "Colorless",
    symbol: "/images/elements/colorless.png",
  };
}

function buildThinCard(rawCard, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const imageExtension =
    ext === ".jpeg" ? "jpg" : ext.replace(".", "") || "png";
  const id = sanitizeCardId(rawCard?.id || rawCard?.name, fileName);
  const name =
    String(rawCard?.name || slugToTitle(id)).trim() || slugToTitle(id);
  const timingType = normalizeTimingType(
    rawCard?.timingType || rawCard?.timing?.type,
  );

  return {
    id,
    name,
    manaCost: normalizeNumber(rawCard?.manaCost),
    element: normalizeElement(rawCard?.elementType || rawCard?.element?.type),
    stats: {
      power: normalizeNumber(rawCard?.power ?? rawCard?.stats?.power),
      defense: normalizeNumber(rawCard?.defense ?? rawCard?.stats?.defense),
      affinity: {},
    },
    timing: {
      type: timingType,
      description:
        timingType === "Standard"
          ? "Can be played during deployment"
          : "Special timing rules apply",
    },
    typeAndAttributes: {
      mainType: normalizeMainType(
        rawCard?.mainType || rawCard?.typeAndAttributes?.mainType,
      ),
      subType: String(
        rawCard?.subType || rawCard?.typeAndAttributes?.subType || "",
      ).trim(),
      attributes: [],
    },
    abilities: [],
    set: {
      symbol: "unknown",
      name: "Unknown Set",
      complexity: "Common",
    },
    imageUrl: `${cloudinaryBase}/algomancy_${id}.${imageExtension}`,
    currentIndex: 0,
  };
}

function loadManualOverrides() {
  if (!fs.existsSync(overridesFile)) {
    return {};
  }

  try {
    const overridesText = fs.readFileSync(overridesFile, "utf8");
    const parsedOverrides = JSON.parse(overridesText);
    return parsedOverrides && typeof parsedOverrides === "object"
      ? parsedOverrides
      : {};
  } catch (error) {
    console.error("Failed to load manual overrides:", error);
    return {};
  }
}

function getOverridesForFile(fileName, extractedJson, manualOverrides) {
  const fileKey = path.parse(fileName).name;
  const extractedId = sanitizeCardId(
    extractedJson?.id || extractedJson?.name,
    fileName,
  );

  return {
    ...(manualOverrides[fileKey] || {}),
    ...(manualOverrides[extractedId] || {}),
  };
}

const targetFiles = [
  "abyssal-extortionist.png",
  "air-plant.png",
  "angel-of-anguish.png",
  "apex-prime.png",
  "arbiter-of-armistice.png",
  "arbiter-of-vitality.png",
  "aurozoa.png",
  "banishment.png",
  "big-glimpse-card.png",
  "blessed-thing.png",
  "blob-of-the-dark-order.png",
  "bloppert.png",
  "blurf.png",
  "brough.png",
  "burden-of-life.png",
  "calming-force.png",
  "colony-of-the-interworld.png",
  "covenant-of-the-damned.png",
  "deathcoil-construct.png",
  "debt-blep.png",
  "debt-plant.png",
  "deferral-drone.png",
  "delver-of-the-ephemeral.png",
  "divine-foresight.png",
  "divine-intervention.png",
  "dragnol.png",
  "equilibriate.png",
  "feed-to-hooba.png",
  "flesh-tithe.png",
  "flzzz.png",
  "gatekeeper-of-souls.png",
  "glararr.png",
  "glutton-of-absolution.png",
  "godray.png",
  "greed-angel.png",
  "grob.png",
  "hammer-of-justice.png",
  "hand-peeper.png",
  "haunting-memories.png",
  "hooba-god.png",
  "hyper-beam.png",
  "insatiable-want.png",
  "iyngstra.png",
  "just-a-unit.png",
  "keeper-of-tithes.png",
  "lifebound-seer.png",
  "life-channel.png",
  "life-leech.png",
  "life-plant.png",
  "life-power-dude.png",
  "living-vault.png",
  "murkstalker.png",
  "nullbringer.png",
  "pale-tormentor.png",
  "penance.png",
  "ploosh.png",
  "prediction-prophet.png",
  "prismatic-observer.png",
  "proph.png",
  "prophecy-bug.png",
  "reap-the-due.png",
  "retribution-thing.png",
  "riftspawn-remnant.png",
  "rime-wraith.png",
  "seer-of-empty-spaces.png",
  "shard-sprite.png",
  "shib.png",
  "siphon-life.png",
  "slurpr.png",
  "stalwart-sentinel.png",
  "stellar-fission.png",
  "suspend.png",
  "the-everywhere.png",
  "the-foretold.png",
  "the-mighty-doot.png",
  "tithe-enforcer.png",
  "triskaidekaphage.png",
  "vengeance.png",
  "visage-of-ruin.png",
  "visionary-construct.png",
  "void-mandible.png",
  "vroot.png",
  "waxen-witness.png",
  "witness-of-the-crossing.png",
];

async function processCards() {
  const finalCardsData = [];
  const manualOverrides = loadManualOverrides();
  const files = fs
    .readdirSync(cardsDir)
    .filter((file) => targetFiles.includes(file));

  console.log(`Found ${files.length} images. Starting extraction...`);

  for (const file of files) {
    console.log(`Processing: ${file}`);
    const filePath = path.join(cardsDir, file);

    // Zistime mimeType (jpg vs png)
    const ext = path.extname(file).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

    const imagePart = fileToGenerativePart(filePath, mimeType);

    try {
      // Použijeme model Flash
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [promptText, imagePart],
        config: {
          // Vynútime JSON výstup, aby nám model neposielal zbytočný pokec naokolo
          responseMimeType: "application/json",
          temperature: 0.1, // Nízka teplota = model bude menej kreatívny a viac presný
        },
      });

      const responseText = response.text;

      try {
        const extractedJson = JSON.parse(responseText);
        const overrides = getOverridesForFile(
          file,
          extractedJson,
          manualOverrides,
        );
        const cardJson = buildThinCard(
          { ...extractedJson, ...overrides },
          file,
        );
        finalCardsData.push(cardJson);
        console.log(`✓ Successfully extracted: ${cardJson.name}`);
      } catch (parseError) {
        console.error(
          `✗ Error parsing JSON for ${file}. Model returned:`,
          responseText,
        );
      }
    } catch (apiError) {
      console.error(`✗ API Error on file ${file}:`, apiError);
    }

    // Krátka pauza, aby sme nezahlitili Google API (Rate limiting)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Uloženie výsledkov do súboru
  fs.writeFileSync(outputFile, JSON.stringify(finalCardsData, null, 2));
  console.log(
    `\n🎉 Extraction complete! Saved ${finalCardsData.length} cards to ${outputFile}`,
  );
}

processCards();
