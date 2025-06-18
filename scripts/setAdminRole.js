/**
 * Script to manually set admin role for roman.daru.ml@gmail.com
 * Run this script if the admin role is not automatically set during authentication
 * 
 * Usage: node scripts/setAdminRole.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function setAdminRole() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find and update the admin user
    const result = await usersCollection.updateOne(
      { email: 'roman.daru.ml@gmail.com' },
      { 
        $set: { 
          isAdmin: true,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('❌ User roman.daru.ml@gmail.com not found in database');
      console.log('   Please sign in with your Google account first');
    } else if (result.modifiedCount === 1) {
      console.log('✅ Admin role successfully set for roman.daru.ml@gmail.com');
    } else {
      console.log('ℹ️  Admin role was already set for roman.daru.ml@gmail.com');
    }
    
    // Verify the update
    const user = await usersCollection.findOne({ email: 'roman.daru.ml@gmail.com' });
    if (user) {
      console.log('📋 User details:');
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
      console.log(`   Updated: ${user.updatedAt}`);
    }
    
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
setAdminRole().catch(console.error);
