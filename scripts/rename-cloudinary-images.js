/**
 * Rename Cloudinary Images
 * 
 * This script:
 * 1. Lists all images in Cloudinary
 * 2. Renames images to remove random suffixes
 * 3. Updates MongoDB with the clean URLs
 * 
 * Usage:
 *   node rename-cloudinary-images.js [--dry-run] [--batch-size=20] [--delay=500]
 * 
 * Options:
 *   --dry-run: Don't actually rename images or update database
 *   --batch-size=N: Process N images at a time (default: 20)
 *   --delay=N: Wait N milliseconds between operations (default: 500)
 */

const cloudinary = require('cloudinary').v2;
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MongoDB connection string
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Parse command line arguments
const isDryRun = process.argv.includes('--dry-run');
const batchSizeArg = process.argv.find(arg => arg.startsWith('--batch-size='));
const delayArg = process.argv.find(arg => arg.startsWith('--delay='));

const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 20;
const DELAY = delayArg ? parseInt(delayArg.split('=')[1]) : 500;

// Function to add delay between operations
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to rename a Cloudinary image
async function renameCloudinaryImage(publicId, newPublicId) {
  try {
    console.log(`Renaming ${publicId} to ${newPublicId}`);
    
    if (isDryRun) {
      console.log(`DRY RUN: Would rename ${publicId} to ${newPublicId}`);
      return { public_id: newPublicId };
    }
    
    const result = await cloudinary.uploader.rename(publicId, newPublicId, { overwrite: true });
    console.log(`Successfully renamed to ${newPublicId}`);
    return result;
  } catch (error) {
    console.error(`Error renaming ${publicId}: ${error.message}`);
    
    // If the error is that the destination already exists, we can consider it a success
    if (error.message.includes('already exists')) {
      console.log(`Image ${newPublicId} already exists, considering rename successful`);
      return { public_id: newPublicId };
    }
    
    throw error;
  }
}

// Function to update a card in MongoDB
async function updateCardInMongoDB(collection, cardId, cardName, oldUrl, newUrl) {
  try {
    console.log(`Updating card ${cardName} in MongoDB...`);
    
    if (isDryRun) {
      console.log(`DRY RUN: Would update card ${cardId} from ${oldUrl} to ${newUrl}`);
      return;
    }
    
    await collection.updateOne(
      { originalId: cardId },
      { $set: { imageUrl: newUrl } }
    );
    
    console.log(`Updated card ${cardName} in MongoDB`);
  } catch (error) {
    console.error(`Error updating card in MongoDB: ${error.message}`);
    throw error;
  }
}

// Function to get all resources from Cloudinary with pagination
async function getAllCloudinaryResources(prefix = '') {
  let allResources = [];
  let nextCursor = null;
  
  do {
    const options = {
      type: 'upload',
      max_results: 500,
      prefix
    };
    
    if (nextCursor) {
      options.next_cursor = nextCursor;
    }
    
    const result = await cloudinary.api.resources(options);
    allResources = allResources.concat(result.resources);
    nextCursor = result.next_cursor;
    
    // Add a delay between API calls to avoid rate limits
    if (nextCursor) {
      await delay(DELAY);
    }
  } while (nextCursor);
  
  return allResources;
}

// Main function
async function main() {
  let client;
  
  try {
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
    
    // Get all images from Cloudinary
    console.log('Fetching images from Cloudinary...');
    const resources = await getAllCloudinaryResources();
    console.log(`Found ${resources.length} images in Cloudinary`);
    
    // Create a map of resources by public ID for easy lookup
    const resourceMap = new Map();
    for (const resource of resources) {
      resourceMap.set(resource.public_id, resource);
    }
    
    // Find resources with suffixes to rename
    const resourcesToRename = resources.filter(resource => {
      const publicId = resource.public_id;
      return publicId.match(/_[a-z0-9]{6}$/);
    });
    
    console.log(`Found ${resourcesToRename.length} images with suffixes to rename`);
    
    // Process resources in batches
    let renamedCount = 0;
    let updatedCount = 0;
    
    for (let i = 0; i < resourcesToRename.length; i += BATCH_SIZE) {
      const batch = resourcesToRename.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(resourcesToRename.length/BATCH_SIZE)}`);
      
      // Process each resource in the batch
      for (const resource of batch) {
        try {
          const publicId = resource.public_id;
          
          // Extract the base name without the suffix
          const newPublicId = publicId.replace(/_[a-z0-9]{6}$/, '');
          
          // Rename the image in Cloudinary
          const result = await renameCloudinaryImage(publicId, newPublicId);
          renamedCount++;
          
          // Update cards in MongoDB that use this image
          const oldUrl = resource.secure_url;
          const newUrl = oldUrl.replace(publicId, newPublicId);
          
          // Find cards that use this image
          const cardsToUpdate = cards.filter(card => card.imageUrl === oldUrl);
          
          for (const card of cardsToUpdate) {
            await updateCardInMongoDB(collection, card.originalId, card.name, oldUrl, newUrl);
            updatedCount++;
            await delay(DELAY / 2); // Shorter delay between database updates
          }
          
          // Add a delay between operations
          await delay(DELAY);
        } catch (error) {
          console.error(`Error processing resource: ${error.message}`);
          // Continue with the next resource
        }
      }
      
      // Add a longer delay between batches
      if (i + BATCH_SIZE < resourcesToRename.length) {
        console.log(`Waiting ${DELAY * 2}ms before processing next batch...`);
        await delay(DELAY * 2);
      }
    }
    
    console.log(`Rename operation completed. Renamed ${renamedCount} images, updated ${updatedCount} cards.`);
  } catch (error) {
    console.error('Error during rename operation:', error);
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
