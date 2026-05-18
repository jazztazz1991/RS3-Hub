const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Per-item per-section sync tracking so the seeder is resumable.
const ItemSyncLog = sequelize.define('ItemSyncLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // "item" | "recipes" | "products" | "disassembly" | "drops" | "shops" | "price"
  entity_type: { type: DataTypes.STRING, allowNull: false },
  // item slug — nullable for global runs
  entity_key: { type: DataTypes.STRING, allowNull: true },
  // "success" | "partial" | "failed"
  status: { type: DataTypes.STRING, allowNull: false },
  last_synced_at: { type: DataTypes.DATE, allowNull: false },
  error_message: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { fields: ['entity_type', 'entity_key'] },
  ],
});

module.exports = ItemSyncLog;
