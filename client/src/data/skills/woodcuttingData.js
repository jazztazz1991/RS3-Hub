// Woodcutting Data - Trees and Methods
// Levels and XP verified against runescape.wiki individual tree pages (June 2025).

export const WOODCUTTING_ITEMS = [
    // Low Level
    { id: 'normal',       name: 'Normal Tree',            level: 1,  xp: 25,    category: 'Tree' },
    { id: 'achey',        name: 'Achey Tree',              level: 1,  xp: 25,    category: 'Tree' },
    { id: 'oak',          name: 'Oak Tree',                level: 10, xp: 37.5,  category: 'Tree' },
    { id: 'willow',       name: 'Willow Tree',             level: 20, xp: 67.5,  category: 'Tree' },
    { id: 'teak',         name: 'Teak Tree',               level: 30, xp: 85,    category: 'Tree' },
    { id: 'creeping_ivy', name: 'Creeping Ivy',            level: 35, xp: 162.5, category: 'Ivy' },
    { id: 'maple',        name: 'Maple Tree',              level: 40, xp: 100,   category: 'Tree' },
    { id: 'mahogany',     name: 'Mahogany Tree',           level: 60, xp: 125,   category: 'Tree' },
    { id: 'acadia',       name: 'Acadia Tree',             level: 50, xp: 80,    category: 'Tree' },
    { id: 'arctic_pine',  name: 'Arctic Pine',             level: 54, xp: 145,   category: 'Tree' },
    { id: 'eucalyptus',   name: 'Eucalyptus',              level: 58, xp: 165,   category: 'Tree' },
    { id: 'yew',          name: 'Yew Tree',                level: 70, xp: 187.5, category: 'Tree' },

    // Mid-High Level
    { id: 'ivy',          name: 'Choked Ivy',              level: 68, xp: 332.5, category: 'Ivy' },
    { id: 'magic',        name: 'Magic Tree',              level: 80, xp: 365,   category: 'Tree' },
    { id: 'cursed_magic', name: 'Cursed Magic Tree',       level: 82, xp: 400,   category: 'Tree' },
    { id: 'bloodwood',    name: 'Bloodwood Tree',          level: 85, xp: 320,   category: 'Tree' },
    { id: 'elder',        name: 'Elder Tree',              level: 90, xp: 425,   category: 'Tree' },
    { id: 'crystal',      name: 'Crystal Tree',            level: 94, xp: 350,   category: 'Crystal' },
    { id: 'eternal_magic',name: 'Eternal Magic Tree',      level: 100, xp: 635,  category: 'Tree' },

    // Arc (Bamboo)
    { id: 'bamboo',        name: 'Bamboo',                 level: 90, xp: 202.5, category: 'Arc' },
    { id: 'golden_bamboo', name: 'Golden Bamboo',          level: 96, xp: 655.5, category: 'Arc' },

    // Croesus — XP per action unconfirmed on wiki; leaving at community estimate
    { id: 'fungal_trove',  name: 'Timber Fungus (Croesus)', level: 88, xp: 1550, category: 'Boss', estimated: true, estimateNote: 'XP per action not listed on the RS Wiki — community estimate only. Verify in-game before relying on this value.' },
];

// Urns are handled separately in the calculator (dropdown + advanced count input).
//
// Lumberjack and Nature Sentinel are mutually exclusive (both body slot).
// Nature Sentinel passively grants the Lumberjack +5% XP bonus when owned.
// Its own +7% is a success chance boost (faster logs, not more XP per log)
// so it does not affect log count — only the inherited +5% is applied here.
// The calculator enforces mutual exclusivity between the two outfit options.
export const WOODCUTTING_BOOSTS = [
    { id: 'lumberjack',      name: 'Lumberjack Outfit',        multiplier: 0.05,   description: '+5% XP per log.', outfitGroup: 'body' },
    { id: 'nature_sentinel', name: 'Nature Sentinel Outfit',   multiplier: 0.05,   description: '+5% XP per log (via Lumberjack passive). Also gives +7% success chance which increases logs/hr but does not change logs needed.', outfitGroup: 'body' },
    { id: 'crystallise',     name: 'Crystallise (Light Form)', multiplier: 0.875,  description: '+87.5% XP (No logs caught)' },
    { id: 'clan_avatar',     name: 'Clan Avatar',              multiplier: 0.06,   description: '+6% XP' },
    { id: 'torstol',         name: 'Torstol Incense',          multiplier: 0.02,   description: '+2% XP' },
];
