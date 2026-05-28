const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Gathering node — trees, rocks, fishing spots, farming patches. These
// share a level-requirement + xp-per-action shape so they live in one
// table with a node_type discriminator. Type-specific fields (e.g. logs
// produced, fish caught) go in the `data` JSONB column.
const ResourceNode = sequelize.define('ResourceNode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slug:      { type: DataTypes.STRING, allowNull: false, unique: true },
  name:      { type: DataTypes.STRING, allowNull: false },
  // 'tree' | 'rock' | 'fishing_spot' | 'farming_patch'
  node_type: { type: DataTypes.STRING, allowNull: false },
  skill:     { type: DataTypes.STRING, allowNull: true },  // Woodcutting / Mining / Fishing / Farming
  level:     { type: DataTypes.INTEGER, allowNull: true },
  xp:        { type: DataTypes.FLOAT,   allowNull: true },
  yields:    { type: DataTypes.STRING,  allowNull: true }, // What this node produces (display string)
  location:  { type: DataTypes.STRING,  allowNull: true },
  members:   { type: DataTypes.BOOLEAN, allowNull: true },
  data:      { type: DataTypes.JSONB,   allowNull: false, defaultValue: {} },
  source_url: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['node_type'] },
    { fields: ['skill', 'level'] },
  ],
});

module.exports = ResourceNode;
