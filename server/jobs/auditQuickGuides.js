// One-shot audit: which quests have a /Quick guide subpage on the wiki?
// Reads quest titles from client/src/data/quests/questData.js (regex), then
// batches 50 titles per wiki API call (action=query&titles=...) and checks
// the `missing` flag in the response.
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const QUEST_DATA_PATH = path.resolve(__dirname, '..', '..', 'client', 'src', 'data', 'quests', 'questData.js');
const BATCH_SIZE = 50;

const http = axios.create({
    baseURL: 'https://runescape.wiki',
    headers: {
        'User-Agent': 'RS3-Efficiency-Hub-Audit/0.1 (https://rs3-efficiency-hub.onrender.com)',
        'Accept': 'application/json',
    },
    timeout: 30000,
});

function extractTitles() {
    const src = fs.readFileSync(QUEST_DATA_PATH, 'utf8');
    // Match `"title": "..."` lines, capturing the value
    const titles = [];
    const re = /"title":\s*"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        const title = m[1].replace(/\\"/g, '"').replace(/\\'/g, "'");
        titles.push(title);
    }
    // Dedupe (in case sub-quests show up)
    return Array.from(new Set(titles));
}

async function checkBatch(titles) {
    // Build the |-separated titles string. Each title gets "/Quick guide" appended.
    const fullTitles = titles.map(t => `${t}/Quick guide`);
    const res = await http.get('/api.php', {
        params: {
            action: 'query',
            titles: fullTitles.join('|'),
            format: 'json',
            redirects: 1,
        },
    });
    const pages = res.data?.query?.pages || {};
    const result = new Map(); // title -> { exists, redirect_target }
    // The API returns pages keyed by pageid (or "-1" etc for missing).
    // Match by the `title` field on each response page.
    for (const key of Object.keys(pages)) {
        const p = pages[key];
        const isMissing = 'missing' in p;
        // Strip /Quick guide to get back to the original quest title
        const stripped = p.title.replace(/\/Quick guide$/, '');
        result.set(stripped, !isMissing);
    }
    // Handle redirects (the wiki may have moved a page)
    const redirects = res.data?.query?.redirects || [];
    for (const r of redirects) {
        const stripped = r.from.replace(/\/Quick guide$/, '');
        // If redirected, the target exists
        result.set(stripped, true);
    }
    return result;
}

async function main() {
    const titles = extractTitles();
    console.log(`Found ${titles.length} quest titles in questData.js\n`);

    const exists = new Set();
    const missing = new Set();

    for (let i = 0; i < titles.length; i += BATCH_SIZE) {
        const batch = titles.slice(i, i + BATCH_SIZE);
        process.stdout.write(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(titles.length / BATCH_SIZE)}... `);
        const result = await checkBatch(batch);
        for (const t of batch) {
            const present = result.get(t);
            if (present === undefined) {
                // Title didn't appear in response — treat as missing (likely normalization issue)
                missing.add(t);
            } else if (present) {
                exists.add(t);
            } else {
                missing.add(t);
            }
        }
        console.log(`have=${exists.size} missing=${missing.size}`);
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total quests checked:  ${titles.length}`);
    console.log(`Have /Quick guide:     ${exists.size}`);
    console.log(`Missing /Quick guide:  ${missing.size}`);

    console.log(`\n=== Quests MISSING a /Quick guide subpage ===`);
    const missingList = [...missing].sort();
    for (const t of missingList) console.log(`  - ${t}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
