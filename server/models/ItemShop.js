const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ItemShop = sequelize.define('ItemShop', {
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
  seller_name: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: true },
  stock: { type: DataTypes.INTEGER, allowNull: true },
  sold_price: { type: DataTypes.INTEGER, allowNull: true },
  bought_price: { type: DataTypes.INTEGER, allowNull: true },
  members_only: { type: DataTypes.BOOLEAN, allowNull: true },
  requirements: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['itemId'] }],
});

module.exports = ItemShop;
