// Refresh live GE prices for every item that has a ge_item_id.
//
// Strategy: batch up to 100 ids per WeirdGloop request (their endpoint
// accepts pipe-separated lists). Throttle between batches at ~1 rps.
//
// Use:
//   CLI:       node server/jobs/refreshPrices.js
//   Scheduler: require this module and call refreshAllPrices()
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Op } = require('sequelize');
const { sequelize, Item, ItemSyncLog } = require('../models');
const gePriceClient = require('../services/gePriceClient');
const logger = require('../utils/logger');

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1100;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Core: refresh all known item prices. Returns a summary. Does NOT close
// the Sequelize connection — callers (especially the internal scheduler)
// share the same connection as the live server.
async function refreshAllPrices() {
  const items = await Item.findAll({
    where: { ge_item_id: { [Op.not]: null } },
    attributes: ['id', 'name', 'ge_item_id'],
  });
  logger.info('Price refresh starting', { totalItems: items.length });
  if (!items.length) return { updated: 0, missed: 0, failedBatches: 0 };

  let updated = 0, missed = 0, failedBatches = 0;
  const totalBatches = Math.ceil(items.length / BATCH_SIZE);

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const ids = batch.map(it => it.ge_item_id);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
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
    } catch (err) {
      failedBatches++;
      logger.error(`Price refresh batch ${batchNum}/${totalBatches} failed`, err);
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

  logger.info('Price refresh done', { updated, missed, failedBatches });
  return { updated, missed, failedBatches };
}

// CLI entry — owns its own connection lifecycle.
async function runAsCli() {
  console.log('Connecting...');
  await sequelize.authenticate();
  await refreshAllPrices();
  await sequelize.close();
}

if (require.main === module) {
  runAsCli().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}

module.exports = { refreshAllPrices };
