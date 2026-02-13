import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrapeSubscriptions, extractUserId } from './utils/scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for sessions
// Map<sessionId, { subscriptions: Array, userId: string, timestamp: Date }>
const sessions = new Map();

// Cleanup old sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of sessions.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour
      sessions.delete(id);
    }
  }
}, 3600000);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, '../public')));

// API Routes

/**
 * POST /api/extract
 * Extract subscriptions from a WeebCentral profile
 */
app.post('/api/extract', async (req, res) => {
  try {
    const { profileUrl } = req.body;

    if (!profileUrl) {
      return res.status(400).json({
        success: false,
        error: 'Profile URL is required'
      });
    }

    console.log(`🚀 Starting extraction for: ${profileUrl}`);

    // Extract user ID
    const userId = extractUserId(profileUrl);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid WeebCentral profile URL'
      });
    }

    // Scrape subscriptions
    const subscriptions = await scrapeSubscriptions(profileUrl);

    if (subscriptions.length === 0) {
      return res.json({
        success: true,
        warning: 'No subscriptions found',
        subscriptions: [],
        sessionId: null
      });
    }

    // Create session (Simple ID: timestamp-random)
    const sessionId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    sessions.set(sessionId, {
      subscriptions,
      userId,
      timestamp: Date.now()
    });

    console.log(`✅ Extraction complete. Session created: ${sessionId}`);

    res.json({
      success: true,
      subscriptions,
      sessionId,
      count: subscriptions.length
    });

  } catch (error) {
    console.error('❌ Error in /api/extract:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * Serve the main UI
 */
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     🎌  WEEBCENTRAL SUBSCRIPTION EXTRACTOR  🎌       ║
║                                                       ║
║  Server running at: http://localhost:${PORT}          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
