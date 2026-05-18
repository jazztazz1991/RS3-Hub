const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// What this item is used to make (the "Products" wiki section).
// inputItemId points to the catalog item; output_item_slug/name describe
// the product, which may not be seeded yet.
const ItemProduct = sequelize.define('ItemProduct', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  inputItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Items', key: 'id' },
  },
  output_item_name: { type: DataTypes.STRING, allowNull: false },
  output_item_slug: { type: DataTypes.STRING, allowNull: true },
  output_quantity: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
  skill: { type: DataTypes.STRING, allowNull: true },
  level: { type: DataTypes.INTEGER, allowNull: true },
  xp: { type: DataTypes.FLOAT, allowNull: true },
  members_only: { type: DataTypes.BOOLEAN, allowNull: true },
  materials: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
  ge_price: { type: DataTypes.INTEGER, allowNull: true },
  ge_volume: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['inputItemId'] }],
});

module.exports = ItemProduct;
