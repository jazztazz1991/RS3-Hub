const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// RS3 monster / creature. Mostly used for slayer-task lookups and drop-
// table joins (eventually). Fields are nullable since wiki coverage is
// uneven (some monsters have lifepoints but no slayer XP, etc.).
const Creature = sequelize.define('Creature', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  combat_level:      { type: DataTypes.INTEGER, allowNull: true },
  slayer_level:      { type: DataTypes.INTEGER, allowNull: true },
  slayer_experience: { type: DataTypes.FLOAT,   allowNull: true },
  lifepoints:        { type: DataTypes.INTEGER, allowNull: true },
  aggressive:        { type: DataTypes.BOOLEAN, allowNull: true },
  poisonous:         { type: DataTypes.BOOLEAN, allowNull: true },
  members:           { type: DataTypes.BOOLEAN, allowNull: true },
  examine:           { type: DataTypes.TEXT,    allowNull: true },
  // Anything else returned by SMW we want to keep but isn't worth a column
  data:              { type: DataTypes.JSONB,   allowNull: false, defaultValue: {} },
  source_url:        { type: DataTypes.STRING,  allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['slug'] }, { fields: ['combat_level'] }, { fields: ['slayer_level'] }],
});

module.exports = Creature;
