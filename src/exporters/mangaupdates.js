/**
 * Export subscriptions to CSV format for MangaUpdates manual use
 * Columns: ID, Title, Link, Original Title
 * @param {Array} subscriptions 
 * @returns {string} CSV content
 */
export function exportToMUCsv(subscriptions) {
    const header = ['ID', 'Title', 'Link', 'Original Title', 'Year', 'Type'];
    const rows = subscriptions.map(sub => {
        // Handle fields that might contain commas
        const safeTitle = `"${(sub.mu_title || sub.title).replace(/"/g, '""')}"`;
        const safeOriginal = `"${sub.title.replace(/"/g, '""')}"`;

        return [
            sub.mu_id || '',
            safeTitle,
            sub.mu_url || '',
            safeOriginal,
            sub.mu_year || '',
            sub.mu_type || ''
        ].join(',');
    });

    return [header.join(','), ...rows].join('\n');
}

/**
 * Export subscriptions to JSON format for MangaUpdates/Bot use
 * @param {Array} subscriptions 
 * @returns {string} JSON string
 */
export function exportToMUJson(subscriptions) {
    const data = subscriptions.map(sub => ({
        id: sub.mu_id || null,
        title: sub.mu_title || sub.title,
        url: sub.mu_url || null,
        original_title: sub.title,
        year: sub.mu_year || null,
        type: sub.mu_type || null,
        weebcentral_link: sub.link || null,
        image_url: sub.imageUrl || null
    }));

    return JSON.stringify(data, null, 2);
}
