const sequelize = require('../config/db');
const User = require('./User');
const Character = require('./Character');
const Report = require('./Report');
const SlayerTask = require('./SlayerTask');
const UserQuest = require('./UserQuest');


// Define Associations
User.hasMany(Character, { foreignKey: 'userId', as: 'characters' });
Character.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SlayerTask, { foreignKey: 'userId', as: 'slayerTasks' });
SlayerTask.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserQuest, { foreignKey: 'userId', as: 'quests' });
UserQuest.belongsTo(User, { foreignKey: 'userId' });

// Report association
User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Character,
  Report,
  SlayerTask,
  UserQuest
};
