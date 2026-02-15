import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractUserId } from './utils/scraper.js';
import { enrichWithMangaUpdates } from './utils/enricher.js';
import { exportToMUTxt, exportToPlainTxt } from './exporters/mangaupdates.js';
import puppeteer from 'puppeteer';
import { scrapeQueue, initWorker } from './queue.js';
import log, { banner } from './utils/logger.js';

// Global browser instance
let globalBrowser;

// Initialize worker with browser once launched
let globalWorker;
// Modify initBrowser to start worker
async function initBrowser() {
  try {
    globalBrowser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    log.debug('Browser instance launched');

    // Initialize Worker
    globalWorker = initWorker(globalBrowser);
  } catch (err) {
    log.error(`Failed to launch browser: ${err.message}`);
    process.exit(1);
  }
}

// Initialize browser on startup
initBrowser();

// Ensure browser closes on exit
process.on('SIGINT', async () => {
  if (globalBrowser) await globalBrowser.close();
  process.exit();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 6767;

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
 * Add extraction job to queue
 */
app.post('/api/extract', async (req, res) => {
  try {
    const { profileUrl } = req.body;

    if (!profileUrl) return res.status(400).json({ error: 'Profile URL is required' });

    const profileRegex = /^https?:\/\/(www\.)?weebcentral\.com\/users\/[A-Za-z0-9]+\/profiles\/?$/;
    if (!profileRegex.test(profileUrl)) {
      return res.status(400).json({ error: 'Invalid URL. Expected format: https://weebcentral.com/users/{id}/profiles' });
    }

    if (!globalBrowser) return res.status(503).json({ error: 'Server warming up...' });

    log.server(`Queuing extraction for: ${profileUrl}`);

    // Add job to queue
    const job = await scrapeQueue.add('extract', { profileUrl });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Job queued'
    });

  } catch (error) {
    log.error(`/api/extract failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/job/:jobId
 * Check job status and get result
 */
app.get('/api/job/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = await scrapeQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const state = await job.getState(); // completed, failed, delayed, etc.
  const result = job.returnvalue;
  const error = job.failedReason;

  // If completed, creating session immediately for simplicity
  if (state === 'completed' && result) {
    const userId = extractUserId(job.data.profileUrl);
    const sessionId = `session-${jobId}`;

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        subscriptions: result,
        userId,
        timestamp: Date.now(),
        enrichment: {
          mangaupdates: { status: 'idle', current: 0, total: result.length }
        }
      });
    }

    return res.json({
      state,
      sessionId,
      count: result.length
    });
  }

  res.json({ state, error });
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

  if (target !== 'mangaupdates') {
    return res.status(400).json({ error: 'Invalid target. Only MangaUpdates is supported.' });
  }

  // If already running or complete, return current status
  if (session.enrichment.mangaupdates.status !== 'idle') {
    return res.json({ success: true, status: session.enrichment.mangaupdates });
  }

  // Start enrichment in background
  session.enrichment.mangaupdates.status = 'enriching';

  const onProgress = (current, total) => {
    session.enrichment.mangaupdates.current = current;
    session.enrichment.mangaupdates.total = total;
  };

  enrichWithMangaUpdates(session.subscriptions, onProgress)
    .then(enrichedSubs => {
      session.subscriptions = enrichedSubs;
      session.enrichment.mangaupdates.status = 'complete';
      session.enrichment.mangaupdates.current = session.subscriptions.length;
    })
    .catch(err => {
      log.error(`Enrichment failed: ${err.message}`);
      session.enrichment.mangaupdates.status = 'error';
    });

  res.json({ success: true, status: 'started' });
});

/**
 * POST /api/update
 * Update session subscriptions (e.g., after manual review)
 */
app.post('/api/update', (req, res) => {
  const { sessionId, rejectedIndices } = req.body;

  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (Array.isArray(rejectedIndices)) {
    rejectedIndices.forEach(index => {
      if (session.subscriptions[index]) {
        const sub = session.subscriptions[index];
        sub.mu_id = null;
        sub.mu_title = sub.title;
        sub.mu_url = null;
        sub.mu_year = null;
        sub.mu_score = 0;
        sub.mu_match_type = 'none';
      }
    });
  }

  res.json({ success: true });
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
    enrichment: session.enrichment,
    subscriptions: session.subscriptions
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
      case 'muTxt':
        content = exportToMUTxt(subscriptions);
        filename = `${baseFilename}_mu_links.txt`;
        contentType = 'text/plain';
        break;

      case 'plainTxt':
        content = exportToPlainTxt(subscriptions);
        filename = `${baseFilename}_list.txt`;
        contentType = 'text/plain';
        break;

      default:
        return res.status(400).send('Invalid format');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(content);

  } catch (error) {
    log.error(`/api/download failed: ${error.message}`);
    res.status(500).send('Error generating download');
  }
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
  banner('WEEBCENTRAL SUBSCRIPTION EXTRACTOR', `Server running at http://localhost:${PORT}`);
});

export default app;
