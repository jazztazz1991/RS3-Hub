// Summoning Calculator Data
// standard: regular pouches made with Gold/Green/Crimson/Blue charms
// ancient: Ancient Summoning pouches (require bound familiars from elite dungeons)
// xp: base XP per pouch; shards: Spirit Shards required; charm: charm type used

export const summoningData = {
    standard: [
        // ── Gold Charms (lowest XP per pouch, most common drop) ──────────────────
        { id: 'spirit_wolf',       name: 'Spirit Wolf',       level: 1,  xp: 4.8,  charm: 'Gold',    shards: 7,   material: 'Wolf Bones' },
        { id: 'dreadfowl',         name: 'Dreadfowl',         level: 4,  xp: 9.3,  charm: 'Gold',    shards: 8,   material: 'Raw Chicken' },
        { id: 'spirit_spider',     name: 'Spirit Spider',     level: 10, xp: 13.5, charm: 'Gold',    shards: 25,  material: 'Red Spider Eggs' },
        { id: 'thorny_snail',      name: 'Thorny Snail',      level: 13, xp: 16.3, charm: 'Gold',    shards: 15,  material: 'Thin Snail' },
        { id: 'granite_crab',      name: 'Granite Crab',      level: 16, xp: 21.6, charm: 'Gold',    shards: 7,   material: 'Iron Ore' },
        { id: 'spirit_mosquito',   name: 'Spirit Mosquito',   level: 17, xp: 22.4, charm: 'Gold',    shards: 7,   material: 'Proboscis' },
        { id: 'honey_badger',      name: 'Honey Badger',      level: 31, xp: 40.8, charm: 'Gold',    shards: 8,   material: 'Honeycomb' },
        { id: 'bull_ant',          name: 'Bull Ant',          level: 40, xp: 52.8, charm: 'Gold',    shards: 9,   material: 'Marigolds' },
        { id: 'spirit_terrorbird', name: 'Spirit Terrorbird', level: 52, xp: 68.4, charm: 'Gold',    shards: 12,  material: 'Raw Bird Meat' },
        { id: 'barker_toad',       name: 'Barker Toad',       level: 66, xp: 87,   charm: 'Gold',    shards: 11,  material: "Toad's Legs" },
        { id: 'fruit_bat',         name: 'Fruit Bat',         level: 69, xp: 90.8, charm: 'Gold',    shards: 10,  material: 'Banana' },
        { id: 'ibis',              name: 'Ibis',              level: 56, xp: 97.4, charm: 'Gold',    shards: 97,  material: 'Raw Tarpon' },

        // ── Green Charms (moderate XP, uncommon drops) ───────────────────────────
        { id: 'desert_wyrm',       name: 'Desert Wyrm',       level: 18, xp: 31.2,  charm: 'Green', shards: 45,  material: 'Bucket of Sand' },
        { id: 'compost_mound',     name: 'Compost Mound',     level: 28, xp: 39.6,  charm: 'Green', shards: 47,  material: 'Compost' },
        { id: 'spirit_scorpion',   name: 'Spirit Scorpion',   level: 43, xp: 59.6,  charm: 'Green', shards: 64,  material: 'Bronze Claws' },
        { id: 'spirit_jelly',      name: 'Spirit Jelly',      level: 55, xp: 80,    charm: 'Green', shards: 151, material: 'Jug of Water' },
        { id: 'bunyip',            name: 'Bunyip',            level: 68, xp: 119.2, charm: 'Green', shards: 110, material: 'Raw Shark' },
        { id: 'macaw',             name: 'Macaw',             level: 72, xp: 112,   charm: 'Green', shards: 118, material: 'Clean Guam' },
        { id: 'unicorn_stallion',  name: 'Unicorn Stallion',  level: 88, xp: 154.4, charm: 'Green', shards: 140, material: 'Unicorn Horn' },
        { id: 'ravenous_locust',   name: 'Ravenous Locust',   level: 70, xp: 130,   charm: 'Green', shards: 120, material: 'Chilli Potato' },

        // ── Crimson Charms (good XP, medium-rare drops) ──────────────────────────
        { id: 'void_ravager',      name: 'Void Ravager',      level: 34, xp: 141.3, charm: 'Crimson', shards: 77,  material: 'Void Seal' },
        { id: 'spirit_weed',       name: 'Spirit Weed',       level: 54, xp: 178.6, charm: 'Crimson', shards: 138, material: 'Clean Spirit Weed' },
        { id: 'smoke_devil',       name: 'Smoke Devil',       level: 61, xp: 212,   charm: 'Crimson', shards: 100, material: 'Mithril Ore' },
        { id: 'strange_plant',     name: 'Strange Plant',     level: 64, xp: 228.6, charm: 'Crimson', shards: 128, material: 'Bagged Plant (1)' },
        { id: 'arctic_bear',       name: 'Arctic Bear',       level: 71, xp: 279.4, charm: 'Crimson', shards: 175, material: 'White Fur' },
        { id: 'granite_lobster',   name: 'Granite Lobster',   level: 74, xp: 325.6, charm: 'Crimson', shards: 166, material: 'Granite (500g)' },
        { id: 'spirit_dagannoth',  name: 'Spirit Dagannoth',  level: 83, xp: 315.8, charm: 'Crimson', shards: 170, material: 'Dagannoth Hide' },
        { id: 'pack_yak',          name: 'Pack Yak',          level: 96, xp: 422.4, charm: 'Crimson', shards: 211, material: 'Yak-hide' },

        // ── Blue Charms (highest XP, rarest drops) ───────────────────────────────
        { id: 'obsidian_golem',    name: 'Obsidian Golem',    level: 73, xp: 645.6, charm: 'Blue', shards: 182, material: 'Obsidian Shard' },
        { id: 'fire_titan',        name: 'Fire Titan',        level: 79, xp: 695.2, charm: 'Blue', shards: 198, material: 'Fire Talisman' },
        { id: 'moss_titan',        name: 'Moss Titan',        level: 79, xp: 695.2, charm: 'Blue', shards: 202, material: 'Earth Talisman' },
        { id: 'ice_titan',         name: 'Ice Titan',         level: 79, xp: 695.2, charm: 'Blue', shards: 198, material: 'Water Talisman' },
        { id: 'abyssal_titan',     name: 'Abyssal Titan',     level: 81, xp: 713.6, charm: 'Blue', shards: 98,  material: 'Abyssal Charm' },
        { id: 'lava_titan',        name: 'Lava Titan',        level: 83, xp: 730.4, charm: 'Blue', shards: 206, material: 'Obsidian Charm' },
        { id: 'geyser_titan',      name: 'Geyser Titan',      level: 89, xp: 783.2, charm: 'Blue', shards: 222, material: 'Water Talisman' },
        { id: 'steel_titan',       name: 'Steel Titan',       level: 99, xp: 435.2, charm: 'Blue', shards: 178, material: 'Steel Platebody' },
    ],

    ancient: [
        // Ancient Summoning pouches – require Binding contracts (bound familiars)
        // obtained from Slayer/elite dungeons; made at the Obelisk of Summoning.
        { id: 'anc_hellhound',       name: 'Hellhound',       level: 68, xp: 350, charm: 'Crimson', shards: 144, material: 'Bound Hellhound' },
        { id: 'anc_waterfiend',      name: 'Waterfiend',      level: 68, xp: 350, charm: 'Crimson', shards: 144, material: 'Bound Waterfiend' },
        { id: 'anc_abomination',     name: 'Abomination',     level: 78, xp: 394, charm: 'Crimson', shards: 180, material: 'Bound Abomination' },
        { id: 'anc_blood_reaver',    name: 'Blood Reaver',    level: 85, xp: 480, charm: 'Blue',    shards: 200, material: 'Bound Blood Reaver' },
        { id: 'anc_smoke_nihil',     name: 'Smoke Nihil',     level: 87, xp: 500, charm: 'Blue',    shards: 205, material: 'Bound Smoke Nihil' },
        { id: 'anc_shadow_nihil',    name: 'Shadow Nihil',    level: 87, xp: 500, charm: 'Blue',    shards: 205, material: 'Bound Shadow Nihil' },
        { id: 'anc_blood_nihil',     name: 'Blood Nihil',     level: 87, xp: 500, charm: 'Blue',    shards: 205, material: 'Bound Blood Nihil' },
        { id: 'anc_ice_nihil',       name: 'Ice Nihil',       level: 87, xp: 500, charm: 'Blue',    shards: 205, material: 'Bound Ice Nihil' },
        { id: 'anc_kalgerion_demon', name: "Kal'gerion Demon",level: 90, xp: 540, charm: 'Blue',    shards: 200, material: "Bound Kal'gerion Demon" },
        { id: 'anc_ripper_demon',    name: 'Ripper Demon',    level: 96, xp: 600, charm: 'Blue',    shards: 211, material: 'Bound Ripper Demon' },
    ],
};
