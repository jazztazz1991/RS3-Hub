// Manually-curated boss entries the wiki scraper can't produce cleanly —
// enrage-scaled signature tables that the wiki lists as "Varies" rather than
// a flat rate. These are ESTIMATES; the `estimated` flag drives a warning
// badge in the UI. Verify rates before relying on them.
//
// Merged with the scraped client/src/data/bossDrops.json in BossHunt.jsx.

// Zamorak signature rewards scale with enrage. At ~50% enrage the chance to
// receive ANY signature is roughly ~1/55, split across the 9 signature
// items, giving ~1/500 per specific item. Values are wiki GE prices captured
// at scrape time.
export const MANUAL_BOSSES = [
    {
        slug: 'zamorak-50',
        name: 'Zamorak, Lord of Chaos',
        category: 'Modern',
        encounter: 'kill',
        defaultSeconds: 240,
        estimated: true,
        estimateNote: 'Signature rate assumes ~50% enrage (~1/500 per item). Verify against the wiki drop-mechanics formula.',
        drops: [
            { name: "Top of the Last Guardian's bow", rate: 500, value: 772_000_000 },
            { name: 'Divine bowstring', rate: 500, value: 664_000_000 },
            { name: "Bottom of the Last Guardian's bow", rate: 500, value: 621_000_000 },
            { name: 'Vestments of havoc robe top', rate: 500, value: 552_000_000 },
            { name: 'Vestments of havoc robe bottom', rate: 500, value: 393_000_000 },
            { name: 'Vestments of havoc boots', rate: 500, value: 202_000_000 },
            { name: 'Chaos Roar ability codex', rate: 500, value: 184_000_000 },
            { name: 'Vestments of havoc hood', rate: 500, value: 133_000_000 },
            { name: 'Codex of lost knowledge', rate: 500, value: 16_000_000 },
        ],
    },
];
