// Construction Calculator Data
// Standard mode: items built in your own POH
// Contracts mode: items commonly assigned via Construction Contracts D&D

const constructionData = {
    standard: [
        // ── Furniture ──────────────────────────────────────────────────────────────
        { id: 'crude_wooden_chair',   name: 'Crude Wooden Chair',   level: 1,  xp: 29,   category: 'Furniture', materials: '1 Plank' },
        { id: 'wooden_chair',         name: 'Wooden Chair',         level: 8,  xp: 58,   category: 'Furniture', materials: '2 Planks' },
        { id: 'rocking_chair',        name: 'Rocking Chair',        level: 14, xp: 87,   category: 'Furniture', materials: '3 Planks' },
        { id: 'oak_chair',            name: 'Oak Chair',            level: 19, xp: 120,  category: 'Furniture', materials: '2 Oak Planks' },
        { id: 'oak_dining_table',     name: 'Oak Dining Table',     level: 22, xp: 240,  category: 'Furniture', materials: '4 Oak Planks' },
        { id: 'carved_oak_table',     name: 'Carved Oak Table',     level: 31, xp: 360,  category: 'Furniture', materials: '6 Oak Planks' },
        { id: 'teak_table',           name: 'Teak Table',           level: 38, xp: 360,  category: 'Furniture', materials: '4 Teak Planks' },
        { id: 'carved_teak_table',    name: 'Carved Teak Table',    level: 45, xp: 540,  category: 'Furniture', materials: '6 Teak Planks' },
        { id: 'mahogany_dining_table',name: 'Mahogany Dining Table',level: 52, xp: 840,  category: 'Furniture', materials: '6 Mahogany Planks' },
        { id: 'gilded_dining_table',  name: 'Gilded Dining Table',  level: 80, xp: 1170, category: 'Furniture', materials: '8 Mahogany Planks, 4 Gold Leaves' },

        // ── Storage ─────────────────────────────────────────────────────────────────
        { id: 'wooden_bookcase',      name: 'Wooden Bookcase',      level: 4,  xp: 116,  category: 'Storage', materials: '4 Planks' },
        { id: 'oak_bookcase',         name: 'Oak Bookcase',         level: 19, xp: 180,  category: 'Storage', materials: '3 Oak Planks' },
        { id: 'oak_larder',           name: 'Oak Larder',           level: 33, xp: 480,  category: 'Storage', materials: '8 Oak Planks' },
        { id: 'teak_larder',          name: 'Teak Larder',          level: 43, xp: 750,  category: 'Storage', materials: '8 Teak Planks, 1 Steel Bar' },
        { id: 'mahogany_bookcase',    name: 'Mahogany Bookcase',    level: 40, xp: 560,  category: 'Storage', materials: '4 Mahogany Planks' },
        { id: 'mahogany_wardrobe',    name: 'Mahogany Wardrobe',    level: 64, xp: 840,  category: 'Storage', materials: '6 Mahogany Planks' },

        // ── Kitchen / Functional ────────────────────────────────────────────────────
        { id: 'wooden_range',         name: 'Wooden Range',         level: 7,  xp: 57,   category: 'Kitchen', materials: '3 Planks, 1 Steel Bar' },
        { id: 'oak_range',            name: 'Oak Range',            level: 26, xp: 240,  category: 'Kitchen', materials: '4 Oak Planks' },
        { id: 'mahogany_range',       name: 'Mahogany Range',       level: 42, xp: 420,  category: 'Kitchen', materials: '3 Mahogany Planks, 4 Steel Bars' },

        // ── Altars ──────────────────────────────────────────────────────────────────
        { id: 'oak_altar',            name: 'Oak Altar',            level: 45, xp: 280,  category: 'Altar', materials: '4 Oak Planks, 2 Bolt of Cloth' },
        { id: 'teak_altar',           name: 'Teak Altar',           level: 55, xp: 420,  category: 'Altar', materials: '4 Teak Planks, 2 Bolt of Cloth' },
        { id: 'mahogany_altar',       name: 'Mahogany Altar',       level: 70, xp: 1010, category: 'Altar', materials: '4 Mahogany Planks, 2 Marble Blocks' },
        { id: 'gilded_altar',         name: 'Gilded Altar',         level: 75, xp: 1170, category: 'Altar', materials: '4 Mahogany Planks, 2 Marble Blocks, 4 Gold Leaves' },

        // ── Decorations ─────────────────────────────────────────────────────────────
        { id: 'small_rug',            name: 'Small Rug',            level: 2,  xp: 60,   category: 'Decoration', materials: '2 Bolt of Cloth' },
        { id: 'large_rug',            name: 'Large Rug',            level: 13, xp: 120,  category: 'Decoration', materials: '4 Bolt of Cloth' },
        { id: 'opulent_rug',          name: 'Opulent Rug',          level: 65, xp: 240,  category: 'Decoration', materials: '8 Bolt of Cloth' },

        // ── Dungeon ─────────────────────────────────────────────────────────────────
        { id: 'oak_door',             name: 'Oak Door',             level: 20, xp: 120,  category: 'Dungeon', materials: '2 Oak Planks' },
        { id: 'teak_door',            name: 'Teak Door',            level: 39, xp: 180,  category: 'Dungeon', materials: '2 Teak Planks' },
        { id: 'steel_portcullis',     name: 'Steel Portcullis',     level: 74, xp: 200,  category: 'Dungeon', materials: '4 Steel Bars' },

        // ── Portals ─────────────────────────────────────────────────────────────────
        { id: 'portal',               name: 'Portal',               level: 50, xp: 350,  category: 'Portal', materials: '10 Limestone Bricks, 1 Marble Block' },
        { id: 'fancy_portal',         name: 'Fancy Portal',         level: 65, xp: 500,  category: 'Portal', materials: '10 Limestone Bricks, 2 Marble Blocks' },

        // ── Special (Pyre Ships) ─────────────────────────────────────────────────────
        { id: 'log_pyre_ship',        name: 'Log Pyre Ship',        level: 30, xp: 90,   category: 'Special', materials: '8 Planks, 8 Logs' },
        { id: 'oak_pyre_ship',        name: 'Oak Pyre Ship',        level: 40, xp: 240,  category: 'Special', materials: '8 Oak Planks, 8 Oak Logs' },
        { id: 'teak_pyre_ship',       name: 'Teak Pyre Ship',       level: 50, xp: 360,  category: 'Special', materials: '8 Teak Planks, 8 Teak Logs' },
        { id: 'mahogany_pyre_ship',   name: 'Mahogany Pyre Ship',   level: 60, xp: 560,  category: 'Special', materials: '8 Mahogany Planks, 8 Mahogany Logs' },
        { id: 'flotsam_pyre_ship',    name: 'Flotsam Pyre Ship',    level: 77, xp: 5000, category: 'Special', materials: '120 Teak Planks, 5 Planks, 7 Steel Bars' },
    ],

    contracts: [
        // Items commonly assigned by Construction Contracts (Elise D&D)
        // Includes standard build XP; calculator modifiers (outfit, chisel) are applied on top

        // ── Furniture ──────────────────────────────────────────────────────────────
        { id: 'oak_dining_table_c',      name: 'Oak Dining Table',      level: 22, xp: 240,  category: 'Furniture', materials: '4 Oak Planks' },
        { id: 'carved_oak_table_c',      name: 'Carved Oak Table',      level: 31, xp: 360,  category: 'Furniture', materials: '6 Oak Planks' },
        { id: 'teak_table_c',            name: 'Teak Table',            level: 38, xp: 360,  category: 'Furniture', materials: '4 Teak Planks' },
        { id: 'carved_teak_table_c',     name: 'Carved Teak Table',     level: 45, xp: 540,  category: 'Furniture', materials: '6 Teak Planks' },
        { id: 'mahogany_dining_table_c', name: 'Mahogany Dining Table', level: 52, xp: 840,  category: 'Furniture', materials: '6 Mahogany Planks' },
        { id: 'gilded_dining_table_c',   name: 'Gilded Dining Table',   level: 80, xp: 1170, category: 'Furniture', materials: '8 Mahogany Planks, 4 Gold Leaves' },

        // ── Storage ─────────────────────────────────────────────────────────────────
        { id: 'oak_larder_c',            name: 'Oak Larder',            level: 33, xp: 480,  category: 'Storage', materials: '8 Oak Planks' },
        { id: 'teak_larder_c',           name: 'Teak Larder',           level: 43, xp: 750,  category: 'Storage', materials: '8 Teak Planks, 1 Steel Bar' },
        { id: 'mahogany_bookcase_c',     name: 'Mahogany Bookcase',     level: 40, xp: 560,  category: 'Storage', materials: '4 Mahogany Planks' },
        { id: 'mahogany_wardrobe_c',     name: 'Mahogany Wardrobe',     level: 64, xp: 840,  category: 'Storage', materials: '6 Mahogany Planks' },

        // ── Altars ──────────────────────────────────────────────────────────────────
        { id: 'oak_altar_c',             name: 'Oak Altar',             level: 45, xp: 280,  category: 'Altar', materials: '4 Oak Planks, 2 Bolt of Cloth' },
        { id: 'teak_altar_c',            name: 'Teak Altar',            level: 55, xp: 420,  category: 'Altar', materials: '4 Teak Planks, 2 Bolt of Cloth' },
        { id: 'mahogany_altar_c',        name: 'Mahogany Altar',        level: 70, xp: 1010, category: 'Altar', materials: '4 Mahogany Planks, 2 Marble Blocks' },
        { id: 'gilded_altar_c',          name: 'Gilded Altar',          level: 75, xp: 1170, category: 'Altar', materials: '4 Mahogany Planks, 2 Marble Blocks, 4 Gold Leaves' },

        // ── Special ─────────────────────────────────────────────────────────────────
        { id: 'flotsam_pyre_ship_c',     name: 'Flotsam Pyre Ship',     level: 77, xp: 5000, category: 'Special', materials: '120 Teak Planks, 5 Planks, 7 Steel Bars' },
    ],
};

export default constructionData;
