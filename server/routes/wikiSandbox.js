const express = require('express');
const router = express.Router();
const {
  Creature, NPC, Achievement, WikiLocation, ResourceNode, WikiSyncLog,
} = require('../models');
const wikiSync = require('../services/wikiSync');
const logger = require('../utils/logger');

// All endpoints below are public read for now — this is a sandbox page.
// The sync trigger is unguarded too so you can hit it from the UI to
// re-seed without faffing with auth.

router.get('/creatures', async (req, res) => {
  const rows = await Creature.findAll({ order: [['combat_level', 'DESC'], ['name', 'ASC']], limit: 500 });
  res.json(rows);
});

router.get('/npcs', async (req, res) => {
  const rows = await NPC.findAll({ order: [['name', 'ASC']], limit: 500 });
  res.json(rows);
});

router.get('/achievements', async (req, res) => {
  const rows = await Achievement.findAll({ order: [['category', 'ASC'], ['name', 'ASC']], limit: 500 });
  res.json(rows);
});

router.get('/locations', async (req, res) => {
  const rows = await WikiLocation.findAll({ order: [['name', 'ASC']], limit: 500 });
  res.json(rows);
});

router.get('/resource-nodes', async (req, res) => {
  const rows = await ResourceNode.findAll({
    order: [['node_type', 'ASC'], ['level', 'ASC'], ['name', 'ASC']],
    limit: 500,
  });
  res.json(rows);
});

// Per-slug detail endpoints. On first hit, lazily hydrate the row with the
// page's lead paragraph + named sections (Location, Strategy, History, etc.)
// so future requests are instant.
const { hydrateRow } = require('../services/wikiHydrate');

async function fetchAndHydrate(Model, slug, res) {
  const row = await Model.findOne({ where: { slug } });
  if (!row) return res.status(404).json({ message: 'Not found' });
  if (!row.data?._sections_hydrated) {
    await hydrateRow(row);
  }
  res.json(row);
}

router.get('/creatures/:slug',      (req, res) => fetchAndHydrate(Creature,     req.params.slug, res));
router.get('/npcs/:slug',           (req, res) => fetchAndHydrate(NPC,          req.params.slug, res));
router.get('/achievements/:slug',   (req, res) => fetchAndHydrate(Achievement,  req.params.slug, res));
router.get('/locations/:slug',      (req, res) => fetchAndHydrate(WikiLocation, req.params.slug, res));
router.get('/resource-nodes/:slug', (req, res) => fetchAndHydrate(ResourceNode, req.params.slug, res));

router.get('/sync-log', async (req, res) => {
  const rows = await WikiSyncLog.findAll({ order: [['createdAt', 'DESC']], limit: 30 });
  res.json(rows);
});

// Trigger a fresh sync (sandbox — unauthenticated for now).
// Runs in background; client can refetch the lists when it's done.
router.post('/sync', async (req, res) => {
  const limit = Math.min(parseInt(req.body?.limit, 10) || 50, 200);
  // Fire-and-forget: respond immediately, let the sync run server-side.
  wikiSync.syncAll(limit)
    .then(results => logger.info('Wiki sandbox sync complete', { results }))
    .catch(err => logger.error('Wiki sandbox sync failed', err));
  res.json({ started: true, limit });
});

module.exports = router;
