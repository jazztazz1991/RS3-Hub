const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Achievement (RS3 internal achievement-system entries). Foundation for
// a future per-character checklist; for now it's just the catalogue.
const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slug:        { type: DataTypes.STRING, allowNull: false, unique: true },
  name:        { type: DataTypes.STRING, allowNull: false },
  category:    { type: DataTypes.STRING, allowNull: true },
  subcategory: { type: DataTypes.STRING, allowNull: true },
  difficulty:  { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT,   allowNull: true },
  members:     { type: DataTypes.BOOLEAN, allowNull: true },
  data:        { type: DataTypes.JSONB,  allowNull: false, defaultValue: {} },
  source_url:  { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['slug'] }, { fields: ['category'] }, { fields: ['difficulty'] }],
});

module.exports = Achievement;
