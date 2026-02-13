# 🔧 Troubleshooting Guide for WeebCentral Scraping

## Issue: "Found 0 subscriptions"

If the scraper returns 0 subscriptions, here's how to fix it:

### Step 1: Understand the Page Structure

WeebCentral uses JavaScript tabs - the subscriptions are on the same page but hidden until you click the "Subscriptions" tab. The scraper needs to:
1. Load the page with a headless browser (Puppeteer)
2. Click the "Subscriptions (95)" tab
3. Wait for content to load
4. Extract the manga cover images and titles

### Step 2: Debug the Scraper

The scraper will create a `debug-screenshot.png` file if it can't find the Subscriptions tab. Check this image to see what the page actually looks like.

### Step 3: Inspect the Actual HTML

1. **Open the WeebCentral profile in your browser**
2. **Click on "Subscriptions (95)"** tab
3. **Right-click on a manga cover** → Inspect Element
4. **Look for:**
   - What HTML tag contains the manga? (`<div>`, `<a>`, etc.)
   - What classes does it have? (`class="..."`)
   - Where is the title stored? (img alt, separate div, etc.)
   - Where is the image URL? (img src, data-src, etc.)

### Step 4: Update the Scraper Selectors

Based on what you find, update `src/utils/scraper.js`:

```javascript
// Example: If manga items are in <div class="manga-card">
const items = document.querySelectorAll('.manga-card');

items.forEach(item => {
  const title = item.querySelector('.title').textContent;
  const img = item.querySelector('img');
  const imageUrl = img.src;
  const link = item.querySelector('a').href;
  
  subscriptions.push({ title, imageUrl, link, source: 'WeebCentral' });
});
```

### Step 5: Common HTML Patterns

Here are common patterns for manga listing sites:

**Pattern 1: Image with alt text**
```html
<a href="/manga/123">
  <img src="cover.jpg" alt="Manga Title">
</a>
```

**Pattern 2: Separate title element**
```html
<div class="manga-item">
  <a href="/manga/123">
    <img src="cover.jpg">
  </a>
  <h3 class="title">Manga Title</h3>
</div>
```

**Pattern 3: Grid layout**
```html
<div class="grid">
  <div class="item">
    <a href="/manga/123">
      <img src="cover.jpg" alt="Manga Title">
    </a>
  </div>
</div>
```

### Step 6: Update Tab Click Logic

If the Subscriptions tab has a specific class or ID:

```javascript
// Find the exact button
const subscriptionTab = document.querySelector('button.subscriptions-tab');
// or
const subscriptionTab = document.querySelector('[data-tab="subscriptions"]');
// or
const subscriptionTab = document.getElementById('subscriptions-tab');

if (subscriptionTab) {
  subscriptionTab.click();
}
```

### Step 7: Test Incrementally

1. **Test tab clicking:**
   ```javascript
   console.log('All buttons:', document.querySelectorAll('button'));
   ```

2. **Test image finding:**
   ```javascript
   console.log('All images:', document.querySelectorAll('img'));
   ```

3. **Test after tab click:**
   ```javascript
   // Click tab
   subscriptionTab.click();
   // Wait
   await new Promise(r => setTimeout(r, 3000));
   // Check images again
   console.log('Images after click:', document.querySelectorAll('img'));
   ```

## Quick Fix Template

Here's a quick template you can adapt in `scraper.js`:

```javascript
// After clicking tab and waiting...

const subscriptions = await page.evaluate(() => {
  const results = [];
  
  // TODO: Replace 'YOUR_SELECTOR' with actual selector
  const items = document.querySelectorAll('YOUR_SELECTOR');
  
  items.forEach(item => {
    // TODO: Adjust these selectors based on actual HTML
    const img = item.querySelector('img');
    const link = item.querySelector('a');
    
    const title = img?.alt || 'Unknown';
    const imageUrl = img?.src;
    const href = link?.href;
    
    if (title && imageUrl) {
      results.push({
        title,
        imageUrl, 
        link: href,
        source: 'WeebCentral'
      });
    }
  });
  
  return results;
});
```

## Advanced Debugging

### Enable Puppeteer Debug Mode

In `scraper.js`, change the launch options:

```javascript
browser = await puppeteer.launch({
  headless: false,  // Show browser window
  devtools: true,   // Open DevTools
  slowMo: 100,      // Slow down actions
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

This will show you exactly what the browser sees!

### Log Page Content

Add this before extraction:

```javascript
const content = await page.content();
console.log('Page HTML:', content);
```

### Take Screenshots

```javascript
await page.screenshot({ path: 'before-click.png' });
// Click tab
await page.screenshot({ path: 'after-click.png' });
```

## Still Not Working?

If you're still having issues:

1. **Share the debug screenshot** - Run the scraper and share `debug-screenshot.png`
2. **Share the HTML** - Right-click → View Page Source on the Subscriptions tab
3. **Check for authentication** - Does the profile require login?
4. **Check for rate limiting** - Is WeebCentral blocking automated requests?

## Alternative: Manual Export

If automated scraping doesn't work, you can manually create a list:

1. Open the Subscriptions tab
2. Right-click → Inspect
3. Run this in browser console:
```javascript
const titles = Array.from(document.querySelectorAll('img'))
  .map(img => img.alt)
  .filter(Boolean);
console.log(JSON.stringify(titles, null, 2));
```

4. Copy the output and save as `subscriptions.json`
5. Use the app's exporters to convert to MAL/MangaDex formats

---

**Need more help?** Include screenshots of the browser DevTools showing the HTML structure!
