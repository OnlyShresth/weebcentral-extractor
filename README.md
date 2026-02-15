# WeebCentral Subscription Extractor

A web tool that scrapes manga subscription lists from WeebCentral profiles and enriches them with metadata from MangaUpdates.

## Features

- Extracts subscriptions from any public WeebCentral profile URL
- Matches titles against MangaUpdates using fuzzy and exact search
- Caches results in MongoDB (falls back to local JSON file)
- Exports to MangaUpdates link list or plain text
- Job queue system with Redis support (optional, defaults to in-memory)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file:
   ```
   MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<database>
   ```

3. Start the server:
   ```
   npm start
   ```

   The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | No | MongoDB connection string. If not set, uses a local JSON file for caching. |
| `USE_REDIS` | No | Set to `true` to use Redis/BullMQ for the job queue. Defaults to in-memory. |
| `REDIS_URL` | No | Redis connection URL. Defaults to `redis://127.0.0.1:6379`. |
| `PORT` | No | Server port. Defaults to `3000`. |

## Project Structure

```
src/
  server.js          - Express server and API routes
  queue.js           - Job queue (BullMQ or in-memory fallback)
  utils/
    scraper.js       - WeebCentral profile scraper (Puppeteer)
    enricher.js      - MangaUpdates title matching and enrichment
    cache.js         - MongoDB / local file cache layer
  exporters/
    mangaupdates.js  - Export formatters
public/
  index.html         - Web UI
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
