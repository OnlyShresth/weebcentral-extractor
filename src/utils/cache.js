
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '../../cache_mangaupdates.json');

// In-memory cache
let cache = new Map();
let isDirty = false;

// Load cache from disk
export function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf8');
            const json = JSON.parse(data);
            cache = new Map(Object.entries(json));
            console.log(`📦 Loaded ${cache.size} items from cache.`);
        }
    } catch (error) {
        console.error('Failed to load cache:', error);
    }
}

// Get item from cache
export function getFromCache(key) {
    // Normalize key
    const normalizedKey = key.toLowerCase().trim();
    return cache.get(normalizedKey);
}

// Set item in cache
export function setToCache(key, value) {
    const normalizedKey = key.toLowerCase().trim();
    cache.set(normalizedKey, value);
    isDirty = true;

    // Auto-save every 10 new items or so? 
    // For now, let's just save periodically or rely on explicit saves.
    // Actually, saving immediately is safer for now to avoid data loss on crash
    saveCache();
}

// Save cache to disk
export function saveCache() {
    if (!isDirty) return;
    try {
        const obj = Object.fromEntries(cache);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
        isDirty = false;
    } catch (error) {
        console.error('Failed to save cache:', error);
    }
}

// Initialize on load
loadCache();
