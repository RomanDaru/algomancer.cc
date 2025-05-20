/**
 * Update Cards from URL List
 * 
 * This script:
 * 1. Reads a text file with Cloudinary URLs
 * 2. Extracts the card names from the URLs
 * 3. Updates the MongoDB database with the correct URLs
 * 
 * Usage:
 *   node update-from-urls.js <urls-file.txt> [--dry-run]
 * 
 * Example:
 *   node update-from-urls.js cloudinary-urls.txt --dry-run
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
const inputFile = process.argv[2];
if (!inputFile || process.argv[2] === '--dry-run') {
  console.error('Error: No input file specified');
  console.error('Usage: node update-from-urls.js <urls-file.txt> [--dry-run]');
  process.exit(1);
}

// Function to add delay between operations
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to extract card name from Cloudinary URL
function extractCardName(url) {
  // Extract the filename from the URL
  const filename = url.split('/').pop();
  
  // Remove the file extension and random suffix
  const nameWithSuffix = filename.split('.')[0];
  
  // Remove the random suffix (e.g., _runw0t)
  const name = nameWithSuffix.replace(/_[a-z0-9]+$/, '');
  
  // Convert kebab case to normal text
  return name.replace(/-/g, ' ');
}

// Main function
async function main() {
  let client;
  
  try {
    // Read URLs from file
    console.log(`Reading URLs from ${inputFile}...`);
    const fileContent = fs.readFileSync(inputFile, 'utf8');
    const urls = fileContent.split('\n').filter(line => line.trim() !== '');
    console.log(`Found ${urls.length} URLs in the file`);
    
    // Extract card names and create a map
    const cardMap = new Map();
    for (const url of urls) {
      const cardName = extractCardName(url);
      cardMap.set(cardName.toLowerCase(), url);
    }
    
    console.log(`Extracted ${cardMap.size} card names from URLs`);
    
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
    
    // Match cards to URLs
    const matches = [];
    const unmatched = [];
    
    for (const card of cards) {
      const cardNameLower = card.name.toLowerCase();
      
      if (cardMap.has(cardNameLower)) {
        matches.push({
          card,
          url: cardMap.get(cardNameLower)
        });
      } else {
        // Try fuzzy matching
        let matched = false;
        for (const [name, url] of cardMap.entries()) {
          if (name.includes(cardNameLower) || cardNameLower.includes(name)) {
            matches.push({
              card,
              url
            });
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          unmatched.push(card);
        }
      }
    }
    
    console.log(`Matched ${matches.length} cards to URLs`);
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
      const { card, url } = match;
      
      if (card.imageUrl !== url) {
        bulkOps.push({
          updateOne: {
            filter: { _id: card._id },
            update: { $set: { imageUrl: url } }
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
        console.log(`- ${card.name}: ${card.imageUrl} -> ${match.url}`);
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
