import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrapeSubscriptions, extractUserId } from './utils/scraper.js';
import { enrichWithJikan } from './utils/enricher.js';
import { exportToMAL, exportToMALText } from './exporters/mal.js';
import { exportToMangaDex, exportToMangaDexText } from './exporters/mangadex.js';

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
      timestamp: Date.now(),
      enrichment: {
        mal: { status: 'idle', current: 0, total: subscriptions.length },
        mangadex: { status: 'idle', current: 0, total: subscriptions.length }
      }
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
 * POST /api/enrich
 * Start enrichment process for a session
 */
app.post('/api/enrich', (req, res) => {
  const { sessionId, target } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!['mal', 'mangadex'].includes(target)) {
    return res.status(400).json({ error: 'Invalid target' });
  }

  // If already running or complete, return current status
  if (session.enrichment[target].status !== 'idle') {
    return res.json({ success: true, status: session.enrichment[target] });
  }

  // Start enrichment in background
  session.enrichment[target].status = 'enriching';

  const onProgress = (current, total) => {
    session.enrichment[target].current = current;
    session.enrichment[target].total = total;
  };

  const enrichPromise = target === 'mal'
    ? enrichWithJikan(session.subscriptions, onProgress)
    : enrichWithMangaDex(session.subscriptions, onProgress);

  enrichPromise
    .then(enrichedSubs => {
      session.subscriptions = enrichedSubs;
      session.enrichment[target].status = 'complete';
      session.enrichment[target].current = session.subscriptions.length;
    })
    .catch(err => {
      console.error(`❌ Enrichment error (${target}):`, err);
      session.enrichment[target].status = 'error';
    });

  res.json({ success: true, status: 'started' });
});

/**
 * GET /api/session/:sessionId
 * Get current session state (for polling progress)
 */
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    enrichment: session.enrichment
  });
});

/**
 * GET /api/download/:sessionId/:format
 * Download subscriptions in requested format
 */
app.get('/api/download/:sessionId/:format', (req, res) => {
  try {
    const { sessionId, format } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).send('Session expired or not found. Please extract again.');
    }

    const { subscriptions, userId } = session;
    const date = new Date().toISOString().split('T')[0];
    const baseFilename = `weebcentral_${userId}_${date}`;

    let content = '';
    let filename = '';
    let contentType = 'text/plain';

    switch (format) {
      case 'malXml':
        content = exportToMAL(subscriptions);
        filename = `${baseFilename}_mal.xml`;
        contentType = 'application/xml';
        break;

      case 'malText':
        content = exportToMALText(subscriptions);
        filename = `${baseFilename}_mal.txt`;
        break;

      case 'mangaDexJson':
        content = exportToMangaDex(subscriptions);
        filename = `${baseFilename}_mangadex.json`;
        contentType = 'application/json';
        break;

      case 'mangaDexText':
        content = exportToMangaDexText(subscriptions);
        filename = `${baseFilename}_mangadex.txt`;
        break;

      default:
        return res.status(400).send('Invalid format');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(content);

  } catch (error) {
    console.error('❌ Error in /api/download:', error);
    res.status(500).send('Error generating download');
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
