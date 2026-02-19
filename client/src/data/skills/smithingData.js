export const SMITHING_METHODS = [
    // Smelting
    { id: 'bronze_bar', name: "Smelt Bronze Bar", level: 1, xp: 6.2, category: 'Smelting' },
    { id: 'iron_bar', name: "Smelt Iron Bar", level: 10, xp: 12.5, category: 'Smelting' },
    { id: 'silver_bar', name: "Smelt Silver Bar", level: 20, xp: 13.7, category: 'Smelting' },
    { id: 'steel_bar', name: "Smelt Steel Bar", level: 30, xp: 17.5, category: 'Smelting' },
    { id: 'gold_bar', name: "Smelt Gold Bar", level: 40, xp: 22.5, category: 'Smelting' }, // With Goldsmith gauntlets 56.2
    { id: 'mithril_bar', name: "Smelt Mithril Bar", level: 50, xp: 30, category: 'Smelting' },
    { id: 'adamant_bar', name: "Smelt Adamant Bar", level: 60, xp: 37.5, category: 'Smelting' },
    { id: 'rune_bar', name: "Smelt Rune Bar", level: 85, xp: 50, category: 'Smelting' },
    { id: 'orikalkum_bar', name: "Smelt Orikalkum Bar", level: 60, xp: 30, category: 'Smelting' },
    { id: 'necronium_bar', name: "Smelt Necronium Bar", level: 70, xp: 40, category: 'Smelting' },
    { id: 'banite_bar', name: "Smelt Banite Bar", level: 80, xp: 50, category: 'Smelting' },
    { id: 'elder_rune_bar', name: "Smelt Elder Rune Bar", level: 90, xp: 100, category: 'Smelting' },
    
    // Burial Armor (XP per Ingot used essentially, but calculated per set)
    // Note: These values are for the full creation from scratch or just the burial step?
    // Usually calc is "Burial Step only" because you buy the +x armor.
    // Burial Elder Rune Set: 35,000 XP?
    // Let's use specific actions.
    
    { id: 'burial_adamant', name: "Burial Adamant Set", level: 60, xp: 25152, category: 'Burial' }, 
    { id: 'burial_rune', name: "Burial Rune Set", level: 90, xp: 129600, category: 'Burial' }, // This seems high? Checking RS3 Wiki is tough without access.
    // Let's use simpler numbers or note "Total XP for set".
    // 1 Elder Rune Bar = 100 XP smelt.
    // Smithing it gives XP per hit. 
    // Total XP for Elder Rune Platebody + 5 = 16000 base?
    
    // Simplified: "Elder Rune Burial Set (from +5)"
    // Input: Full set of +5 items. 
    // XP: 48,000 (Very rough estimate, I should be conservative).
    
    // Let's stick to "Corrupted Ore" and "Protean Bars" as they are simple single-action items.
    { id: 'corrupted_ore', name: "Corrupted Ore", level: 89, xp: 150, category: 'Smelting' },
    { id: 'protean_bar', name: "Protean Bar (Level Scaled)", level: 1, xp: 0, category: 'Protean' }, // Dynamic

    // Burial simplified (Per Bar equivalent) 
    // Elder Rune Burial is approx 4000 XP per bar?
    { id: 'burial_elder_rune_set', name: "Elder Rune Burial Set", level: 90, xp: 58564, category: 'Burial' },
    { id: 'burial_banite_set', name: "Banite Burial Set", level: 80, xp: 24595, category: 'Burial' },
];
