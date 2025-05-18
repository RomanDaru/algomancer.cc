/**
 * MongoDB Restore Script
 * This script restores your MongoDB database from a backup
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to list available backups
function listBackups() {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.error('No backups directory found');
    return [];
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => {
      // Sort by creation time, newest first
      return fs.statSync(path.join(backupDir, b)).mtime.getTime() - 
             fs.statSync(path.join(backupDir, a)).mtime.getTime();
    });
  
  if (files.length === 0) {
    console.log('No backup files found');
    return [];
  }
  
  console.log('Available backups:');
  files.forEach((file, index) => {
    const stats = fs.statSync(path.join(backupDir, file));
    console.log(`${index + 1}. ${file} (${stats.mtime.toLocaleString()})`);
  });
  
  return files;
}

// Function to restore from a backup file
async function restoreFromBackup(backupFile) {
  try {
    console.log(`Restoring from backup: ${backupFile}`);
    
    // Read the backup file
    const backupPath = path.join(__dirname, '..', 'backups', backupFile);
    const backupData = fs.readFileSync(backupPath, 'utf8');
    const cards = JSON.parse(backupData);
    
    console.log(`Found ${cards.length} cards in the backup`);
    
    // Confirm with the user
    const confirmation = await new Promise(resolve => {
      rl.question(`Are you sure you want to import ${cards.length} cards? This will NOT delete existing cards. (y/n): `, answer => {
        resolve(answer.toLowerCase());
      });
    });
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('Restore cancelled');
      return { success: false, message: 'Cancelled by user' };
    }
    
    // Import the cards
    console.log('Importing cards...');
    const response = await fetch('http://localhost:3000/api/cards/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cards),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to import cards');
    }
    
    const result = await response.json();
    console.log(`Successfully imported ${result.count} cards`);
    
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    console.log('MongoDB Restore Utility');
    console.log('=======================');
    
    // List available backups
    const backups = listBackups();
    
    if (backups.length === 0) {
      rl.close();
      return;
    }
    
    // Ask which backup to restore
    const backupIndex = await new Promise(resolve => {
      rl.question('Enter the number of the backup to restore (or 0 to cancel): ', answer => {
        resolve(parseInt(answer));
      });
    });
    
    if (backupIndex === 0 || isNaN(backupIndex) || backupIndex > backups.length) {
      console.log('Restore cancelled');
      rl.close();
      return;
    }
    
    // Restore from the selected backup
    const selectedBackup = backups[backupIndex - 1];
    const result = await restoreFromBackup(selectedBackup);
    
    if (result.success) {
      console.log(`Restore completed successfully. ${result.count} cards restored.`);
    } else {
      console.error(`Restore failed: ${result.error || result.message}`);
    }
  } catch (error) {
    console.error('Error in restore process:', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
