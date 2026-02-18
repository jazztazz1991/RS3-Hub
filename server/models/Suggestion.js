const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Suggestion = sequelize.define('Suggestion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Can be anonymous
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contextData: {
    type: DataTypes.JSON, 
    allowNull: true
  },
  path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'investigating', 'implemented', 'rejected'),
    defaultValue: 'open'
  },
});

module.exports = Suggestion;
