const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Catalogue of farm animals (Player-Owned Farm + Anachronia base camp).
// Seeded from the curated JSON at server/data/farmAnimals.json — this table
// gives us referential integrity for UserAnimalTimer.animalId.
const FarmAnimal = sequelize.define('FarmAnimal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Stable identifier matching the JSON entry (e.g. "pof-cow", "dino-asciatops").
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  // 'pof' (Player-Owned Farm) | 'dino' (Anachronia base camp)
  kind: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  image_url: { type: DataTypes.STRING, allowNull: true },
  // Which pen this animal occupies (Breeding / Pen / Large pen / etc.)
  pen_type: { type: DataTypes.STRING, allowNull: true },
  // Levels required to interact with this animal
  farming_level: { type: DataTypes.INTEGER, allowNull: true },
  // Growth stages with duration to reach each:
  //   [{ stage: 'Baby', hours: 0 }, { stage: 'Adolescent', hours: 4 }, ...]
  growth_stages: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
  source_url: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ fields: ['kind'] }, { fields: ['slug'], unique: true }],
});

module.exports = FarmAnimal;
