
import fs from 'fs';

async function debugSearch(title) {
    console.log(`\n--- Searching: "${title}" ---`);
    try {
        const response = await fetch('https://api.mangaupdates.com/v1/series/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search: title, per_page: 5 })
        });

        const data = await response.json();
        fs.writeFileSync('debug_output.json', JSON.stringify(data, null, 2));
        console.log("Wrote response to debug_output.json");

    } catch (e) {
        console.error("Error:", e);
    }
}

debugSearch("Blue Box");
