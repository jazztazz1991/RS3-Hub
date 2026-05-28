const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// In-game location (city, dungeon, region, building). "WikiLocation"
// name avoids any future clash with geographic location concepts.
const WikiLocation = sequelize.define('WikiLocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slug:    { type: DataTypes.STRING, allowNull: false, unique: true },
  name:    { type: DataTypes.STRING, allowNull: false },
  type:    { type: DataTypes.STRING, allowNull: true },   // city, dungeon, region, building, etc.
  region:  { type: DataTypes.STRING, allowNull: true },
  members: { type: DataTypes.BOOLEAN, allowNull: true },
  data:    { type: DataTypes.JSONB,  allowNull: false, defaultValue: {} },
  source_url: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['slug'] }, { fields: ['type'] }, { fields: ['region'] }],
});

module.exports = WikiLocation;
