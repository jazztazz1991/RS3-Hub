const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// How an item is created — there can be multiple recipes per item
// (e.g. "Vial of water" vs "Empty vial" variants).
const ItemRecipe = sequelize.define('ItemRecipe', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Items', key: 'id' },
  },
  skill: { type: DataTypes.STRING, allowNull: true },
  level: { type: DataTypes.INTEGER, allowNull: true },
  xp: { type: DataTypes.FLOAT, allowNull: true },
  ticks: { type: DataTypes.STRING, allowNull: true },
  members_only: { type: DataTypes.BOOLEAN, allowNull: true },
  materials: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
  output_quantity: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
  total_cost: { type: DataTypes.INTEGER, allowNull: true },
  variant_label: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['itemId'] }],
});

module.exports = ItemRecipe;
