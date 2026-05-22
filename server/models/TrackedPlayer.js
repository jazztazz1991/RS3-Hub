const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// A non-user RS3 player whose hiscores we snapshot. Deduped by rs_name so
// the same person appearing in multiple groups is only fetched once per
// snapshot cycle. Snapshots live in TrackedPlayerXpSnapshot.
const TrackedPlayer = sequelize.define('TrackedPlayer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rs_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  last_fetched_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // 'active' | 'not_found' (Jagex 404) | 'error' (other fetch failure)
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  timestamps: true,
  indexes: [{ fields: ['rs_name'] }],
});

module.exports = TrackedPlayer;
