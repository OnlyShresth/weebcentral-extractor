/**
 * Formats subscription data for MyAnimeList (MAL) import
 * MAL uses XML format for manga list imports
 */

/**
 * Convert subscriptions to MAL XML format
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {string} XML string for MAL import
 */
export function exportToMAL(subscriptions) {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8" ?>\n';
  const myAnimeListOpen = '<myanimelist>\n';
  const myAnimeListClose = '</myanimelist>';

  // Add myinfo header (required for some importers)
  const myInfo = `
  <myinfo>
    <user_id>0</user_id>
    <user_name>WeebCentral-Export</user_name>
    <user_export_type>2</user_export_type>
    <user_total_manga>${subscriptions.length}</user_total_manga>
    <user_total_reading>${subscriptions.length}</user_total_reading>
    <user_total_completed>0</user_total_completed>
    <user_total_onhold>0</user_total_onhold>
    <user_total_dropped>0</user_total_dropped>
    <user_total_plantoread>0</user_total_plantoread>
  </myinfo>
`;

  let mangaEntries = '';

  subscriptions.forEach((sub) => {
    mangaEntries += `  <manga>\n`;
    mangaEntries += `    <manga_mangadb_id>${sub.mal_id || 0}</manga_mangadb_id>\n`;
    mangaEntries += `    <manga_title><![CDATA[${escapeXml(sub.title)}]]></manga_title>\n`;
    mangaEntries += `    <manga_volumes>0</manga_volumes>\n`;
    mangaEntries += `    <manga_chapters>0</manga_chapters>\n`;
    mangaEntries += `    <my_id>0</my_id>\n`;
    mangaEntries += `    <my_read_volumes>0</my_read_volumes>\n`;
    mangaEntries += `    <my_read_chapters>0</my_read_chapters>\n`;
    mangaEntries += `    <my_start_date>0000-00-00</my_start_date>\n`;
    mangaEntries += `    <my_finish_date>0000-00-00</my_finish_date>\n`;
    mangaEntries += `    <my_scans_group><![CDATA[]]></my_scans_group>\n`;
    mangaEntries += `    <my_score>0</my_score>\n`;
    mangaEntries += `    <my_storage><![CDATA[]]></my_storage>\n`;
    mangaEntries += `    <my_comments><![CDATA[]]></my_comments>\n`;
    mangaEntries += `    <my_status>Reading</my_status>\n`;
    mangaEntries += `    <my_times_read>0</my_times_read>\n`;
    mangaEntries += `    <my_tags><![CDATA[imported-from-weebcentral]]></my_tags>\n`;
    mangaEntries += `    <my_reread_value>0</my_reread_value>\n`;
    mangaEntries += `    <update_on_import>1</update_on_import>\n`;
    mangaEntries += `  </manga>\n`;
  });

  return xmlHeader + myAnimeListOpen + myInfo + mangaEntries + myAnimeListClose;
}

/**
 * Generate MAL-compatible text format (alternative to XML)
 * @param {Array} subscriptions 
 * @returns {string} Text format for manual import
 */
export function exportToMALText(subscriptions) {
  let output = '# MyAnimeList Import (Text Format)\n';
  output += '# Copy and paste manga titles to search on MAL\n\n';

  subscriptions.forEach((sub, index) => {
    output += `${index + 1}. ${sub.title}\n`;
  });

  return output;
}

/**
 * Escape special XML characters
 */
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
