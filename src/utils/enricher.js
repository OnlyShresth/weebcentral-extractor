import { getFromCache, setToCache } from './cache.js';
import log, { divider } from './logger.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate similarity between two strings using Token-based Jaccard Index + Levenshtein
 * @param {string} a 
 * @param {string} b 
 * @returns {number} Similarity score (0 to 1)
 */
function calculateSimilarity(a, b) {
    if (!a || !b) return 0;

    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const s1 = normalize(a);
    const s2 = normalize(b);

    // 1. Exact Match (Highest Priority)
    if (s1 === s2) return 1.0;

    // 2. Token-based Jaccard Similarity (Good for multi-word titles)
    const tokens1 = new Set(s1.split(/\s+/));
    const tokens2 = new Set(s2.split(/\s+/));

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    const jaccardScore = intersection.size / union.size;

    // 3. Levenshtein Distance (for typos or short titles)
    let levScore = 0;
    if (Math.abs(s1.length - s2.length) < 5) {
        const matrix = [];
        for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
        for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= s2.length; i++) {
            for (let j = 1; j <= s1.length; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        const distance = matrix[s2.length][s1.length];
        const maxLength = Math.max(s1.length, s2.length);
        levScore = 1 - (distance / maxLength);
    }

    // Weighted Score
    if (s1.length < 5 || s2.length < 5) {
        return levScore;
    }

    return Math.max(jaccardScore, levScore);
}

// Rate Limiting State
let minDelay = 1000;
let currentDelay = 500;
let lastRequestTime = 0;

/**
 * Fetch top MangaUpdates results and find best match
 * @param {string} title - Title to search
 * @returns {Promise<Object|null>} Best match or null
 */
async function fetchBestMangaUpdatesMatch(title) {
    try {
        // 1. Check Cache
        const cached = await getFromCache(title);
        if (cached) {
            log.cache(`Hit: "${title}" -> "${cached.title}"`);
            return cached;
        }

        // Rate Limit Handling
        const now = Date.now();
        const timeSinceLast = now - lastRequestTime;
        if (timeSinceLast < currentDelay) {
            await delay(currentDelay - timeSinceLast);
        }
        lastRequestTime = Date.now();

        const response = await fetch('https://api.mangaupdates.com/v1/series/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search: title, per_page: 10 })
        });

        if (!response.ok) {
            if (response.status === 429) {
                log.warn('Rate limited by MangaUpdates API. Backing off...');
                currentDelay += 500;
                await delay(2000);
                return fetchBestMangaUpdatesMatch(title); // Retry
            }
            return null;
        }

        // Slowly speed up if successful
        if (currentDelay > 500 && Math.random() > 0.8) {
            currentDelay -= 50;
        }

        const data = await response.json();
        if (!data.results || data.results.length === 0) return null;

        let bestMatch = null;
        let highestScore = 0;

        // Pre-normalization for exact checks
        const normalizedSearch = title.toLowerCase().replace(/[^a-z0-9]/g, '');

        for (const result of data.results) {
            const muTitle = result.record.title;
            const hitTitle = result.hit_title || muTitle;

            const normalizedResult = muTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedHit = hitTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (normalizedResult === normalizedSearch || normalizedHit === normalizedSearch) {
                log.match(`Exact: "${title}" -> "${muTitle}"`);
                const formatted = formatResult(result.record, 1.0, 'exact');
                await setToCache(title, formatted);
                return formatted;
            }

            let score = calculateSimilarity(title, hitTitle);

            const muType = result.record.type;
            const isDoujin = muType === 'Doujinshi';
            const isAnthology = muType === 'Anthology';
            const isNovel = muType === 'Novel';
            const titleHasDoujin = title.toLowerCase().includes('doujin');
            const titleHasAnthology = title.toLowerCase().includes('anthology');
            const titleHasNovel = title.toLowerCase().includes('novel');

            if ((isDoujin && !titleHasDoujin) ||
                (isAnthology && !titleHasAnthology) ||
                (isNovel && !titleHasNovel)) {
                score -= 0.5;
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = result.record;
            }
        }

        if (highestScore < 0.4) {
            log.warn(`No good match for "${title}"`);
            return null;
        }

        log.match(`Fuzzy: "${title}" -> "${bestMatch.title}" (${highestScore.toFixed(2)})`);

        const finalResult = formatResult(bestMatch, highestScore, 'fuzzy');
        await setToCache(title, finalResult);
        return finalResult;

    } catch (error) {
        log.error(`MU fetch failed for "${title}": ${error.message}`);
        return null;
    }
}

/**
 * Format MangaUpdates record for our app
 */
function formatResult(record, score = 0, matchType = 'fuzzy') {
    return {
        id: record.series_id,
        title: record.title,
        url: record.url,
        year: record.year,
        type: record.type,
        image: record.image ? record.image.url.original : null,
        mu_score: score,
        mu_match_type: matchType
    };
}

/**
 * Enrich subscriptions with MangaUpdates Data
 * Uses concurrency pool for faster processing
 */
export async function enrichWithMangaUpdates(subscriptions, onProgress) {
    divider('ENRICHMENT');
    log.info(`Enriching ${subscriptions.length} items with MangaUpdates data...`);
    const enriched = [...subscriptions];
    let processed = 0;

    // Concurrency Limit
    const CONCURRENCY = 2;
    const queue = [];

    // Helper to process one item
    const processItem = async (index) => {
        const sub = enriched[index];
        if (sub.mu_id === undefined) {
            const match = await fetchBestMangaUpdatesMatch(sub.title);
            enriched[index] = {
                ...sub,
                mu_id: match ? match.id : null,
                mu_title: match ? match.title : sub.title,
                mu_url: match ? match.url : null,
                mu_year: match ? match.year : null,
                mu_type: match ? match.type : null,
                mu_image: match ? match.image : null,
                mu_score: match ? match.mu_score : 0,
                mu_match_type: match ? match.mu_match_type : 'none'
            };
        }
        processed++;
        if (onProgress) onProgress(processed, subscriptions.length);
    };

    // Execute with pool
    for (let i = 0; i < subscriptions.length; i += CONCURRENCY) {
        const chunk = [];
        for (let j = 0; j < CONCURRENCY && i + j < subscriptions.length; j++) {
            chunk.push(processItem(i + j));
        }
        await Promise.all(chunk);
    }

    divider('ENRICHMENT COMPLETE');
    return enriched;
}
