// Fishing Data - Fish and Boosts

export const FISHING_ITEMS = [
    // Low Level
    { id: 'crayfish', name: 'Crayfish', level: 1, xp: 10, category: 'Net/Cage' },
    { id: 'shrimp', name: 'Raw Shrimp', level: 1, xp: 10, category: 'Net/Cage' },
    { id: 'sardine', name: 'Raw Sardine', level: 5, xp: 20, category: 'Bait' },
    { id: 'herring', name: 'Raw Herring', level: 10, xp: 30, category: 'Bait' },
    { id: 'anchovies', name: 'Raw Anchovies', level: 15, xp: 40, category: 'Net/Cage' },
    { id: 'trout', name: 'Raw Trout', level: 20, xp: 50, category: 'Fly Fishing' },
    { id: 'salmon', name: 'Raw Salmon', level: 30, xp: 70, category: 'Fly Fishing' },
    { id: 'tuna', name: 'Raw Tuna', level: 35, xp: 80, category: 'Harpoon' },
    { id: 'lobster', name: 'Raw Lobster', level: 40, xp: 90, category: 'Net/Cage' },
    { id: 'swordfish', name: 'Raw Swordfish', level: 50, xp: 100, category: 'Harpoon' },
    
    // Barbarian Fishing (Leaping)
    { id: 'leaping_trout', name: 'Leaping Trout', level: 48, xp: 50, category: 'Barbarian' },
    { id: 'leaping_salmon', name: 'Leaping Salmon', level: 58, xp: 70, category: 'Barbarian' },
    { id: 'leaping_sturgeon', name: 'Leaping Sturgeon', level: 70, xp: 80, category: 'Barbarian' },

    // Mid-High Level
    { id: 'monkfish', name: 'Raw Monkfish', level: 62, xp: 120, category: 'Net/Cage' },
    { id: 'shark', name: 'Raw Shark', level: 76, xp: 110, category: 'Harpoon' }, // Shark is surprisingly low XP per catch compared to speed
    { id: 'cavefish', name: 'Raw Cavefish', level: 85, xp: 300, category: 'Special' },
    { id: 'rocktail', name: 'Raw Rocktail', level: 90, xp: 380, category: 'Special' },
    
    // Prifddinas Waterfall
    { id: 'small_urchin', name: 'Small Crystal Urchin', level: 93, xp: 310, category: 'Waterfall' },
    { id: 'medium_urchin', name: 'Medium Crystal Urchin', level: 95, xp: 330, category: 'Waterfall' },
    { id: 'large_urchin', name: 'Large Crystal Urchin', level: 97, xp: 350, category: 'Waterfall' },

    // Deep Sea Fishing
    { id: 'blue_jelly', name: 'Blue Blubber Jellyfish', level: 91, xp: 390, category: 'Deep Sea' },
    { id: 'sailfish', name: 'Raw Sailfish', level: 97, xp: 400, category: 'Deep Sea' },

    // Menaphos
    { id: 'desert_sole', name: 'Desert Sole', level: 52, xp: 22.5, category: 'Menaphos' },
    { id: 'catfish', name: 'Catfish', level: 60, xp: 25, category: 'Menaphos' },
    { id: 'beltfish', name: 'Beltfish', level: 72, xp: 45, category: 'Menaphos' },
    
    // The Arc
    { id: 'wobbegong', name: 'Wobbegong', level: 96, xp: 682.5, category: 'Arc' },

    // Croesus
    { id: 'fungal_algae', name: 'Fungal Algae (Croesus)', level: 88, xp: 105, category: 'Boss' }, // Note: This is per tick/success, very rapid
];

export const FISHING_BOOSTS = [
    { id: 'urns', name: 'Decorated Urns', multiplier: 0.2, description: '+20% XP (Requires Urns)' },
    { id: 'fishing_outfit', name: 'Fishing Outfit', multiplier: 0.05, description: '+5% XP' },
    { id: 'shark_outfit', name: 'Shark Outfit (Combined)', multiplier: 0.07, description: '+7% XP' },
    { id: 'torstol', name: 'Torstol Incense', multiplier: 0.02, description: '+2% XP' },
    { id: 'clan_avatar', name: 'Clan Avatar', multiplier: 0.06, description: '+6% XP' },
    { id: 'call_of_sea', name: 'Call of the Sea (Aura)', multiplier: 0.0, description: 'Increases catch rate, not XP per fish' },
    { id: 'perfect_juju', name: 'Perfect Juju Potion', multiplier: 0.05, description: '+5% XP (Avg via double catch)' }, // 5% chance to double fish = 5% XP boost roughly
    { id: 'raf', name: 'Refer a Friend', multiplier: 0.1, description: '+10% XP' },
    { id: 'crystallise', name: 'Crystallise', multiplier: 0.875, description: '+87.5% XP (No fish)' }
];
