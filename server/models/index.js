const sequelize = require('../config/db');
const User = require('./User');
const Character = require('./Character');

// Define Associations
User.hasMany(Character, { foreignKey: 'userId', as: 'characters' });
Character.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Character,
};
