// Reasonable best-practical XP-per-hour rates per skill. These are
// community consensus midpoints — players can match higher with peak
// effort + gear or slower if AFK / undergeared. For v1 we use a single
// rate per skill; later we can split into AFK vs tryhard lanes.
//
// Combat skills assume Necromancy-era Slayer / mass kill methods (~1M/hr).
// Buyables assume modern best methods (Herblore = overloads with portable
// well, Construction = mahogany trees, Prayer = dragon-bone altar, etc).
export const DEFAULT_XP_PER_HOUR = {
    Attack:        1100000,
    Defence:       1100000,
    Strength:      1100000,
    Constitution:  1100000,
    Ranged:        1000000,
    Prayer:        1500000,
    Magic:         1000000,
    Cooking:        800000,
    Woodcutting:    500000,
    Fletching:      800000,
    Fishing:        350000,
    Firemaking:     700000,
    Crafting:      1000000,
    Smithing:       600000,
    Mining:         500000,
    Herblore:      1200000,
    Agility:        250000,
    Thieving:       700000,
    Slayer:         400000,
    Farming:        500000,
    Runecrafting:   500000,
    Hunter:         600000,
    Construction:  1200000,
    Summoning:     1000000,
    Dungeoneering:  500000,
    Divination:     400000,
    Invention:      600000,
    Archaeology:    600000,
    Necromancy:     800000,
};

// Goal presets. Each preset maps skill name -> target XP (absolute).
// "all" is shorthand applied to every skill in DEFAULT_XP_PER_HOUR.
export const GOAL_PRESETS = [
    {
        id: 'max',
        name: 'Max (99 all)',
        description: 'Level 99 in every skill — 13,034,431 XP × 28 skills.',
        targetXpAll: 13034431,
    },
    {
        id: '120-elite',
        name: '120 Elite (Elite skills)',
        description: 'Level 120 in elite skills (Invention, Slayer, Farming, Herblore, Archaeology, Dungeoneering, Necromancy). 99 elsewhere.',
        targetXpPerSkill: {
            Invention: 80618654,
            Slayer:    104273167,
            Farming:   104273167,
            Herblore:  104273167,
            Archaeology: 104273167,
            Dungeoneering: 104273167,
            Necromancy: 104273167,
        },
        defaultTargetXp: 13034431,
    },
    {
        id: '120-all',
        name: '120 All',
        description: 'Level 120 in every skill — 104,273,167 XP per skill.',
        targetXpAll: 104273167,
    },
    {
        id: '200m-buyables',
        name: '200M Buyables',
        description: '200M in skills that can be trained primarily with gold.',
        targetXpPerSkill: {
            Prayer:       200000000,
            Herblore:     200000000,
            Crafting:     200000000,
            Construction: 200000000,
            Summoning:    200000000,
            Cooking:      200000000,
            Fletching:    200000000,
            Smithing:     200000000,
        },
        defaultTargetXp: 13034431,
    },
    {
        id: '5.8b',
        name: '5.8B Total (200M all)',
        description: 'Max XP in every skill. 200M × 29 = 5,800,000,000 total XP.',
        targetXpAll: 200000000,
    },
];

// Skills we plan against (skipping aggregate "Overall"). Matches the order
// players generally see in-game.
export const PLANNED_SKILLS = Object.keys(DEFAULT_XP_PER_HOUR);

// Per-skill lane presets sourced from the RS3 Wiki. Each lane carries a
// concrete method, the rate at endgame (~99), and a source URL so users
// can verify. Skills missing here fall back to DEFAULT_XP_PER_HOUR above.
//
// Lanes:
//   afk      — low-effort methods (ID kept as 'afk' but UI labels "Low effort"
//              to avoid implying truly-AFK when most skills don't have that)
//   standard — typical no-tryhard active training
//   tryhard  — peak rates with optimal setup and attention
//
// Only Agility is sourced for now (proof of concept). Other skills will
// follow once we agree on a curation flow.
export const SKILL_RATE_PRESETS = {
    Agility: {
        afk: {
            method: 'Hefin Agility Course (99)',
            rate: 110000,
            source: 'https://runescape.wiki/w/Hefin_Agility_Course',
            notes: 'Lowest-attention active method. Base rate at 99 without Voice of Seren.',
        },
        standard: {
            method: 'Anachronia full lap',
            rate: 280000,
            source: 'https://runescape.wiki/w/Anachronia_Agility_Course',
            notes: 'Full lap with all shortcuts unlocked. Higher attention than Hefin.',
        },
        tryhard: {
            method: 'Hefin Course w/ Voice of Seren (avg)',
            rate: 145000,
            source: 'https://runescape.wiki/w/Hefin_Agility_Course',
            notes: 'Hefin during VoS averaged across the day (Hefin active ~28% of clock). Pair with Anachronia in down-time for peak rate.',
        },
    },
};

export const LANES = [
    { id: 'afk',      label: 'Low effort', description: 'Minimal clicking / low-attention training' },
    { id: 'standard', label: 'Standard',   description: 'Typical no-tryhard active training' },
    { id: 'tryhard',  label: 'Tryhard',    description: 'Peak rates with optimal setup and full attention' },
];

// Resolve the rate to use for a skill under a given lane. Falls back to
// the next available lane on the same skill, then DEFAULT_XP_PER_HOUR.
export function resolveSkillRate(skillName, lane) {
    const presets = SKILL_RATE_PRESETS[skillName];
    if (presets?.[lane]) return { ...presets[lane], laneUsed: lane, fallback: false };
    if (presets) {
        // Pick whichever lane exists (priority: standard > tryhard > afk)
        for (const l of ['standard', 'tryhard', 'afk']) {
            if (presets[l]) return { ...presets[l], laneUsed: l, fallback: true };
        }
    }
    return {
        method: 'Estimated rate (not sourced)',
        rate: DEFAULT_XP_PER_HOUR[skillName] || 500000,
        source: null,
        notes: null,
        laneUsed: null,
        fallback: true,
    };
}
