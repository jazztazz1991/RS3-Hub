// RS3 Skill List in Order from Lite API
export const SKILL_NAMES = [
  'Overall',
  'Attack', 'Defence', 'Strength', 'Constitution', 'Ranged', 'Prayer', 'Magic', 
  'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting', 
  'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer', 
  'Farming', 'Runecrafting', 'Hunter', 'Construction', 'Summoning', 
  'Dungeoneering', 'Divination', 'Invention', 'Archaeology', 'Necromancy'
];

export const parseHiscores = (csvData) => {
  if (!csvData) return [];
  
  const lines = csvData.split('\n');
  const skills = [];

  // Iterate only through skill lines (first 30 lines)
  for (let i = 0; i < SKILL_NAMES.length; i++) {
    if (!lines[i]) continue;
    
    const [rank, level, xp] = lines[i].split(',');
    
    // Ensure we have valid numbers
    if (rank === '-1' && level === '-1') {
      // Unranked/Unstarted skill sometimes returns -1s
      skills.push({
        id: i,
        name: SKILL_NAMES[i],
        rank: -1,
        level: 1,
        xp: 0
      });
      continue;
    }

    skills.push({
      id: i,
      name: SKILL_NAMES[i],
      rank: parseInt(rank),
      level: parseInt(level),
      xp: parseInt(xp)
    });
  }

  // Calculate virtual levels (120) for elite skills or all if desired
  // For now return raw parsed data
  return skills;
};

// Target XPs for progress bars (Standard 99, 110, and 120)
export const XP_TABLE = {
  99: 13034431,
  110: 38737661,
  120: 104273167,
  
  // Max Levels for specific skills
  MAX_LEVELS: {
      'Invention': 120,
      'Slayer': 120,
      'Dungeoneering': 120,
      'Archaeology': 120,
      'Herblore': 120,
      'Farming': 120,
      'Necromancy': 120,
      'Mining': 110,
      'Smithing': 110,
      'Woodcutting': 110,
      'Fletching': 110
  }
};

export const getTargetXp = (skillName, currentXp = 0) => {
  const maxLevel = XP_TABLE.MAX_LEVELS[skillName] || 99;
  
  // Milestone 1: Level 99
  if (currentXp < XP_TABLE[99]) {
      return XP_TABLE[99];
  }

  // Milestone 2: Max Level (110 or 120)
  if (maxLevel > 99) {
      if (maxLevel === 110) return XP_TABLE[110];
      if (maxLevel === 120) return XP_TABLE[120];
  }

  // Already 99 (and max is 99)
  return XP_TABLE[99];
};

export const getTargetLevel = (skillName, currentXp = 0) => {
    const maxLevel = XP_TABLE.MAX_LEVELS[skillName] || 99;
    if (currentXp < XP_TABLE[99]) return 99;
    return maxLevel;
};

export const getLevelAtXp = (xp) => {
  let points = 0;
  for (let lvl = 1; lvl < 127; lvl++) {
    points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    if (Math.floor(points / 4) > xp) {
      return lvl;
    }
  }
  return 126;
};

export const getXpAtLevel = (level) => {
    if (level > 120) level = 120;
    if (level < 1) level = 1;
    
    let points = 0;
    for (let lvl = 1; lvl < level; lvl++) {
      points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    }
    return Math.floor(points / 4);
};

