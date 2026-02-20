const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserQuest = sequelize.define('UserQuest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    }
  },
  characterId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Characters',
      key: 'id'
    }
  },
  questTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'characterId', 'questTitle']
    }
  ]
});

module.exports = UserQuest;
