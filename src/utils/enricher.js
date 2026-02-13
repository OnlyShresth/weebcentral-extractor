const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch MAL ID for a given manga title using Jikan API
 * @param {string} title - Manga title to search for
 * @returns {Promise<number|null>} - MAL ID or null if not found
 */
async function fetchMalId(title) {
    try {
        // Rate limit: 1 request per second to be safe (Jikan allows 3/sec)
        await delay(1000);

        const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=1`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 429) {
                console.warn(`⚠️ Rate limited by Jikan API for "${title}". Waiting 2s...`);
                await delay(2000);
                return fetchMalId(title); // Retry once
            }
            throw new Error(`Jikan API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            return data.data[0].mal_id;
        }

        return null;
    } catch (error) {
        console.error(`❌ Error fetching ID for "${title}":`, error.message);
        return null;
    }
}

/**
 * Enrich subscriptions with MAL IDs
 * @param {Array} subscriptions - List of subscription objects
 * @param {Function} onProgress - Callback (current, total)
 * @returns {Promise<Array>} - Enriched subscriptions
 */
export async function enrichWithJikan(subscriptions, onProgress) {
    console.log(`\n🔍 Enriching ${subscriptions.length} items with MAL IDs via Jikan API...`);

    const enriched = [];

    for (let i = 0; i < subscriptions.length; i++) {
        const sub = subscriptions[i];

        // Check if already enriched
        if (sub.mal_id !== undefined) {
            enriched.push(sub);
            if (onProgress) onProgress(i + 1, subscriptions.length);
            continue;
        }

        const malId = await fetchMalId(sub.title);

        if (malId) {
            enriched.push({ ...sub, mal_id: malId });
        } else {
            enriched.push({ ...sub, mal_id: 0 });
        }

        if (onProgress) onProgress(i + 1, subscriptions.length);
    }

    return enriched;
}

/**
 * Fetch MangaDex ID for a given manga title
 * @param {string} title - Manga title to search for
 * @returns {Promise<Object|null>} - { id, url } or null if not found
 */
async function fetchMangaDexId(title) {
    try {
        // Rate limit: 5 requests per second (approx 200ms delay)
        await delay(250);

        const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 429) {
                await delay(1000); // Wait longer on rate limit
                return fetchMangaDexId(title);
            }
            return null; // Skip on other errors
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const manga = data.data[0];
            return {
                id: manga.id,
                url: `https://mangadex.org/title/${manga.id}`
            };
        }

        return null;
    } catch (error) {
        console.error(`❌ Error fetching MangaDex ID for "${title}":`, error.message);
        return null;
    }
}

/**
 * Enrich subscriptions with MangaDex IDs
 * @param {Array} subscriptions - List of subscription objects
 * @param {Function} onProgress - Callback (current, total)
 * @returns {Promise<Array>} - Enriched subscriptions
 */
export async function enrichWithMangaDex(subscriptions, onProgress) {
    console.log(`\n🔍 Enriching ${subscriptions.length} items with MangaDex IDs...`);

    const enriched = [];

    for (let i = 0; i < subscriptions.length; i++) {
        const sub = subscriptions[i];

        // Check if already enriched (avoid re-fetching)
        if (sub.mangadex_id !== undefined) {
            enriched.push(sub);
            if (onProgress) onProgress(i + 1, subscriptions.length);
            continue;
        }

        const mdData = await fetchMangaDexId(sub.title);

        if (mdData) {
            enriched.push({ ...sub, mangadex_id: mdData.id, mangadex_url: mdData.url });
        } else {
            enriched.push({ ...sub, mangadex_id: null, mangadex_url: null });
        }

        if (onProgress) onProgress(i + 1, subscriptions.length);
    }

    return enriched;
}
