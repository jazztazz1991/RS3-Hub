const sequelize = require('../config/db');
const User = require('./User');
const Character = require('./Character');
const SlayerTask = require('./SlayerTask');

// Define Associations
User.hasMany(Character, { foreignKey: 'userId', as: 'characters' });
Character.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SlayerTask, { foreignKey: 'userId', as: 'slayerTasks' });
SlayerTask.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Character,
  SlayerTask
};
