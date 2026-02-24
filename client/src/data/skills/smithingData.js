// Smithing Calculator Data
// Smelting: XP per bar smelted
// Smithing: XP per piece made at the anvil (platebody = 5 bars, platelegs = 3 bars)
// Burial: XP per full set (helm + body + legs + boots + gloves + shield)

export const SMITHING_METHODS = [
    // ── Smelting (XP per bar) ───────────────────────────────────────────────────
    { id: 'smelt_bronze',         name: 'Smelt Bronze Bar',                     level: 1,  xp: 6.2,  category: 'Smelting' },
    { id: 'smelt_iron',           name: 'Smelt Iron Bar',                       level: 10, xp: 12.5, category: 'Smelting' },
    { id: 'smelt_silver',         name: 'Smelt Silver Bar',                     level: 20, xp: 13.7, category: 'Smelting' },
    { id: 'smelt_steel',          name: 'Smelt Steel Bar',                      level: 30, xp: 17.5, category: 'Smelting' },
    { id: 'smelt_gold',           name: 'Smelt Gold Bar',                       level: 40, xp: 22.5, category: 'Smelting' },
    { id: 'smelt_gold_gauntlets', name: 'Smelt Gold Bar (Goldsmith Gauntlets)', level: 40, xp: 56.2, category: 'Smelting' },
    { id: 'smelt_mithril',        name: 'Smelt Mithril Bar',                    level: 50, xp: 30,   category: 'Smelting' },
    { id: 'smelt_adamant',        name: 'Smelt Adamant Bar',                    level: 60, xp: 37.5, category: 'Smelting' },
    { id: 'smelt_orikalkum',      name: 'Smelt Orikalkum Bar',                  level: 60, xp: 40,   category: 'Smelting' },
    { id: 'smelt_necronium',      name: 'Smelt Necronium Bar',                  level: 70, xp: 60,   category: 'Smelting' },
    { id: 'smelt_banite',         name: 'Smelt Banite Bar',                     level: 80, xp: 80,   category: 'Smelting' },
    { id: 'smelt_rune',           name: 'Smelt Rune Bar',                       level: 85, xp: 50,   category: 'Smelting' },
    { id: 'smelt_elder_rune',     name: 'Smelt Elder Rune Bar',                 level: 90, xp: 100,  category: 'Smelting' },
    { id: 'corrupted_ore',        name: 'Corrupted Ore',                        level: 89, xp: 150,  category: 'Smelting' },

    // ── Smithing at Anvil (XP per piece made) ───────────────────────────────────
    // Platelegs = 3 bars; Platebody = 5 bars
    { id: 'bronze_platelegs',     name: 'Bronze Platelegs',       level: 16, xp: 18.6,  category: 'Smithing' },
    { id: 'bronze_platebody',     name: 'Bronze Platebody',       level: 18, xp: 31,    category: 'Smithing' },
    { id: 'iron_platelegs',       name: 'Iron Platelegs',         level: 31, xp: 37.5,  category: 'Smithing' },
    { id: 'iron_platebody',       name: 'Iron Platebody',         level: 33, xp: 62.5,  category: 'Smithing' },
    { id: 'steel_platelegs',      name: 'Steel Platelegs',        level: 46, xp: 52.5,  category: 'Smithing' },
    { id: 'steel_platebody',      name: 'Steel Platebody',        level: 48, xp: 87.5,  category: 'Smithing' },
    { id: 'mithril_platelegs',    name: 'Mithril Platelegs',      level: 66, xp: 90,    category: 'Smithing' },
    { id: 'mithril_platebody',    name: 'Mithril Platebody',      level: 68, xp: 150,   category: 'Smithing' },
    { id: 'adamant_platelegs',    name: 'Adamant Platelegs',      level: 86, xp: 112.5, category: 'Smithing' },
    { id: 'adamant_platebody',    name: 'Adamant Platebody',      level: 88, xp: 187.5, category: 'Smithing' },
    { id: 'rune_platelegs',       name: 'Rune Platelegs',         level: 97, xp: 150,   category: 'Smithing' },
    { id: 'rune_platebody',       name: 'Rune Platebody',         level: 99, xp: 250,   category: 'Smithing' },
    // RS3 Ancient metals
    { id: 'orikalkum_platebody',  name: 'Orikalkum Platebody',    level: 70, xp: 200,   category: 'Smithing' },
    { id: 'necronium_platebody',  name: 'Necronium Platebody',    level: 80, xp: 300,   category: 'Smithing' },
    { id: 'banite_platebody',     name: 'Banite Platebody',       level: 90, xp: 400,   category: 'Smithing' },
    { id: 'elder_rune_platebody', name: 'Elder Rune Platebody',   level: 99, xp: 500,   category: 'Smithing' },

    // ── Artisan's Workshop – Burial Armour ──────────────────────────────────────
    // XP per full 6-piece burial set conversion (helm + body + legs + boots + gloves + shield).
    // Purchase +4 sets from the workshop, upgrade to +5 at the anvil, then convert to burial.
    // This is the fastest Smithing XP method; costs are high.
    { id: 'burial_iron',       name: 'Iron Burial Set',       level: 15, xp: 8750,  category: 'Burial' },
    { id: 'burial_steel',      name: 'Steel Burial Set',      level: 30, xp: 14000, category: 'Burial' },
    { id: 'burial_mithril',    name: 'Mithril Burial Set',    level: 50, xp: 24000, category: 'Burial' },
    { id: 'burial_adamant',    name: 'Adamant Burial Set',    level: 60, xp: 33750, category: 'Burial' },
    { id: 'burial_rune',       name: 'Rune Burial Set',       level: 85, xp: 45000, category: 'Burial' },
    { id: 'burial_orikalkum',  name: 'Orikalkum Burial Set',  level: 70, xp: 36000, category: 'Burial' },
    { id: 'burial_necronium',  name: 'Necronium Burial Set',  level: 80, xp: 54000, category: 'Burial' },
    { id: 'burial_banite',     name: 'Banite Burial Set',     level: 90, xp: 72000, category: 'Burial' },
    { id: 'burial_elder_rune', name: 'Elder Rune Burial Set', level: 99, xp: 90000, category: 'Burial' },
];
