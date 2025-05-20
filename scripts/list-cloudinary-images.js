/**
 * List Cloudinary Images
 * 
 * This script:
 * 1. Lists all images in your Cloudinary account
 * 2. Outputs them to a JSON file
 * 
 * Usage:
 *   node list-cloudinary-images.js [output-file]
 * 
 * Example:
 *   node list-cloudinary-images.js cloudinary-images.json
 */

const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Get output path from command line arguments or use default
const defaultOutputPath = path.join(__dirname, 'cloudinary-images.json');
const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultOutputPath;

// Function to add delay between operations
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to get all resources from Cloudinary with pagination and retry logic
async function getAllCloudinaryResources(prefix = '') {
  let allResources = [];
  let nextCursor = null;
  
  // Retry configuration
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 10000; // 10 seconds
  
  const fetchWithRetry = async (options, retryCount = 0) => {
    try {
      return await cloudinary.api.resources(options);
    } catch (error) {
      // Check if it's a rate limit error
      if (error.error && error.error.http_code === 420) {
        // Extract the retry time from the error message
        const retryTimeMatch = error.error.message.match(/Try again on (.*) UTC/);
        if (retryTimeMatch) {
          const retryTime = new Date(retryTimeMatch[1]);
          const now = new Date();
          const waitTime = Math.max(retryTime - now, INITIAL_RETRY_DELAY);
          
          console.log(`Rate limit exceeded. Waiting until ${retryTime.toISOString()} (${Math.ceil(waitTime/1000)} seconds)`);
          
          await delay(waitTime);
          return fetchWithRetry(options, retryCount);
        }
      }
      
      // For other errors or if we can't parse the retry time, use exponential backoff
      if (retryCount < MAX_RETRIES) {
        const waitTime = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Error fetching resources: ${error.message}. Retrying in ${waitTime/1000} seconds...`);
        await delay(waitTime);
        return fetchWithRetry(options, retryCount + 1);
      }
      
      // If we've exhausted our retries, throw the error
      throw error;
    }
  };
  
  do {
    const options = {
      type: 'upload',
      max_results: 500,
      prefix
    };
    
    if (nextCursor) {
      options.next_cursor = nextCursor;
    }
    
    console.log(`Fetching resources${nextCursor ? ' (continued)' : ''}...`);
    const result = await fetchWithRetry(options);
    
    if (result.resources) {
      allResources = allResources.concat(result.resources);
      console.log(`Fetched ${result.resources.length} resources (total: ${allResources.length})`);
    }
    
    nextCursor = result.next_cursor;
    
    // Add a delay between API calls to avoid rate limits
    if (nextCursor) {
      await delay(2000);
    }
  } while (nextCursor);
  
  return allResources;
}

// Main function
async function main() {
  try {
    console.log('Fetching images from Cloudinary...');
    const resources = await getAllCloudinaryResources();
    console.log(`Found ${resources.length} images in Cloudinary`);
    
    // Extract relevant information
    const images = resources.map(resource => ({
      public_id: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      version: resource.version,
      created_at: resource.created_at
    }));
    
    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(images, null, 2));
    console.log(`Successfully wrote ${images.length} images to ${outputPath}`);
    
    // Print some example URLs
    console.log('\nExample URLs:');
    for (let i = 0; i < Math.min(5, images.length); i++) {
      console.log(`- ${images[i].url}`);
    }
    
    console.log('\nNext steps:');
    console.log('1. Review the JSON file to see all your Cloudinary images');
    console.log('2. Run update-card-urls.js to update your MongoDB database with these URLs');
    
  } catch (error) {
    console.error('Error listing Cloudinary images:', error);
    process.exit(1);
  }
}

// Run the main function
main();
