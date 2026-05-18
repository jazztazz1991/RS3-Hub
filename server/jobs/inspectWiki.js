// Inspect the infobox-switch structure on a multi-dose potion page so we
// can pull the (4) variant's image when the item name lacks a dose suffix.
const axios = require('axios');
const cheerio = require('cheerio');

const PAGE = process.argv[2] || 'Super restore';

(async () => {
    const res = await axios.get('https://runescape.wiki/api.php', {
        params: {
            action: 'parse',
            page: PAGE,
            format: 'json',
            prop: 'text',
            redirects: 1,
        },
        headers: { 'User-Agent': 'RS3-Hub-Inspect/0.1' },
    });
    const html = res.data.parse.text['*'];
    const $ = cheerio.load(html);

    console.log(`\n========== Page: ${res.data.parse.title} ==========\n`);

    const $box = $('.infobox-item').first();
    console.log('Infobox classes:', $box.attr('class'));

    console.log('\n--- all <img> elements inside the infobox ---');
    $box.find('img').each((i, img) => {
        const $img = $(img);
        const src = $img.attr('src') || '';
        const alt = $img.attr('alt') || '';
        const parentClass = $img.parent().attr('class') || '';
        const switchAnchor = $img.closest('[data-switch-anchor]').attr('data-switch-anchor');
        console.log(`  img[${i}] alt="${alt}" parent="${parentClass.slice(0, 40)}" switchAnchor="${switchAnchor || ''}"`);
        console.log(`    src="${src}"`);
    });

    console.log('\n--- switch buttons / tab labels ---');
    $box.find('.switch-infobox-triggers, .infobox-switch-buttons, [data-switch-anchor]').each((i, el) => {
        const $el = $(el);
        const txt = $el.text().replace(/\s+/g, ' ').trim().slice(0, 80);
        const dataAttrs = {};
        for (const k of Object.keys(el.attribs || {})) {
            if (k.startsWith('data-')) dataAttrs[k] = el.attribs[k];
        }
        console.log(`  <${el.tagName}> "${txt}" attrs=${JSON.stringify(dataAttrs)}`);
    });

    console.log('\n--- raw [data-attr-param="image"] cells ---');
    $box.find('[data-attr-param="image"]').each((i, el) => {
        const $el = $(el);
        const html = $.html($el).slice(0, 300);
        console.log(`  cell[${i}]: ${html}`);
    });

    console.log('\n--- all elements with data-switch-anchor or data-switch-index ---');
    $box.find('[data-switch-anchor], [data-switch-index]').each((i, el) => {
        if (i > 10) return;
        const $el = $(el);
        console.log(`  <${el.tagName}> switchAnchor="${$el.attr('data-switch-anchor') || ''}" switchIndex="${$el.attr('data-switch-index') || ''}" text="${$el.text().replace(/\s+/g, ' ').trim().slice(0, 40)}"`);
    });
})().catch(err => { console.error(err); process.exit(1); });
