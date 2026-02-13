# 🎌 WeebCentral Subscription Extractor

A modern, sleek Node.js application to extract your manga/anime subscriptions from WeebCentral and export them to MyAnimeList (MAL) and MangaDex.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- 🔍 **Extract Subscriptions** - Scrape all manga/anime subscriptions from any WeebCentral profile
- 📦 **Multiple Export Formats** - Generate MAL XML, MangaDex JSON, CSV, and text formats
- 🎨 **Modern UI** - Cyberpunk-inspired, sleek interface with smooth animations
- 📊 **Statistics Dashboard** - Visual overview of extracted subscriptions
- 🚀 **Fast & Efficient** - Modular architecture for easy debugging and maintenance

## 🏗️ Project Structure

```
weebcentral-extractor/
├── src/
│   ├── server.js              # Express server & API routes
│   ├── utils/
│   │   ├── scraper.js         # WeebCentral scraping logic
│   │   └── fileGenerator.js   # File generation utilities
│   └── exporters/
│       ├── mal.js             # MyAnimeList export formats
│       └── mangadex.js        # MangaDex export formats
├── public/
│   ├── index.html             # Main UI
│   ├── styles.css             # Cyberpunk-themed styling
│   └── app.js                 # Client-side JavaScript
├── exports/                   # Generated export files (auto-created)
├── package.json
└── README.md
```

## 🚀 Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup Steps

1. **Clone or download this repository**

2. **Navigate to the project directory**
   ```bash
   cd weebcentral-extractor
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 Usage

### Web Interface

1. **Enter Profile URL**
   - Paste any WeebCentral profile URL (e.g., `https://weebcentral.com/users/uGjE4hTJ9Jf3mdnSLOUObcd4ou53/profiles`)

2. **Click Extract**
   - The app will scrape the profile and extract all subscriptions

3. **Download Exports**
   - Choose from multiple export formats:
     - **MAL XML** - Direct import to MyAnimeList
     - **MAL Text** - Manual copy-paste list
     - **MangaDex JSON** - API-ready format
     - **MangaDex Text** - Search reference list
     - **CSV** - Universal spreadsheet format
     - **README** - Instructions and full list

### API Endpoints

#### Extract Subscriptions
```http
POST /api/extract
Content-Type: application/json

{
  "profileUrl": "https://weebcentral.com/users/USER_ID/profiles"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptions": [...],
  "files": {
    "malXml": "./exports/weebcentral_USER_ID_DATE_mal.xml",
    "malText": "./exports/weebcentral_USER_ID_DATE_mal.txt",
    "mangaDexJson": "./exports/weebcentral_USER_ID_DATE_mangadex.json",
    "mangaDexText": "./exports/weebcentral_USER_ID_DATE_mangadex.txt",
    "csv": "./exports/weebcentral_USER_ID_DATE_list.csv",
    "summary": "./exports/weebcentral_USER_ID_DATE_README.txt"
  },
  "count": 42
}
```

#### Health Check
```http
GET /api/health
```

## 📁 Export Formats

### MyAnimeList (MAL)

**XML Format** (`*_mal.xml`)
- Direct import compatible with MAL
- Use at: https://myanimelist.net/panel.php?go=export

**Text Format** (`*_mal.txt`)
- Simple numbered list
- For manual entry

### MangaDex

**JSON Format** (`*_mangadex.json`)
```json
{
  "version": "1.0",
  "exportDate": "2026-02-13T...",
  "source": "WeebCentral",
  "totalItems": 42,
  "manga": [...]
}
```

**Text Format** (`*_mangadex.txt`)
- Search-friendly list
- Includes original URLs

### Universal

**CSV Format** (`*_list.csv`)
- Compatible with Excel, Google Sheets
- Columns: Title, Status, Tags, Source URL, Image URL

**README** (`*_README.txt`)
- Complete guide
- Full subscription list
- Usage instructions

## 🎨 Design Philosophy

The UI features a **cyberpunk-inspired aesthetic** with:
- Custom font pairing (Orbitron + Lexend)
- Cyan/Magenta/Yellow color scheme
- Smooth animations and transitions
- Responsive grid layouts
- Grain texture overlay
- Neon glow effects

## 🛠️ Development

### File Organization

Each major function is in its own file for easy debugging:

- **scraper.js** - Web scraping logic
- **mal.js** - MAL export generation
- **mangadex.js** - MangaDex export generation
- **fileGenerator.js** - File I/O operations
- **server.js** - API routes and server
- **app.js** - Client-side interactions

### Run in Development Mode

```bash
npm run dev
```

Uses Node's `--watch` flag for auto-reload on file changes.

## 🔧 Customization

### Modify Scraping Logic

Edit `src/utils/scraper.js`:
```javascript
// Adjust selectors based on WeebCentral's HTML structure
$('.subscription-item, .manga-item, .anime-item').each((index, element) => {
  // Your logic here
});
```

### Add New Export Formats

Create a new file in `src/exporters/`:
```javascript
export function exportToNewPlatform(subscriptions) {
  // Generate your format
  return formattedData;
}
```

Update `fileGenerator.js` to include the new format.

### Customize Styling

Edit `public/styles.css` - all design tokens are in CSS variables:
```css
:root {
    --primary-cyan: #00f3ff;
    --primary-magenta: #ff006e;
    --primary-yellow: #ffbe0b;
    /* ... */
}
```

## 📝 Notes

- The scraper selectors may need adjustment based on WeebCentral's current HTML structure
- Network restrictions may prevent package installation in some environments
- Export files are saved to `./exports` directory (auto-created)
- All subscriptions are tagged with `imported-from-weebcentral`

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

Built with:
- Express.js - Web server
- Cheerio - HTML parsing
- Axios - HTTP client
- Modern CSS - Cyberpunk aesthetics

---

Made with 💙 for manga/anime enthusiasts

**Happy extracting!** 🎌
