// One-off migration: for already-seeded items whose name doesn't carry a
// dose suffix (1)-(4), swap their image_url's (1)/(2)/(3) variant for the
// (4) variant. Safe to run repeatedly — idempotent.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Op } = require('sequelize');
const { sequelize, Item } = require('../models');

async function main() {
  await sequelize.authenticate();

  const items = await Item.findAll({
    where: {
      image_url: {
        [Op.or]: [
          { [Op.like]: '%\\%281\\%29%' },
          { [Op.like]: '%\\%282\\%29%' },
          { [Op.like]: '%\\%283\\%29%' },
        ],
      },
    },
    attributes: ['id', 'name', 'image_url'],
  });

  console.log(`Inspecting ${items.length} candidate items...`);
  let updated = 0;
  for (const item of items) {
    if (/\([1-4]\)$/.test(item.name)) continue; // dose-specific, leave alone
    const next = item.image_url.replace(/%28[1-3]%29/g, '%284%29');
    if (next === item.image_url) continue;
    await Item.update({ image_url: next }, { where: { id: item.id } });
    console.log(`  ✓ ${item.name}`);
    updated++;
  }
  console.log(`\nDone. Updated ${updated} items.`);
  await sequelize.close();
}

if (require.main === module) {
  main().catch(err => { console.error('Fatal:', err); process.exit(1); });
}
