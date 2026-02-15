# WeebCentral Subscription Extractor

A web tool that scrapes manga subscription lists from WeebCentral profiles and enriches them with metadata from MangaUpdates.

## Quick Start

**Windows users:** Double-click `start.bat`. It will check for Node.js, install dependencies, and open the app in your browser.

If Node.js is not installed, the script will open the download page for you automatically.

**Manual start:**

```
npm install
npm start
```

The app will be available at `http://localhost:6767`.

## Features

- Extracts subscriptions from any public WeebCentral profile URL
- Matches titles against MangaUpdates using fuzzy and exact search
- Caches results in MongoDB (falls back to local JSON file)
- Exports to MangaUpdates link list or plain text

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | No | MongoDB connection string. Falls back to local JSON cache. |
| `PORT` | No | Server port. Defaults to `6767`. |
| `DEBUG` | No | Set to `true` for verbose error output. |

## Project Structure

```
start.bat               - One-click launcher (Windows)
src/
  server.js             - Express server and API routes
  queue.js              - In-memory job queue
  utils/
    logger.js           - Centralized logging utility
    scraper.js          - WeebCentral profile scraper (Puppeteer)
    enricher.js         - MangaUpdates title matching and enrichment
    cache.js            - MongoDB / local file cache layer
  exporters/
    mangaupdates.js     - Export formatters
public/
  index.html            - Web UI
  app.js                - Frontend logic
  styles.css            - Styles
```

## API Endpoints

- `POST /api/extract` - Queue a profile scrape job
- `GET /api/job/:jobId` - Check job status
- `POST /api/enrich` - Start MangaUpdates enrichment for a session
- `GET /api/session/:sessionId` - Get session data and enrichment progress
- `POST /api/update` - Update session (reject bad matches)
- `GET /api/download/:sessionId/:format` - Download results (`muTxt` or `plainTxt`)

## License

MIT
