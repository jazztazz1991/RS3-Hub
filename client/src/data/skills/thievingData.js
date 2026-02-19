export const THIEVING_METHODS = [
    // --- Pickpocketing ---
    { id: 'man', name: 'Man/Woman', level: 1, xp: 8, category: 'Pickpocket' },
    { id: 'farmer', name: 'Farmer', level: 10, xp: 14.5, category: 'Pickpocket' },
    { id: 'ham_female', name: 'H.A.M. Member (Female)', level: 15, xp: 18.5, category: 'Pickpocket' },
    { id: 'ham_male', name: 'H.A.M. Member (Male)', level: 20, xp: 22.5, category: 'Pickpocket' },
    { id: 'warrior', name: 'Warrior', level: 25, xp: 26, category: 'Pickpocket' },
    { id: 'rogue', name: 'Rogue', level: 32, xp: 36.5, category: 'Pickpocket' },
    { id: 'cave_goblin', name: 'Cave Goblin', level: 36, xp: 40, category: 'Pickpocket' },
    { id: 'master_farmer', name: 'Master Farmer', level: 38, xp: 43, category: 'Pickpocket' },
    { id: 'guard', name: 'Guard', level: 40, xp: 46.8, category: 'Pickpocket' },
    { id: 'fremennik', name: 'Fremennik Citizen', level: 45, xp: 65, category: 'Pickpocket' },
    { id: 'desert_bandit', name: 'Desert Bandit', level: 53, xp: 79.5, category: 'Pickpocket' },
    { id: 'knight', name: 'Knight of Ardougne', level: 55, xp: 84.3, category: 'Pickpocket' },
    { id: 'yanille_watchman', name: 'Yanille Watchman', level: 65, xp: 137.5, category: 'Pickpocket' },
    { id: 'menaphite', name: 'Menaphite Thug', level: 65, xp: 137.5, category: 'Pickpocket' },
    { id: 'paladin', name: 'Paladin', level: 70, xp: 151.75, category: 'Pickpocket' },
    { id: 'monkey_knife', name: 'Monkey Knife Fighter', level: 70, xp: 150, // Rapid clicks
      category: 'Pickpocket' },
    { id: 'gnome', name: 'Gnome', level: 75, xp: 198.5, category: 'Pickpocket' },
    { id: 'hero', name: 'Hero', level: 80, xp: 275, category: 'Pickpocket' },
    { id: 'elf_clan', name: 'Prifddinas Workers', level: 91, xp: 350, category: 'Pickpocket' },
    { id: 'crux_eqal', name: 'Crux Eqal Knight', level: 95, xp: 550, category: 'Pickpocket' },

    // --- Stalls ---
    { id: 'veg_stall', name: 'Vegetable Stall', level: 2, xp: 10, category: 'Stall' },
    { id: 'baker', name: 'Baker\'s Stall', level: 5, xp: 16, category: 'Stall' },
    { id: 'tea_stall', name: 'Tea Stall', level: 5, xp: 16, category: 'Stall' },
    { id: 'silk', name: 'Silk Stall', level: 20, xp: 24, category: 'Stall' },
    { id: 'wine', name: 'Wine Stall', level: 22, xp: 27, category: 'Stall' },
    { id: 'seed', name: 'Seed Stall', level: 27, xp: 10, category: 'Stall' },
    { id: 'fur', name: 'Fur Stall', level: 35, xp: 36, category: 'Stall' },
    { id: 'fish', name: 'Fish Stall', level: 42, xp: 42, category: 'Stall' },
    { id: 'cross', name: 'Crossbow Stall', level: 49, xp: 52, category: 'Stall' },
    { id: 'magic', name: 'Magic Stall', level: 65, xp: 100, category: 'Stall' },
    { id: 'scimitar', name: 'Scimitar Stall', level: 65, xp: 160, category: 'Stall' },
    { id: 'spice', name: 'Spice Stall', level: 65, xp: 81, category: 'Stall' },
    { id: 'gem', name: 'Gem Stall', level: 75, xp: 160, category: 'Stall' },

    // --- Safecracking ---
    { id: 'safe_novice', name: 'Safe (Novice / Level 62+)', level: 62, xp: 600, category: 'Safecracking' },
    { id: 'safe_intermediate', name: 'Safe (Intermediate / Level 76+)', level: 76, xp: 950, category: 'Safecracking' },
    { id: 'safe_advanced', name: 'Safe (Advanced / Level 83+)', level: 83, xp: 1400, category: 'Safecracking' },
    { id: 'safe_expert', name: 'Safe (Expert / Level 90+)', level: 90, xp: 2200, category: 'Safecracking' },
    { id: 'safe_wildy', name: 'Wilderness Safe (Level 90+)', level: 90, xp: 3500, category: 'Safecracking' }, // With bonuses roughly

    // --- Activities ---
    { id: 'plunder_1', name: 'Pyramid Plunder (Room 1 Urns)', level: 21, xp: 15, category: 'Plunder' },
    { id: 'plunder_2', name: 'Pyramid Plunder (Room 2 Urns)', level: 31, xp: 30, category: 'Plunder' },
    { id: 'plunder_3', name: 'Pyramid Plunder (Room 3 Urns)', level: 41, xp: 45, category: 'Plunder' },
    { id: 'plunder_4', name: 'Pyramid Plunder (Room 4 Urns)', level: 51, xp: 65, category: 'Plunder' },
    { id: 'plunder_5', name: 'Pyramid Plunder (Room 5 Urns)', level: 61, xp: 90, category: 'Plunder' },
    { id: 'plunder_6', name: 'Pyramid Plunder (Room 6 Urns)', level: 71, xp: 125, category: 'Plunder' },
    { id: 'plunder_7', name: 'Pyramid Plunder (Room 7 Urns)', level: 81, xp: 175, category: 'Plunder' },
    { id: 'plunder_8', name: 'Pyramid Plunder (Room 8 Urns)', level: 91, xp: 275, category: 'Plunder' },
    { id: 'croesus', name: 'Croesus (Sticky Fingers)', level: 88, xp: 400, category: 'Activity' }
];
