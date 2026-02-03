// Fletching Data - Logs, Bows, Arrows, Darts

export const FLETCHING_ITEMS = [
    // --- Bows (Check: Unstrung XP vs Stringing XP. Often calculators separate them or combine full) ---
    // Usually people either cut unstrung (AFK) or String (Fast). 
    // Data format: We can have separate entries or a "method" selector.
    // Let's list the base resource and let method handle the specific action (Cut vs String)?
    // Problem: Cutting a Magic Log -> Magic Shortbow (u) is different XP than Stringing it.
    // Simpler approach: List specific actionable items like "Cut Magic Shortbow (u)", "String Magic Shortbow".
    
    // --- Fletching Bows (Cutting Logs) ---
    { id: 'short_normal', name: 'Shortbow (Cut)', level: 5, xp: 5, category: 'Bows (Cut)' },
    { id: 'long_normal', name: 'Longbow (Cut)', level: 10, xp: 10, category: 'Bows (Cut)' },
    { id: 'short_oak', name: 'Oak Shortbow (Cut)', level: 20, xp: 16.5, category: 'Bows (Cut)' },
    { id: 'long_oak', name: 'Oak Longbow (Cut)', level: 25, xp: 25, category: 'Bows (Cut)' },
    { id: 'short_willow', name: 'Willow Shortbow (Cut)', level: 35, xp: 33.3, category: 'Bows (Cut)' },
    { id: 'long_willow', name: 'Willow Longbow (Cut)', level: 40, xp: 41.5, category: 'Bows (Cut)' },
    { id: 'short_maple', name: 'Maple Shortbow (Cut)', level: 50, xp: 50, category: 'Bows (Cut)' },
    { id: 'long_maple', name: 'Maple Longbow (Cut)', level: 55, xp: 58.3, category: 'Bows (Cut)' },
    { id: 'short_yew', name: 'Yew Shortbow (Cut)', level: 65, xp: 67.5, category: 'Bows (Cut)' },
    { id: 'long_yew', name: 'Yew Longbow (Cut)', level: 70, xp: 75, category: 'Bows (Cut)' },
    { id: 'short_magic', name: 'Magic Shortbow (Cut)', level: 80, xp: 83.3, category: 'Bows (Cut)' },
    { id: 'long_magic', name: 'Magic Longbow (Cut)', level: 85, xp: 91.5, category: 'Bows (Cut)' },
    { id: 'short_elder', name: 'Elder Shortbow (Cut)', level: 90, xp: 108.3, category: 'Bows (Cut)' },
    { id: 'long_elder', name: 'Elder Longbow (Cut)', level: 95, xp: 116.6, category: 'Bows (Cut)' }, // Verify this
    
    // --- Stringing Bows ---
    { id: 'str_short_normal', name: 'Shortbow (String)', level: 5, xp: 5, category: 'Stringing' },
    { id: 'str_long_normal', name: 'Longbow (String)', level: 10, xp: 10, category: 'Stringing' },
    { id: 'str_short_oak', name: 'Oak Shortbow (String)', level: 20, xp: 16.5, category: 'Stringing' },
    { id: 'str_long_oak', name: 'Oak Longbow (String)', level: 25, xp: 25, category: 'Stringing' },
    { id: 'str_short_willow', name: 'Willow Shortbow (String)', level: 35, xp: 33.3, category: 'Stringing' },
    { id: 'str_long_willow', name: 'Willow Longbow (String)', level: 40, xp: 41.5, category: 'Stringing' },
    { id: 'str_short_maple', name: 'Maple Shortbow (String)', level: 50, xp: 50, category: 'Stringing' },
    { id: 'str_long_maple', name: 'Maple Longbow (String)', level: 55, xp: 58.3, category: 'Stringing' },
    { id: 'str_short_yew', name: 'Yew Shortbow (String)', level: 65, xp: 67.5, category: 'Stringing' },
    { id: 'str_long_yew', name: 'Yew Longbow (String)', level: 70, xp: 75, category: 'Stringing' },
    { id: 'str_short_magic', name: 'Magic Shortbow (String)', level: 80, xp: 83.3, category: 'Stringing' },
    { id: 'str_long_magic', name: 'Magic Longbow (String)', level: 85, xp: 91.5, category: 'Stringing' },
    { id: 'str_short_elder', name: 'Elder Shortbow (String)', level: 90, xp: 108.3, category: 'Stringing' },
    { id: 'str_long_elder', name: 'Elder Longbow (String)', level: 95, xp: 116.6, category: 'Stringing' },

    // --- Arrows/Bolts (Feathering or Tipping) ---
    { id: 'headless_arrows', name: 'Headless Arrows', level: 1, xp: 15, category: 'Arrows' }, // Per set of 15? No, usually per action. 15 arrows per action? Need verify. 1 xp per arrow.
    { id: 'broad_arrows', name: 'Broad Arrows', level: 52, xp: 10, category: 'Arrows' }, // 10 xp per arrow, usually made in batches of 15 (150 xp drop)
    { id: 'dragon_arrows', name: 'Dragon Arrows', level: 90, xp: 15, category: 'Arrows' }, // 15 xp per arrow -> 225 per 15
    { id: 'rune_arrows', name: 'Rune Arrows', level: 75, xp: 12.5, category: 'Arrows' },
    
    // --- Darts (Fast XP) ---
    { id: 'mithril_dart', name: 'Mithril Dart', level: 52, xp: 11.2, category: 'Darts' },
    { id: 'adamant_dart', name: 'Adamant Dart', level: 67, xp: 15, category: 'Darts' },
    { id: 'rune_dart', name: 'Rune Dart', level: 81, xp: 18.8, category: 'Darts' },
    { id: 'dragon_dart', name: 'Dragon Dart', level: 95, xp: 25, category: 'Darts' },

    // --- Bolts ---
    { id: 'diamond_bolts', name: 'Diamond Bolts (Unfn)', level: 65, xp: 7, category: 'Bolts' }, // Tipping
    { id: 'ruby_bolts', name: 'Ruby Bolts (Unfn)', level: 63, xp: 6.3, category: 'Bolts' },
    { id: 'dragon_bolts', name: 'Dragon Bolts (Unfn)', level: 84, xp: 12, category: 'Bolts' },
    { id: 'ascension_bolts', name: 'Ascension Bolts', level: 90, xp: 20, category: 'Bolts' } // Feathering
];

// Note on Arrows/Darts: The game makes them in batches (sets of 15 arrows, 10 darts).
// However, the input is usually "Actions". 
// Or we can display "Items Needed" vs "Sets Needed".
// Standard calc convention: Show XP per single item creation action?
// For Broad Arrows: 1 action makes 15 arrows. XP is 150.
// For Headless Arrows: 1 action makes 15. XP is 15.
// Let's standardize: The XP listed above should be PER ITEM produced? Or per ACTION?
// "Broad Arrows": 10 XP (per arrow). 
// User buys 15000 arrowheads. 
// Let's adjust XP to be "Per Action" (batch creation) for sanity, or label it clearly.
// Actually, for broad arrows, you click once and make sets. 
// Let's update the Broad Arrows to be PER ACTION (Item: Set of 15 Broad Arrows).

export const FLETCHING_ITEMS_REVISED = [
     // ... Standard Bows ...
     { id: 'short_magic', name: 'Magic Shortbow (Cut)', level: 80, xp: 83.3, category: 'Bows (Cut)' },
     { id: 'str_short_magic', name: 'Magic Shortbow (String)', level: 80, xp: 83.3, category: 'Stringing' },
     
     // ... Batch Items (XP per Action) ...
     { id: 'broad_arrows', name: 'Broad Arrows (Set of 15)', level: 52, xp: 150, category: 'Arrows', amountMade: 15 }, 
     { id: 'headless_arrows', name: 'Headless Arrows (Set of 15)', level: 1, xp: 15, category: 'Arrows', amountMade: 15 },
     { id: 'rune_arrows', name: 'Rune Arrows (Set of 15)', level: 75, xp: 187.5, category: 'Arrows', amountMade: 15 },
     { id: 'dragon_arrows', name: 'Dragon Arrows (Set of 15)', level: 90, xp: 225, category: 'Arrows', amountMade: 15 },
     
     { id: 'rune_dart', name: 'Rune Dart (Set of 10)', level: 81, xp: 188, category: 'Darts', amountMade: 10 },
     { id: 'dragon_dart', name: 'Dragon Dart (Set of 10)', level: 95, xp: 250, category: 'Darts', amountMade: 10 }
];

// Merging concepts into one export for simplicity
export const FLETCHING_DATA = [
    // Cut Bows
    { id: 'short_oak', name: 'Oak Shortbow (Cut)', level: 20, xp: 16.5, category: 'Bows (Cut)' },
    { id: 'long_oak', name: 'Oak Longbow (Cut)', level: 25, xp: 25, category: 'Bows (Cut)' },
    { id: 'short_willow', name: 'Willow Shortbow (Cut)', level: 35, xp: 33.3, category: 'Bows (Cut)' },
    { id: 'long_willow', name: 'Willow Longbow (Cut)', level: 40, xp: 41.5, category: 'Bows (Cut)' },
    { id: 'short_maple', name: 'Maple Shortbow (Cut)', level: 50, xp: 50, category: 'Bows (Cut)' },
    { id: 'long_maple', name: 'Maple Longbow (Cut)', level: 55, xp: 58.3, category: 'Bows (Cut)' },
    { id: 'short_yew', name: 'Yew Shortbow (Cut)', level: 65, xp: 67.5, category: 'Bows (Cut)' },
    { id: 'long_yew', name: 'Yew Longbow (Cut)', level: 70, xp: 75, category: 'Bows (Cut)' },
    { id: 'short_magic', name: 'Magic Shortbow (Cut)', level: 80, xp: 83.3, category: 'Bows (Cut)' },
    { id: 'long_magic', name: 'Magic Longbow (Cut)', level: 85, xp: 91.5, category: 'Bows (Cut)' },
    { id: 'short_elder', name: 'Elder Shortbow (Cut)', level: 90, xp: 108.3, category: 'Bows (Cut)' },
    { id: 'long_elder', name: 'Elder Shieldbow (Cut)', level: 95, xp: 116.6, category: 'Bows (Cut)' },
    
    // String Bows
    { id: 'str_short_maple', name: 'Maple Shortbow (String)', level: 50, xp: 50, category: 'Stringing' },
    { id: 'str_long_maple', name: 'Maple Longbow (String)', level: 55, xp: 58.3, category: 'Stringing' },
    { id: 'str_short_yew', name: 'Yew Shortbow (String)', level: 65, xp: 67.5, category: 'Stringing' },
    { id: 'str_long_yew', name: 'Yew Longbow (String)', level: 70, xp: 75, category: 'Stringing' },
    { id: 'str_short_magic', name: 'Magic Shortbow (String)', level: 80, xp: 83.3, category: 'Stringing' },
    { id: 'str_long_magic', name: 'Magic Longbow (String)', level: 85, xp: 91.5, category: 'Stringing' },
    { id: 'str_short_elder', name: 'Elder Shortbow (String)', level: 90, xp: 108.3, category: 'Stringing' },
    { id: 'str_long_elder', name: 'Elder Shieldbow (String)', level: 95, xp: 116.6, category: 'Stringing' },
    
    // Projectiles (Batch XP)
    { id: 'headless_arrows', name: 'Headless Arrows (x15)', level: 1, xp: 15, category: 'Arrows', amountMade: 15 },
    { id: 'broad_arrows', name: 'Broad Arrows (x15)', level: 52, xp: 150, category: 'Arrows', amountMade: 15 },
    { id: 'rune_arrows', name: 'Rune Arrows (x15)', level: 75, xp: 187.5, category: 'Arrows', amountMade: 15 },
    { id: 'dragon_arrows', name: 'Dragon Arrows (x15)', level: 90, xp: 225, category: 'Arrows', amountMade: 15 },
    { id: 'asc_bolts', name: 'Ascension Bolts (x15)', level: 90, xp: 300, category: 'Bolts', amountMade: 15 }, // Verify XP
    
    { id: 'rune_dart', name: 'Rune Dart (x10)', level: 81, xp: 188, category: 'Darts', amountMade: 10 },
    { id: 'dragon_dart', name: 'Dragon Dart (x10)', level: 95, xp: 250, category: 'Darts', amountMade: 10 }
];

export const FLETCHING_BOOSTS = [
    { id: 'portable_fletcher', name: 'Portable Fletcher', multiplier: 0.1, description: '+10% XP' },
    { id: 'fletching_outfit', name: 'Fletching Outfit', multiplier: 0.06, description: '+6% XP (Master)' },
    { id: 'torstol', name: 'Torstol Incense', multiplier: 0.02, description: '+2% XP' },
    { id: 'clan_avatar', name: 'Clan Avatar', multiplier: 0.06, description: '+6% XP' },
    { id: 'raf', name: 'Refer a Friend', multiplier: 0.1, description: '+10% XP' }
];

