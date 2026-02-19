// Woodcutting Data - Trees and Methods

export const WOODCUTTING_ITEMS = [
    // Low Level
    { id: 'normal', name: 'Normal Tree', level: 1, xp: 25, category: 'Tree' },
    { id: 'achey', name: 'Achey Tree', level: 1, xp: 25, category: 'Tree' },
    { id: 'oak', name: 'Oak Tree', level: 15, xp: 37.5, category: 'Tree' },
    { id: 'willow', name: 'Willow Tree', level: 30, xp: 67.5, category: 'Tree' },
    { id: 'teak', name: 'Teak Tree', level: 35, xp: 85, category: 'Tree' },
    { id: 'maple', name: 'Maple Tree', level: 45, xp: 100, category: 'Tree' },
    { id: 'mahogany', name: 'Mahogany Tree', level: 50, xp: 125, category: 'Tree' },
    { id: 'acadia', name: 'Acadia Tree', level: 50, xp: 80, category: 'Tree' },
    { id: 'arctic_pine', name: 'Arctic Pine', level: 54, xp: 145, category: 'Tree' },
    { id: 'eucalyptus', name: 'Eucalyptus', level: 58, xp: 165, category: 'Tree' },
    { id: 'yew', name: 'Yew Tree', level: 60, xp: 175, category: 'Tree' },
    
    // Mid-High Level
    { id: 'ivy', name: 'Choked Ivy', level: 68, xp: 332.5, category: 'Ivy' },
    { id: 'magic', name: 'Magic Tree', level: 75, xp: 250, category: 'Tree' },
    { id: 'cursed_magic', name: 'Cursed Magic Tree', level: 82, xp: 275, category: 'Tree' },
    { id: 'elder', name: 'Elder Tree', level: 90, xp: 425, category: 'Tree' },
    { id: 'crystal', name: 'Crystal Tree', level: 94, xp: 434.5, category: 'Crystal' },
    
    // Arc (Bamboo)
    { id: 'bamboo', name: 'Bamboo', level: 90, xp: 202.5, category: 'Arc' }, 
    { id: 'golden_bamboo', name: 'Golden Bamboo', level: 96, xp: 655.5, category: 'Arc' },
    
    // Croesus
    { id: 'fungal_trove', name: 'Timber Fungus (Croesus)', level: 88, xp: 1550, category: 'Boss' }
];

// In The Arc, Golden Bamboo gives bundles. 1 Golden Bamboo = 100 bundles? No.
// RS3 Wiki: Golden bamboo: 500 XP per chop? No, it's complex.
// Let's stick to standard trees for now and Crystal Trees which are popular.

export const WOODCUTTING_BOOSTS = [
    { id: 'urns', name: 'Decorated Urns', multiplier: 0.2, description: '+20% XP (Requires Urns)' },
    { id: 'lumberjack', name: 'Lumberjack Outfit', multiplier: 0.05, description: '+5% XP' },
    { id: 'nature_sentinel', name: 'Nature Sentinel', multiplier: 0.07, description: '+7% XP' },
    { id: 'crystallise', name: 'Crystallise (Light Form)', multiplier: 0.875, description: '+87.5% XP (No logs caught)' },
    { id: 'clan_avatar', name: 'Clan Avatar', multiplier: 0.06, description: '+6% XP' },
    { id: 'torstol', name: 'Torstol Incense', multiplier: 0.02, description: '+2% XP' }
];
