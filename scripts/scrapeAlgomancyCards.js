// Script to download Algomancy card images
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");

// Function to download an image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Skip if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`File already exists: ${filepath}`);
      resolve();
      return;
    }

    // Download the image
    const file = fs.createWriteStream(filepath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if there's an error
        reject(err);
      });
  });
}

// Function to sanitize a filename
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
}

// Main function to download card images
async function downloadCardImages() {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    defaultViewport: null,
  });

  const page = await browser.newPage();
  console.log("Navigating to Algomancy cards page...");
  await page.goto("https://calebgannon.com/algomancycards/", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Wait for the cards to load
  console.log("Waiting for cards to load...");
  try {
    await page.waitForSelector(".card-grid", { timeout: 60000 });
  } catch (error) {
    console.log(
      "Could not find .card-grid selector. Trying to find images anyway..."
    );
  }

  // Extract image URLs and card names
  console.log("Extracting image URLs...");
  const cardImages = await page.evaluate(() => {
    // Try to find all image elements that might be cards
    const images = Array.from(document.querySelectorAll("img"));
    return images
      .filter((img) => img.src && img.src.includes("cardsearch-images"))
      .map((img) => {
        // Try to get the card name from alt text, parent element, or filename
        let name = img.alt || "";
        if (!name) {
          // Try to get name from parent element text
          const parent = img.closest("div");
          if (parent) {
            const nameElement = parent.querySelector(".card-name") || parent;
            name = nameElement.textContent?.trim() || "";
          }
        }

        // If still no name, extract from URL
        if (!name) {
          const urlParts = img.src.split("/");
          const filename = urlParts[urlParts.length - 1];
          name = filename.replace(".jpg", "").replace(/-/g, " ");
        }

        return {
          name: name || "Unknown Card",
          imageUrl: img.src,
        };
      });
  });

  console.log(`Found ${cardImages.length} card images`);

  // Create a directory for the images
  const imagesDir = path.join(__dirname, "..", "public", "images", "cards");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Download the images
  console.log("Downloading images...");
  const cardData = [];

  for (let i = 0; i < cardImages.length; i++) {
    const card = cardImages[i];
    const sanitizedName = sanitizeFilename(card.name);
    const filename = `${sanitizedName}.jpg`;
    const filepath = path.join(imagesDir, filename);
    const localImagePath = `/images/cards/${filename}`;

    try {
      await downloadImage(card.imageUrl, filepath);
      console.log(`Downloaded (${i + 1}/${cardImages.length}): ${card.name}`);

      // Add to card data
      cardData.push({
        name: card.name,
        originalImageUrl: card.imageUrl,
        localImagePath: localImagePath,
      });
    } catch (error) {
      console.error(`Error downloading ${card.name}: ${error.message}`);
    }
  }

  // Save the card data to a JSON file
  const cardDataPath = path.join(
    __dirname,
    "..",
    "app",
    "lib",
    "data",
    "cardImages.json"
  );
  fs.writeFileSync(cardDataPath, JSON.stringify(cardData, null, 2));
  console.log(`Saved card data to ${cardDataPath}`);

  // Create a template file for manually adding card details
  const templatePath = path.join(
    __dirname,
    "..",
    "app",
    "lib",
    "data",
    "algomancyCards.ts"
  );
  const templateContent = `import { Card, ELEMENTS, TIMING, CARD_TYPES } from "../types/card";

// Template for manually adding card details
// This file needs to be manually populated with card details
export const algomancyCards: Card[] = [
  // Example of how to add a card:
  /*
  {
    id: "fire-001",
    name: "${cardData.length > 0 ? cardData[0].name : "Card Name"}",
    manaCost: 1,
    element: {
      type: ELEMENTS.FIRE,
      symbol: "/images/elements/fire.png",
    },
    stats: {
      power: 1,
      defense: 1,
    },
    timing: {
      type: TIMING.STANDARD,
      description: "Can be played during deployment",
    },
    typeAndAttributes: {
      mainType: CARD_TYPES.UNIT,
      subType: "Subtype",
      modifiers: [],
    },
    abilities: ["Ability description"],
    set: {
      symbol: "core",
      name: "Core Set",
      complexity: "Standard",
    },
    imageUrl: "${
      cardData.length > 0
        ? cardData[0].localImagePath
        : "/images/cards/card-name.jpg"
    }",
    flavorText: "Flavor text",
  },
  */
];
`;

  fs.writeFileSync(templatePath, templateContent);
  console.log(`Created template file at ${templatePath}`);

  await browser.close();
  console.log("Done!");
}

// Run the image downloader
downloadCardImages().catch(console.error);
