/**
 * Scheduled Backup Script
 * This script can be run on a schedule to automatically back up your MongoDB database
 * 
 * To schedule this script:
 * 
 * On Windows:
 * 1. Open Task Scheduler
 * 2. Create a new task
 * 3. Set the trigger (e.g., daily at midnight)
 * 4. Set the action to run this script with node
 * 
 * On macOS/Linux:
 * 1. Open crontab: crontab -e
 * 2. Add a line like: 0 0 * * * node /path/to/scheduled-backup.js
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MongoDB connection string
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Create a timestamp for the backup filename
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const backupFilename = `scheduled_backup_${timestamp}.json`;
const backupPath = path.join(backupDir, backupFilename);

// Function to run the backup
async function runBackup() {
  try {
    console.log(`Starting scheduled backup at ${new Date().toLocaleString()}`);
    console.log(`Backup will be saved to: ${backupPath}`);
    
    // Get all cards from the API
    const response = await fetch('http://localhost:3000/api/cards');
    
    if (!response.ok) {
      throw new Error(`Failed to get cards: ${response.statusText}`);
    }
    
    const cards = await response.json();
    console.log(`Retrieved ${cards.length} cards from the database`);
    
    // Save the cards to a JSON file
    fs.writeFileSync(backupPath, JSON.stringify(cards, null, 2));
    console.log(`Backup completed successfully: ${cards.length} cards saved to ${backupPath}`);
    
    // Keep only the 10 most recent backups
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('scheduled_backup_') && file.endsWith('.json'))
      .sort((a, b) => {
        // Sort by creation time, newest first
        return fs.statSync(path.join(backupDir, b)).mtime.getTime() - 
               fs.statSync(path.join(backupDir, a)).mtime.getTime();
      });
    
    // Delete older backups (keep the 10 most recent)
    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      filesToDelete.forEach(file => {
        const filePath = path.join(backupDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted old backup: ${filePath}`);
      });
    }
    
    return { success: true, count: cards.length, path: backupPath };
  } catch (error) {
    console.error('Error creating scheduled backup:', error);
    return { success: false, error: error.message };
  }
}

// Run the backup
runBackup().then(result => {
  if (result.success) {
    console.log(`Scheduled backup completed successfully. ${result.count} cards backed up to ${result.path}`);
    process.exit(0);
  } else {
    console.error(`Scheduled backup failed: ${result.error}`);
    process.exit(1);
  }
});
