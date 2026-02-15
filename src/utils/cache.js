
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import log from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../../cache_mangaupdates.json');

// MongoDB Configuration
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
            log.cache('Connecting to MongoDB...');
            dbClient = new MongoClient(MONGO_URI);
            await dbClient.connect();
            const db = dbClient.db(); // Use database from URI
            dbCollection = db.collection(COLLECTION_NAME);
            useMongo = true;
            log.debug('Connected to MongoDB cache');
            return;
        } catch (err) {
            log.warn(`MongoDB connection failed, falling back to file cache: ${err.message}`);
        }
    } else {
        log.debug('No MONGODB_URI found, using local file cache.');
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
            log.cache(`Loaded ${localCache.size} items from local file cache`);
        }
    } catch (error) {
        log.error(`Failed to load local cache: ${error.message}`);
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
            log.error(`Cache read failed: ${err.message}`);
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
            log.cache(`Saving to MongoDB: ${normalizedKey}`);
            await dbCollection.updateOne(
                { _id: normalizedKey },
                { $set: { value, updatedAt: new Date() } },
                { upsert: true }
            );
        } catch (err) {
            log.error(`Cache write failed: ${err.message}`);
        }
    } else {
        log.cache(`Saving to local cache: ${normalizedKey}`);
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
        log.error(`Failed to save local cache: ${error.message}`);
    }
}

export { initCache };
