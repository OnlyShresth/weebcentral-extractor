/**
 * Convert numeric ID to Base36 (MangaUpdates format)
 * @param {number} id 
 * @returns {string}
 */
function toBase36(id) {
    return id.toString(36);
}

/**
 * Create a slug from title
 * @param {string} title 
 * @returns {string}
 */
function toSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

/**
 * Export as MangaUpdates Links (.txt)
 * Format: https://www.mangaupdates.com/series/{base36id}/{slug}
 */
export function exportToMUTxt(subscriptions) {
    return subscriptions
        .filter(sub => sub.mu_id) // Only matched items
        .map(sub => {
            const base36Id = toBase36(sub.mu_id);
            const slug = toSlug(sub.mu_title || sub.title);
            return `https://www.mangaupdates.com/series/${base36Id}/${slug}`;
        })
        .join('\n');
}

/**
 * Export as Plain Text List (.txt)
 * Format: Title
 */
export function exportToPlainTxt(subscriptions) {
    return subscriptions
        .map(sub => sub.mu_title || sub.title)
        .join('\n');
}

// End of file
