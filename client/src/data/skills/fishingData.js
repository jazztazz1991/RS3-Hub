// Fishing Data - Fish and Boosts

export const FISHING_ITEMS = [
    { id: 'shrimp', name: 'Shrimp', level: 1, xp: 10.0, category: 'Net' },
    { id: 'crayfish', name: 'Crayfish', level: 1, xp: 10.0, category: 'Cage' },
    { id: 'sardine', name: 'Sardine', level: 5, xp: 20.0, category: 'Bait' },
    { id: 'herring', name: 'Herring', level: 10, xp: 30.0, category: 'Bait' },
    { id: 'anchovies', name: 'Anchovies', level: 15, xp: 40.0, category: 'Net' },
    { id: 'mackerel', name: 'Mackerel', level: 16, xp: 20.0, category: 'Net' },
    { id: 'trout', name: 'Trout', level: 20, xp: 50.0, category: 'Fly Fishing' },
    { id: 'cod', name: 'Cod', level: 23, xp: 45.0, category: 'Net' },
    { id: 'pike', name: 'Pike', level: 25, xp: 60.0, category: 'Bait' },
    { id: 'salmon', name: 'Salmon', level: 30, xp: 70.0, category: 'Fly Fishing' },
    { id: 'tuna', name: 'Tuna', level: 35, xp: 80.0, category: 'Harpoon' },
    { id: 'rainbow_fish', name: 'Rainbow fish', level: 38, xp: 80.0, category: 'Fly Fishing' },
    { id: 'lobster', name: 'Lobster', level: 40, xp: 90.0, category: 'Cage' },
    { id: 'bass', name: 'Bass', level: 46, xp: 100.0, category: 'Net' },
    { id: 'leaping_trout', name: 'Leaping trout', level: 48, xp: 60.0, category: 'Barbarian' },
    { id: 'swordfish', name: 'Swordfish', level: 50, xp: 100.0, category: 'Harpoon' },
    { id: 'desert_sole', name: 'Desert sole', level: 52, xp: 60.0, category: 'Bait' },
    { id: 'leaping_salmon', name: 'Leaping salmon', level: 58, xp: 82.0, category: 'Barbarian' },
    { id: 'catfish', name: 'Catfish', level: 60, xp: 85.0, category: 'Bait' },
    { id: 'monkfish', name: 'Monkfish', level: 62, xp: 120.0, category: 'Net' },
    { id: 'ghostly_sole', name: 'Ghostly sole', level: 66, xp: 130.0, category: 'Bait' },
    { id: 'green_blubber_jellyfish', name: 'Green blubber jellyfish', level: 68, xp: 165.0, category: 'Bait' },
    { id: 'leaping_sturgeon', name: 'Leaping sturgeon', level: 70, xp: 92.0, category: 'Barbarian' },
    { id: 'beltfish', name: 'Beltfish', level: 72, xp: 92.0, category: 'Bait' },
    { id: 'shark', name: 'Shark', level: 76, xp: 110.0, category: 'Harpoon' },
    { id: 'sea_turtle', name: 'Sea turtle', level: 79, xp: 240.0, category: 'Bait' },
    { id: 'manta_ray', name: 'Manta ray', level: 81, xp: 200.0, category: 'Bait' },
    { id: 'cavefish', name: 'Cavefish', level: 85, xp: 300.0, category: 'Bait' },
    { id: 'fungal_algae', name: 'Fungal algae', level: 88, xp: 105.0, category: 'Boss' },
    { id: 'rocktail', name: 'Rocktail', level: 90, xp: 380.0, category: 'Other' },
    { id: 'blue_blubber_jellyfish', name: 'Blue blubber jellyfish', level: 91, xp: 390.0, category: 'Bait' },
    { id: 'enriched_fungal_algae', name: 'Enriched fungal algae', level: 92, xp: 145.0, category: 'Boss' },
    { id: 'sailfish', name: 'Sailfish', level: 97, xp: 400.0, category: 'Bait' },
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
