/**
 * Import existing cards from algomancyCards.ts to MongoDB
 * Run this script to migrate your existing cards to the MongoDB database
 */
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// Path to the algomancyCards.ts file
const algomancyCardsPath = path.join(
  __dirname,
  "..",
  "app",
  "lib",
  "data",
  "algomancyCards.ts"
);

// Function to extract cards from the TypeScript file
async function extractCardsFromFile() {
  try {
    // Read the file
    const fileContent = fs.readFileSync(algomancyCardsPath, "utf8");

    // Extract the array part using regex
    const match = fileContent.match(
      /export const algomancyCards: Card\[\] = (\[[\s\S]*\]);/
    );
    if (!match || !match[1]) {
      throw new Error("Could not extract cards array from file");
    }

    // Convert TypeScript to JSON
    let jsonContent = match[1]
      // Replace BASIC_ELEMENTS.FIRE with "Fire", etc.
      .replace(
        /BASIC_ELEMENTS\.(FIRE|WATER|EARTH|WOOD|METAL|COLORLESS)/g,
        (_, element) => {
          const elements = {
            FIRE: '"Fire"',
            WATER: '"Water"',
            EARTH: '"Earth"',
            WOOD: '"Wood"',
            METAL: '"Metal"',
            COLORLESS: '"Colorless"',
          };
          return elements[element] || `"${element}"`;
        }
      )
      // Replace HYBRID_ELEMENTS.FIRE_WATER with "Fire/Water", etc.
      .replace(
        /HYBRID_ELEMENTS\.(FIRE_WATER|WATER_FIRE|FIRE_EARTH|EARTH_FIRE|FIRE_WOOD|WOOD_FIRE|FIRE_METAL|METAL_FIRE|WATER_EARTH|EARTH_WATER|WATER_WOOD|WOOD_WATER|WATER_METAL|METAL_WATER|EARTH_WOOD|WOOD_EARTH|EARTH_METAL|METAL_EARTH|WOOD_METAL|METAL_WOOD)/g,
        (_, element) => {
          const elements = {
            FIRE_WATER: '"Fire/Water"',
            WATER_FIRE: '"Water/Fire"',
            FIRE_EARTH: '"Fire/Earth"',
            EARTH_FIRE: '"Earth/Fire"',
            FIRE_WOOD: '"Fire/Wood"',
            WOOD_FIRE: '"Wood/Fire"',
            FIRE_METAL: '"Fire/Metal"',
            METAL_FIRE: '"Metal/Fire"',
            WATER_EARTH: '"Water/Earth"',
            EARTH_WATER: '"Earth/Water"',
            WATER_WOOD: '"Water/Wood"',
            WOOD_WATER: '"Wood/Water"',
            WATER_METAL: '"Water/Metal"',
            METAL_WATER: '"Metal/Water"',
            EARTH_WOOD: '"Earth/Wood"',
            WOOD_EARTH: '"Wood/Earth"',
            EARTH_METAL: '"Earth/Metal"',
            METAL_EARTH: '"Metal/Earth"',
            WOOD_METAL: '"Wood/Metal"',
            METAL_WOOD: '"Metal/Wood"',
          };
          return elements[element] || `"${element}"`;
        }
      )
      // Replace TIMING.STANDARD with "Standard", etc.
      .replace(/TIMING\.(STANDARD|HASTE|BATTLE|VIRUS)/g, (_, timing) => {
        const timings = {
          STANDARD: '"Standard"',
          HASTE: '"Haste"',
          BATTLE: '"Battle"',
          VIRUS: '"Virus"',
        };
        return timings[timing] || `"${timing}"`;
      })
      // Replace CARD_TYPES.UNIT with "Unit", etc.
      .replace(
        /CARD_TYPES\.(UNIT|SPELL|RESOURCE|TOKEN|SPELL_TOKEN|SPELL_UNIT)/g,
        (_, type) => {
          const types = {
            UNIT: '"Unit"',
            SPELL: '"Spell"',
            RESOURCE: '"Resource"',
            TOKEN: '"Token"',
            SPELL_TOKEN: '"Spell Token"',
            SPELL_UNIT: '"Spell Unit"',
          };
          return types[type] || `"${type}"`;
        }
      );

    // Parse the JSON
    const cards = JSON.parse(jsonContent);
    return cards;
  } catch (error) {
    console.error("Error extracting cards from file:", error);
    return [];
  }
}

// Function to import cards to MongoDB
async function importCardsToMongoDB(cards) {
  try {
    console.log(`Importing ${cards.length} cards to MongoDB...`);

    // Send the cards to the import API
    const response = await fetch("http://localhost:3000/api/cards/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cards),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to import cards");
    }

    const result = await response.json();
    console.log(`Successfully imported ${result.count} cards to MongoDB`);
    return result.count;
  } catch (error) {
    console.error("Error importing cards to MongoDB:", error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log("Starting card import to MongoDB...");

    // Extract cards from file
    const cards = await extractCardsFromFile();
    console.log(`Found ${cards.length} cards in algomancyCards.ts`);

    if (cards.length === 0) {
      console.log("No cards found to import");
      return;
    }

    // Import cards to MongoDB
    await importCardsToMongoDB(cards);

    console.log("Card import completed successfully");
  } catch (error) {
    console.error("Error during card import:", error);
    process.exit(1);
  }
}

// Run the main function
main();
