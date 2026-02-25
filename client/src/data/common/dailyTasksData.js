export const DAILY_TASKS = [
    { id: 'vis_wax', name: 'Vis Wax (Rune Goldberg)', category: 'Daily', description: 'Daily rune combination for Vis Wax.' },
    { id: 'daily_challenge', name: 'Daily Challenges', category: 'Daily', description: 'Complete 3 daily challenges for XP lamps and bonus rewards.' },
    { id: 'reaper', name: 'Reaper Task', category: 'Daily', description: 'Complete Soul Reaper assignment from Death.' },
    { id: 'farming_runs', name: 'Farming Runs', category: 'Daily', description: 'Herb patches, tree patches, and flower patches for passive XP and supplies.' },
    { id: 'sandstone', name: 'Red/Crystal Sandstone', category: 'Daily', description: 'Mine sandstone for glass/flasks (Ooglog/Prif).' },
    { id: 'bak_bolts', name: 'Bakriminel Bolts', category: 'Daily', description: 'Cut bloodwood trees for bolt tips.' },
    { id: 'caches', name: 'Guthixian Cache', category: 'Daily', description: 'Divination D&D (200 points daily).' },
    { id: 'sinkholes', name: 'Sinkholes', category: 'Daily', description: 'Dungeoneering D&D (2x per day).' },
    { id: 'big_chinchompa', name: 'Big Chinchompa', category: 'Daily', description: 'Hunter D&D available twice daily for Hunter XP and reward points.' },
    { id: 'traveling_merchant', name: 'Traveling Merchant', category: 'Daily', description: 'Check Deep Sea Fishing hub stock.' },
    { id: 'nemi', name: 'Nemi Forest', category: 'Daily', description: 'Mazcab reputation and XP.' },
    { id: 'wicked_hood', name: 'Wicked Hood', category: 'Daily', description: 'Claim free runes/essence.' },
    { id: 'ports', name: 'Player Owned Ports', category: 'Daily', description: 'Send out ships and check visitors.' },
    {
        id: 'shop_run',
        name: 'Daily Shop Run',
        category: 'Daily',
        description: 'Purchase essential daily supplies from various shops.',
        checklist: [
            'Runes (Elemental / Combination / Nature / Law / Death / Blood / Soul)',
            'Bait & Flies (Pet Shops)',
            'Raw Meat Packs (Oo\'glog)',
            'Broad Arrowheads (Slayer Masters)',
            'Feathers (Fishing Shops)',
            'Vials of Water Packs',
            'Eye of Newt Packs',
            'Pineapples (Arhein - Catherby)'
        ]
    },
];

export const WEEKLY_TASKS = [
    { id: 'penguins', name: 'Penguin Hide & Seek', category: 'Weekly', description: 'Find spies for XP points (resets Wednesday).' },
    { id: 'herby', name: 'Herby Werby', category: 'Weekly', description: 'Herblore D&D on Anachronia.' },
    { id: 'tog', name: 'Tears of Guthix', category: 'Weekly', description: 'XP for your lowest skill.' },
    { id: 'meg', name: 'Meg (Ports)', category: 'Weekly', description: 'Answer adventurer questions.' },
    { id: 'agoroth', name: 'Agoroth', category: 'Weekly', description: 'Two fights for bonus XP pearls.' },
    { id: 'skeletal_horror', name: 'Skeletal Horror', category: 'Weekly', description: 'Slayer XP and Elite Clue.' },
    { id: 'fam_recall', name: 'Familiarisation', category: 'Weekly', description: 'Triple charm drop ticket for 40 minutes.' },
    { id: 'miscellania', name: 'Manage Miscellania', category: 'Weekly', description: 'Refill kingdom coffers to keep resource collection running.' },
];

export const MONTHLY_TASKS = [
    { id: 'oyster', name: 'Giant Oyster', category: 'Monthly', description: 'Fishing/Farming XP and Clue loot.' },
    { id: 'god_statues', name: 'God Statues', category: 'Monthly', description: 'Construction/Prayer XP.' },
    { id: 'troll_invasion', name: 'Troll Invasion', category: 'Monthly', description: 'Defend Burthorpe for XP book.' },
    { id: 'effigy', name: 'Effigy Incubator', category: 'Monthly', description: 'Invention/Various XP (Kerapac lab).' },
];
