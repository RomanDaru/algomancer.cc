/**
 * Import Creator Cards Script
 *
 * This script imports the converted creator cards into the MongoDB database.
 * It reads from app/cards/ConvertedCards.json and imports them into the database.
 *
 * Usage:
 *   node import-creator-cards.js [--dry-run] [--replace-all]
 *
 * Options:
 *   --dry-run: Don't actually import the cards, just show what would be imported
 *   --replace-all: Replace all existing cards with the new ones (USE WITH CAUTION)
 *
 * By default, this script will:
 * 1. Update existing cards while preserving custom fields
 * 2. Add new cards that don't exist in the database
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// MongoDB connection string
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("Error: MONGODB_URI not found in .env file");
  process.exit(1);
}

// Check for command line flags
const isDryRun = process.argv.includes("--dry-run");
const replaceAll = process.argv.includes("--replace-all");

if (replaceAll) {
  console.log(
    "WARNING: Replace All mode enabled. This will delete all existing cards and replace them with the new ones."
  );
  console.log("Press Ctrl+C within 5 seconds to cancel...");

  if (!isDryRun) {
    // Wait 5 seconds to give the user a chance to cancel
    for (let i = 5; i > 0; i--) {
      console.log(`Continuing in ${i} seconds...`);
      // Use setTimeout with a promise for cross-platform compatibility
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Path to the converted cards file
const cardsPath = path.join(
  __dirname,
  "..",
  "app",
  "cards",
  "ConvertedCards.json"
);

// Function to import cards
async function importCards() {
  let client;

  try {
    // Read the converted cards
    const cardsData = fs.readFileSync(cardsPath, "utf8");
    const cards = JSON.parse(cardsData);

    console.log(`Found ${cards.length} cards to import`);

    if (isDryRun) {
      console.log("Dry run mode - not actually importing cards");
      console.log(`First 3 cards that would be imported:`);
      console.log(JSON.stringify(cards.slice(0, 3), null, 2));
      return;
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log("Connected to MongoDB");

    // Get the database and collection
    const database = client.db();
    const collection = database.collection("cards");

    // Handle replace-all mode
    if (replaceAll && !isDryRun) {
      console.log("Replace All mode: Deleting all existing cards...");
      await collection.deleteMany({});
      console.log("All existing cards deleted");

      // All cards are new in replace-all mode
      const newCards = cards;
      console.log(`Preparing to import all ${newCards.length} cards as new`);

      // Prepare cards for MongoDB
      const cardsToInsert = newCards.map((card, index) => ({
        originalId: card.id,
        name: card.name,
        manaCost: card.manaCost,
        element: card.element,
        stats: card.stats,
        timing: card.timing,
        typeAndAttributes: card.typeAndAttributes,
        abilities: card.abilities,
        set: card.set,
        imageUrl: card.imageUrl,
        flavorText: card.flavorText,
        currentIndex: index,
      }));

      // Insert cards
      console.log(`Importing ${cardsToInsert.length} cards...`);
      const result = await collection.insertMany(cardsToInsert);
      console.log(`Successfully imported ${result.insertedCount} cards`);

      console.log("Import process completed successfully");
      return;
    }

    // Normal mode (update existing, add new)
    // Get existing cards to check for updates
    const existingCards = await collection.find({}).toArray();
    const existingCardMap = new Map(
      existingCards.map((card) => [card.originalId, card])
    );

    console.log(`Found ${existingCardMap.size} existing cards in the database`);

    // Separate cards into new and updates
    const newCards = [];
    const cardsToUpdate = [];

    for (const card of cards) {
      if (existingCardMap.has(card.id)) {
        cardsToUpdate.push(card);
      } else {
        newCards.push(card);
      }
    }

    console.log(`Found ${newCards.length} new cards to import`);
    console.log(`Found ${cardsToUpdate.length} existing cards to update`);

    // Process updates first
    if (cardsToUpdate.length > 0) {
      console.log("Updating existing cards...");

      let updateCount = 0;
      for (const card of cardsToUpdate) {
        const existingCard = existingCardMap.get(card.id);

        // Prepare update data - preserve certain fields from existing card
        const updateData = {
          name: card.name,
          manaCost: card.manaCost,
          element: card.element,
          stats: card.stats,
          timing: card.timing,
          typeAndAttributes: card.typeAndAttributes,
          abilities: card.abilities,
          set: card.set,
          imageUrl: card.imageUrl,
          // Preserve these fields if they exist in the original card
          flavorText: card.flavorText || existingCard.flavorText,
          currentIndex: existingCard.currentIndex || card.currentIndex,
          // Preserve timestamps
          createdAt: existingCard.createdAt,
          updatedAt: new Date(),
        };

        // Update the card
        await collection.updateOne(
          { originalId: card.id },
          { $set: updateData }
        );

        updateCount++;
        if (updateCount % 50 === 0) {
          console.log(
            `Updated ${updateCount}/${cardsToUpdate.length} cards...`
          );
        }
      }

      console.log(`Successfully updated ${updateCount} existing cards`);
    }

    // Process new cards
    if (newCards.length > 0) {
      // Prepare cards for MongoDB
      const cardsToInsert = newCards.map((card) => ({
        originalId: card.id,
        name: card.name,
        manaCost: card.manaCost,
        element: card.element,
        stats: card.stats,
        timing: card.timing,
        typeAndAttributes: card.typeAndAttributes,
        abilities: card.abilities,
        set: card.set,
        imageUrl: card.imageUrl,
        flavorText: card.flavorText,
        currentIndex: card.currentIndex,
      }));

      // Insert cards
      console.log(`Importing ${cardsToInsert.length} new cards...`);
      const result = await collection.insertMany(cardsToInsert);
      console.log(`Successfully imported ${result.insertedCount} new cards`);
    } else {
      console.log("No new cards to import");
    }

    console.log("Import process completed successfully");
  } catch (error) {
    console.error("Error importing cards:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the import
importCards();
