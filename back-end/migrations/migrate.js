// migrations/add-createdBy-field.js
const mongoose = require('mongoose');
require('dotenv').config(); // Make sure to have your MongoDB URI in .env

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Meeting = require('../models/Meeting');
        
        // Add createdBy field to all existing meetings
        const result = await Meeting.updateMany(
            { createdBy: { $exists: false } },
            { $set: { createdBy: 'default_user' } }
        );

        console.log(`Updated ${result.modifiedCount} meetings`);
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

migrate();