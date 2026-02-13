const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SlayerTask = sequelize.define('SlayerTask', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users', // Check if table name is 'Users' or 'users'. Sequelize defaults to plural.
      key: 'id',
    }
  },
  monsterId: {
    type: DataTypes.STRING, // IDs are strings (e.g. 'imperial_warrior_akh')
    allowNull: false,
  },
  monsterName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  masterName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  duration: {
    type: DataTypes.INTEGER, // Milliseconds
    defaultValue: 0,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  xpPerKill: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  totalXp: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  }
});

module.exports = SlayerTask;
