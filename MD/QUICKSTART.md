# 🚀 Quick Start Guide

## Installation (3 Steps)

1. **Install Node.js dependencies**
   ```bash
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

## Usage (3 Steps)

1. **Get your WeebCentral profile URL**
   - Format: `https://weebcentral.com/users/YOUR_USER_ID/profiles`
   - Example: `https://weebcentral.com/users/uGjE4hTJ9Jf3mdnSLOUObcd4ou53/profiles`

2. **Paste URL and click "Extract"**
   - Wait for processing (usually 5-15 seconds)

3. **Download your exports**
   - MAL XML for direct import
   - CSV for spreadsheets
   - Text lists for manual entry

## What You Get

✅ **6 Different Export Files**
- MyAnimeList XML (for import)
- MyAnimeList Text (for manual entry)
- MangaDex JSON (API format)
- MangaDex Text (search list)
- CSV (spreadsheet compatible)
- README (with full list and instructions)

## Importing to MyAnimeList

1. Download the `*_mal.xml` file
2. Go to: https://myanimelist.net/panel.php?go=export
3. Upload the XML file
4. Done! ✨

## Importing to MangaDex

1. Download the `*_mangadex.txt` file
2. Search each title on MangaDex manually
3. Add to your library

## Troubleshooting

**Port already in use?**
```bash
# Change port in .env file or:
PORT=3001 npm start
```

**No subscriptions found?**
- Verify the profile URL is correct
- Check if the profile is public
- The profile must have subscriptions visible

**Dependencies won't install?**
- Make sure you have Node.js 18+ installed
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` and try again

## Need Help?

- Check the full README.md
- Review the code comments
- Each file is documented with its purpose

---

**Happy extracting!** 🎌
