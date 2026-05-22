const sequelize = require('../config/db');
const User = require('./User');
const Character = require('./Character');
const Report = require('./Report');
const Suggestion = require('./Suggestion');
const SlayerTask = require('./SlayerTask');
const UserQuest = require('./UserQuest');
const PageVisit = require('./PageVisit');
const Item = require('./Item');
const ItemRecipe = require('./ItemRecipe');
const ItemProduct = require('./ItemProduct');
const ItemDisassembly = require('./ItemDisassembly');
const ItemDrop = require('./ItemDrop');
const ItemShop = require('./ItemShop');
const ItemSyncLog = require('./ItemSyncLog');
const LootActivity = require('./LootActivity');
const LootDrop = require('./LootDrop');
const CharacterXpSnapshot = require('./CharacterXpSnapshot');
const FarmAnimal = require('./FarmAnimal');
const UserAnimalTimer = require('./UserAnimalTimer');
const TrackedPlayer = require('./TrackedPlayer');
const TrackedPlayerXpSnapshot = require('./TrackedPlayerXpSnapshot');
const Group = require('./Group');
const GroupMember = require('./GroupMember');


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

// PageVisit association
User.hasMany(PageVisit, { foreignKey: 'user_id', as: 'pageVisits' });
PageVisit.belongsTo(User, { foreignKey: 'user_id' });

// Item associations
Item.hasMany(ItemRecipe, { foreignKey: 'itemId', as: 'recipes', onDelete: 'CASCADE' });
ItemRecipe.belongsTo(Item, { foreignKey: 'itemId' });

Item.hasMany(ItemProduct, { foreignKey: 'inputItemId', as: 'products', onDelete: 'CASCADE' });
ItemProduct.belongsTo(Item, { foreignKey: 'inputItemId', as: 'inputItem' });

Item.hasOne(ItemDisassembly, { foreignKey: 'itemId', as: 'disassembly', onDelete: 'CASCADE' });
ItemDisassembly.belongsTo(Item, { foreignKey: 'itemId' });

Item.hasMany(ItemDrop, { foreignKey: 'itemId', as: 'drops', onDelete: 'CASCADE' });
ItemDrop.belongsTo(Item, { foreignKey: 'itemId' });

Item.hasMany(ItemShop, { foreignKey: 'itemId', as: 'shops', onDelete: 'CASCADE' });
ItemShop.belongsTo(Item, { foreignKey: 'itemId' });

// Loot tracking
Character.hasMany(LootActivity, { foreignKey: 'characterId', as: 'lootActivities', onDelete: 'CASCADE' });
LootActivity.belongsTo(Character, { foreignKey: 'characterId' });

LootActivity.hasMany(LootDrop, { foreignKey: 'activityId', as: 'drops', onDelete: 'CASCADE' });
LootDrop.belongsTo(LootActivity, { foreignKey: 'activityId' });

LootDrop.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });
Item.hasMany(LootDrop, { foreignKey: 'itemId' });

// XP tracker — character has many time-series snapshots
Character.hasMany(CharacterXpSnapshot, { foreignKey: 'characterId', as: 'xpSnapshots', onDelete: 'CASCADE' });
CharacterXpSnapshot.belongsTo(Character, { foreignKey: 'characterId' });

// Farm timers — user can have many active timers, each references a catalog animal
Character.hasMany(UserAnimalTimer, { foreignKey: 'characterId', as: 'animalTimers', onDelete: 'CASCADE' });
UserAnimalTimer.belongsTo(Character, { foreignKey: 'characterId' });
UserAnimalTimer.belongsTo(FarmAnimal, { foreignKey: 'animalId', as: 'animal' });
FarmAnimal.hasMany(UserAnimalTimer, { foreignKey: 'animalId' });

// Group XP tracking — owner has many groups, each group has many members,
// each member references one tracked player (a non-user RS3 name).
User.hasMany(Group, { foreignKey: 'ownerId', as: 'groups' });
Group.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members', onDelete: 'CASCADE' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });

TrackedPlayer.hasMany(GroupMember, { foreignKey: 'trackedPlayerId', onDelete: 'CASCADE' });
GroupMember.belongsTo(TrackedPlayer, { foreignKey: 'trackedPlayerId', as: 'trackedPlayer' });

TrackedPlayer.hasMany(TrackedPlayerXpSnapshot, { foreignKey: 'trackedPlayerId', as: 'snapshots', onDelete: 'CASCADE' });
TrackedPlayerXpSnapshot.belongsTo(TrackedPlayer, { foreignKey: 'trackedPlayerId' });

module.exports = {
  sequelize,
  User,
  Character,
  Report,
  Suggestion,
  SlayerTask,
  UserQuest,
  PageVisit,
  Item,
  ItemRecipe,
  ItemProduct,
  ItemDisassembly,
  ItemDrop,
  ItemShop,
  ItemSyncLog,
  LootActivity,
  LootDrop,
  CharacterXpSnapshot,
  FarmAnimal,
  UserAnimalTimer,
  TrackedPlayer,
  TrackedPlayerXpSnapshot,
  Group,
  GroupMember,
};
