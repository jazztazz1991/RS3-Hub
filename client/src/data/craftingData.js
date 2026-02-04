export const CRAFTING_METHODS = [
    // Gems (Cutting)
    { id: 'cut_opal', name: "Cut Opal", level: 1, xp: 15, category: 'Gems' },
    { id: 'cut_jade', name: "Cut Jade", level: 13, xp: 20, category: 'Gems' },
    { id: 'cut_red_topaz', name: "Cut Red Topaz", level: 16, xp: 25, category: 'Gems' },
    { id: 'cut_sapphire', name: "Cut Sapphire", level: 20, xp: 50, category: 'Gems' },
    { id: 'cut_emerald', name: "Cut Emerald", level: 27, xp: 67.5, category: 'Gems' },
    { id: 'cut_ruby', name: "Cut Ruby", level: 34, xp: 85, category: 'Gems' },
    { id: 'cut_diamond', name: "Cut Diamond", level: 43, xp: 107.5, category: 'Gems' },
    { id: 'cut_dragonstone', name: "Cut Dragonstone", level: 55, xp: 137.5, category: 'Gems' },
    { id: 'cut_onyx', name: "Cut Onyx", level: 67, xp: 167.5, category: 'Gems' },
    { id: 'cut_hydrix', name: "Cut Hydrix", level: 79, xp: 197.5, category: 'Gems' },

    // Leather (Bodies typically best XP/H, but Vambs/Shields exist)
    // We'll stick to Bodies for D'hide as they are standard training
    { id: 'leather_gloves', name: "Leather Gloves", level: 1, xp: 13.8, category: 'Leather' },
    { id: 'leather_boots', name: "Leather Boots", level: 7, xp: 16.2, category: 'Leather' },
    { id: 'leather_cowl', name: "Leather Cowl", level: 9, xp: 18.5, category: 'Leather' },
    { id: 'leather_vambs', name: "Leather Vambraces", level: 11, xp: 22, category: 'Leather' },
    { id: 'leather_body', name: "Leather Body", level: 14, xp: 25, category: 'Leather' },
    { id: 'hard_leather_body', name: "Hard Leather Body", level: 28, xp: 35, category: 'Leather' },
    
    // Dragonhide Bodies (3 leathers)
    { id: 'green_dhide_body', name: "Green D'hide Body", level: 63, xp: 186, category: 'Leather' },
    { id: 'blue_dhide_body', name: "Blue D'hide Body", level: 71, xp: 210, category: 'Leather' },
    { id: 'red_dhide_body', name: "Red D'hide Body", level: 77, xp: 234, category: 'Leather' },
    { id: 'black_dhide_body', name: "Black D'hide Body", level: 84, xp: 258, category: 'Leather' },
    { id: 'royal_dhide_body', name: "Royal D'hide Body", level: 93, xp: 282, category: 'Leather' },
    
    // Dragonhide Shields (2 leathers)
    { id: 'green_dhide_shield', name: "Green D'hide Shield", level: 62, xp: 124, category: 'Leather' },
    { id: 'blue_dhide_shield', name: "Blue D'hide Shield", level: 69, xp: 140, category: 'Leather' },
    { id: 'red_dhide_shield', name: "Red D'hide Shield", level: 76, xp: 156, category: 'Leather' },
    { id: 'black_dhide_shield', name: "Black D'hide Shield", level: 83, xp: 172, category: 'Leather' },

    // Battlestaves (Attaching Orb)
    { id: 'water_battlestaff', name: "Water Battlestaff", level: 54, xp: 100, category: 'Battlestaves' },
    { id: 'earth_battlestaff', name: "Earth Battlestaff", level: 58, xp: 112.5, category: 'Battlestaves' },
    { id: 'fire_battlestaff', name: "Fire Battlestaff", level: 62, xp: 125, category: 'Battlestaves' },
    { id: 'air_battlestaff', name: "Air Battlestaff", level: 66, xp: 137.5, category: 'Battlestaves' },

    // Glassblowing
    { id: 'blow_vial', name: "Vial", level: 33, xp: 35, category: 'Glass' },
    { id: 'blow_orb', name: "Unpowered Orb", level: 46, xp: 52.5, category: 'Glass' },
    { id: 'blow_lantern_lens', name: "Lantern Lens", level: 49, xp: 55, category: 'Glass' },
    { id: 'blow_light_orb', name: "Light Orb", level: 87, xp: 70, category: 'Glass' },
    
    // Flasks (Crystal/Potion)
    { id: 'potion_flask', name: "Potion Flask", level: 89, xp: 100, category: 'Glass' }, // Prif
    { id: 'crystal_flask', name: "Crystal Flask", level: 89, xp: 150, category: 'Glass' }, // Prif with Ithell voice usually

    // Others
    { id: 'haris', name: "Hareralander Tar", level: 44, xp: 37.5, category: 'Other' }, // Sometimes used
    { id: 'decorated_urn', name: "Decorated Urn (Molding)", level: 76, xp: 82, category: 'Urns' }, // Depending on urn type, avg XP
    { id: 'protean_hide', name: "Protean Hide", level: 1, xp: 0, category: 'Protean' }, // Dynamic
];
