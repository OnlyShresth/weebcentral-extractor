const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch MangaUpdates Series ID and Metadata
 * @param {string} title - Manga title to search for
 * @returns {Promise<Object|null>} - { id, title, url, year, type } or null if not found
 */
async function fetchMangaUpdatesId(title) {
    try {
        // Strict Rate Limit: 1 request per second
        await delay(1000); // 1s delay before request

        // MangaUpdates API v1 Search
        const url = 'https://api.mangaupdates.com/v1/series/search';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ search: title })
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.warn(`⚠️ Rate limited by MangaUpdates for "${title}". Waiting 2s...`);
                await delay(2000);
                return fetchMangaUpdatesId(title); // Retry once
            }
            // Log but don't throw, just return null so process continues
            console.error(`❌ MangaUpdates API Error: ${response.status} for "${title}"`);
            return null;
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Take the first result
            const series = data.results[0];
            // The API structure for v1 search results:
            // { results: [ { record: { series_id, title, url, year, type, ... } }, ... ] }
            return {
                id: series.record.series_id,
                title: series.record.title,
                url: series.record.url,
                year: series.record.year,
                type: series.record.type
            };
        }

        return null;
    } catch (error) {
        console.error(`❌ Error fetching MU ID for "${title}":`, error.message);
        return null;
    }
}

/**
 * Enrich subscriptions with MangaUpdates Data
 * @param {Array} subscriptions - List of subscription objects
 * @param {Function} onProgress - Callback (current, total)
 * @returns {Promise<Array>} - Enriched subscriptions
 */
export async function enrichWithMangaUpdates(subscriptions, onProgress) {
    console.log(`\n🔍 Enriching ${subscriptions.length} items with MangaUpdates data...`);

    const enriched = [];

    for (let i = 0; i < subscriptions.length; i++) {
        const sub = subscriptions[i];

        // Check if already enriched
        if (sub.mu_id !== undefined) {
            enriched.push(sub);
            if (onProgress) onProgress(i + 1, subscriptions.length);
            continue;
        }

        const muData = await fetchMangaUpdatesId(sub.title);

        if (muData) {
            enriched.push({
                ...sub,
                mu_id: muData.id,
                mu_title: muData.title,
                mu_url: muData.url,
                mu_year: muData.year,
                mu_type: muData.type
            });
        } else {
            // Fallback: null ID but keep original title
            enriched.push({
                ...sub,
                mu_id: null,
                mu_title: sub.title, // Use original title as fallback
                mu_url: null
            });
        }

        if (onProgress) onProgress(i + 1, subscriptions.length);
    }

    return enriched;
}
