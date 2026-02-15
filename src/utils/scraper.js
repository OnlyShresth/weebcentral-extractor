// Puppeteer import removed, passed from server
import log from './logger.js';

/**
 * Scrapes subscription data from a WeebCentral profile
 * Uses Puppeteer to handle dynamic content, tab switching, and pagination
 * @param {string} profileUrl - The WeebCentral profile URL
 * @param {object} browser - Shared Puppeteer browser instance
 * @returns {Promise<Array>} Array of subscription objects
 */
export async function scrapeSubscriptions(profileUrl, browser) {
  let page;

  try {
    log.scrape(`Starting scrape for: ${profileUrl}`);

    // Create new page from shared browser
    page = await browser.newPage();

    // Optimize: Block images, fonts, styles to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    log.scrape('Navigating to profile...');
    try {
      // Optimized wait condition: domcontentloaded is faster than networkidle2
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (error) {
      log.warn('Page load issue, retrying...');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    // Wait for initial load
    await page.waitForTimeout(1000);

    log.scrape('Looking for Subscriptions tab...');

    // Click the Subscriptions tab
    const subscriptionsTabClicked = await page.evaluate(() => {
      // Find all buttons
      const buttons = Array.from(document.querySelectorAll('button'));

      // Look for button with exact text "Subscriptions (95)" or similar
      const subscriptionTab = buttons.find(btn => {
        const text = (btn.textContent || '').trim();
        return text.startsWith('Subscriptions') && text.includes('(');
      });

      if (subscriptionTab) {
        subscriptionTab.click();
        return true;
      }

      return false;
    });

    if (!subscriptionsTabClicked) {
      log.scrape('First attempt failed, trying alternative selector...');

      // Alternative: try clicking by looking for any element with "Subscriptions ("
      await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const subElement = allElements.find(el => {
          const text = (el.textContent || '').trim();
          return text.startsWith('Subscriptions (') && el.offsetParent !== null;
        });

        if (subElement) {
          subElement.click();
        }
      });

      await page.waitForTimeout(2000);
    }



    if (subscriptionsTabClicked) {
      log.scrape('Clicked Subscriptions tab, waiting for content...');
      await page.waitForTimeout(3000);
    } else {
      log.warn('Could not find Subscriptions tab');
    }

    // Click "View More" button repeatedly to load all subscriptions
    log.scrape('Loading all subscriptions via pagination...');
    let hasMore = true;
    let clicks = 0;
    const maxClicks = 100;

    // Helper to count potential subscription items (images with 'cover' in alt)
    const countItems = () => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => (img.alt || '').toLowerCase().includes('cover')).length;
    };

    let previousItemCount = await page.evaluate(countItems);

    while (hasMore && clicks < maxClicks) {
      hasMore = await page.evaluate(async () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const viewMoreButton = buttons.find(btn => {
          const text = (btn.textContent || '').trim();
          return text === 'View More' && !btn.disabled && btn.offsetParent !== null;
        });

        if (viewMoreButton) {
          viewMoreButton.click();
          return true;
        }
        return false;
      });

      if (hasMore) {
        clicks++;
        if (clicks % 5 === 0) log.scrape(`Pagination progress: ${clicks} pages loaded`);

        // Wait for new items to appear
        try {
          await page.waitForFunction((prevCount) => {
            const images = Array.from(document.querySelectorAll('img'));
            const currentCount = images.filter(img => (img.alt || '').toLowerCase().includes('cover')).length;
            return currentCount > prevCount;
          }, { timeout: 10000, polling: 500 }, previousItemCount);

          // Update count
          previousItemCount = await page.evaluate(countItems);

        } catch (e) {
          log.warn(`Timeout after click ${clicks}. Possible end of list.`);
          const isButtonStillThere = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return !!buttons.find(btn => (btn.textContent || '').trim() === 'View More');
          });

          if (isButtonStillThere) {
            log.warn('View More button persists but no new items loaded. Stopping.');
            hasMore = false;
          }
        }
      }
    }

    log.scrape(`Pagination complete. ${clicks} pages loaded.`);

    // Wait for final render
    await page.waitForTimeout(1000);

    // Verify we have content
    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll('img').length;
    });
    log.scrape(`Total images found on page: ${itemCount}`);

    log.scrape('Extracting subscription data...');

    // Extract all subscriptions from the page
    const subscriptions = await page.evaluate(() => {
      const results = [];
      const foundTitles = new Set();

      // Get all images
      const images = Array.from(document.querySelectorAll('img'));

      images.forEach(img => {
        const alt = img.alt || '';

        // Skip logos, avatars, and non-manga images
        if (!alt ||
          alt.includes('Logo') ||
          alt.includes('avatar') ||
          !alt.toLowerCase().includes('cover')) {
          return;
        }

        // Remove " cover" suffix
        const cleanTitle = alt.replace(/\s+cover$/i, '').trim();

        // Skip if already found or empty
        if (foundTitles.has(cleanTitle.toLowerCase()) || !cleanTitle) {
          return;
        }

        foundTitles.add(cleanTitle.toLowerCase());

        // Get image URL
        const imageUrl = img.src || img.dataset.src || img.getAttribute('data-src');

        // Try to find link
        let link = null;
        const linkEl = img.closest('a');
        if (linkEl && linkEl.href) {
          link = linkEl.href;
        }

        results.push({
          title: cleanTitle,
          imageUrl: imageUrl,
          link: link,
          source: 'WeebCentral'
        });
      });

      return results;
    });

    log.ok(`Found ${subscriptions.length} subscriptions`);

    await page.close();
    return subscriptions;

  } catch (error) {
    if (page) await page.close();
    log.error(`Scrape failed: ${error.message}`);
    throw new Error(`Failed to scrape profile: ${error.message}`);
  }
}

/**
 * Extract user ID from WeebCentral profile URL
 * @param {string} url - The profile URL
 * @returns {string} User ID
 */
export function extractUserId(url) {
  const match = url.match(/users\/([^\/]+)/);
  return match ? match[1] : null;
}
