/**
 * Centralized Logger Utility
 * Clean, structured console output with timestamps and categories.
 */

const LABELS = {
    INFO: '[INFO]   ',
    OK: '[OK]     ',
    WARN: '[WARN]   ',
    ERROR: '[ERROR]  ',
    DEBUG: '[DEBUG]  ',
    CACHE: '[CACHE]  ',
    MATCH: '[MATCH]  ',
    SCRAPE: '[SCRAPE] ',
    QUEUE: '[QUEUE]  ',
    SERVER: '[SERVER] ',
};

function timestamp() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function fmt(label, message) {
    return `${timestamp()}  ${label} ${message}`;
}

// ─── Box Drawing Helpers ────────────────────────────────────────

/**
 * Print a boxed banner with optional subtitle lines.
 * @param {string} title - Main title
 * @param {string[]} [lines] - Extra lines beneath the title
 * @param {number} [width] - Box width (default 56)
 */
export function banner(title, lines = [], width = 56) {
    const pad = (str, w) => {
        const padding = w - str.length;
        const left = Math.floor(padding / 2);
        const right = padding - left;
        return ' '.repeat(left) + str + ' '.repeat(right);
    };
    const inner = width - 2;

    console.log('');
    console.log(`+${'-'.repeat(inner)}+`);
    console.log(`|${pad(title, inner)}|`);
    if (lines.length > 0) {
        console.log(`|${' '.repeat(inner)}|`);
        for (const line of lines) {
            console.log(`|${pad(line, inner)}|`);
        }
    }
    console.log(`+${'-'.repeat(inner)}+`);
    console.log('');
}

/**
 * Print a labelled divider line.
 * @param {string} [label] - Optional label
 * @param {number} [width] - Total width (default 56)
 */
export function divider(label = '', width = 56) {
    if (!label) {
        console.log('-'.repeat(width));
        return;
    }
    const side = Math.max(2, Math.floor((width - label.length - 2) / 2));
    console.log(`${'-'.repeat(side)} ${label} ${'-'.repeat(width - side - label.length - 2)}`);
}

/**
 * Print key-value pairs in a clean aligned table.
 * @param {Record<string, string>} data
 */
export function table(data) {
    const maxKey = Math.max(...Object.keys(data).map(k => k.length));
    for (const [key, value] of Object.entries(data)) {
        console.log(`  ${key.padEnd(maxKey)}  :  ${value}`);
    }
}

// ─── Standard Logging ───────────────────────────────────────────

const log = {
    info: (msg, ...args) => console.log(fmt(LABELS.INFO, msg), ...args),
    ok: (msg, ...args) => console.log(fmt(LABELS.OK, msg), ...args),
    warn: (msg, ...args) => console.warn(fmt(LABELS.WARN, msg), ...args),
    error: (msg, ...args) => console.error(fmt(LABELS.ERROR, msg), ...args),
    debug: (msg, ...args) => {
        if (process.env.DEBUG === 'true') {
            console.log(fmt(LABELS.DEBUG, msg), ...args);
        }
    },

    // Category-specific helpers
    cache: (msg, ...args) => console.log(fmt(LABELS.CACHE, msg), ...args),
    match: (msg, ...args) => console.log(fmt(LABELS.MATCH, msg), ...args),
    scrape: (msg, ...args) => console.log(fmt(LABELS.SCRAPE, msg), ...args),
    queue: (msg, ...args) => console.log(fmt(LABELS.QUEUE, msg), ...args),
    server: (msg, ...args) => console.log(fmt(LABELS.SERVER, msg), ...args),
};

export default log;
