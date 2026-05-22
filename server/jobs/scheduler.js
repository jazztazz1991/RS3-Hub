// In-process cron scheduler. Runs alongside the Express server so we don't
// need a paid Render cron job. Caveat: on Render's free tier the web
// service sleeps after 15 min of inactivity, so scheduled jobs only fire
// while the service is awake. External keepalive (or just normal user
// traffic) keeps it up.
const cron = require('node-cron');
const logger = require('../utils/logger');
const { refreshAllPrices } = require('./refreshPrices');
const { snapshotAllOptedIn } = require('../services/xpSnapshots');

// 04:00 UTC daily — comfortably outside Jagex's GE recalculation window.
const PRICE_REFRESH_SCHEDULE = process.env.PRICE_REFRESH_CRON || '0 4 * * *';
// 03:00 UTC daily — runs before the price refresh so the two crons don't
// fight over the (shared) network if anything spikes.
const XP_SNAPSHOT_SCHEDULE = process.env.XP_SNAPSHOT_CRON || '0 3 * * *';

let started = false;

function startScheduler() {
  if (started) return;
  started = true;

  if (cron.validate(PRICE_REFRESH_SCHEDULE)) {
    cron.schedule(PRICE_REFRESH_SCHEDULE, async () => {
      try {
        logger.info('Scheduled price refresh triggered');
        await refreshAllPrices();
      } catch (err) {
        logger.error('Scheduled price refresh failed', err);
      }
    }, { timezone: 'UTC' });
    logger.info('Price refresh scheduled', { schedule: PRICE_REFRESH_SCHEDULE });
  } else {
    logger.error('Invalid PRICE_REFRESH_CRON expression', null, { schedule: PRICE_REFRESH_SCHEDULE });
  }

  if (cron.validate(XP_SNAPSHOT_SCHEDULE)) {
    cron.schedule(XP_SNAPSHOT_SCHEDULE, async () => {
      try {
        logger.info('Scheduled XP snapshot triggered');
        await snapshotAllOptedIn();
      } catch (err) {
        logger.error('Scheduled XP snapshot failed', err);
      }
    }, { timezone: 'UTC' });
    logger.info('XP snapshot scheduled', { schedule: XP_SNAPSHOT_SCHEDULE });
  } else {
    logger.error('Invalid XP_SNAPSHOT_CRON expression', null, { schedule: XP_SNAPSHOT_SCHEDULE });
  }
}

module.exports = { startScheduler };
