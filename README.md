# WeebCentral Subscription Extractor

Extract your manga subscription list from WeebCentral and export it for MangaUpdates.

---

## How to Use

### 1. Download

Click the green **Code** button on this page, then click **Download ZIP**.

### 2. Extract

Right-click the downloaded `.zip` file and choose **Extract All**. Open the extracted folder.

### 3. Run

Double-click **`start.bat`** to launch the app.

- If Node.js is not installed, the script will open the download page for you. Install it, then run `start.bat` again.
- On first run, dependencies will be installed automatically.
- The app will open in your browser at `http://localhost:6767`.

### 4. Extract Your Subscriptions

1. Go to your WeebCentral profile and make sure it is set to **public**.
2. Copy your profile URL (e.g. `https://weebcentral.com/users/YOUR_ID/profiles`).
3. Paste it into the app and click **Extract**.
4. Once extracted, click **Verify with MangaUpdates** to match your titles.
5. Review any low-confidence matches, then download your export file.

---

## Environment Variables (Optional)

Create a `.env` file in the project folder to customize:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string for persistent caching. |
| `PORT` | Server port (default: `6767`). |
| `DEBUG` | Set to `true` for detailed logs. |

## License

MIT
