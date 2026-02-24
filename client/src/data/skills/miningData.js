// Mining Calculator Data
// xp: XP per ore mined (base, no outfit/urns)

export const MINING_ROCKS = [
    // ── Basic Ores ────────────────────────────────────────────────────────────────
    { id: 'clay',          name: 'Clay',          level: 1,  xp: 5,     category: 'Basic Ores' },
    { id: 'copper',        name: 'Copper Ore',    level: 1,  xp: 17.5,  category: 'Basic Ores' },
    { id: 'tin',           name: 'Tin Ore',       level: 1,  xp: 17.5,  category: 'Basic Ores' },
    { id: 'iron',          name: 'Iron Ore',      level: 10, xp: 35,    category: 'Basic Ores' },
    { id: 'coal',          name: 'Coal',          level: 30, xp: 50,    category: 'Basic Ores' },
    { id: 'gold',          name: 'Gold Ore',      level: 40, xp: 65,    category: 'Basic Ores' },
    { id: 'mithril',       name: 'Mithril Ore',   level: 40, xp: 80,    category: 'Basic Ores' },
    { id: 'adamantite',    name: 'Adamantite Ore',level: 50, xp: 95,    category: 'Basic Ores' },
    { id: 'runite',        name: 'Runite Ore',    level: 60, xp: 125,   category: 'Basic Ores' },

    // ── RS3 Ancient Ores ──────────────────────────────────────────────────────────
    { id: 'luminite',      name: 'Luminite',      level: 50, xp: 95,    category: 'RS3 Ores' },
    { id: 'orichalcite',   name: 'Orichalcite',   level: 60, xp: 125,   category: 'RS3 Ores' },
    { id: 'drakolith',     name: 'Drakolith',     level: 60, xp: 125,   category: 'RS3 Ores' },
    { id: 'necrite',       name: 'Necrite Ore',   level: 70, xp: 195,   category: 'RS3 Ores' },
    { id: 'phasmatite',    name: 'Phasmatite',    level: 70, xp: 195,   category: 'RS3 Ores' },
    { id: 'banite',        name: 'Banite Ore',    level: 80, xp: 210,   category: 'RS3 Ores' },
    { id: 'light_animica', name: 'Light Animica', level: 90, xp: 260,   category: 'RS3 Ores' },
    { id: 'dark_animica',  name: 'Dark Animica',  level: 90, xp: 260,   category: 'RS3 Ores' },

    // ── Special Methods ───────────────────────────────────────────────────────────
    { id: 'seren_stones',      name: 'Seren Stones (AFK)',            level: 89, xp: 296.7, category: 'Special' },
    { id: 'soft_clay_prif',    name: 'Soft Clay (Prifddinas)',        level: 75, xp: 5,     category: 'Special' },
    { id: 'salt_crablet',      name: 'Salt Crablet (Alauna)',         level: 90, xp: 235,   category: 'Special' },
    { id: 'arc_crablet',       name: 'Arc Crablet (The Arc)',         level: 90, xp: 235,   category: 'Special' },
];
