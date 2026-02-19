// Magic Data - Non-Combat Spells

export const SPELLBOOK_TYPES = {
    STANDARD: 'Standard',
    LUNAR: 'Lunar'
};

export const MAGIC_SPELLS = [
    // Standard - Low Level
    { id: 'enchant_bolt_opal', name: 'Enchant Crossbow Bolt (Opal)', level: 4, xp: 9, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'lvl1_enchant', name: 'Lvl-1 Enchant (Sapphire)', level: 7, xp: 17.5, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bolt_sapphire', name: 'Enchant Crossbow Bolt (Sapphire)', level: 7, xp: 17.5, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'bones_to_bananas', name: 'Bones to Bananas', level: 15, xp: 25, category: 'Transmutation', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'telegrab', name: 'Telekinetic Grab', level: 33, xp: 43, category: 'Utility', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'superheat', name: 'Superheat Item', level: 43, xp: 53, category: 'Alchemy', book: SPELLBOOK_TYPES.STANDARD },
    
    // Standard - Mid Level
    { id: 'lvl3_enchant', name: 'Lvl-3 Enchant (Ruby)', level: 49, xp: 59, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bolt_ruby', name: 'Enchant Crossbow Bolt (Ruby)', level: 49, xp: 59, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'high_alchemy', name: 'High Level Alchemy', level: 55, xp: 65, category: 'Alchemy', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'lvl4_enchant', name: 'Lvl-4 Enchant (Diamond)', level: 57, xp: 67, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bolt_diamond', name: 'Enchant Crossbow Bolt (Diamond)', level: 57, xp: 67, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'bones_to_peaches', name: 'Bones to Peaches', level: 60, xp: 35.5, category: 'Transmutation', book: SPELLBOOK_TYPES.STANDARD },
    
    // Standard - High Level
    { id: 'lvl5_enchant', name: 'Lvl-5 Enchant (Dragonstone)', level: 68, xp: 78, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bolt_dragonstone', name: 'Enchant Crossbow Bolt (Dragonstone)', level: 68, xp: 78, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'lvl6_enchant', name: 'Lvl-6 Enchant (Onyx/Hydrix)', level: 87, xp: 97, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bolt_onyx', name: 'Enchant Crossbow Bolt (Onyx)', level: 87, xp: 97, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },

    // Standard - Bakriminel Bolts (High XP)
    { id: 'enchant_bak_ruby', name: 'Enchant Ruby Bakriminel Bolt', level: 95, xp: 126.4, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bak_diamond', name: 'Enchant Diamond Bakriminel Bolt', level: 96, xp: 127.7, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bak_dragonstone', name: 'Enchant Dragonstone Bakriminel Bolt', level: 97, xp: 129, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bak_onyx', name: 'Enchant Onyx Bakriminel Bolt', level: 98, xp: 130.3, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },
    { id: 'enchant_bak_hydrix', name: 'Enchant Hydrix Bakriminel Bolt', level: 99, xp: 131.6, category: 'Enchantment', book: SPELLBOOK_TYPES.STANDARD },

    // Lunar Spells
    { id: 'string_jewellery', name: 'String Jewellery', level: 80, xp: 83, category: 'Skilling', book: SPELLBOOK_TYPES.LUNAR },
    { id: 'plank_make', name: 'Plank Make', level: 86, xp: 90, category: 'Skilling', book: SPELLBOOK_TYPES.LUNAR },
    { id: 'sift_soil', name: 'Sift Soil', level: 91, xp: 93, category: 'Skilling', book: SPELLBOOK_TYPES.LUNAR },
];
