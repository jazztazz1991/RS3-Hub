const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Time-series XP snapshot for a non-user RS3 player. Mirrors the shape of
// CharacterXpSnapshot. On-demand: written when a group containing this
// player is viewed/refreshed, throttled per-player so we don't blast
// Jagex on every page open.
const TrackedPlayerXpSnapshot = sequelize.define('TrackedPlayerXpSnapshot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  trackedPlayerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'TrackedPlayers', key: 'id' },
  },
  capturedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  xp: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  // 'manual' | 'auto' (page-load triggered) | 'cron' (future)
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'auto',
  },
}, {
  timestamps: true,
  indexes: [{ fields: ['trackedPlayerId', 'capturedAt'] }],
});

module.exports = TrackedPlayerXpSnapshot;
