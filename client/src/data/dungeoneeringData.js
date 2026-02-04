export const dungeoneeringData = {
    floors: [
        // Rushing
        { id: 'rush_c1', name: "C1 Rush (Frozen/Aban)", level: 1, xp: 800, category: "Rushing", floorType: "Frozen/Aban" },
        { id: 'rush_c6_small', name: "C6 Small Rush", level: 1, xp: 4500, category: "Rushing", floorType: "Any" },
        
        // Solo
        { id: 'c6_med_frozen', name: "C6 Med (Frozen 1-11)", level: 1, xp: 7500, category: "Solo", floorType: "Frozen" },
        { id: 'c6_med_aban', name: "C6 Med (Abandoned 12-29)", level: 23, xp: 17000, category: "Solo", floorType: "Abandoned" },
        { id: 'c6_med_furn', name: "C6 Med (Furnished 30-35)", level: 59, xp: 32000, category: "Solo", floorType: "Furnished" },
        { id: 'c6_med_occ', name: "C6 Med (Occult 36-47)", level: 71, xp: 55000, category: "Solo", floorType: "Occult" },
        { id: 'c6_med_warp', name: "C6 Med (Warped 48-60)", level: 95, xp: 85000, category: "Solo", floorType: "Warped" },
        
        // Solo Large (Guide Mode etc)
        { id: 'c6_large_occ_solo', name: "C6 Large Solo (Occult)", level: 71, xp: 85000, category: "Solo-Large", floorType: "Occult" },
        { id: 'c6_large_warp_solo', name: "C6 Large Solo (Warped)", level: 95, xp: 130000, category: "Solo-Large", floorType: "Warped" },

        // Team (5-Man averages)
        { id: '5man_large_ab2', name: "5-Man Large (Aban 2)", level: 29, xp: 55000, category: "Team", floorType: "Abandoned 2" },
        { id: '5man_large_furn', name: "5-Man Large (Furnished)", level: 59, xp: 95000, category: "Team", floorType: "Furnished" },
        { id: '5man_large_occ', name: "5-Man Large (Occult)", level: 71, xp: 180000, category: "Team", floorType: "Occult" },
        { id: '5man_large_warp', name: "5-Man Large (Warped)", level: 95, xp: 250000, category: "Team", floorType: "Warped" },
    ],
    elite: [
        // ED1
        { id: 'ed1_run', name: "ED1 Full Run (Temple of Aminishi)", level: 90, xp: 140000, category: "ED1", notes: "Tokens + XP" },
        { id: 'ed1_mini', name: "ED1 Token Farm", level: 80, xp: 8000, category: "ED1", notes: "Tokens mainly" },
        
        // ED2
        { id: 'ed2_run', name: "ED2 Full Run (Dragonkin Lab)", level: 85, xp: 95000, category: "ED2", notes: "Codex + XP" },
        
        // ED3
        { id: 'ed3_run', name: "ED3 Full Run (Shadow Reef)", level: 95, xp: 180000, category: "ED3", notes: "Fastest ED XP" },
        { id: 'ed3_trash', name: "ED3 Trash Run (Start Only)", level: 70, xp: 2500, category: "ED3", notes: "Mainly Combat XP" },

        // Dailies
        { id: 'sinkhole', name: "Sinkhole (Good Game)", level: 50, xp: 85000, category: "Dailies", notes: "Daily D&D" },
        { id: 'daily_challenge', name: "Daily Challenge (Ext)", level: 99, xp: 210000, category: "Dailies", notes: "Lvl 99 Scale" },
    ]
};