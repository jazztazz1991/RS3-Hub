// Site-wide changelog. Add a new entry at the TOP of CHANGELOG for every meaningful update.
// Categories: 'Feature', 'Guides', 'Calculators', 'Quests', 'Daily Tasks', 'UI', 'Bug Fix', 'Content'

export const CHANGELOG = [
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
