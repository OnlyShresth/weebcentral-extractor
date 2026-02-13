# 🧪 Development & Testing Guide

## Project Architecture

### Directory Structure
```
src/
├── server.js                 # Main Express server
├── config/
│   └── index.js             # Configuration management
├── utils/
│   ├── scraper.js           # Web scraping logic
│   ├── fileGenerator.js     # File generation
│   ├── validation.js        # Input validation
│   └── errorHandler.js      # Error handling
└── exporters/
    ├── mal.js               # MyAnimeList exporters
    └── mangadex.js          # MangaDex exporters

public/
├── index.html               # Frontend UI
├── styles.css               # Styling
└── app.js                   # Client JavaScript
```

## File Responsibilities

### Backend Files

**server.js**
- Express server setup
- API route definitions
- Middleware configuration
- Server initialization

**scraper.js**
- Fetches WeebCentral profile pages
- Parses HTML to extract subscriptions
- Handles HTTP requests and errors

**fileGenerator.js**
- Orchestrates all export file generation
- Manages file I/O operations
- Creates the exports directory

**mal.js**
- Generates MAL XML format
- Creates MAL text list format
- Handles XML escaping

**mangadex.js**
- Generates MangaDex JSON format
- Creates MangaDex text list format
- Handles CSV generation

**validation.js**
- Validates user input
- Sanitizes data
- Checks file types

**errorHandler.js**
- Custom error classes
- Error middleware
- Logging utilities

### Frontend Files

**index.html**
- Main UI structure
- Form elements
- Results display sections

**styles.css**
- Cyberpunk aesthetic styling
- Responsive design
- Animations and transitions

**app.js**
- Form submission handling
- API communication
- UI state management
- Download functionality

## Testing Locally

### Manual Testing Flow

1. **Start the server**
   ```bash
   npm start
   ```

2. **Test with a valid URL**
   ```
   https://weebcentral.com/users/uGjE4hTJ9Jf3mdnSLOUObcd4ou53/profiles
   ```

3. **Check console output**
   - Look for extraction progress
   - Verify file generation

4. **Verify exports directory**
   ```bash
   ls -la exports/
   ```

5. **Test downloads**
   - Click each download button
   - Verify file contents

### API Testing with cURL

**Extract subscriptions:**
```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"profileUrl": "https://weebcentral.com/users/USER_ID/profiles"}'
```

**Health check:**
```bash
curl http://localhost:3000/api/health
```

### Testing Edge Cases

**Invalid URL:**
```javascript
// Should return 400 error
{
  "profileUrl": "https://invalid-site.com"
}
```

**Missing URL:**
```javascript
// Should return 400 error
{
  "profileUrl": ""
}
```

**Non-existent profile:**
```javascript
// Should return 500 error
{
  "profileUrl": "https://weebcentral.com/users/nonexistent/profiles"
}
```

## Debugging Tips

### Enable Debug Mode
```bash
DEBUG=true npm start
```

### Check Logs
- Server logs appear in console
- Each operation has emoji indicators:
  - 🚀 = Starting operation
  - ✅ = Success
  - ❌ = Error
  - 📡 = Network request
  - 📁 = File operation

### Common Issues

**Port in use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

**Dependencies not installing:**
```bash
# Clear cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Scraping not working:**
- Check if WeebCentral changed their HTML structure
- Update selectors in `src/utils/scraper.js`
- Verify URL format is correct

**Files not generating:**
- Check permissions on exports directory
- Verify disk space
- Check error logs

## Modifying the Scraper

The scraper uses Cheerio (jQuery-like syntax) to parse HTML:

```javascript
// Current implementation in scraper.js
$('.subscription-item, .manga-item, .anime-item').each((index, element) => {
    const $el = $(element);
    const title = $el.find('.title, h3, .manga-title').text().trim();
    // ...
});
```

**To update selectors:**
1. Open WeebCentral profile in browser
2. Right-click → Inspect Element
3. Find the subscription elements
4. Note their CSS classes/IDs
5. Update selectors in scraper.js

## Adding New Features

### Add New Export Format

1. **Create exporter file:**
   ```bash
   touch src/exporters/newplatform.js
   ```

2. **Implement export function:**
   ```javascript
   export function exportToNewPlatform(subscriptions) {
       // Your logic
       return formattedData;
   }
   ```

3. **Update fileGenerator.js:**
   ```javascript
   import { exportToNewPlatform } from '../exporters/newplatform.js';
   
   files.newPlatform = await saveToFile(
       `${baseFilename}_newplatform.ext`,
       exportToNewPlatform(subscriptions)
   );
   ```

4. **Update frontend:**
   - Add download button in index.html
   - Add handler in app.js

### Add New API Endpoint

1. **Add route in server.js:**
   ```javascript
   app.get('/api/stats', (req, res) => {
       // Your logic
   });
   ```

2. **Add frontend function:**
   ```javascript
   async function fetchStats() {
       const response = await fetch('/api/stats');
       const data = await response.json();
       // Handle data
   }
   ```

## Performance Optimization

### Current Performance
- Scraping: ~5-10 seconds
- File generation: ~1-2 seconds
- Total: ~10-15 seconds for 100 subscriptions

### Optimization Opportunities
1. **Caching** - Cache scraped profiles
2. **Parallel processing** - Generate files concurrently
3. **Compression** - Compress large exports
4. **Pagination** - Handle very large profiles

## Code Style

- Use ES6+ features (import/export, async/await)
- Descriptive variable names
- JSDoc comments for functions
- Consistent error handling
- Emoji in logs for clarity

## Contributing

When adding new code:
1. Follow existing file structure
2. Add JSDoc comments
3. Update README if needed
4. Test thoroughly
5. Keep functions focused and modular

---

**Happy coding!** 💻
