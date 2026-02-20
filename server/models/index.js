const sequelize = require('../config/db');
const User = require('./User');
const Character = require('./Character');
const Report = require('./Report');
const Suggestion = require('./Suggestion');
const SlayerTask = require('./SlayerTask');
const UserQuest = require('./UserQuest');


// Define Associations
User.hasMany(Character, { foreignKey: 'userId', as: 'characters' });
Character.belongsTo(User, { foreignKey: 'userId' });

Character.hasMany(UserQuest, { foreignKey: 'characterId', as: 'quests' });
UserQuest.belongsTo(Character, { foreignKey: 'characterId' });

User.hasMany(SlayerTask, { foreignKey: 'userId', as: 'slayerTasks' });
SlayerTask.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserQuest, { foreignKey: 'userId', as: 'userQuests' }); // Renamed alias to avoid confusion if needed
UserQuest.belongsTo(User, { foreignKey: 'userId' });

// Report association
User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId' });

// Suggestion association
User.hasMany(Suggestion, { foreignKey: 'userId', as: 'suggestions' });
Suggestion.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Character,
  Report,
  Suggestion,
  SlayerTask,
  UserQuest
};
