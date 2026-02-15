
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../../cache_mangaupdates.json');

// MongoDB Configuration
// const MONGO_URI = process.env.MONGODB_URI; // Moved inside initCache()
const DB_NAME = 'weebcentral_extractor';
const COLLECTION_NAME = 'mu_cache';

let dbClient;
let dbCollection;
let useMongo = false;

// In-memory cache (fallback/local)
let localCache = new Map();
let isDirty = false;

// Initialize Cache - stored as a promise
let initPromise = initCache();

// Initialize Cache function
async function initCache() {
    const MONGO_URI = process.env.MONGODB_URI;

    // Try connecting to MongoDB first
    if (MONGO_URI) {
        try {
            console.log('🍃 Connecting to MongoDB...');
            dbClient = new MongoClient(MONGO_URI);
            await dbClient.connect();
            const db = dbClient.db(); // Use database from URI
            dbCollection = db.collection(COLLECTION_NAME);
            useMongo = true;
            console.log('✅ Connected to MongoDB Cache');
            return;
        } catch (err) {
            console.warn('⚠️ MongoDB connection failed, falling back to file cache:', err.message);
        }
    } else {
        console.log('ℹ️ No MONGODB_URI found (Check .env file!), using local file cache.');
        // console.log('DEBUG: process.env keys:', Object.keys(process.env).filter(k => k.includes('MONGO')));
    }

    // Fallback to File Cache
    loadLocalCache();
}

// Load local file cache
function loadLocalCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf8');
            const json = JSON.parse(data);
            localCache = new Map(Object.entries(json));
            console.log(`📦 Loaded ${localCache.size} items from local file cache.`);
        }
    } catch (error) {
        console.error('Failed to load local cache:', error);
    }
}

// Get item from cache
export async function getFromCache(key) {
    if (!dbClient && !localCache.size) await initPromise; // Ensure init is done

    const normalizedKey = key.toLowerCase().trim();

    if (useMongo && dbCollection) {
        try {
            const doc = await dbCollection.findOne({ _id: normalizedKey });
            return doc ? doc.value : null;
        } catch (err) {
            console.error('Error reading from MongoDB:', err);
            return null;
        }
    }

    return localCache.get(normalizedKey);
}

// Set item in cache
export async function setToCache(key, value) {
    if (!dbClient && !localCache.size) await initPromise; // Ensure init is done

    const normalizedKey = key.toLowerCase().trim();

    if (useMongo && dbCollection) {
        try {
            console.log(`💾 Saving to MongoDB: ${normalizedKey}`);
            await dbCollection.updateOne(
                { _id: normalizedKey },
                { $set: { value, updatedAt: new Date() } },
                { upsert: true }
            );
        } catch (err) {
            console.error('Error writing to MongoDB:', err);
        }
    } else {
        console.log(`💾 Saving to local cache: ${normalizedKey}`);
        localCache.set(normalizedKey, value);
        isDirty = true;
        saveLocalCache();
    }
}

// Save local cache to disk
function saveLocalCache() {
    if (!isDirty) return;
    try {
        const obj = Object.fromEntries(localCache);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
        isDirty = false;
    } catch (error) {
        console.error('Failed to save local cache:', error);
    }
}

export { initCache };
