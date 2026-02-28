const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Character = sequelize.define('Character', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_known_stats: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pinned_tasks: {
    type: DataTypes.TEXT, // Stored as JSON string
    allowNull: true,
    defaultValue: '[]'
  },
  task_state: {
    type: DataTypes.TEXT, // Stored as JSON string { taskId: timestamp }
    allowNull: true,
    defaultValue: '{}'
  },
  block_list: {
    type: DataTypes.TEXT, // Stored as JSON string [taskId1, taskId2]
    allowNull: true,
    defaultValue: '[]'
  },
  arch_material_bank: {
    type: DataTypes.TEXT, // Stored as JSON string { materialName: quantity }
    allowNull: true,
    defaultValue: '{}'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    }
  }
}, {
  timestamps: true,
});

module.exports = Character;
