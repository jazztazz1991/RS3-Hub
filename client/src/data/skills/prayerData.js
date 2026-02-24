// Prayer Data - Bones and Ashes
// Base values for standard Prayer training items

export const PRAYER_ITEMS = [
    { id: 'bones', name: 'Bones', xp: 4.5, category: 'Bones' },
    { id: 'big_bones', name: 'Big Bones', xp: 15, category: 'Bones' },
    { id: 'baby_dragon_bones', name: 'Baby Dragon Bones', xp: 30, category: 'Bones' },
    { id: 'wyvern_bones', name: 'Wyvern Bones', xp: 50, category: 'Bones' },
    { id: 'infernal_ashes', name: 'Infernal Ashes', xp: 62.5, category: 'Ashes' },
    { id: 'dragon_bones', name: 'Dragon Bones', xp: 72, category: 'Bones' },
    { id: 'fayrg_bones', name: 'Fayrg Bones', xp: 84, category: 'Bones' },
    { id: 'tortured_ashes', name: 'Tortured Ashes', xp: 90, category: 'Ashes' },
    { id: 'raurg_bones', name: 'Raurg Bones', xp: 96, category: 'Bones' },
    { id: 'dagannoth_bones', name: 'Dagannoth Bones', xp: 125, category: 'Bones' },
    { id: 'airut_bones', name: 'Airut Bones', xp: 132.5, category: 'Bones' },
    { id: 'ourg_bones', name: 'Ourg Bones', xp: 140, category: 'Bones' },
    { id: 'hardened_dragon_bones', name: 'Hardened Dragon Bones', xp: 144, category: 'Bones' },
    { id: 'dragonkin_bones', name: 'Dragonkin Bones', xp: 160, category: 'Bones' },
    { id: 'dinosaur_bones', name: 'Dinosaur Bones', xp: 170, category: 'Bones' },
    { id: 'frost_dragon_bones', name: 'Frost Dragon Bones', xp: 180, category: 'Bones' },
    { id: 'reinforced_dragon_bones', name: 'Reinforced Dragon Bones', xp: 190, category: 'Bones' },
    { id: 'searing_ashes', name: 'Searing Ashes', xp: 200, category: 'Ashes' }
];

export const PRAYER_METHODS = [
    { id: 'bury', name: 'Bury / Scatter', multiplier: 1.0, description: 'Standard method, no boosts.' },
    { id: 'powder_of_burials', name: 'Powder of Burials', multiplier: 3.5, description: 'Grants 350% XP when burying bones. Lasts 30 mins.' },
    { id: 'gilded_altar', name: 'Gilded Altar (2 Burners)', multiplier: 3.5, description: 'Player Owned House altar with 2 lit burners.' },
    { id: 'chaos_altar', name: 'Chaos Altar (Wilderness)', multiplier: 3.5, description: 'Located in level 12 Wilderness. Equivalent to Gilded Altar.' },
    { id: 'fort_forinthry', name: 'Fort Forinthry Chapel', multiplier: 3.5, description: 'Tier 3 Chapel altar.' },
    { id: 'ectofuntus', name: 'Ectofuntus', multiplier: 4.0, description: 'Requires Ecto-tokens, buckets of slime, and grinding bones.' },
];

export const SPECIAL_ITEMS = [
    { id: 'cleansing_crystal', name: 'Cleansing Crystal (Hefin)', xp: 9800, methods: [
        { id: 'hefin_standard', name: 'Standard', multiplier: 1.0 },
        { id: 'hefin_vos', name: 'Voice of Seren', multiplier: 1.2 }
    ]}
];
