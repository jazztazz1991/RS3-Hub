const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Can be anonymous
  },
  type: {
    type: DataTypes.ENUM('bug', 'data_error', 'suggestion', 'other'),
    allowNull: false,
    defaultValue: 'bug'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contextData: {
    type: DataTypes.JSON, 
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'investigating', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Report;
