/**
 * Upload Algomancy card images to Cloudinary
 * This script uploads all card images to Cloudinary and updates the card data in MongoDB
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const cloudinary = require("cloudinary").v2;
const fetch = require("node-fetch");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Base path for card images
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const IMAGES_DIR = path.join(PUBLIC_DIR, "images", "cards");

// Function to get all card images
async function getCardImages() {
  try {
    // Check if directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`Directory not found: ${IMAGES_DIR}`);
      return [];
    }

    // Get all files in the directory
    const files = fs.readdirSync(IMAGES_DIR);

    // Filter for image files
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
    });

    return imageFiles.map((file) => ({
      name: file,
      path: path.join(IMAGES_DIR, file),
      relativePath: `/images/cards/${file}`,
    }));
  } catch (error) {
    console.error("Error getting card images:", error);
    return [];
  }
}

// Function to upload an image to Cloudinary
async function uploadImageToCloudinary(imagePath, publicId) {
  try {
    console.log(`Uploading ${path.basename(imagePath)} to Cloudinary...`);

    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: "algomancy/cards",
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });

    console.log(
      `Uploaded ${path.basename(imagePath)} to Cloudinary: ${result.secure_url}`
    );
    return result;
  } catch (error) {
    console.error(
      `Error uploading ${path.basename(imagePath)} to Cloudinary:`,
      error
    );
    throw error;
  }
}

// Function to get all cards from MongoDB
async function getCardsFromMongoDB() {
  try {
    console.log("Getting cards from MongoDB...");

    const response = await fetch("http://localhost:3000/api/cards");

    if (!response.ok) {
      throw new Error(`Failed to get cards: ${response.statusText}`);
    }

    const cards = await response.json();
    console.log(`Got ${cards.length} cards from MongoDB`);
    return cards;
  } catch (error) {
    console.error("Error getting cards from MongoDB:", error);
    throw error;
  }
}

// Function to update a card in MongoDB
async function updateCardInMongoDB(card) {
  try {
    console.log(`Updating card ${card.id} in MongoDB...`);

    const response = await fetch(`http://localhost:3000/api/cards/${card.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      throw new Error(`Failed to update card: ${response.statusText}`);
    }

    const updatedCard = await response.json();
    console.log(`Updated card ${card.id} in MongoDB`);
    return updatedCard;
  } catch (error) {
    console.error(`Error updating card ${card.id} in MongoDB:`, error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log("Starting image upload to Cloudinary...");

    // Get all card images
    const cardImages = await getCardImages();
    console.log(`Found ${cardImages.length} card images`);

    if (cardImages.length === 0) {
      console.log("No card images found");
      return;
    }

    // Get all cards from MongoDB
    const cards = await getCardsFromMongoDB();

    if (cards.length === 0) {
      console.log("No cards found in MongoDB");
      return;
    }

    // Upload each image to Cloudinary and update the card in MongoDB
    for (const image of cardImages) {
      try {
        // Find the card that uses this image
        const card = cards.find((c) => c.imageUrl === image.relativePath);

        if (!card) {
          console.log(`No card found for image ${image.name}, skipping`);
          continue;
        }

        // Generate a public ID for the image
        const publicId = `algomancy_${card.id}`;

        // Upload the image to Cloudinary
        const uploadResult = await uploadImageToCloudinary(
          image.path,
          publicId
        );

        // Update the card with the Cloudinary URL
        card.imageUrl = uploadResult.secure_url;

        // Update the card in MongoDB
        await updateCardInMongoDB(card);

        console.log(`Successfully processed ${image.name}`);
      } catch (error) {
        console.error(`Error processing ${image.name}:`, error);
        // Continue with the next image
      }
    }

    console.log("Image upload completed");
  } catch (error) {
    console.error("Error during image upload:", error);
    process.exit(1);
  }
}

// Run the main function
main();
