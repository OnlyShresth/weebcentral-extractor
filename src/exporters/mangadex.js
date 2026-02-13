/**
 * Formats subscription data for MangaDex import/reference
 * MangaDex doesn't have a direct import format, so we create a JSON structure
 * that can be used with their API or as a reference list
 */

/**
 * Convert subscriptions to MangaDex JSON format
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {string} JSON string for MangaDex reference
 */
export function exportToMangaDex(subscriptions) {
  // Return a clean list of objects that can be easily parsed by migration scripts
  const exportData = subscriptions.map(sub => ({
    title: sub.title,
    weebCentralLink: sub.link,
    imageUrl: sub.imageUrl,
    status: 'Reading'
  }));

  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate a simple list format for MangaDex
 * @param {Array} subscriptions 
 * @returns {string} Text format with titles
 */
export function exportToMangaDexText(subscriptions) {
  let output = '# MangaDex Import List\n';
  output += '# Search these titles on MangaDex to add to your library\n\n';

  subscriptions.forEach((sub, index) => {
    output += `${index + 1}. ${sub.title}\n`;
    if (sub.link) {
      output += `   Original: ${sub.link}\n`;
    }
  });

  return output;
}

/**
 * Create a CSV format that can be used for bulk operations
 * @param {Array} subscriptions 
 * @returns {string} CSV format
 */
export function exportToCSV(subscriptions) {
  let csv = 'Title,Status,Tags,Source URL,Image URL\n';

  subscriptions.forEach(sub => {
    const title = escapeCSV(sub.title);
    const link = sub.link || '';
    const imageUrl = sub.imageUrl || '';

    csv += `"${title}","Reading","imported-from-weebcentral","${link}","${imageUrl}"\n`;
  });

  return csv;
}

/**
 * Escape CSV special characters
 */
function escapeCSV(field) {
  if (field === null || field === undefined) return '';
  return String(field).replace(/"/g, '""');
}
