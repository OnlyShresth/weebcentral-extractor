import { scrapeSubscriptions } from './utils/scraper.js';
import log from './utils/logger.js';

/**
 * Lightweight in-memory job queue.
 * Mimics a minimal subset of the BullMQ API (.add, .getJob)
 * so the server can queue scrapes and poll for completion.
 */
class JobQueue {
    constructor() {
        this.jobs = new Map();
        this.idCounter = 1;
        this.processor = null;
    }

    /**
     * Register the processing function for this queue.
     */
    process(fn) {
        this.processor = fn;
    }

    /**
     * Add a job. Processing starts immediately in the background.
     */
    async add(name, data) {
        const id = String(this.idCounter++);
        const job = {
            id,
            data,
            returnvalue: null,
            failedReason: null,
            _state: 'waiting',
            getState: async function () { return this._state; }
        };
        this.jobs.set(id, job);

        // Process asynchronously (don't block the caller)
        this._run(job);

        return job;
    }

    /**
     * Retrieve a job by ID.
     */
    async getJob(id) {
        return this.jobs.get(String(id)) || null;
    }

    /**
     * @private Execute the processor for a single job.
     */
    async _run(job) {
        if (!this.processor) return;
        job._state = 'active';
        try {
            job.returnvalue = await this.processor(job);
            job._state = 'completed';
            log.ok(`Job ${job.id} completed`);
        } catch (err) {
            job.failedReason = err.message;
            job._state = 'failed';
            log.error(`Job ${job.id} failed: ${err.message}`);
        }
    }
}

// ─── Create and export the queue ────────────────────────────────

const scrapeQueue = new JobQueue();

/**
 * Initialize the worker by attaching the scrape processor.
 * @param {object} browser - Shared Puppeteer browser instance
 */
export function initWorker(browser) {
    scrapeQueue.process(async (job) => {
        const { profileUrl } = job.data;
        log.queue(`Job ${job.id}: Scraping ${profileUrl}`);
        return await scrapeSubscriptions(profileUrl, browser);
    });
    log.queue('Scrape worker initialized');
    return scrapeQueue;
}

export { scrapeQueue };
