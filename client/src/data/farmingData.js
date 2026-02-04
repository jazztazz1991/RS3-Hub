export const FARMING_CROPS = [
    // --- Trees (Check Health usually main XP) ---
    { id: 'magic', name: 'Magic Tree', level: 75, xp: 13913.8, category: 'Tree' }, // Plant + Check
    { id: 'yew', name: 'Yew Tree', level: 60, xp: 7150.9, category: 'Tree' },
    { id: 'maple', name: 'Maple Tree', level: 45, xp: 3403.4, category: 'Tree' },
    { id: 'willow', name: 'Willow Tree', level: 30, xp: 1456.5, category: 'Tree' },
    { id: 'oak', name: 'Oak Tree', level: 15, xp: 467.3, category: 'Tree' },
    { id: 'elder', name: 'Elder Tree', level: 90, xp: 23463, category: 'Tree' },

    // --- Fruit Trees ---
    { id: 'catherby', name: 'Catherby (Carambola)', level: 100, xp: 18500, category: 'Fruit Tree' }, // 110?
    { id: 'papaya', name: 'Papaya Tree', level: 57, xp: 6146.4, category: 'Fruit Tree' },
    { id: 'palm', name: 'Palm Tree', level: 68, xp: 10150.1, category: 'Fruit Tree' },
    { id: 'dragonfruit', name: 'Dragonfruit Tree', level: 81, xp: 17335, category: 'Fruit Tree' },
    { id: 'guarana', name: 'Guarana Tree', level: 72, xp: 12500, category: 'Fruit Tree' }, // Rough avg check
    { id: 'pineapple', name: 'Pineapple Plant', level: 51, xp: 4607.5, category: 'Fruit Tree' },
    { id: 'banana', name: 'Banana Tree', level: 27, xp: 1750.5, category: 'Fruit Tree' },

    // --- Special ---
    { id: 'calquat', name: 'Calquat Tree', level: 72, xp: 12096, category: 'Special' },
    { id: 'spirit', name: 'Spirit Tree', level: 83, xp: 19301, category: 'Special' },
    { id: 'crystal', name: 'Crystal Tree', level: 94, xp: 50000, category: 'Special' },
    { id: 'tomb_shroom', name: 'Tombshroom', level: 109, xp: 22000, category: 'Special' }, // Varies

    // --- Herbs (Avg per seed assuming ~8 herbs + plant xp) ---
    { id: 'fellstalk', name: 'Fellstalk', level: 91, xp: 1600, category: 'Herb' }, // Est total per patch
    { id: 'torstol', name: 'Torstol', level: 85, xp: 1350, category: 'Herb' },
    { id: 'dwarf', name: 'Dwarf Weed', level: 79, xp: 1100, category: 'Herb' },
    { id: 'lantadyme', name: 'Lantadyme', level: 73, xp: 1000, category: 'Herb' },
    { id: 'cadantine', name: 'Cadantine', level: 67, xp: 900, category: 'Herb' },
    { id: 'snapdragon', name: 'Snapdragon', level: 62, xp: 820, category: 'Herb' },
    { id: 'arbuck', name: 'Arbuck', level: 77, xp: 1050, category: 'Herb' },
    { id: 'spirit_weed', name: 'Spirit Weed', level: 36, xp: 500, category: 'Herb' },

    // --- Allotments (Watermelon/Snape Grass avg per patch) ---
    { id: 'watermelon', name: 'Watermelon (Full Patch)', level: 47, xp: 1000, category: 'Allotment' }, // Rough avg
    { id: 'snape_grass', name: 'Snape Grass (Full Patch)', level: 61, xp: 2500, category: 'Allotment' }
];

export const POF_ANIMALS = [
    // --- Small Pen ---
    { id: 'chin_crystal', name: 'Crystal Chinchompa (Elder)', level: 81, xp: 20000, category: 'Small Pen' }, // 50k base? checking wiki... Crystal chin elder check is huge
    { id: 'chin_red', name: 'Red Chinchompa (Elder)', level: 63, xp: 12500, category: 'Small Pen' },
    { id: 'chin_grey', name: 'Grey Chinchompa (Elder)', level: 54, xp: 8000, category: 'Small Pen' },
    { id: 'rabbit', name: 'Rabbit (Elder)', level: 1, xp: 2500, category: 'Small Pen' },
    { id: 'chicken', name: 'Chicken (Elder)', level: 1, xp: 1650, category: 'Small Pen' },

    // --- Medium Pen ---
    { id: 'spider_ara', name: 'Araxyte Spider (Elder)', level: 92, xp: 45000, category: 'Medium Pen' },
    { id: 'spider_spirit', name: 'Spirit Spider (Elder)', level: 81, xp: 27500, category: 'Medium Pen' },
    { id: 'zygomite', name: 'Zygomite (Elder)', level: 81, xp: 35000, category: 'Medium Pen' },
    { id: 'sheep', name: 'Sheep (Elder)', level: 35, xp: 6000, category: 'Medium Pen' },
    
    // --- Large Pen ---
    { id: 'dragon_royal', name: 'Royal Dragon (Elder)', level: 99, xp: 140000, category: 'Large Pen' }, // High variability, using solid avg
    { id: 'dragon_black', name: 'Black Dragon (Elder)', level: 92, xp: 120000, category: 'Large Pen' },
    { id: 'dragon_blue', name: 'Blue Dragon (Elder)', level: 71, xp: 60000, category: 'Large Pen' }, // Check
    { id: 'yak', name: 'Yak (Elder)', level: 71, xp: 65000, category: 'Large Pen' },
    { id: 'cow', name: 'Cow (Elder)', level: 49, xp: 15000, category: 'Large Pen' },

    // --- ROoT (Dinosaur Farm) ---
    { id: 'bagrada', name: 'Bagrada Rex (Elder)', level: 104, xp: 160000, category: 'Dinosaur' },
    { id: 'corbicula', name: 'Corbicula Rex (Elder)', level: 106, xp: 175000, category: 'Dinosaur' },
    { id: 'spicati', name: 'Spicati Apoterrasaur (Elder)', level: 108, xp: 190000, category: 'Dinosaur' },
    { id: 'malletops', name: 'Malletops (Elder)', level: 112, xp: 240000, category: 'Dinosaur' },
    { id: 'pavoca', name: 'Pavosaurus Rex (Elder)', level: 114, xp: 275000, category: 'Dinosaur' },
    { id: 'brutish', name: 'Brutish Dinosaur (Elder)', level: 99, xp: 110000, category: 'Dinosaur' },
    { id: 'scimitops', name: 'Scimitops (Elder)', level: 100, xp: 125000, category: 'Dinosaur' },
    
    // --- ROoT (Small) ---
    { id: 'frog', name: 'Common Frog (Elder)', level: 42, xp: 10000, category: 'Dinosaur Small' },
    { id: 'salamander', name: 'Salamander (Elder)', level: 102, xp: 25000, category: 'Dinosaur Small' },

     // --- ROoT (Medium) ---
     { id: 'jadinko', name: 'Jadinko (Elder)', level: 90, xp: 35000, category: 'Dinosaur Medium' },
     { id: 'varan', name: 'Varanusaur (Elder)', level: 100, xp: 50000, category: 'Dinosaur Medium' }
];
