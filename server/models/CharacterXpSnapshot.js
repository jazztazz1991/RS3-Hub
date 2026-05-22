const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Time-series snapshot of a character's XP per skill. The daily cron writes
// one of these per opted-in character. xp is { Attack: 13034431, ... }.
//
// Diffs come from comparing two snapshots; we never store derived numbers.
const CharacterXpSnapshot = sequelize.define('CharacterXpSnapshot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  characterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Characters', key: 'id' },
  },
  capturedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  // { skillName: xpInteger }. We store every skill including Overall.
  xp: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  // Capture-method, for debugging when something looks wrong:
  //   'cron'   — daily scheduled snapshot
  //   'manual' — user clicked snapshot button
  //   'initial' — first snapshot after enabling tracking
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'cron',
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['characterId', 'capturedAt'] },
  ],
});

module.exports = CharacterXpSnapshot;
