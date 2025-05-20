/**
 * Match Cloudinary Images to Cards
 * 
 * This script:
 * 1. Reads a JSON file with Cloudinary images
 * 2. Matches them to cards in MongoDB
 * 3. Updates the database with the correct URLs
 * 
 * Usage:
 *   node match-cloudinary-images.js <cloudinary-images.json> [--dry-run]
 * 
 * Example:
 *   node match-cloudinary-images.js cloudinary-images.json --dry-run
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MongoDB connection string
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

// Check for dry run flag
const isDryRun = process.argv.includes('--dry-run');

// Get input file path
const inputFile = process.argv.find(arg => arg.endsWith('.json'));
if (!inputFile) {
  console.error('Error: No JSON file specified');
  console.error('Usage: node match-cloudinary-images.js <cloudinary-images.json> [--dry-run]');
  process.exit(1);
}

// Function to add delay between operations
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to find the best match for a card name in Cloudinary images
function findBestMatch(cardName, images) {
  // Convert card name to kebab case for matching
  const kebabName = cardName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Try exact match first
  const exactMatch = images.find(img => {
    const publicId = path.basename(img.public_id);
    return publicId === kebabName || publicId === `${kebabName}.jpg`;
  });
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Try fuzzy match
  for (const img of images) {
    const publicId = path.basename(img.public_id);
    
    // Check if the public ID contains the kebab name
    if (publicId.includes(kebabName)) {
      return img;
    }
    
    // Check if the kebab name contains the public ID
    if (kebabName.includes(publicId.replace(/\.[^/.]+$/, ''))) {
      return img;
    }
  }
  
  // Try even fuzzier match
  for (const img of images) {
    const publicId = path.basename(img.public_id).toLowerCase();
    const nameWords = cardName.toLowerCase().split(/[^a-z0-9]+/);
    
    // Check if the public ID contains at least half of the words in the card name
    const matchCount = nameWords.filter(word => publicId.includes(word)).length;
    if (matchCount >= Math.ceil(nameWords.length / 2)) {
      return img;
    }
  }
  
  return null;
}

// Main function
async function main() {
  let client;
  
  try {
    // Read Cloudinary images from file
    console.log(`Reading Cloudinary images from ${inputFile}...`);
    const imagesData = fs.readFileSync(inputFile, 'utf8');
    const images = JSON.parse(imagesData);
    console.log(`Found ${images.length} images in the file`);
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database and collection
    const database = client.db();
    const collection = database.collection('cards');
    
    // Get all cards from MongoDB
    const cards = await collection.find({}).toArray();
    console.log(`Found ${cards.length} cards in the database`);
    
    // Match cards to images
    const matches = [];
    const unmatched = [];
    
    for (const card of cards) {
      const match = findBestMatch(card.name, images);
      
      if (match) {
        matches.push({
          card,
          image: match
        });
      } else {
        unmatched.push(card);
      }
    }
    
    console.log(`Matched ${matches.length} cards to images`);
    console.log(`Could not match ${unmatched.length} cards`);
    
    if (unmatched.length > 0) {
      console.log('\nUnmatched cards:');
      for (let i = 0; i < Math.min(10, unmatched.length); i++) {
        console.log(`- ${unmatched[i].name}`);
      }
      
      if (unmatched.length > 10) {
        console.log(`... and ${unmatched.length - 10} more`);
      }
    }
    
    // Prepare bulk operations
    const bulkOps = [];
    
    for (const match of matches) {
      const { card, image } = match;
      
      if (card.imageUrl !== image.url) {
        bulkOps.push({
          updateOne: {
            filter: { _id: card._id },
            update: { $set: { imageUrl: image.url } }
          }
        });
      }
    }
    
    console.log(`Prepared ${bulkOps.length} update operations`);
    
    if (isDryRun) {
      console.log('\nDRY RUN: Would update the following cards:');
      for (let i = 0; i < Math.min(10, bulkOps.length); i++) {
        const op = bulkOps[i];
        const card = cards.find(c => c._id.toString() === op.updateOne.filter._id.toString());
        const match = matches.find(m => m.card._id.toString() === card._id.toString());
        console.log(`- ${card.name}: ${card.imageUrl} -> ${match.image.url}`);
      }
      
      if (bulkOps.length > 10) {
        console.log(`... and ${bulkOps.length - 10} more`);
      }
      
      console.log('\nDRY RUN completed. No changes were made to the database.');
      return;
    }
    
    // Execute bulk operations
    if (bulkOps.length > 0) {
      console.log('Executing bulk update...');
      const result = await collection.bulkWrite(bulkOps);
      console.log(`Successfully updated ${result.modifiedCount} cards`);
    } else {
      console.log('No cards need updating');
    }
    
    console.log('URL update completed');
  } catch (error) {
    console.error('Error during URL update:', error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the main function
main();
