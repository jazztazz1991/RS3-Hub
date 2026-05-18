// Refresh live GE prices for every item that has a ge_item_id.
//
// Strategy: batch up to 100 ids per WeirdGloop request (their endpoint
// accepts pipe-separated lists). Throttle between batches at ~1 rps.
//
// Run locally:    node server/jobs/refreshPrices.js
// Run on Render:  set up a Cron Job pointing at this script (see README).
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Op } = require('sequelize');
const { sequelize, Item, ItemSyncLog } = require('../models');
const gePriceClient = require('../services/gePriceClient');

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1100;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Connecting...');
  await sequelize.authenticate();

  const items = await Item.findAll({
    where: { ge_item_id: { [Op.not]: null } },
    attributes: ['id', 'name', 'ge_item_id'],
  });
  console.log(`Found ${items.length} items with ge_item_id`);

  if (!items.length) {
    await sequelize.close();
    return;
  }

  let updated = 0, missed = 0, failedBatches = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const ids = batch.map(it => it.ge_item_id);
    try {
      const prices = await gePriceClient.getLatestByIds(ids);
      const now = new Date();
      for (const it of batch) {
        const p = prices[it.ge_item_id];
        if (!p) { missed++; continue; }
        await Item.update({
          ge_price_current: p.price,
          ge_volume_current: p.volume,
          ge_price_synced_at: now,
        }, { where: { id: it.id } });
        updated++;
      }
      console.log(`  batch ${Math.floor(i / BATCH_SIZE) + 1}: +${batch.length} (updated=${updated} missed=${missed})`);
    } catch (err) {
      failedBatches++;
      console.error(`  batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err.message);
    }
    if (i + BATCH_SIZE < items.length) await sleep(BATCH_DELAY_MS);
  }

  await ItemSyncLog.create({
    entity_type: 'price',
    entity_key: 'all',
    status: failedBatches > 0 ? 'partial' : 'success',
    last_synced_at: new Date(),
    error_message: failedBatches > 0 ? `${failedBatches} batches failed` : null,
  });

  console.log(`\nDone. updated=${updated}, no-data=${missed}, failed_batches=${failedBatches}`);
  await sequelize.close();
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}
