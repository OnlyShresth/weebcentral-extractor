import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Save export data to file
 * @param {string} filename - Name of the file
 * @param {string} content - Content to write
 * @param {string} outputDir - Output directory path
 * @returns {Promise<string>} Path to saved file
 */
export async function saveToFile(filename, content, outputDir = './exports') {
  try {
    // Create exports directory if it doesn't exist
    await mkdir(outputDir, { recursive: true });
    
    const filePath = join(outputDir, filename);
    await writeFile(filePath, content, 'utf-8');
    
    console.log(`✅ Saved: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`❌ Error saving file ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Generate all export files from subscriptions
 * @param {Array} subscriptions - Array of subscription objects
 * @param {string} userId - User ID for naming files
 * @returns {Promise<Object>} Paths to all generated files
 */
export async function generateAllExports(subscriptions, userId) {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `weebcentral_${userId}_${timestamp}`;
  
  const files = {
    malXml: null,
    malText: null,
    mangaDexJson: null,
    mangaDexText: null,
    csv: null,
    summary: null
  };
  
  try {
    // Import exporters
    const { exportToMAL, exportToMALText } = await import('../exporters/mal.js');
    const { exportToMangaDex, exportToMangaDexText, exportToCSV } = await import('../exporters/mangadex.js');
    
    // Generate MAL exports
    files.malXml = await saveToFile(
      `${baseFilename}_mal.xml`,
      exportToMAL(subscriptions)
    );
    
    files.malText = await saveToFile(
      `${baseFilename}_mal.txt`,
      exportToMALText(subscriptions)
    );
    
    // Generate MangaDex exports
    files.mangaDexJson = await saveToFile(
      `${baseFilename}_mangadex.json`,
      exportToMangaDex(subscriptions)
    );
    
    files.mangaDexText = await saveToFile(
      `${baseFilename}_mangadex.txt`,
      exportToMangaDexText(subscriptions)
    );
    
    // Generate CSV
    files.csv = await saveToFile(
      `${baseFilename}_list.csv`,
      exportToCSV(subscriptions)
    );
    
    // Generate summary
    const summary = generateSummary(subscriptions, files);
    files.summary = await saveToFile(
      `${baseFilename}_README.txt`,
      summary
    );
    
    return files;
  } catch (error) {
    console.error('❌ Error generating exports:', error.message);
    throw error;
  }
}

/**
 * Generate a summary/readme file
 */
function generateSummary(subscriptions, files) {
  const lines = [
    '═══════════════════════════════════════════════════════',
    '    WEEBCENTRAL SUBSCRIPTION EXPORT',
    '═══════════════════════════════════════════════════════',
    '',
    `Export Date: ${new Date().toLocaleString()}`,
    `Total Subscriptions: ${subscriptions.length}`,
    '',
    '───────────────────────────────────────────────────────',
    'GENERATED FILES:',
    '───────────────────────────────────────────────────────',
    '',
    '📄 MAL (MyAnimeList) Formats:',
    '   • *_mal.xml - XML format for MAL import',
    '   • *_mal.txt - Text list for manual entry',
    '',
    '📄 MangaDex Formats:',
    '   • *_mangadex.json - JSON reference format',
    '   • *_mangadex.txt - Text list for manual search',
    '',
    '📄 Universal Format:',
    '   • *_list.csv - CSV format (compatible with Excel/Sheets)',
    '',
    '───────────────────────────────────────────────────────',
    'HOW TO USE:',
    '───────────────────────────────────────────────────────',
    '',
    '🔹 MyAnimeList:',
    '   1. Go to: https://myanimelist.net/panel.php?go=export',
    '   2. Import the XML file or manually add from text list',
    '',
    '🔹 MangaDex:',
    '   1. Use the text list to search titles on MangaDex',
    '   2. Or use the JSON for custom scripts/tools',
    '',
    '🔹 Other Platforms:',
    '   Use the CSV file for bulk import or tracking',
    '',
    '═══════════════════════════════════════════════════════',
    '',
    'SUBSCRIPTION LIST:',
    ''
  ];
  
  subscriptions.forEach((sub, index) => {
    lines.push(`${(index + 1).toString().padStart(3, ' ')}. ${sub.title}`);
  });
  
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('Generated by WeebCentral Extractor');
  lines.push('═══════════════════════════════════════════════════════');
  
  return lines.join('\n');
}
