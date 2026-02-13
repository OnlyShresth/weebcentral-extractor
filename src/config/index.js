import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

/**
 * Application configuration with defaults
 */
export const appConfig = {
    // Server
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    
    // Paths
    exportDir: process.env.EXPORT_DIR || './exports',
    publicDir: join(__dirname, '../../public'),
    
    // Scraping
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    maxSubscriptions: parseInt(process.env.MAX_SUBSCRIPTIONS) || 1000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Features
    debug: process.env.DEBUG === 'true',
    
    // Rate limiting
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100 // Max requests per window
};

/**
 * Log configuration on startup
 */
export function logConfig() {
    if (appConfig.debug) {
        console.log('\n📋 Configuration:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Port: ${appConfig.port}`);
        console.log(`Export Directory: ${appConfig.exportDir}`);
        console.log(`Max Subscriptions: ${appConfig.maxSubscriptions}`);
        console.log(`Request Timeout: ${appConfig.requestTimeout}ms`);
        console.log(`Debug Mode: ${appConfig.debug}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
}

export default appConfig;
