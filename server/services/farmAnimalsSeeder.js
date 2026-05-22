// One-time idempotent seeder: copies server/data/farmAnimals.json into the
// FarmAnimals table on startup. Upserts by slug so re-running the server
// just keeps the catalogue in sync with the JSON file in repo.
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { FarmAnimal } = require('../models');
const logger = require('../utils/logger');

const DATA_PATH = path.resolve(__dirname, '..', 'data', 'farmAnimals.json');

async function seedFarmAnimals() {
  if (!fs.existsSync(DATA_PATH)) {
    logger.warn('farmAnimals.json missing — skipping seed');
    return { seeded: 0 };
  }
  const { animals } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  let upserts = 0;
  const slugs = [];
  for (const a of animals || []) {
    await FarmAnimal.upsert({
      slug: a.slug,
      kind: a.kind,
      name: a.name,
      image_url: a.image_url || null,
      pen_type: a.pen_type || null,
      farming_level: a.farming_level || null,
      growth_stages: a.growth_stages || [],
      notes: a.notes || null,
      source_url: a.source_url || null,
    });
    slugs.push(a.slug);
    upserts++;
  }
  // Remove orphan rows from earlier scrape runs whose slugs are no longer
  // in the JSON (e.g. when an animal was retagged from pof → dino and got
  // a new slug).
  const removed = await FarmAnimal.destroy({ where: { slug: { [Op.notIn]: slugs } } });
  logger.info('Farm animals seeded', { count: upserts, removed });
  return { seeded: upserts, removed };
}

module.exports = { seedFarmAnimals };
