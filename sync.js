// syncData.js

const fs = require('fs').promises;
const { MongoClient } = require('mongodb');
const path = require('path');

const configPath = path.join(__dirname, 'Config.json');
const requestPath = path.join(__dirname, 'request.json');

async function syncRequestData() {
    let client;
    try {
        // 1. Load MongoDB URL from Config.json
        const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
        const mongoDbUrl = configData.LOCKUNLOCKDB;

        if (!mongoDbUrl) {
            console.error('MongoDB URL not found in Config.json. Please ensure "LOCKUNLOCKDB" is set.');
            return;
        }

        // 2. Connect to MongoDB
        client = new MongoClient(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(); // You can specify your database name here if it's not in the URL
        const collection = db.collection('requests'); // Name of your MongoDB collection

        console.log('Connected to MongoDB successfully!');

        // 3. Read current request.json
        let localRequests = {};
        try {
            localRequests = JSON.parse(await fs.readFile(requestPath, 'utf8'));
            console.log('Read request.json:', localRequests);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn('request.json not found. Starting with an empty local dataset.');
            } else {
                throw error; // Re-throw other errors
            }
        }

        // 4. Upload/Update data in MongoDB
        const bulkOps = [];
        for (const key in localRequests) {
            const data = localRequests[key];
            bulkOps.push({
                updateOne: {
                    filter: { _id: key }, // Use the key as the document ID
                    update: { $set: data },
                    upsert: true // Insert if not found, update if found
                }
            });
        }

        if (bulkOps.length > 0) {
            await collection.bulkWrite(bulkOps);
            console.log('Uploaded/Updated data to MongoDB.');
        } else {
            console.log('No local changes to upload to MongoDB.');
        }

        // 5. Download all data from MongoDB
        const dbRequestsArray = await collection.find({}).toArray();
        const synchronizedRequests = {};
        dbRequestsArray.forEach(doc => {
            const { _id, ...rest } = doc;
            synchronizedRequests[_id] = rest;
        });

        // 6. Overwrite request.json with synchronized data
        await fs.writeFile(requestPath, JSON.stringify(synchronizedRequests, null, 2), 'utf8');
        console.log('Successfully synchronized request.json with MongoDB.');

    } catch (error) {
        console.error('Error during synchronization:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed.');
        }
    }
}

// Call the synchronization function
syncRequestData();

// You can export the function if you want to call it from another file
module.exports = syncRequestData;
