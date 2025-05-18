/**
 * MongoDB Backup Script
 * This script creates a backup of your MongoDB database
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MongoDB connection string
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

// Parse MongoDB URI to get database name
let dbName = 'algomancy';
try {
  const uriParts = mongoUri.split('/');
  const lastPart = uriParts[uriParts.length - 1];
  if (lastPart && !lastPart.includes('?')) {
    dbName = lastPart;
  } else if (lastPart && lastPart.includes('?')) {
    dbName = lastPart.split('?')[0];
  }
} catch (error) {
  console.warn('Could not parse database name from URI, using default: algomancy');
}

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Create a timestamp for the backup filename
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const backupFilename = `${dbName}_backup_${timestamp}.json`;
const backupPath = path.join(backupDir, backupFilename);

// Function to run the backup
async function runBackup() {
  try {
    console.log(`Starting backup of MongoDB database: ${dbName}`);
    console.log(`Backup will be saved to: ${backupPath}`);
    
    // First, get all cards from the API
    const response = await fetch('http://localhost:3000/api/cards');
    
    if (!response.ok) {
      throw new Error(`Failed to get cards: ${response.statusText}`);
    }
    
    const cards = await response.json();
    console.log(`Retrieved ${cards.length} cards from the database`);
    
    // Save the cards to a JSON file
    fs.writeFileSync(backupPath, JSON.stringify(cards, null, 2));
    console.log(`Backup completed successfully: ${cards.length} cards saved to ${backupPath}`);
    
    // Also create a TypeScript backup for direct use in the app
    const tsBackupPath = path.join(__dirname, '..', 'app', 'lib', 'data', `backup_${timestamp}.ts`);
    const tsContent = `// Automatic backup created on ${new Date().toLocaleString()}
import { Card } from "../types/card";

export const backupCards: Card[] = ${JSON.stringify(cards, null, 2)};
`;
    fs.writeFileSync(tsBackupPath, tsContent);
    console.log(`TypeScript backup created at: ${tsBackupPath}`);
    
    return { success: true, count: cards.length, path: backupPath };
  } catch (error) {
    console.error('Error creating backup:', error);
    return { success: false, error: error.message };
  }
}

// Run the backup
runBackup().then(result => {
  if (result.success) {
    console.log(`Backup completed successfully. ${result.count} cards backed up to ${result.path}`);
    process.exit(0);
  } else {
    console.error(`Backup failed: ${result.error}`);
    process.exit(1);
  }
});
