const express = require('express');
const router = express.Router();
const { Character, FarmAnimal, UserAnimalTimer } = require('../models');
const logger = require('../utils/logger');

function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: 'Unauthorized' });
}

async function ownedCharacter(characterId, userId) {
  const character = await Character.findOne({ where: { id: characterId, userId } });
  if (!character) {
    const err = new Error('Character not found');
    err.status = 404;
    throw err;
  }
  return character;
}

// Walk a timer's animal stages and figure out where it currently sits + the
// duration until each upcoming stage. All times computed in absolute Date.
function projectTimer(timer, animal) {
  const startedAt = new Date(timer.started_at).getTime();
  const stages = (animal.growth_stages || []);
  // Anchor: if user logged a non-default starting stage, shift start backwards
  // so the math still produces correct future stage times.
  let anchorOffsetMin = 0;
  if (timer.started_stage) {
    const found = stages.find(s => s.stage === timer.started_stage);
    if (found) anchorOffsetMin = found.minutes_from_start;
  }
  const effectiveStartMs = startedAt - anchorOffsetMin * 60 * 1000;

  const projected = stages.map(s => ({
    stage: s.stage,
    reaches_at: new Date(effectiveStartMs + s.minutes_from_start * 60 * 1000),
  }));
  const now = Date.now();
  const reachedIdx = projected.findIndex((p, i) => {
    const next = projected[i + 1];
    return p.reaches_at.getTime() <= now && (!next || next.reaches_at.getTime() > now);
  });
  const currentStage = reachedIdx >= 0 ? projected[reachedIdx].stage : projected[0].stage;
  const nextStage = reachedIdx >= 0 && projected[reachedIdx + 1] ? projected[reachedIdx + 1] : null;
  return { projected, current_stage: currentStage, next_stage: nextStage };
}

// GET /api/farm-timers/animals?kind=pof
router.get('/animals', async (req, res) => {
  try {
    const where = {};
    if (req.query.kind) where.kind = req.query.kind;
    const animals = await FarmAnimal.findAll({
      where,
      order: [['kind', 'ASC'], ['farming_level', 'ASC'], ['name', 'ASC']],
    });
    res.json(animals);
  } catch (err) {
    logger.error('farm animals list failed', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/farm-timers?characterId=X
router.get('/', requireAuth, async (req, res) => {
  try {
    const { characterId } = req.query;
    if (!characterId) return res.status(400).json({ message: 'characterId required' });
    await ownedCharacter(characterId, req.user.id);
    const timers = await UserAnimalTimer.findAll({
      where: { characterId },
      include: [{ model: FarmAnimal, as: 'animal' }],
      order: [['started_at', 'DESC']],
    });
    res.json(timers.map(t => ({
      ...t.toJSON(),
      ...projectTimer(t, t.animal),
    })));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('farm timers list failed', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/farm-timers  { characterId, animalId, pen_label?, started_at?, started_stage?, notes? }
router.post('/', requireAuth, async (req, res) => {
  try {
    const { characterId, animalId, pen_label, started_at, started_stage, notes } = req.body;
    if (!characterId || !animalId) {
      return res.status(400).json({ message: 'characterId and animalId required' });
    }
    await ownedCharacter(characterId, req.user.id);
    const animal = await FarmAnimal.findByPk(animalId);
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    const timer = await UserAnimalTimer.create({
      characterId,
      animalId,
      pen_label: pen_label || null,
      started_at: started_at ? new Date(started_at) : new Date(),
      started_stage: started_stage || (animal.growth_stages?.[0]?.stage) || null,
      notes: notes || null,
    });
    res.status(201).json({ ...timer.toJSON(), animal });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('farm timer create failed', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/farm-timers/:id — update pen_label, started_at, started_stage, notes
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const timer = await UserAnimalTimer.findByPk(req.params.id);
    if (!timer) return res.status(404).json({ message: 'Timer not found' });
    await ownedCharacter(timer.characterId, req.user.id);

    for (const key of ['pen_label', 'started_at', 'started_stage', 'notes']) {
      if (req.body[key] !== undefined) {
        timer[key] = key === 'started_at' && req.body[key] ? new Date(req.body[key]) : req.body[key];
      }
    }
    await timer.save();
    res.json(timer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('farm timer patch failed', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/farm-timers/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const timer = await UserAnimalTimer.findByPk(req.params.id);
    if (!timer) return res.status(404).json({ message: 'Timer not found' });
    await ownedCharacter(timer.characterId, req.user.id);
    await timer.destroy();
    res.json({ success: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    logger.error('farm timer delete failed', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
