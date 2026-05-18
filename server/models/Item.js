const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // url-safe slug derived from the wiki page title; used in /items/:slug routes
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  // exact wiki page title, e.g. "Snapdragon potion (unfinished)"
  wiki_page_title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image_url: { type: DataTypes.STRING, allowNull: true },
  examine_text: { type: DataTypes.TEXT, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  release_date: { type: DataTypes.STRING, allowNull: true },

  members: { type: DataTypes.BOOLEAN, allowNull: true },
  quest_item: { type: DataTypes.BOOLEAN, allowNull: true },
  tradeable: { type: DataTypes.BOOLEAN, allowNull: true },
  equipable: { type: DataTypes.BOOLEAN, allowNull: true },
  stackable: { type: DataTypes.BOOLEAN, allowNull: true },
  noteable: { type: DataTypes.BOOLEAN, allowNull: true },
  disassemblable: { type: DataTypes.BOOLEAN, allowNull: true },

  // Most items have a short destroy verb ("Drop", "Destroy"), but quest items
  // sometimes carry long destroy instructions — overflow varchar(255).
  destroy_method: { type: DataTypes.TEXT, allowNull: true },
  backpack_options: { type: DataTypes.JSONB, allowNull: true },

  ge_value: { type: DataTypes.INTEGER, allowNull: true },
  high_alch: { type: DataTypes.INTEGER, allowNull: true },
  low_alch: { type: DataTypes.INTEGER, allowNull: true },
  weight_kg: { type: DataTypes.FLOAT, allowNull: true },

  on_death_reclaimable: { type: DataTypes.BOOLEAN, allowNull: true },
  on_death_value: { type: DataTypes.INTEGER, allowNull: true },
  on_death_cost: { type: DataTypes.INTEGER, allowNull: true },

  ge_buy_limit: { type: DataTypes.INTEGER, allowNull: true },
  // GE item id (from the wiki infobox `id` field) — primary key for WeirdGloop lookups
  ge_item_id: { type: DataTypes.INTEGER, allowNull: true },
  ge_price_current: { type: DataTypes.INTEGER, allowNull: true },
  ge_volume_current: { type: DataTypes.INTEGER, allowNull: true },
  ge_price_synced_at: { type: DataTypes.DATE, allowNull: true },

  // free-form classification used for browse/filter — populated from the wiki's
  // own category list (action=parse&prop=categories)
  categories: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },

  // Forward-compatibility for non-potion item types. Stores every
  // [data-attr-param] cell from the wiki infobox keyed by attribute name,
  // so weapons (attack_speed, slot, damage) and armour (armour, slot_type)
  // don't require schema migrations as we expand the catalog.
  infobox_raw: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },

  // derived flags for default-hide filters in search
  is_trainable: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  is_skilling: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },

  last_synced_at: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['name'] },
  ],
});

module.exports = Item;
