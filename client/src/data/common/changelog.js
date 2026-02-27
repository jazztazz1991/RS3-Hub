// Site-wide changelog. Add a new entry at the TOP of CHANGELOG for every meaningful update.
// Categories: 'Feature', 'Guides', 'Calculators', 'Quests', 'Daily Tasks', 'UI', 'Bug Fix', 'Content'

export const CHANGELOG = [
    {
        date: '2026-02-27',
        category: 'Calculators',
        description: 'Archaeology calculator now tracks your material storage — the Materials Required panel shows Need / Have / Left columns. Enter your current stock to instantly see what you\'re short on, with green checkmarks for covered materials. Stock persists across sessions via localStorage.',
    },
    {
        date: '2026-02-27',
        category: 'Content',
        description: 'Two missing archaeology artefacts added to the database: Ekeleshuun blinder mask (level 76, Warforge) and Necromantic focus (level 86, Kharid-et).',
    },
    {
        date: '2026-02-25',
        category: 'Bug Fix',
        description: 'XP_TABLE[110] corrected from 43,599,174 to 38,737,661 — Mining and Smithing progress bars, XP-to-go displays, and calculator targets were all showing inflated values.',
    },
    {
        date: '2026-02-25',
        category: 'Bug Fix',
        description: 'Slayer calculator: 21 task ID mismatches fixed across all masters (plural IDs like "desert_strykewyrms" now correctly resolve to monster data). Added missing iron, steel, and mithril dragon entries; fixed blood nihil and throwing muspah Slayer level requirements.',
    },
    {
        date: '2026-02-25',
        category: 'Bug Fix',
        description: 'Archaeology calculator now correctly computes XP to target for any level — previously returned 0 XP remaining for any target other than exactly 99, 110, or 120.',
    },
    {
        date: '2026-02-25',
        category: 'Bug Fix',
        description: 'Mining and Smithing calculators default target corrected from 120 to 110 (their actual level cap). Summoning calculator default target capped at 99.',
    },
    {
        date: '2026-02-25',
        category: 'Bug Fix',
        description: 'Invention calculator level display corrected for XP in the 99–120 range — previously fell back to the standard XP formula, showing levels up to 10 off.',
    },
    {
        date: '2026-02-25',
        category: 'UI',
        description: 'Quest guide pages redesigned — wiki-style numbered checklist with circle counters, color-coded skill requirement chips (green/red based on your stats), cleaner quest requirement tree, and simplified item lists.',
    },
    {
        date: '2026-02-25',
        category: 'Feature',
        description: 'Admin role hierarchy added — four tiers (admin, manager, co-owner, owner) with cumulative tab access. Owners can assign roles directly from the User Management panel.',
    },
    {
        date: '2026-02-25',
        category: 'Feature',
        description: 'Analytics tab added to admin dashboard — tracks MAU (registered users active in last 30 days), unique visitor sessions, and a 30-day daily visits bar chart.',
    },
    {
        date: '2026-02-25',
        category: 'Guides',
        description: 'Ranged guide added — P2P and Ironman variants covering gear progression, chinchompa AoE training, Slayer integration, and endgame methods.',
    },
    {
        date: '2026-02-25',
        category: 'Bug Fix',
        description: 'Quest tracker quest count and quest points now correctly exclude RuneMetrics-imported titles that do not match local quest data.',
    },
    {
        date: '2026-02-25',
        category: 'Bug Fix',
        description: 'Slayer Log dual hook instance fixed — completing a task now immediately updates calculator stats without a page refresh.',
    },
    {
        date: '2026-02-25',
        category: 'Bug Fix',
        description: 'Vite dev proxy added — API calls now correctly reach the Express server on port 5000 during local development.',
    },
    {
        date: '2026-02-25',
        category: 'Quests',
        description: 'Spirits of the Elid and Contact! quest guides cleaned — removed duplicated sub-steps and post-completion achievement debris.',
    },
    {
        date: '2026-02-25',
        category: 'Feature',
        description: 'Quest guide image support added — steps can include optional inline images with lightbox zoom on click.',
    },
    {
        date: '2026-02-24',
        category: 'UI',
        description: 'Full mobile responsiveness pass — hamburger nav, calculator layouts, quest tracker, dashboard, and auth pages all fixed for 375px+.',
    },
    {
        date: '2026-02-24',
        category: 'UI',
        description: 'Auth pages redesigned with RS3 aesthetic — centered layout, brand link, loading states, and cross-links between login and register.',
    },
    {
        date: '2026-02-24',
        category: 'Guides',
        description: 'Divination P2P guide completely rewritten — 7 logical sections, garbage wiki parser sections removed, accurate XP rates throughout.',
    },
    {
        date: '2026-02-24',
        category: 'Guides',
        description: 'Divination Ironman guide expanded with boons coverage, Daemonheim Divination, Hall of Memories, and Arc daily contracts.',
    },
    {
        date: '2026-02-24',
        category: 'Guides',
        description: 'Firemaking Ironman guide fully rewritten — 6 sections covering early log burning, Miscellania, Curly Roots, and Superheat Form.',
    },
    {
        date: '2026-02-24',
        category: 'Guides',
        description: 'Firemaking P2P guide fixed — Curly Roots section now has accurate level requirements, XP rates, and method description.',
    },
    {
        date: '2026-02-24',
        category: 'Daily Tasks',
        description: 'Daily/weekly/monthly task list verified and updated — added Farming Runs and Big Chinchompa, fixed descriptions and shop run checklist.',
    },
    {
        date: '2026-02-24',
        category: 'Feature',
        description: 'Guides hub redesigned to card grid layout matching Calculators page style.',
    },
    {
        date: '2026-02-24',
        category: 'Feature',
        description: 'Calculators hub redesigned to card grid layout with skill icons and tool section.',
    },
    {
        date: '2026-02-24',
        category: 'Feature',
        description: 'Dashboard skill cards now expand in place to show Guide, Calculator, and Wiki action links.',
    },
    {
        date: '2026-02-24',
        category: 'Guides',
        description: 'All 24 skill guides standardised to Schema B JSON and a single shared GuideTemplate component.',
    },
    {
        date: '2026-02-24',
        category: 'Quests',
        description: 'Quest tracker redesigned to table layout — requirements moved to detail page, cleaner list view.',
    },
    {
        date: '2026-02-24',
        category: 'Quests',
        description: 'Quest details page cleaned up — removed placeholder infobox rows, guide section more prominent.',
    },
    {
        date: '2026-02-23',
        category: 'Feature',
        description: 'Landing page added for unauthenticated users showcasing site features.',
    },
    {
        date: '2026-02-23',
        category: 'Feature',
        description: 'Custom 404 page added with context-aware navigation links.',
    },
    {
        date: '2026-02-20',
        category: 'Calculators',
        description: '24 skill calculators available covering all meaningful skilling skills.',
    },
    {
        date: '2026-02-20',
        category: 'Guides',
        description: '24 skill guides added with P2P and Ironman variants for all skilling skills.',
    },
    {
        date: '2026-02-15',
        category: 'Feature',
        description: 'Quest tracker launched with 270 quests, skill/quest requirement checking, and RuneMetrics import.',
    },
    {
        date: '2026-02-10',
        category: 'Feature',
        description: 'Character tracking added via Jagex hiscores proxy with database caching.',
    },
    {
        date: '2026-02-05',
        category: 'Feature',
        description: 'Daily/weekly/monthly task tracker added with completion state persistence.',
    },
    {
        date: '2026-02-01',
        category: 'Feature',
        description: 'Initial launch — Dashboard, Calculators, and core authentication system.',
    },
];

// The date of the most recently added entry (top of the list)
export const SITE_LAST_UPDATED = CHANGELOG[0].date;
