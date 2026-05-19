const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// One row per tracked activity for a character — e.g. "Vorago",
// "Yew logs", "Master clue scrolls". Drops belong to an activity.
const LootActivity = sequelize.define('LootActivity', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // boss | skilling | misc
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'misc',
  },
  // total kills / chops / opens / actions performed
  kill_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  // optional time spent — enables gp/hr displays later
  total_time_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['characterId'] },
    { fields: ['characterId', 'category'] },
  ],
});

module.exports = LootActivity;
