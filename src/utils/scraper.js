import puppeteer from 'puppeteer';

/**
 * Scrapes subscription data from a WeebCentral profile
 * Uses Puppeteer to handle dynamic content, tab switching, and pagination
 * @param {string} profileUrl - The WeebCentral profile URL
 * @returns {Promise<Array>} Array of subscription objects
 */
export async function scrapeSubscriptions(profileUrl) {
  let browser;

  try {
    console.log(`Launching browser for: ${profileUrl}`);

    browser = await puppeteer.launch({
      headless: "new",
      devtools: false,
      slowMo: 0,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

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

    console.log(`Navigating to profile...`);
    try {
      // Optimized wait condition: domcontentloaded is faster than networkidle2
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (error) {
      console.log(`Page load issue, retrying...`);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    // Wait for initial load
    await page.waitForTimeout(1000);

    console.log(`Looking for Subscriptions tab...`);

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
        console.log('Found subscription button:', subscriptionTab.textContent);
        subscriptionTab.click();
        return true;
      }

      console.log('Could not find subscription button');
      console.log('Available buttons:', buttons.map(b => b.textContent?.trim()));
      return false;
    });

    if (!subscriptionsTabClicked) {
      console.log(`First attempt failed, trying alternative selector...`);

      // Alternative: try clicking by looking for any element with "Subscriptions ("
      await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const subElement = allElements.find(el => {
          const text = (el.textContent || '').trim();
          return text === 'Subscriptions (95)' || (text.startsWith('Subscriptions (') && el.offsetParent !== null);
        });

        if (subElement) {
          console.log('Found via alternative method:', subElement.textContent);
          subElement.click();
        }
      });

      await page.waitForTimeout(2000);
    }



    if (subscriptionsTabClicked) {
      console.log(`Clicked Subscriptions tab, waiting for content...`);
      await page.waitForTimeout(3000);
    } else {
      console.log(`Could not find Subscriptions tab`);
    }

    // Click "View More" button repeatedly to load all subscriptions
    console.log(`Loading all subscriptions via pagination...`);
    let clickedViewMore = true;
    let clicks = 0;
    const maxClicks = 50; // Safety limit

    while (clickedViewMore && clicks < maxClicks) {
      clickedViewMore = await page.evaluate(() => {
        // Find button with exact "View More" text
        const buttons = Array.from(document.querySelectorAll('button'));
        const viewMoreButton = buttons.find(btn => {
          const text = (btn.textContent || '').trim();
          return text === 'View More';
        });

        if (viewMoreButton && viewMoreButton.offsetParent !== null && !viewMoreButton.disabled) {
          viewMoreButton.click();
          return true;
        }
        return false;
      });

      if (clickedViewMore) {
        clicks++;
        console.log(`Clicked View More (${clicks})...`);
        await page.waitForTimeout(800); // Reduced from 2000ms for speed
      }
    }

    console.log(`Clicked View More ${clicks} times total`);

    // Verify we have content
    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll('img').length;
    });
    console.log(`Total images on page: ${itemCount}`);


    console.log(`Finished pagination. Extracting subscription data...`);

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

    console.log(`Found ${subscriptions.length} subscriptions`);

    await browser.close();
    return subscriptions;

  } catch (error) {
    if (browser) await browser.close();
    console.error('Error scraping profile:', error.message);
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
