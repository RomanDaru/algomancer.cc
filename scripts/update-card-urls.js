/**
 * Update Card URLs in MongoDB
 *
 * This script updates the MongoDB records with the correct Cloudinary URLs
 * after the images have been manually uploaded to Cloudinary.
 *
 * Usage:
 *   node update-card-urls.js [--dry-run]
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

// Cloudinary details
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dyfj9qvc0";

// Check for dry run flag
const isDryRun = process.argv.includes("--dry-run");

// Function to generate Cloudinary URL for a card
function generateCloudinaryUrl(cardName) {
  // Convert card name to kebab case for the URL
  const kebabName = cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // This is the format we observed in your manually uploaded images
  // Example: https://res.cloudinary.com/dyfj9qvc0/image/upload/v1747764824/metamorphic-luminary_c0r5mg.jpg
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1747764824/${kebabName}.jpg`;
}

// Function to update a card in MongoDB
async function updateCardInMongoDB(collection, cardId, cardName, imageUrl) {
  try {
    console.log(`Updating card ${cardName} in MongoDB...`);

    if (isDryRun) {
      console.log(
        `DRY RUN: Would update card ${cardId} with imageUrl: ${imageUrl}`
      );
      return;
    }

    await collection.updateOne({ originalId: cardId }, { $set: { imageUrl } });

    console.log(`Updated card ${cardName} in MongoDB`);
  } catch (error) {
    console.error(`Error updating card in MongoDB: ${error.message}`);
    throw error;
  }
}

// Function to add delay between operations
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main function
async function main() {
  let client;

  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    console.log(`Using MongoDB URI: ${mongoUri.substring(0, 20)}...`);
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log("Connected to MongoDB");

    // Get the database and collection
    const database = client.db();
    const collection = database.collection("cards");

    // Get all cards
    const cards = await collection.find({}).toArray();
    console.log(`Found ${cards.length} cards in the database`);

    // Process cards in batches to avoid overwhelming the database
    let updateCount = 0;
    const BATCH_SIZE = 20;

    // Split cards into batches
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = cards.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
          cards.length / BATCH_SIZE
        )}`
      );

      // Process each card in the batch
      for (const card of batch) {
        try {
          // Generate the Cloudinary URL for this card
          const cloudinaryUrl = generateCloudinaryUrl(card.name);

          // Only update if the URL is different
          if (card.imageUrl !== cloudinaryUrl) {
            await updateCardInMongoDB(
              collection,
              card.originalId,
              card.name,
              cloudinaryUrl
            );
            updateCount++;
          } else {
            console.log(`Card ${card.name} already has the correct URL`);
          }

          // Add a small delay between updates
          await delay(100);
        } catch (error) {
          console.error(`Error processing card ${card.name}: ${error.message}`);
          // Continue with the next card
        }
      }

      // Add a delay between batches
      if (i + BATCH_SIZE < cards.length) {
        console.log(`Waiting 1 second before processing next batch...`);
        await delay(1000);
      }
    }

    console.log(`URL update completed. Updated ${updateCount} cards.`);
  } catch (error) {
    console.error("Error during URL update:", error);
    console.error("Stack trace:", error.stack);

    if (error.message.includes("Connection timeout")) {
      console.error(
        "\nMongoDB connection timed out. Please check your MongoDB connection string and make sure your database is accessible."
      );
    } else if (error.name === "MongoNetworkError") {
      console.error(
        "\nMongoDB network error. Please check your internet connection and MongoDB connection string."
      );
    } else if (error.message.includes("authentication failed")) {
      console.error(
        "\nMongoDB authentication failed. Please check your username and password in the connection string."
      );
    }

    process.exit(1);
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the main function
main();
