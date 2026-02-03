// Cooking Data - Food and Methods

export const COOKING_ITEMS = [
    // Low Level
    { id: 'crayfish', name: 'Crayfish', level: 1, xp: 30, category: 'Fish' },
    { id: 'shrimp', name: 'Shrimp', level: 1, xp: 30, category: 'Fish' },
    { id: 'anchovies', name: 'Anchovies', level: 1, xp: 30, category: 'Fish' },
    { id: 'sardine', name: 'Sardine', level: 1, xp: 40, category: 'Fish' },
    { id: 'herring', name: 'Herring', level: 5, xp: 50, category: 'Fish' },
    { id: 'trout', name: 'Trout', level: 15, xp: 70, category: 'Fish' },
    { id: 'salmon', name: 'Salmon', level: 25, xp: 90, category: 'Fish' },
    { id: 'sweetcorn', name: 'Sweetcorn', level: 28, xp: 104, category: 'Vegetable' },
    { id: 'tuna', name: 'Tuna', level: 30, xp: 100, category: 'Fish' },
    
    // Mid Level
    { id: 'jug_of_wine', name: 'Jug of Wine', level: 35, xp: 200, category: 'Drink' }, // Often cited as 200 or 201
    { id: 'lobster', name: 'Lobster', level: 40, xp: 120, category: 'Fish' },
    { id: 'swordfish', name: 'Swordfish', level: 45, xp: 140, category: 'Fish' },
    { id: 'cheese_potato', name: 'Potato with Cheese', level: 47, xp: 199.5, category: 'Vegetable' },
    { id: 'desert_sole', name: 'Desert Sole', level: 52, xp: 142.5, category: 'Fish' },
    { id: 'catfish', name: 'Catfish', level: 60, xp: 145, category: 'Fish' },
    { id: 'monkfish', name: 'Monkfish', level: 62, xp: 150, category: 'Fish' },
    
    // High Level
    { id: 'beltfish', name: 'Beltfish', level: 72, xp: 180, category: 'Fish' },
    { id: 'shark', name: 'Shark', level: 80, xp: 210, category: 'Fish' },
    { id: 'cavefish', name: 'Cavefish', level: 88, xp: 214, category: 'Fish' },
    { id: 'rocktail', name: 'Rocktail', level: 93, xp: 225, category: 'Fish' },
    { id: 'blue_jelly', name: 'Blue Blubber Jellyfish', level: 95, xp: 235, category: 'Fish' },
    { id: 'sailfish', name: 'Sailfish', level: 99, xp: 270, category: 'Fish' },
    { id: 'primal_feast', name: 'Primal Feast', level: 115, xp: 1000, category: 'Special' }
];

export const COOKING_METHODS = [
    { id: 'standard', name: 'Standard Range/Fire', multiplier: 1.0, description: 'Normal cooking method.' },
    { id: 'portable_range', name: 'Portable Range', multiplier: 1.1, description: 'Portable station (+10% Base XP).' },
    { id: 'urns', name: 'Standard + Urns', multiplier: 1.2, description: 'Adds ~20% bonus XP via urns.' },
    { id: 'portable_urns', name: 'Portable Range + Urns', multiplier: 1.32, description: 'Combined portable and urn bonuses.' }
    // 1.1 * 1.2 = 1.32 approx effective
];
