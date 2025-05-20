/**
 * Upload Missing Card Images to Cloudinary
 *
 * This script:
 * 1. Finds all cards in MongoDB that have Cloudinary URLs but the images don't exist
 * 2. Looks for the images in your local public/images/cards directory
 * 3. Uploads them to Cloudinary with the correct naming
 *
 * Usage:
 *   node upload-missing-card-images.js [--dry-run]
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// MongoDB connection string
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("Error: MONGODB_URI not found in .env file");
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Check for dry run flag
const isDryRun = process.argv.includes("--dry-run");

// Path to local card images
const IMAGES_DIR = path.join(__dirname, "..", "public", "images", "cards");

// Function to add delay between API calls
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to check if an image exists on Cloudinary
async function checkImageExists(publicId) {
  try {
    await cloudinary.api.resource(`algomancy/cards/${publicId}`);
    return true;
  } catch (error) {
    if (error.error && error.error.http_code === 404) {
      return false;
    }

    // Handle rate limiting
    if (error.error && error.error.http_code === 420) {
      console.log("Rate limit exceeded. Waiting 60 seconds before retrying...");
      await delay(60000); // Wait 60 seconds
      return checkImageExists(publicId); // Retry
    }

    throw error;
  }
}

// Function to find a local image for a card
function findLocalImage(cardName) {
  try {
    // Check if directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`Directory not found: ${IMAGES_DIR}`);
      return null;
    }

    // Get all files in the directory
    const files = fs.readdirSync(IMAGES_DIR);

    // Try different naming patterns
    const possibleNames = [
      // Exact match
      `${cardName}.jpg`,
      `${cardName}.png`,

      // Lowercase
      `${cardName.toLowerCase()}.jpg`,
      `${cardName.toLowerCase()}.png`,

      // Kebab case
      `${cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`,
      `${cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`,

      // Snake case
      `${cardName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.jpg`,
      `${cardName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`,
    ];

    // Try to find a matching file
    for (const fileName of possibleNames) {
      if (files.includes(fileName)) {
        return path.join(IMAGES_DIR, fileName);
      }
    }

    // If no exact match, try a fuzzy match
    for (const file of files) {
      const fileNameWithoutExt = path.parse(file).name.toLowerCase();
      const cardNameLower = cardName.toLowerCase();

      if (
        fileNameWithoutExt.includes(cardNameLower) ||
        cardNameLower.includes(fileNameWithoutExt)
      ) {
        return path.join(IMAGES_DIR, file);
      }
    }

    console.log(`No local image found for card: ${cardName}`);
    return null;
  } catch (error) {
    console.error(`Error finding local image: ${error.message}`);
    return null;
  }
}

// Function to upload an image to Cloudinary
async function uploadToCloudinary(imagePath, publicId) {
  try {
    console.log(
      `Uploading ${path.basename(imagePath)} to Cloudinary as ${publicId}...`
    );

    if (isDryRun) {
      console.log(
        `DRY RUN: Would upload ${imagePath} to Cloudinary as ${publicId}`
      );
      return {
        secure_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1747595000/algomancy/cards/${publicId}.jpg`,
      };
    }

    // Add a small delay before each upload to avoid rate limiting
    await delay(1000); // Wait 1 second between uploads

    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: "algomancy/cards",
      overwrite: true,
    });

    console.log(`Uploaded to Cloudinary: ${result.secure_url}`);
    return result;
  } catch (error) {
    // Handle rate limiting
    if (error.error && error.error.http_code === 420) {
      console.log("Rate limit exceeded. Waiting 60 seconds before retrying...");
      await delay(60000); // Wait 60 seconds
      return uploadToCloudinary(imagePath, publicId); // Retry
    }

    console.error(`Error uploading to Cloudinary: ${error.message}`);
    throw error;
  }
}

// Function to update a card in MongoDB
async function updateCardInMongoDB(collection, cardId, imageUrl) {
  try {
    console.log(`Updating card ${cardId} in MongoDB...`);

    if (isDryRun) {
      console.log(
        `DRY RUN: Would update card ${cardId} with imageUrl: ${imageUrl}`
      );
      return;
    }

    // Add a small delay before each database update
    await delay(500); // Wait 0.5 seconds between updates

    await collection.updateOne({ originalId: cardId }, { $set: { imageUrl } });

    console.log(`Updated card ${cardId} in MongoDB`);
  } catch (error) {
    console.error(`Error updating card in MongoDB: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  let client;

  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log("Connected to MongoDB");

    // Get the database and collection
    const database = client.db();
    const collection = database.collection("cards");

    // Get all cards
    const cards = await collection.find({}).toArray();
    console.log(`Found ${cards.length} cards in the database`);

    // Filter for cards that have Cloudinary URLs but the images might not exist
    const cardsToProcess = [];

    for (const card of cards) {
      if (!card.imageUrl) continue;

      // Extract the public ID from the Cloudinary URL
      const match = card.imageUrl.match(/\/algomancy\/cards\/([^.]+)/);
      if (!match) continue;

      const publicId = match[1];

      // Check if the image exists on Cloudinary
      const exists = await checkImageExists(publicId);

      if (!exists) {
        cardsToProcess.push({
          id: card.originalId,
          name: card.name,
          imageUrl: card.imageUrl,
          publicId,
        });
      }
    }

    console.log(
      `Found ${cardsToProcess.length} cards that need images uploaded to Cloudinary`
    );

    if (cardsToProcess.length === 0) {
      console.log("No cards need processing");
      return;
    }

    // Process cards in batches to avoid rate limits
    let successCount = 0;
    let failCount = 0;
    const BATCH_SIZE = 10; // Process 10 cards at a time

    // Split cards into batches
    for (let i = 0; i < cardsToProcess.length; i += BATCH_SIZE) {
      const batch = cardsToProcess.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
          cardsToProcess.length / BATCH_SIZE
        )}`
      );

      // Process each card in the batch
      for (const card of batch) {
        try {
          console.log(`Processing card: ${card.name}`);

          // Find a local image for the card
          const localImagePath = findLocalImage(card.name);

          if (!localImagePath) {
            console.log(
              `No local image found for card: ${card.name}, skipping`
            );
            failCount++;
            continue;
          }

          console.log(`Found local image: ${localImagePath}`);

          // Upload to Cloudinary
          const uploadResult = await uploadToCloudinary(
            localImagePath,
            card.publicId
          );

          // Update the card in MongoDB
          await updateCardInMongoDB(
            collection,
            card.id,
            uploadResult.secure_url
          );

          successCount++;
          console.log(`Successfully processed ${card.name}`);
        } catch (error) {
          console.error(`Error processing card ${card.name}: ${error.message}`);
          failCount++;
          // Continue with the next card
        }
      }

      // Add a delay between batches
      if (i + BATCH_SIZE < cardsToProcess.length) {
        console.log(`Waiting 5 seconds before processing next batch...`);
        await delay(5000); // Wait 5 seconds between batches
      }
    }

    console.log(
      `Image upload completed. Success: ${successCount}, Failed: ${failCount}`
    );
  } catch (error) {
    console.error("Error during image upload:", error);
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
