export const RC_ALTARS = [
    // --- Elemental ---
    { id: 'air', name: 'Air Rune', level: 1, xp: 5, category: 'Elemental', description: 'Base Elemental' },
    { id: 'mind', name: 'Mind Rune', level: 2, xp: 5.5, category: 'Elemental', description: 'Base Elemental' },
    { id: 'water', name: 'Water Rune', level: 5, xp: 6, category: 'Elemental', description: 'Base Elemental' },
    { id: 'earth', name: 'Earth Rune', level: 9, xp: 6.5, category: 'Elemental', description: 'Base Elemental' },
    { id: 'fire', name: 'Fire Rune', level: 14, xp: 7, category: 'Elemental', description: 'Base Elemental' },
    { id: 'body', name: 'Body Rune', level: 20, xp: 7.5, category: 'Elemental', description: 'Base Elemental' },
    
    // --- Catalytic ---
    { id: 'cosmic', name: 'Cosmic Rune', level: 27, xp: 8, category: 'Catalytic', description: 'Zanaris' },
    { id: 'chaos', name: 'Chaos Rune', level: 35, xp: 8.5, category: 'Catalytic', description: 'Wilderness' },
    { id: 'astral', name: 'Astral Rune', level: 40, xp: 8.7, category: 'Catalytic', description: 'Lunar Isle' },
    { id: 'nature', name: 'Nature Rune', level: 44, xp: 9, category: 'Catalytic', description: 'High profit' },
    { id: 'law', name: 'Law Rune', level: 54, xp: 9.5, category: 'Catalytic', description: 'Entrana' },
    { id: 'death', name: 'Death Rune', level: 65, xp: 10, category: 'Catalytic', description: 'Mournings End' },
    { id: 'blood', name: 'Blood Rune', level: 77, xp: 10.5, category: 'Catalytic', description: 'Morytania' },
    { id: 'soul', name: 'Soul Rune', level: 90, xp: 220, category: 'Catalytic', description: 'Menaphos (High XP/Ess)' }, // Avg per ess considering charge mechanism

    // --- Combination (Approx XP) ---
    { id: 'mist', name: 'Mist Rune', level: 6, xp: 8, category: 'Combination', description: 'Air + Water' },
    { id: 'dust', name: 'Dust Rune', level: 10, xp: 8.3, category: 'Combination', description: 'Air + Earth' },
    { id: 'mud', name: 'Mud Rune', level: 13, xp: 9.3, category: 'Combination', description: 'Water + Earth' },
    { id: 'smoke', name: 'Smoke Rune', level: 15, xp: 8.5, category: 'Combination', description: 'Air + Fire' },
    { id: 'steam', name: 'Steam Rune', level: 19, xp: 9.5, category: 'Combination', description: 'Water + Fire' },
    { id: 'lava', name: 'Lava Rune', level: 23, xp: 10, category: 'Combination', description: 'Earth + Fire' },
    
    // --- Special ---
    { id: 'abyss', name: 'Abyss Runecrafting (Any)', level: 1, xp: 0, category: 'Special', description: 'Use with demonic skull for 3.5x XP' }, // Placeholder for toggle logic maybe
    { id: 'necro', name: 'Necrotic Rune (Bone)', level: 1, xp: 2.5, category: 'Necromancy', description: 'Low Tier' },
    { id: 'flesh', name: 'Flesh Rune', level: 20, xp: 4.5, category: 'Necromancy', description: 'Mid Tier' },
    { id: 'miasma', name: 'Miasma Rune', level: 60, xp: 9.5, category: 'Necromancy', description: 'High Tier' }
];

export const RUNESPAN_NODES = [
    // --- Floor 1 (Low) ---
    { id: 'cyclone', name: 'Cyclone', level: 1, xp: 19, category: 'Floor 1' },
    { id: 'mind_storm', name: 'Mind Storm', level: 5, xp: 20, category: 'Floor 1' },
    { id: 'water_pool', name: 'Water Pool', level: 9, xp: 23.3, category: 'Floor 1' },
    { id: 'rock_frag', name: 'Rock Fragment', level: 14, xp: 28.6, category: 'Floor 1' },
    { id: 'fireball', name: 'Fireball', level: 20, xp: 34.8, category: 'Floor 1' },
    { id: 'vine', name: 'Vine', level: 27, xp: 38.8, category: 'Floor 1' },
    
    // --- Floor 2 (Mid) ---
    { id: 'fleshy', name: 'Fleshy Growth', level: 20, xp: 42.6, category: 'Floor 2' },
    { id: 'fire_storm', name: 'Fire Storm', level: 27, xp: 55.4, category: 'Floor 2' },
    { id: 'chaos_cloud', name: 'Chaos Cloud', level: 35, xp: 62.1, category: 'Floor 2' },
    { id: 'nebula', name: 'Nebula', level: 40, xp: 81.3, category: 'Floor 2' },
    { id: 'shifter', name: 'Shifter', level: 44, xp: 86.8, category: 'Floor 2' },
    { id: 'jumper', name: 'Jumper', level: 54, xp: 107.2, category: 'Floor 2' },
    
    // --- Floor 3 (High) ---
    { id: 'skulls', name: 'Skulls', level: 65, xp: 120, category: 'Floor 3' },
    { id: 'blood_pool', name: 'Blood Pool', level: 77, xp: 146.3, category: 'Floor 3' },
    { id: 'bloody_skulls', name: 'Bloody Skulls', level: 83, xp: 161, category: 'Floor 3' },
    { id: 'living_soul', name: 'Living Soul', level: 90, xp: 213, category: 'Floor 3' },
    { id: 'undead_soul', name: 'Undead Soul', level: 95, xp: 244.5, category: 'Floor 3' }
];
