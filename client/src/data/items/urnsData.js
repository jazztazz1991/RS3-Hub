// useLevel: the maximum activity level that fills this urn (null = any level fills it).
// level:    the Crafting level required to make the urn. Urns can also be bought from GE.
//
// Fill levels verified against individual urn wiki pages (runescape.wiki).

export const URN_DATA = {
  Cooking: [
    { name: 'Cracked cooking urn',   level: 1,   useLevel: 10,  fillXp: 2000.0,  bonusXp: 400.0   },
    { name: 'Fragile cooking urn',   level: 12,  useLevel: 25,  fillXp: 2750.0,  bonusXp: 550.0   },
    { name: 'Plain cooking urn',     level: 36,  useLevel: 40,  fillXp: 4750.0,  bonusXp: 950.0   },
    { name: 'Strong cooking urn',    level: 51,  useLevel: 55,  fillXp: 5250.0,  bonusXp: 1050.0  },
    { name: 'Decorated cooking urn', level: 81,  useLevel: null, fillXp: 7737.5,  bonusXp: 1547.5  },
    { name: 'Exquisite cooking urn', level: 103, useLevel: null, fillXp: 11230.0, bonusXp: 2807.5  },
  ],
  Divination: [
    { name: 'Cracked divination urn',   level: 3,   useLevel: 10,  fillXp: 1050.0,  bonusXp: 210.0   },
    { name: 'Fragile divination urn',   level: 16,  useLevel: 30,  fillXp: 1750.0,  bonusXp: 350.0   },
    { name: 'Plain divination urn',     level: 38,  useLevel: 50,  fillXp: 2500.0,  bonusXp: 500.0   },
    { name: 'Strong divination urn',    level: 56,  useLevel: 70,  fillXp: 4000.0,  bonusXp: 800.0   },
    { name: 'Decorated divination urn', level: 82,  useLevel: null, fillXp: 9500.0,  bonusXp: 1900.0  },
    { name: 'Exquisite divination urn', level: 108, useLevel: null, fillXp: 12980.0, bonusXp: 3245.0  },
  ],
  Farming: [
    { name: 'Cracked farming urn',   level: 5,   useLevel: 12,  fillXp: 1100.0,  bonusXp: 220.0   },
    { name: 'Fragile farming urn',   level: 18,  useLevel: 30,  fillXp: 2500.0,  bonusXp: 500.0   },
    { name: 'Plain farming urn',     level: 40,  useLevel: 53,  fillXp: 4500.0,  bonusXp: 900.0   },
    { name: 'Strong farming urn',    level: 58,  useLevel: 72,  fillXp: 5500.0,  bonusXp: 1100.0  },
    { name: 'Decorated farming urn', level: 84,  useLevel: null, fillXp: 7000.0,  bonusXp: 1400.0  },
    { name: 'Exquisite farming urn', level: 110, useLevel: null, fillXp: 11300.0, bonusXp: 2825.0  },
  ],
  Fishing: [
    { name: 'Cracked fishing urn',   level: 1,   useLevel: 10,  fillXp: 750.0,   bonusXp: 150.0   },
    { name: 'Fragile fishing urn',   level: 15,  useLevel: 30,  fillXp: 1750.0,  bonusXp: 350.0   },
    { name: 'Plain fishing urn',     level: 41,  useLevel: 50,  fillXp: 2500.0,  bonusXp: 500.0   },
    { name: 'Strong fishing urn',    level: 53,  useLevel: 70,  fillXp: 3000.0,  bonusXp: 600.0   },
    { name: 'Decorated fishing urn', level: 76,  useLevel: null, fillXp: 9500.0,  bonusXp: 1900.0  },
    { name: 'Exquisite fishing urn', level: 104, useLevel: null, fillXp: 13300.0, bonusXp: 3325.0  },
  ],
  Hunter: [
    { name: 'Cracked hunter urn',   level: 3,   useLevel: 11,  fillXp: 1100.0,  bonusXp: 220.0   },
    { name: 'Fragile hunter urn',   level: 17,  useLevel: 29,  fillXp: 2500.0,  bonusXp: 500.0   },
    { name: 'Plain hunter urn',     level: 34,  useLevel: 53,  fillXp: 5000.0,  bonusXp: 1000.0  },
    { name: 'Strong hunter urn',    level: 55,  useLevel: 74,  fillXp: 7000.0,  bonusXp: 1400.0  },
    { name: 'Decorated hunter urn', level: 79,  useLevel: null, fillXp: 8000.0,  bonusXp: 1600.0  },
    { name: 'Exquisite hunter urn', level: 109, useLevel: null, fillXp: 11040.0, bonusXp: 2760.0  },
  ],
  Mining: [
    { name: 'Cracked mining urn',   level: 1,   useLevel: 10,  fillXp: 437.5,   bonusXp: 87.5    },
    { name: 'Fragile mining urn',   level: 17,  useLevel: 30,  fillXp: 1000.0,  bonusXp: 200.0   },
    { name: 'Plain mining urn',     level: 32,  useLevel: 50,  fillXp: 1625.0,  bonusXp: 325.0   },
    { name: 'Strong mining urn',    level: 48,  useLevel: 70,  fillXp: 2000.0,  bonusXp: 400.0   },
    { name: 'Decorated mining urn', level: 78,  useLevel: null, fillXp: 3125.0,  bonusXp: 625.0   },
    { name: 'Exquisite mining urn', level: 102, useLevel: null, fillXp: 4375.0,  bonusXp: 1093.7  },
  ],
  Prayer: [
    // Prayer urns fill from creature kills, not a Prayer level range.
    { name: 'Impious urn',  level: 1,  useLevel: null, fillXp: 100.0,   bonusXp: 120.0   },
    { name: 'Accursed urn', level: 26, useLevel: null, fillXp: 312.5,   bonusXp: 375.0   },
    { name: 'Infernal urn', level: 62, useLevel: null, fillXp: 1562.5,  bonusXp: 1875.0  },
  ],
  Runecrafting: [
    { name: 'Cracked runecrafting urn',   level: 4,   useLevel: 9,   fillXp: 1050.0,  bonusXp: 210.0   },
    { name: 'Fragile runecrafting urn',   level: 18,  useLevel: 27,  fillXp: 1750.0,  bonusXp: 350.0   },
    { name: 'Plain runecrafting urn',     level: 33,  useLevel: 54,  fillXp: 3500.0,  bonusXp: 700.0   },
    { name: 'Strong runecrafting urn',    level: 52,  useLevel: 77,  fillXp: 5000.0,  bonusXp: 1000.0  },
    { name: 'Decorated runecrafting urn', level: 77,  useLevel: null, fillXp: 7000.0,  bonusXp: 1400.0  },
    { name: 'Exquisite runecrafting urn', level: 107, useLevel: null, fillXp: 9450.0,  bonusXp: 2362.5  },
  ],
  Smithing: [
    { name: 'Cracked smithing urn',   level: 4,   useLevel: 10,  fillXp: 200.0,   bonusXp: 40.0    },
    { name: 'Fragile smithing urn',   level: 17,  useLevel: 30,  fillXp: 1430.0,  bonusXp: 286.0   },
    { name: 'Plain smithing urn',     level: 35,  useLevel: 50,  fillXp: 2980.0,  bonusXp: 596.0   },
    { name: 'Strong smithing urn',    level: 49,  useLevel: 70,  fillXp: 7254.0,  bonusXp: 1450.8  },
    { name: 'Decorated smithing urn', level: 80,  useLevel: null, fillXp: 9470.0,  bonusXp: 1894.0  },
    { name: 'Exquisite smithing urn', level: 105, useLevel: null, fillXp: 12130.0, bonusXp: 3032.5  },
  ],
  Woodcutting: [
    { name: 'Cracked woodcutting urn',   level: 4,   useLevel: 10,  fillXp: 800.0,   bonusXp: 160.0   },
    { name: 'Fragile woodcutting urn',   level: 15,  useLevel: 35,  fillXp: 2125.0,  bonusXp: 425.0   },
    { name: 'Plain woodcutting urn',     level: 44,  useLevel: 58,  fillXp: 4125.0,  bonusXp: 825.0   },
    { name: 'Strong woodcutting urn',    level: 61,  useLevel: 75,  fillXp: 8312.5,  bonusXp: 1662.5  },
    { name: 'Decorated woodcutting urn', level: 76,  useLevel: null, fillXp: 9500.0,  bonusXp: 1900.0  },
    { name: 'Exquisite woodcutting urn', level: 106, useLevel: null, fillXp: 13015.0, bonusXp: 3253.7  },
  ],
};

export const URN_ENHANCER_BONUS = 0.25;
