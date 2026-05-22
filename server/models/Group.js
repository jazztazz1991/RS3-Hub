const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/db');

// A user-owned grouping of RS3 players for XP comparison. kind is a
// loose label so the UI can render different framings (clan / friends /
// alts / comp), but every group works the same way under the hood.
const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // 'clan' | 'friends' | 'alts' | 'comp' — purely UI hint, no logic gates on it
  kind: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'friends',
  },
  // Random URL-safe token. Anyone with the token can view the group
  // read-only without auth.
  share_token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: () => crypto.randomBytes(12).toString('base64url'),
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['ownerId'] },
    { fields: ['share_token'] },
  ],
});

module.exports = Group;
