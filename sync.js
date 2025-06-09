const fs = require('fs');
const mongoose = require('mongoose');
const config = require('./config.json');

const MONGO_URI = config.LOCKUNLOCKDB;
const FILE_PATH = './request.json';

// Mongoose Schema
const requestSchema = new mongoose.Schema({
  id: String,
  status: String,
  expiresAt: mongoose.Schema.Types.Mixed
});

const Request = mongoose.model('Request', requestSchema);

// Read JSON file
function readJsonFile() {
  if (!fs.existsSync(FILE_PATH)) return {};
  const data = fs.readFileSync(FILE_PATH, 'utf8');
  return JSON.parse(data);
}

// Save to JSON file (Compressed format)
function saveToJsonFile(data) {
  const obj = {};
  data.forEach(entry => {
    obj[entry.id] = {
      status: entry.status,
      expiresAt: entry.expiresAt ?? null
    };
  });
  fs.writeFileSync(FILE_PATH, JSON.stringify(obj)); // Compressed
}

// Upload to MongoDB
async function uploadToMongoDB(jsonData) {
  for (const [id, info] of Object.entries(jsonData)) {
    await Request.findOneAndUpdate(
      { id },
      { id, status: info.status, expiresAt: info.expiresAt ?? null },
      { upsert: true, new: true }
    );
  }
}

// Sync from MongoDB
async function syncFromMongoDB() {
  const allRequests = await Request.find();
  saveToJsonFile(allRequests);
}

// Watch for changes in JSON file
fs.watchFile(FILE_PATH, async () => {
  console.log('🟡 Detected change in request.json');
  const data = readJsonFile();
  await uploadToMongoDB(data);
  await syncFromMongoDB();
  console.log('✅ Synced with MongoDB');
});

// Initial setup
async function init() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB Connected');
  const data = readJsonFile();
  await uploadToMongoDB(data);
  await syncFromMongoDB();
  console.log('✅ Initial Sync Done');
}

init();
