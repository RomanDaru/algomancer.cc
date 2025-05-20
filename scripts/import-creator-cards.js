/**
 * Import Creator Cards Script
 * 
 * This script imports the converted creator cards into the MongoDB database.
 * It reads from app/cards/ConvertedCards.json and imports them into the database.
 * 
 * Usage:
 *   node import-creator-cards.js [--dry-run]
 * 
 * Options:
 *   --dry-run: Don't actually import the cards, just show what would be imported
 * 
 * IMPORTANT: This script will NOT overwrite existing cards with the same ID.
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

// Path to the converted cards file
const cardsPath = path.join(__dirname, '..', 'app', 'cards', 'ConvertedCards.json');

// Function to import cards
async function importCards() {
  let client;
  
  try {
    // Read the converted cards
    const cardsData = fs.readFileSync(cardsPath, 'utf8');
    const cards = JSON.parse(cardsData);
    
    console.log(`Found ${cards.length} cards to import`);
    
    if (isDryRun) {
      console.log('Dry run mode - not actually importing cards');
      console.log(`First 3 cards that would be imported:`);
      console.log(JSON.stringify(cards.slice(0, 3), null, 2));
      return;
    }
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database and collection
    const database = client.db();
    const collection = database.collection('cards');
    
    // Get existing card IDs to avoid duplicates
    const existingCards = await collection.find({}, { projection: { originalId: 1 } }).toArray();
    const existingIds = new Set(existingCards.map(card => card.originalId));
    
    console.log(`Found ${existingIds.size} existing cards in the database`);
    
    // Filter out cards that already exist
    const newCards = cards.filter(card => !existingIds.has(card.id));
    
    console.log(`Found ${newCards.length} new cards to import`);
    
    if (newCards.length === 0) {
      console.log('No new cards to import');
      return;
    }
    
    // Prepare cards for MongoDB
    const cardsToInsert = newCards.map(card => ({
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
      currentIndex: card.currentIndex
    }));
    
    // Insert cards
    console.log(`Importing ${cardsToInsert.length} cards...`);
    const result = await collection.insertMany(cardsToInsert);
    
    console.log(`Successfully imported ${result.insertedCount} cards`);
    
  } catch (error) {
    console.error('Error importing cards:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the import
importCards();
