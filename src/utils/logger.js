/**
 * Logger Utility
 * Clean, minimal terminal output.
 *
 * User-facing logs use simple markers:
 *   >  action / step in progress
 *   +  success
 *   !  warning
 *   x  error
 *
 * Internal/debug logs are hidden unless DEBUG=true.
 */

const isDebug = () => process.env.DEBUG === 'true';

// ─── Box Drawing ────────────────────────────────────────────

/**
 * Print a boxed banner.
 */
export function banner(title, subtitle = '') {
    const lines = [title];
    if (subtitle) lines.push(subtitle);

    const longest = Math.max(...lines.map(l => l.length));
    const inner = longest + 4; // 2 padding each side

    const center = (str) => {
        const space = inner - str.length;
        const left = Math.floor(space / 2);
        return ' '.repeat(left) + str + ' '.repeat(space - left);
    };

    console.log('');
    console.log(`  ┌${'─'.repeat(inner)}┐`);
    console.log(`  │${' '.repeat(inner)}│`);
    lines.forEach(line => console.log(`  │${center(line)}│`));
    console.log(`  │${' '.repeat(inner)}│`);
    console.log(`  └${'─'.repeat(inner)}┘`);
    console.log('');
}

/**
 * Print a section divider.
 */
export function divider(label = '') {
    if (label) {
        console.log(`\n  ── ${label} ${'─'.repeat(Math.max(2, 44 - label.length))}\n`);
    } else {
        console.log('');
    }
}

// ─── User-Facing Logs ───────────────────────────────────────

const log = {
    /** Action / step in progress */
    step: (msg) => console.log(`  >  ${msg}`),

    /** Success */
    ok: (msg) => console.log(`  +  ${msg}`),

    /** Warning */
    warn: (msg) => console.warn(`  !  ${msg}`),

    /** Error */
    error: (msg) => console.error(`  x  ${msg}`),

    // ─── Internal / Debug Only ──────────────────────────────
    // These only print when DEBUG=true

    /** Detailed internal logging */
    debug: (msg) => { if (isDebug()) console.log(`     [debug] ${msg}`); },

    /** Internal cache operations */
    cache: (msg) => { if (isDebug()) console.log(`     [cache] ${msg}`); },

    /** Internal match details */
    match: (msg) => { if (isDebug()) console.log(`     [match] ${msg}`); },

    /** Internal scrape details */
    scrape: (msg) => { if (isDebug()) console.log(`     [scrape] ${msg}`); },

    /** Internal queue details */
    queue: (msg) => { if (isDebug()) console.log(`     [queue] ${msg}`); },

    /** Internal server details */
    server: (msg) => { if (isDebug()) console.log(`     [server] ${msg}`); },
};

export default log;
