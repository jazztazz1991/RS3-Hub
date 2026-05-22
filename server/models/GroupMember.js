const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Join row between a Group and a TrackedPlayer. display_name is an
// optional override the owner can set (e.g. "Cody (main)" vs the raw
// hiscores name) for the leaderboard.
const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Groups', key: 'id' },
  },
  trackedPlayerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'TrackedPlayers', key: 'id' },
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['groupId'] },
    { fields: ['groupId', 'trackedPlayerId'], unique: true },
  ],
});

module.exports = GroupMember;
