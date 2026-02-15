import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { scrapeSubscriptions } from './utils/scraper.js';

// Redis Connection
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Check if Redis is available (simple heuristic or env var)
const USE_REDIS = process.env.USE_REDIS === 'true'; // Default to false unless explicitly enabled to avoid errors

console.log(`ℹ️ Redis Queue is ${USE_REDIS ? 'ENABLED' : 'DISABLED (Using In-Memory Fallback)'}`);

let scrapeQueue;
let worker;

/* 
 * MOCK QUEUE IMPLEMENTATION (In-Memory)
 * Mimics BullMQ API for 'add' and 'getJob'
 */
class MockQueue {
    constructor() {
        this.jobs = new Map();
        this.idCounter = 1;
        this.processor = null;
    }

    async add(name, data) {
        const id = this.idCounter++;
        const job = {
            id: String(id),
            data,
            returnvalue: null,
            failedReason: null,
            state: 'waiting', // waiting, active, completed, failed
            timestamp: Date.now(),
            getState: async () => job.state
        };
        this.jobs.set(job.id, job);

        // Trigger processing immediately (next tick)
        this.processJob(job);

        return job;
    }

    async getJob(id) {
        return this.jobs.get(String(id));
    }

    async processJob(job) {
        if (!this.processor) return;

        job.state = 'active';
        try {
            const result = await this.processor(job);
            job.returnvalue = result;
            job.state = 'completed';
        } catch (err) {
            console.error(`Job ${job.id} failed:`, err);
            job.failedReason = err.message;
            job.state = 'failed';
        }
    }

    // Mimic Worker initialization
    process(callback) {
        this.processor = callback;
    }
}


if (USE_REDIS) {
    // --- REAL REDIS IMPLEMENTATION ---
    const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
    scrapeQueue = new Queue('weebcentral-scrape', { connection });
} else {
    // --- IN-MEMORY IMPLEMENTATION ---
    scrapeQueue = new MockQueue();
}


// Worker Setup
export function initWorker(browser) {
    const processor = async job => {
        const { profileUrl } = job.data;
        console.log(`Job ${job.id}: Scraping ${profileUrl}`);
        const result = await scrapeSubscriptions(profileUrl, browser);
        return result;
    };

    if (USE_REDIS) {
        // Real BullMQ Worker
        const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
        worker = new Worker('weebcentral-scrape', processor, { connection, concurrency: 2 });

        worker.on('completed', job => {
            console.log(`Job ${job.id} completed!`);
        });
        worker.on('failed', (job, err) => {
            console.error(`Job ${job.id} failed:`, err);
        });
    } else {
        // Mock Worker (Just attaches processor to queue)
        scrapeQueue.process(processor);
        console.log('👷 In-Memory Scrape Worker initialized');
        return scrapeQueue;
    }

    console.log('👷 Redis Scrape Worker initialized');
    return worker;
}

export { scrapeQueue };
