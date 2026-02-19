export const divinationData = {
    wisps: [
        { id: 'pale', name: "Pale Wisp", level: 1, xp: 6, depositXp: 1, enhancedXp: 1.25, category: "Colony" }, // Abstracted totals
        { id: 'flickering', name: "Flickering Wisp", level: 10, xp: 12, category: "Colony" },
        { id: 'bright', name: "Bright Wisp", level: 20, xp: 20, category: "Colony" },
        { id: 'glowing', name: "Glowing Wisp", level: 30, xp: 32, category: "Colony" },
        { id: 'sparkling', name: "Sparkling Wisp", level: 40, xp: 45, category: "Colony" },
        { id: 'gleaming', name: "Gleaming Wisp", level: 50, xp: 60, category: "Colony" },
        { id: 'vibrant', name: "Vibrant Wisp", level: 60, xp: 72, category: "Colony" },
        { id: 'lustrous', name: "Lustrous Wisp", level: 70, xp: 90, category: "Colony" },
        { id: 'elder', name: "Elder Wisp", level: 75, xp: 105, category: "Colony" }, 
        { id: 'brilliant', name: "Brilliant Wisp", level: 80, xp: 110, category: "Colony" },
        { id: 'radiant', name: "Radiant Wisp", level: 90, xp: 130, category: "Colony" },
        { id: 'incandescent', name: "Incandescent Wisp", level: 95, xp: 155, category: "Colony" },
        { id: 'ancestral', name: "Ancestral Wisp (Arc)", level: 95, xp: 170, category: "Arc" }
    ],
    hall: [
        { id: 'hom_lustrous', name: "Lustrous Core", level: 70, xp: 280, category: "Core" },
        { id: 'hom_brilliant', name: "Brilliant Core", level: 80, xp: 320, category: "Core" },
        { id: 'hom_radiant', name: "Radiant Core", level: 90, xp: 360, category: "Core" },
        { id: 'hom_incandescent', name: "Incandescent Core", level: 95, xp: 400, category: "Core" },
        { id: 'hom_plinth', name: "Knowledge Fragment (Plinth)", level: 70, xp: 42, category: "Fragment" }
    ],
    dailies: [
        { id: 'cache_points', name: "Guthixian Cache (100 pts)", level: 1, xp: 73400, category: "Cache", notes: "XP scales with level" }, 
        // Note: Cache XP is dynamic formula (Level * X). We might need logic for this or just a placeholder estimate at 99.
        // Let's stick to a solid estimate or handle it in logic. 
        // For simplicity in data file, we'll put a base value and handle formula in component if possible, 
        // OR just list "Daily Cache (Lvl 99)"
        { id: 'cache_99', name: "Daily Cache (Level 99)", level: 99, xp: 73400, category: "Cache" },
        { id: 'cache_85', name: "Daily Cache (Level 85)", level: 85, xp: 45000, category: "Cache" },
    ]
};