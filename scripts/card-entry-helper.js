// Card Entry Helper - A simple web-based tool for entering card details
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const open = require("open");
const { uploadImage } = require("./cloudinary-upload");

// Constants for card data
// Basic elements
const BASIC_ELEMENTS = {
  FIRE: "Fire",
  WATER: "Water",
  EARTH: "Earth",
  WOOD: "Wood",
  METAL: "Metal",
  COLORLESS: "Colorless",
};

// Hybrid elements
const HYBRID_ELEMENTS = {
  FIRE_WATER: "Fire/Water",
  WATER_FIRE: "Water/Fire",
  FIRE_EARTH: "Fire/Earth",
  EARTH_FIRE: "Earth/Fire",
  FIRE_WOOD: "Fire/Wood",
  WOOD_FIRE: "Wood/Fire",
  FIRE_METAL: "Fire/Metal",
  METAL_FIRE: "Metal/Fire",
  WATER_EARTH: "Water/Earth",
  EARTH_WATER: "Earth/Water",
  WATER_WOOD: "Water/Wood",
  WOOD_WATER: "Wood/Water",
  WATER_METAL: "Water/Metal",
  METAL_WATER: "Metal/Water",
  EARTH_WOOD: "Earth/Wood",
  WOOD_EARTH: "Wood/Earth",
  EARTH_METAL: "Earth/Metal",
  METAL_EARTH: "Metal/Earth",
  WOOD_METAL: "Wood/Metal",
  METAL_WOOD: "Metal/Wood",
};

// Combined elements
const ELEMENTS = {
  ...BASIC_ELEMENTS,
  ...HYBRID_ELEMENTS,
};

const TIMING = {
  STANDARD: "Standard",
  HASTE: "Haste",
  BATTLE: "Battle",
  VIRUS: "Virus",
};

const CARD_TYPES = {
  UNIT: "Unit",
  SPELL: "Spell",
  RESOURCE: "Resource",
  TOKEN: "Token",
  SPELL_TOKEN: "Spell Token",
  SPELL_UNIT: "Spell Unit",
};

// Card attributes
const CARD_ATTRIBUTES = {
  ALLURING: { name: "Alluring", color: "yellow" },
  BALANCED: { name: "Balanced", color: "yellow" },
  BURST: { name: "Burst", color: "pink" },
  DEADLY: { name: "Deadly", color: "yellow" },
  ELECTRIC: { name: "Electric", color: "yellow" },
  EVASIVE: { name: "Evasive", color: "yellow" },
  FEEBLE: { name: "Feeble", color: "yellow" },
  FLYING: { name: "Flying", color: "yellow" },
  INVERTED: { name: "Inverted", color: "yellow" },
  PIERCING: { name: "Piercing", color: "yellow" },
  POISONOUS: { name: "Poisonous", color: "yellow" },
  POISONOUS_SWIFT: { name: "Poisonous Swift", color: "yellow" },
  POWERFUL: { name: "Powerful", color: "yellow" },
  REAPING: { name: "Reaping", color: "yellow" },
  RESONANT: { name: "Resonant", color: "yellow" },
  SLUGGISH: { name: "Sluggish", color: "yellow" },
  SNEAKY: { name: "Sneaky", color: "yellow" },
  SWIFT: { name: "Swift", color: "yellow" },
  THIEVING: { name: "Thieving", color: "yellow" },
  TOUGH: { name: "Tough", color: "yellow" },
  UNAWARE: { name: "Unaware", color: "yellow" },
  UNSTABLE: { name: "Unstable", color: "pink" },
  VULNERABLE: { name: "Vulnerable", color: "yellow" },
};

const COMPLEXITY = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  MYTHIC: "Mythic",
};

// Create Express app
const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Load card images data
let cardImages = [];
try {
  const cardImagesPath = path.join(
    __dirname,
    "..",
    "app",
    "lib",
    "data",
    "cardImages.json"
  );
  if (fs.existsSync(cardImagesPath)) {
    cardImages = JSON.parse(fs.readFileSync(cardImagesPath, "utf8"));
  }
} catch (error) {
  console.error("Error loading card images data:", error);
}

// Load last saved card index
let lastSavedCardIndex = 0;
try {
  const lastCardPath = path.join(__dirname, "last-card-index.json");
  if (fs.existsSync(lastCardPath)) {
    const lastCardData = JSON.parse(fs.readFileSync(lastCardPath, "utf8"));
    lastSavedCardIndex = lastCardData.index || 0;
    console.log(`Loaded last saved card index: ${lastSavedCardIndex}`);
  }
} catch (error) {
  console.error("Error loading last card index:", error);
}

// Load existing card data if available
let existingCards = [];
try {
  const algomancyCardsPath = path.join(
    __dirname,
    "..",
    "app",
    "lib",
    "data",
    "algomancyCards.ts"
  );
  if (fs.existsSync(algomancyCardsPath)) {
    const fileContent = fs.readFileSync(algomancyCardsPath, "utf8");
    const match = fileContent.match(
      /export const algomancyCards: Card\[\] = (\[[\s\S]*\]);/
    );
    if (match && match[1]) {
      // Replace ELEMENTS.FIRE with 'Fire', etc.
      let jsonContent = match[1]
        .replace(
          /BASIC_ELEMENTS\.(FIRE|WATER|EARTH|WOOD|METAL|COLORLESS)/g,
          (_, element) => `"${BASIC_ELEMENTS[element]}"`
        )
        .replace(
          /HYBRID_ELEMENTS\.(FIRE_WATER|WATER_FIRE|FIRE_EARTH|EARTH_FIRE|FIRE_WOOD|WOOD_FIRE|FIRE_METAL|METAL_FIRE|WATER_EARTH|EARTH_WATER|WATER_WOOD|WOOD_WATER|WATER_METAL|METAL_WATER|EARTH_WOOD|WOOD_EARTH|EARTH_METAL|METAL_EARTH|WOOD_METAL|METAL_WOOD)/g,
          (_, element) => `"${HYBRID_ELEMENTS[element]}"`
        )
        .replace(
          /ELEMENTS\.(FIRE|WATER|EARTH|WOOD|METAL|COLORLESS|FIRE_WATER|WATER_FIRE|FIRE_EARTH|EARTH_FIRE|FIRE_WOOD|WOOD_FIRE|FIRE_METAL|METAL_FIRE|WATER_EARTH|EARTH_WATER|WATER_WOOD|WOOD_WATER|WATER_METAL|METAL_WATER|EARTH_WOOD|WOOD_EARTH|EARTH_METAL|METAL_EARTH|WOOD_METAL|METAL_WOOD)/g,
          (_, element) => `"${ELEMENTS[element]}"`
        )
        .replace(
          /TIMING\.(STANDARD|HASTE|BATTLE|VIRUS)/g,
          (_, timing) => `"${TIMING[timing]}"`
        )
        .replace(
          /CARD_TYPES\.(UNIT|SPELL|RESOURCE|TOKEN|SPELL_TOKEN)/g,
          (_, type) => `"${CARD_TYPES[type]}"`
        );

      try {
        existingCards = JSON.parse(jsonContent);
      } catch (e) {
        console.error("Error parsing existing cards:", e);
        existingCards = [];
      }
    }
  }
} catch (error) {
  console.error("Error loading existing card data:", error);
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "card-entry-helper.html"));
});

app.get("/api/card-images", (req, res) => {
  res.json(cardImages);
});

app.get("/api/existing-cards", (req, res) => {
  res.json(existingCards);
});

app.get("/api/constants", (req, res) => {
  res.json({
    ELEMENTS,
    TIMING,
    CARD_TYPES,
    CARD_ATTRIBUTES,
    COMPLEXITY,
  });
});

app.get("/api/last-card-index", (req, res) => {
  res.json({ index: lastSavedCardIndex });
});

app.post("/api/save-card", async (req, res) => {
  const newCard = req.body;

  // Validate card data
  if (!newCard.id || !newCard.name || !newCard.imageUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if the image is a local file that needs to be uploaded to Cloudinary
    if (newCard.imageUrl && newCard.imageUrl.startsWith("/images/")) {
      try {
        // Generate a public ID for the image
        const publicId = `algomancy_${newCard.id}`;

        // Get the full path to the image
        const imagePath = path.join(
          __dirname,
          "..",
          "public",
          newCard.imageUrl
        );

        // Upload the image to Cloudinary
        console.log(`Uploading image for card ${newCard.id} to Cloudinary...`);
        const uploadResult = await uploadImage(imagePath, publicId);

        // Update the card with the Cloudinary URL
        newCard.imageUrl = uploadResult.secure_url;
        console.log(
          `Updated card ${newCard.id} with Cloudinary URL: ${newCard.imageUrl}`
        );
      } catch (uploadError) {
        console.error(
          `Error uploading image for card ${newCard.id} to Cloudinary:`,
          uploadError
        );
        // Continue with the local image URL if upload fails
      }
    }

    // Save to MongoDB via the API
    const response = await fetch("http://localhost:3000/api/cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newCard),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save card to MongoDB");
    }

    const savedCard = await response.json();

    // Update local cache
    const existingIndex = existingCards.findIndex(
      (card) => card.id === newCard.id
    );
    if (existingIndex !== -1) {
      // Update existing card
      existingCards[existingIndex] = newCard;
    } else {
      // Add new card
      existingCards.push(newCard);
    }

    // Also save to file as a backup
    try {
      const algomancyCardsPath = path.join(
        __dirname,
        "..",
        "app",
        "lib",
        "data",
        "algomancyCards.ts"
      );

      // Convert JSON to TypeScript
      let tsContent = JSON.stringify(existingCards, null, 2);
      // Replace "Fire" with ELEMENTS.FIRE, etc.
      tsContent = tsContent
        // Handle basic elements
        .replace(
          /"type":\s*"(Fire|Water|Earth|Wood|Metal|Colorless)"/g,
          (_, element) => {
            const key = Object.keys(BASIC_ELEMENTS).find(
              (key) => BASIC_ELEMENTS[key] === element
            );
            if (key) {
              return `"type": BASIC_ELEMENTS.${key}`;
            }
            return `"type": "${element}"`;
          }
        )
        // Handle hybrid elements
        .replace(
          /"type":\s*"(Fire\/Water|Water\/Fire|Fire\/Earth|Earth\/Fire|Fire\/Wood|Wood\/Fire|Fire\/Metal|Metal\/Fire|Water\/Earth|Earth\/Water|Water\/Wood|Wood\/Water|Water\/Metal|Metal\/Water|Earth\/Wood|Wood\/Earth|Earth\/Metal|Metal\/Earth|Wood\/Metal|Metal\/Wood)"/g,
          (_, element) => {
            const key = Object.keys(HYBRID_ELEMENTS).find(
              (key) => HYBRID_ELEMENTS[key] === element
            );
            if (key) {
              return `"type": HYBRID_ELEMENTS.${key}`;
            }
            return `"type": "${element}"`;
          }
        )
        // Handle timing
        .replace(/"type":\s*"(Standard|Haste|Battle|Virus)"/g, (_, timing) => {
          const key = Object.keys(TIMING).find((key) => TIMING[key] === timing);
          if (key) {
            return `"type": TIMING.${key}`;
          }
          return `"type": "${timing}"`;
        })
        // Handle card types
        .replace(
          /"mainType":\s*"(Unit|Spell|Resource|Token|Spell Token|Spell Unit)"/g,
          (_, type) => {
            const key = Object.keys(CARD_TYPES).find(
              (key) => CARD_TYPES[key] === type
            );
            if (key) {
              return `"mainType": CARD_TYPES.${key}`;
            }
            return `"mainType": "${type}"`;
          }
        );

      const fileContent = `import {
  Card,
  BASIC_ELEMENTS,
  HYBRID_ELEMENTS,
  TIMING,
  CARD_TYPES,
} from "../types/card";

// Card data for Algomancy cards
// This file is auto-generated by the card entry helper
// Do not edit this file directly
export const algomancyCards: Card[] = ${tsContent};
`;

      fs.writeFileSync(algomancyCardsPath, fileContent);
      console.log("Saved backup to algomancyCards.ts");
    } catch (fileError) {
      console.error("Error saving backup file:", fileError);
      // Continue even if backup fails
    }

    // Save the current card index
    const currentIndex = req.body.currentIndex;
    if (typeof currentIndex === "number") {
      lastSavedCardIndex = currentIndex;
      const lastCardPath = path.join(__dirname, "last-card-index.json");
      fs.writeFileSync(
        lastCardPath,
        JSON.stringify({ index: lastSavedCardIndex })
      );
      console.log(`Saved current card index: ${lastSavedCardIndex}`);
    }

    res.json({ success: true, cardCount: existingCards.length });
  } catch (error) {
    console.error("Error saving card data:", error);
    res.status(500).json({ error: "Failed to save card data" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Card Entry Helper running at http://localhost:${port}`);
  open(`http://localhost:${port}`);
});
