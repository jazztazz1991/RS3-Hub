// Document-order walk: keep "current h2" as state, attribute step tables.
const axios = require('axios');
const cheerio = require('cheerio');

const PAGE = process.argv[2] || "Plague's End/Quick guide";

(async () => {
    const res = await axios.get('https://runescape.wiki/api.php', {
        params: { action: 'parse', page: PAGE, format: 'json', prop: 'text', redirects: 1 },
        headers: { 'User-Agent': 'RS3-Hub-Inspect/0.1' },
    });
    const $ = cheerio.load(res.data.parse.text['*']);

    let currentSection = '(top)';
    const sections = new Map(); // section -> [{ stepNumber, text, links }]

    function walk(node) {
        if (!node) return;
        const $node = $(node);
        const tag = (node.tagName || '').toLowerCase();

        if (tag === 'h2') {
            currentSection = $node.find('.mw-headline').text().trim() || $node.text().trim();
        } else if (tag === 'table') {
            const firstCellText = $node.find('tr').first().children().first().text().trim();
            if (/^\d+$/.test(firstCellText) && !$node.attr('class')) {
                if (!sections.has(currentSection)) sections.set(currentSection, []);
                $node.find('tr').each((_, tr) => {
                    const $tr = $(tr);
                    const $cells = $tr.children();
                    const num = $cells.eq(0).text().trim();
                    const txt = $cells.eq(1).text().replace(/\s+/g, ' ').trim();
                    const links = $tr.find('a[title]').map((_, a) => $(a).attr('title')).get().filter(Boolean);
                    if (txt) sections.get(currentSection).push({ num, text: txt, links });
                });
                return; // don't recurse into step tables
            }
        }
        // Recurse into children
        if (node.children) {
            for (const c of node.children) walk(c);
        }
    }

    const root = $('.mw-parser-output')[0];
    walk(root);

    console.log('--- Parsed quest by section ---');
    for (const [section, steps] of sections) {
        if (/^(Overview|Required for completing|Rewards|Contents)$/i.test(section)) continue;
        console.log(`\n[${section}] — ${steps.length} step entries`);
        steps.slice(0, 4).forEach((s, i) => {
            console.log(`  ${i + 1}. (${s.num}) ${s.text.slice(0, 140)}`);
            if (s.links.length) console.log(`       linked: ${s.links.slice(0, 4).join(', ')}`);
        });
        if (steps.length > 4) console.log(`  …${steps.length - 4} more`);
    }
})().catch(err => { console.error(err); process.exit(1); });
