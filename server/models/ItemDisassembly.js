const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ItemDisassembly = sequelize.define('ItemDisassembly', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'Items', key: 'id' },
  },
  category: { type: DataTypes.STRING, allowNull: true },
  disassembly_xp: { type: DataTypes.FLOAT, allowNull: true },
  item_quantity_required: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
  junk_chance: { type: DataTypes.FLOAT, allowNull: true },
  // [{ name, quantity, chance, chance_fraction }]
  materials: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
}, {
  timestamps: true,
});

module.exports = ItemDisassembly;
