const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Non-combat NPC (shopkeepers, quest givers, atmospheric chars). Some
// overlap with Creature exists for NPCs that can also be attacked — we
// store them separately by wiki category for now.
const NPC = sequelize.define('NPC', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slug:     { type: DataTypes.STRING, allowNull: false, unique: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  examine:  { type: DataTypes.TEXT,   allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  role:     { type: DataTypes.STRING, allowNull: true },
  members:  { type: DataTypes.BOOLEAN, allowNull: true },
  data:     { type: DataTypes.JSONB,  allowNull: false, defaultValue: {} },
  source_url: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['slug'] }, { fields: ['name'] }],
});

module.exports = NPC;
