// Firemaking Data - Logs and Methods

// Note: Bonfire XP is unique per log, not a flat multiplier.
// We will store both 'base' (Line Firemaking) and 'bonfire' XP values.

export const FIREMAKING_ITEMS = [
    // Low Level
    { id: 'normal', name: 'Normal Logs', level: 1, xp: 40, bonfireXp: 50, category: 'Logs' },
    { id: 'achey', name: 'Achey Tree Logs', level: 1, xp: 40, bonfireXp: 50, category: 'Logs' },
    { id: 'oak', name: 'Oak Logs', level: 15, xp: 60, bonfireXp: 85, category: 'Logs' },
    { id: 'willow', name: 'Willow Logs', level: 30, xp: 90, bonfireXp: 105, category: 'Logs' },
    { id: 'teak', name: 'Teak Logs', level: 35, xp: 105, bonfireXp: 120, category: 'Logs' },
    
    // Mid Level
    { id: 'arctic_pine', name: 'Arctic Pine Logs', level: 42, xp: 125, bonfireXp: 125, category: 'Logs' }, // Can be bonfired? Assume yes, but maybe no extra? Wiki often omits. Use base as fallback.
    { id: 'maple', name: 'Maple Logs', level: 45, xp: 135, bonfireXp: 157.5, category: 'Logs' },
    { id: 'acadia', name: 'Acadia Logs', level: 47, xp: 140, bonfireXp: 170, category: 'Logs' },
    { id: 'maogany', name: 'Mahogany Logs', level: 50, xp: 157.5, bonfireXp: 178.5, category: 'Logs' },
    { id: 'eucalyptus', name: 'Eucalyptus Logs', level: 58, xp: 195, bonfireXp: 195, category: 'Logs' }, // Verify specific bonfire value later, use base for now if unknown
    { id: 'yew', name: 'Yew Logs', level: 60, xp: 202.5, bonfireXp: 220, category: 'Logs' },
    
    // High Level
    { id: 'magic', name: 'Magic Logs', level: 75, xp: 303.8, bonfireXp: 309.5, category: 'Logs' },
    { id: 'corrupted_magic', name: 'Corrupted Magic Logs', level: 75, xp: 319, bonfireXp: 319, category: 'Logs' },
    { id: 'elder', name: 'Elder Logs', level: 90, xp: 434.3, bonfireXp: 449, category: 'Logs' },
    
    // Special
    { id: 'curly_root', name: 'Curly Root (Jadinko)', level: 83, xp: 378.7, bonfireXp: 378.7, category: 'Special' }, // Superheat form usually
    // { id: 'bamboo', name: 'Bamboo', level: 90, xp: 0, category: 'Arc' } // Not burnable for XP
];

export const FIREMAKING_BOOSTS = [
    { id: 'bonfire', name: 'Bonfire Method', multiplier: 0, description: 'Use Bonfire XP values (varies by log)', type: 'method_override' },
    { id: 'ring_of_fire', name: 'Ring of Fire', multiplier: 0.02, description: '+2% XP' },
    { id: 'fire_gloves', name: 'Flame Gloves', multiplier: 0.02, description: '+2% XP' },
    { id: 'inferno_adze', name: 'Inferno Adze', multiplier: 0.0, description: 'Burns logs while cutting (Woodcutting method really)' }, 
    { id: 'pxp_outfit', name: 'Pyromancer Outfit', multiplier: 0.05, description: '+5% XP' },
    { id: 'raf', name: 'Refer a Friend', multiplier: 0.1, description: '+10% XP' },
    { id: 'clan_avatar', name: 'Clan Avatar', multiplier: 0.06, description: '+6% XP' },
    { id: 'torstol', name: 'Torstol Incense', multiplier: 0.02, description: '+2% XP' },
    { id: 'brawling', name: 'Brawling Gloves (Wildy)', multiplier: 0.5, description: '+50% XP (Wilderness)' } // Brawling varies heavily (up to 300% at aggro pool), simplistic 50% for standard wildy
];
