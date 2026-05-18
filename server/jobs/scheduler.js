// In-process cron scheduler. Runs alongside the Express server so we don't
// need a paid Render cron job. Caveat: on Render's free tier the web
// service sleeps after 15 min of inactivity, so scheduled jobs only fire
// while the service is awake. External keepalive (or just normal user
// traffic) keeps it up.
const cron = require('node-cron');
const logger = require('../utils/logger');
const { refreshAllPrices } = require('./refreshPrices');

// 04:00 UTC daily — comfortably outside Jagex's GE recalculation window.
const PRICE_REFRESH_SCHEDULE = process.env.PRICE_REFRESH_CRON || '0 4 * * *';

let started = false;

function startScheduler() {
  if (started) return;
  started = true;

  if (!cron.validate(PRICE_REFRESH_SCHEDULE)) {
    logger.error('Invalid cron expression — scheduler not started', null, {
      schedule: PRICE_REFRESH_SCHEDULE,
    });
    return;
  }

  cron.schedule(PRICE_REFRESH_SCHEDULE, async () => {
    try {
      logger.info('Scheduled price refresh triggered');
      await refreshAllPrices();
    } catch (err) {
      logger.error('Scheduled price refresh failed', err);
    }
  }, { timezone: 'UTC' });

  logger.info('Scheduler started', { schedule: PRICE_REFRESH_SCHEDULE });
}

module.exports = { startScheduler };
