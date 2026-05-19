const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// A drop logged against an activity. Stored as one row per (activity × item)
// with cumulative quantity so the detail view stays compact regardless of
// kill count. We also keep item_name denormalized for fast listing without
// a join and so free-text uncommon drops (itemId null) still display.
const LootDrop = sequelize.define('LootDrop', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  activityId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'LootActivities', key: 'id' },
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Items', key: 'id' },
  },
  item_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['activityId'] },
    { fields: ['activityId', 'itemId'] },
  ],
});

module.exports = LootDrop;
