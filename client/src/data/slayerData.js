export const SLAYER_MASTERS = [
    {
        id: 'laniakea',
        name: 'Laniakea (Anachronia)',
        level: 90,
        avgXp: 75000, 
        description: 'Highest level master. Great for cluster tasks.'
    },
    {
        id: 'mandrith',
        name: 'Mandrith (Wilderness)',
        level: 85,
        avgXp: 95000,
        description: 'Wilderness tasks. High risk, high average XP.'
    },
    {
        id: 'morvran',
        name: 'Morvran (Prifddinas)',
        level: 85,
        avgXp: 60000,
        description: 'Standard high-level master.'
    },
    {
        id: 'kuradal',
        name: 'Kuradal',
        level: 75,
        avgXp: 45000,
        description: 'Ancient Cavern dungeon tasks.'
    },
    {
        id: 'sumona',
        name: 'Sumona',
        level: 35,
        avgXp: 25000,
        description: 'Pollnivneach specialized tasks.'
    },
    {
        id: 'vannaka',
        name: 'Vannaka',
        level: 30, // combat lvl rq
        avgXp: 8000,
        description: 'Mid-level training.'
    },
    {
        id: 'jacquelyn',
        name: 'Jacquelyn',
        level: 1,
        avgXp: 200,
        description: 'Point boosting (Tasks take ~1 min).'
    }
];

export const SLAYER_MONSTERS = [
    // --- High Tier ---
    { id: 'skull_fould', name: 'Acheron Mammoths', xp: 2695, category: 'Elite' },
    { id: 'ripper', name: 'Ripper Demons', xp: 2555, category: 'Elite' },
    { id: 'camel', name: 'Camel Warriors', xp: 2450, category: 'Elite' },
    { id: 'wyvern', name: 'Living Wyverns', xp: 2200, category: 'Elite' },
    { id: 'hydrix', name: 'Hydrix Dragons', xp: 1980, category: 'Dragons' },
    { id: 'moss_golem', name: 'Moss Golems', xp: 1350, category: 'Lost Grove' },
    { id: 'bulbous', name: 'Bulbous Crawlers', xp: 1250, category: 'Lost Grove' },
    
    // --- Abyssal ---
    { id: 'aby_lord', name: 'Abyssal Lords', xp: 4800, category: 'Abyssal' },
    { id: 'aby_savage', name: 'Abyssal Savages', xp: 850, category: 'Abyssal' },
    { id: 'aby_beast', name: 'Abyssal Beasts', xp: 1400, category: 'Abyssal' },
    { id: 'aby_demon', name: 'Abyssal Demons', xp: 285.6, category: 'Abyssal' },

    // --- Sophanem ---
    { id: 'soul_devourer', name: 'Soul Devourers (Avg)', xp: 1000, category: 'Sophanem' },
    { id: 'imperial_g', name: 'Imperial Guard (Akh)', xp: 1600, category: 'Sophanem' },
    { id: 'salawa', name: 'Salawa Akh', xp: 875, category: 'Sophanem' },
    { id: 'corrupted', name: 'Corrupted Creatures (Avg)', xp: 550, category: 'Sophanem' },
    { id: 'corrupted_worker', name: 'Corrupted Worker', xp: 620, category: 'Sophanem' },

    // --- Common High Lvl ---
    { id: 'kalgerion', name: 'Kalgerion Demons', xp: 1485, category: 'Common' },
    { id: 'gemstone', name: 'Gemstone Dragon (Hydrix)', xp: 1980, category: 'Dragons' },
    { id: 'dark_beast', name: 'Dark Beasts', xp: 285, category: 'Common' },
    { id: 'airut', name: 'Airut', xp: 580, category: 'Common' },
    { id: 'ganodermic', name: 'Ganodermic Beasts', xp: 595, category: 'Common' },
    { id: 'crystal_shape', name: 'Crystal Shapeshifters', xp: 1150, category: 'Common' },
    { id: 'shadow_creature', name: 'Shadow Creatures (Truth)', xp: 450, category: 'Common' },
    { id: 'nightmare', name: 'Nightmare Creatures', xp: 1380, category: 'Common' },
    { id: 'nodon', name: 'Nodon Dragonkin', xp: 1100, category: 'Elder God Wars' },
    { id: 'glacor', name: 'Glacors', xp: 1125, category: 'Elite' },
    
    // --- Mid Tier ---
    { id: 'gargoyle', name: 'Gargoyles', xp: 105, category: 'Mid' },
    { id: 'bloodveld', name: 'Bloodveld', xp: 120, category: 'Mid' },
    { id: 'vyrewatch', name: 'Vyrewatch', xp: 125, category: 'Mid' },
    { id: 'dust_devil', name: 'Dust Devils', xp: 105, category: 'Mid' },
    { id: 'aberrant', name: 'Aberrant Spectres', xp: 90, category: 'Mid' }
];
