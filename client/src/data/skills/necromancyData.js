export const necromancyData = {
    rituals: [
        // Necroplasm (Material Grinding)
        { id: 'lesser_necroplasm', name: "Lesser Necroplasm Ritual", level: 5, xp: 550, category: "Necroplasm", duration: 8.4 }, // XP is approx per ritual completion
        { id: 'greater_necroplasm', name: "Greater Necroplasm Ritual", level: 60, xp: 2200, category: "Necroplasm", duration: 16.8 },
        { id: 'powerful_necroplasm', name: "Powerful Necroplasm Ritual", level: 90, xp: 5500, category: "Necroplasm", duration: 25.2 },
        
        // Essence (Soul Grinding)
        { id: 'commune_1', name: "Commune I (Basic)", level: 5, xp: 600, category: "Commune" },
        { id: 'commune_2', name: "Commune II (Greater)", level: 60, xp: 2500, category: "Commune" },
        { id: 'commune_3', name: "Commune III (Powerful)", level: 90, xp: 6100, category: "Commune" },

        // Ectoplasm
        { id: 'ectoplasm_basic', name: "Basic Ectoplasm Ritual", level: 5, xp: 500, category: "Ectoplasm" },
        { id: 'ectoplasm_powerful', name: "Powerful Ectoplasm Ritual", level: 90, xp: 5800, category: "Ectoplasm" }
    ],
    combat: [
        // Low/Mid
        { id: 'ritual_skeleton', name: "Ritual Skeleton", level: 1, xp: 45, category: "Undead" },
        { id: 'bound_skeleton', name: "Bound Skeleton (POSD)", level: 50, xp: 450, category: "AFK" },
        { id: 'armoured_zombie', name: "Armoured Zombie", level: 70, xp: 650, category: "AFK" },
        
        // High Level
        { id: 'abyssal_savage', name: "Abyssal Savage", level: 95, xp: 1100, category: "Abyssal" },
        { id: 'abyssal_beast', name: "Abyssal Beast", level: 105, xp: 1850, category: "Abyssal" },
        { id: 'phantom_guardian', name: "Phantom Guardian", level: 99, xp: 2800, category: "Undead" },
        { id: 'rasial', name: "Rasial, The First Necromancer", level: 95, xp: 15000, category: "Boss" }
    ]
};