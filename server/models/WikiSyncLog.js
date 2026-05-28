const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Generic change-detection log for any wiki-sourced entity table.
// One row per seeder run, recording counts + status so we can detect
// drift (e.g. wiki adds 200 new monsters since last sync).
const WikiSyncLog = sequelize.define('WikiSyncLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // 'creatures' | 'npcs' | 'achievements' | 'locations' | 'resource_nodes'
  entity_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'success',
  },
  fetched: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  created: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  updated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  failed:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  notes:   { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['entity_type', 'createdAt'] }],
});

module.exports = WikiSyncLog;
