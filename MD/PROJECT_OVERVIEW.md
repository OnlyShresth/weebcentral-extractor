# 🎌 WeebCentral Subscription Extractor

## 📦 What's Inside

A complete, production-ready Node.js application to extract manga/anime subscriptions from WeebCentral and export them to multiple formats.

## ✨ Key Features

✅ **Extract subscriptions** from any WeebCentral profile
✅ **Export to multiple formats**: MAL XML, MangaDex JSON, CSV, TXT
✅ **Modern, cyberpunk-inspired UI** with smooth animations
✅ **Modular architecture** - each function in its own file for easy debugging
✅ **Comprehensive documentation** with guides for setup, usage, and development
✅ **Production-ready** error handling and validation

## 📁 Project Structure

```
weebcentral-extractor/
├── 📄 README.md              # Complete documentation
├── 📄 QUICKSTART.md          # Fast setup guide
├── 📄 DEVELOPMENT.md         # Development & testing guide
├── 📄 package.json           # Dependencies & scripts
├── 📄 .env.example           # Environment configuration
├── 📄 .gitignore            # Git ignore rules
│
├── 📂 src/                   # Backend source code
│   ├── server.js            # Express server & API routes
│   │
│   ├── config/
│   │   └── index.js         # Configuration management
│   │
│   ├── utils/
│   │   ├── scraper.js       # WeebCentral scraping logic
│   │   ├── fileGenerator.js # File generation utilities
│   │   ├── validation.js    # Input validation
│   │   └── errorHandler.js  # Error handling & logging
│   │
│   └── exporters/
│       ├── mal.js           # MyAnimeList export formats
│       └── mangadex.js      # MangaDex export formats
│
└── 📂 public/               # Frontend files
    ├── index.html          # Main UI (cyberpunk-themed)
    ├── styles.css          # Styling with neon aesthetics
    └── app.js              # Client-side JavaScript
```

## 🚀 Quick Start (3 Commands)

```bash
# 1. Navigate to the project
cd weebcentral-extractor

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

Then open: **http://localhost:3000**

## 📖 How to Use

1. **Get a WeebCentral profile URL**
   ```
   https://weebcentral.com/users/uGjE4hTJ9Jf3mdnSLOUObcd4ou53/profiles
   ```

2. **Paste it into the app and click "Extract"**

3. **Download your exports:**
   - 📄 MAL XML (for direct import)
   - 📄 MAL Text (manual entry list)
   - 📄 MangaDex JSON (API format)
   - 📄 MangaDex Text (search list)
   - 📄 CSV (spreadsheet format)
   - 📄 README (with instructions)

## 🎨 Design Highlights

The UI features a distinctive **cyberpunk aesthetic**:
- Custom font pairing (Orbitron + Lexend)
- Neon cyan/magenta/yellow color scheme
- Grain texture overlay
- Smooth animations and transitions
- Glow effects and shadows
- Responsive grid layouts

**No generic AI aesthetics** - every detail is intentionally designed to stand out.

## 🛠️ Technical Stack

- **Backend**: Node.js + Express
- **Scraping**: Axios + Cheerio
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Modern CSS with custom properties
- **Architecture**: Modular ES6 modules

## 📚 Documentation

- **README.md** - Complete project documentation
- **QUICKSTART.md** - Fast setup guide (3 steps)
- **DEVELOPMENT.md** - Development & testing guide

## 🔧 Modular Architecture

Each major function is in its own file for easy debugging:

| File | Purpose |
|------|---------|
| `scraper.js` | Web scraping logic |
| `mal.js` | MyAnimeList export generation |
| `mangadex.js` | MangaDex export generation |
| `fileGenerator.js` | File I/O operations |
| `validation.js` | Input validation |
| `errorHandler.js` | Error handling & logging |
| `server.js` | API routes & server setup |
| `app.js` | Frontend interactions |

## 🎯 Export Formats

### MyAnimeList
- **XML** - Direct import compatible
- **Text** - Numbered list for manual entry

### MangaDex
- **JSON** - API-ready format with metadata
- **Text** - Search-friendly list with URLs

### Universal
- **CSV** - Excel/Google Sheets compatible
- **README** - Instructions and full list

## 🌟 Features

✨ **Smart Scraping** - Extracts all subscriptions from WeebCentral profiles
✨ **Multiple Formats** - 6 different export formats for flexibility
✨ **Beautiful UI** - Modern, responsive design that's a pleasure to use
✨ **Error Handling** - Comprehensive validation and error messages
✨ **Progress Tracking** - Visual feedback during extraction
✨ **Statistics Dashboard** - Overview of extracted data
✨ **One-Click Downloads** - Easy access to all export files

## 🔒 Safety & Validation

- Input validation on all user data
- Sanitization to prevent path traversal
- Error handling for network failures
- Rate limiting ready (configurable)
- Secure file operations

## 📝 Notes

- The scraper selectors may need adjustment if WeebCentral changes their HTML structure
- All exports are tagged with `imported-from-weebcentral`
- Export files are saved to `./exports` directory (auto-created)
- Server runs on port 3000 by default (configurable)

## 🤝 Next Steps

1. Read **QUICKSTART.md** for immediate setup
2. Check **DEVELOPMENT.md** for customization
3. Explore the modular code structure
4. Customize the scraper for your needs

## 💡 Pro Tips

- Use DEBUG=true for detailed logs
- Modify CSS variables for custom styling
- Add new exporters by creating files in `src/exporters/`
- The scraper selector can be adjusted in `scraper.js`

## 🎉 Ready to Use

Everything is set up and ready to go. Just install dependencies and start the server!

---

**Made with 💙 for manga/anime enthusiasts**

Enjoy extracting your subscriptions! 🎌
