const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// One row per active timer. When the user "plants" an animal we record the
// start time + which growth stage they started at. Time-until-next-stage is
// computed on read from FarmAnimal.growth_stages.
const UserAnimalTimer = sequelize.define('UserAnimalTimer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  characterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Characters', key: 'id' },
  },
  animalId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'FarmAnimals', key: 'id' },
  },
  // User-defined pen label so they can track multiple animals at once.
  pen_label: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // When the timer was started.
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  // Which stage the user started at (defaults to the first growth stage).
  // We track this so users can log animals that are already mid-growth.
  started_stage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['characterId'] }],
});

module.exports = UserAnimalTimer;
