const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ItemDrop = sequelize.define('ItemDrop', {
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
  source_name: { type: DataTypes.STRING, allowNull: false },
  source_level: { type: DataTypes.INTEGER, allowNull: true },
  quantity_min: { type: DataTypes.INTEGER, allowNull: true },
  quantity_max: { type: DataTypes.INTEGER, allowNull: true },
  noted: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  rarity_text: { type: DataTypes.STRING, allowNull: true },
  rarity_chance: { type: DataTypes.FLOAT, allowNull: true },
  // for stackable variants like 1-dose / 2-dose / 3-dose potions
  variant: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['itemId'] }],
});

module.exports = ItemDrop;
