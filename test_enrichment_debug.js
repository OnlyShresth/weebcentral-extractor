
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function calculateSimilarity(a, b) {
    if (!a || !b) return 0;

    const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLength);
}

async function testMatch(title) {
    console.log(`\n--- Testing: "${title}" ---`);
    try {
        const response = await fetch('https://api.mangaupdates.com/v1/series/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search: title, per_page: 5 })
        });

        const data = await response.json();

        if (!data.results) {
            console.log("No results found.");
            return;
        }

        console.log(`API returned ${data.results.length} results:`);

        let bestScore = -1;
        let bestTitle = "";

        data.results.forEach(res => {
            console.log(JSON.stringify(res)); // Log JSON.stringify(result) to see all fields
            const muTitle = res.record.title;
            const hitTitle = res.hit_title; // Check if this exists
            console.log(`Title: "${muTitle}", Hit: "${hitTitle}"`);

            const score = calculateSimilarity(title, muTitle);
            console.log(`[${score.toFixed(4)}] "${muTitle}"`);

            if (score > bestScore) {
                bestScore = score;
                bestTitle = muTitle;
            }
        });

        console.log(`Winner: "${bestTitle}" with score ${bestScore.toFixed(4)}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

async function run() {
    await testMatch("Blue Box");
    await delay(1500);
    await testMatch("How to Grill Our Love");
    await delay(1500);
    await testMatch("In the Clear Moonlit Dusk");
}

run();
