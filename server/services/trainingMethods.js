// Unified training-methods data layer.
//
// Two sources, one shape:
//   1. Hand-curated JSON in server/data/skillMethods/<skill>.json
//      (Mining, gathering skills, activity skills — XP rates not derivable
//      from Cargo data, so people curate them.)
//   2. Auto-derived from the seeded Items + recipes table for artisan
//      skills (Herblore today; Smithing/Crafting/Fletching/etc. later).
//      We walk Item.recipes filtered to the requested skill and compute
//      XP/hr and gp/hr from ticks + GE prices.
//
// Output of getMethodsForSkill(skill) is a normalised array of method
// records ready for the frontend.
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Item, ItemRecipe } = require('../models');

const CURATED_DIR = path.resolve(__dirname, '..', 'data', 'skillMethods');

// Filename per skill. Lowercased.
function curatedPath(skill) {
  return path.join(CURATED_DIR, `${skill.toLowerCase()}.json`);
}

function hasCurated(skill) {
  return fs.existsSync(curatedPath(skill));
}

function loadCurated(skill) {
  const raw = fs.readFileSync(curatedPath(skill), 'utf8');
  return JSON.parse(raw);
}

// Fetch live item info for all slugs referenced by a curated file, so the
// frontend gets joined image/price data in one round trip.
async function enrichOutputs(methods) {
  const slugs = new Set();
  for (const m of methods) {
    for (const o of m.outputs || []) {
      if (o.itemSlug) slugs.add(o.itemSlug);
    }
  }
  if (!slugs.size) return methods;
  const items = await Item.findAll({
    where: { slug: { [Op.in]: Array.from(slugs) } },
    attributes: ['slug', 'name', 'image_url', 'ge_price_current'],
  });
  const bySlug = new Map(items.map(i => [i.slug, i]));

  return methods.map(m => ({
    ...m,
    outputs: (m.outputs || []).map(o => {
      const item = bySlug.get(o.itemSlug);
      const ge_price = item?.ge_price_current ?? null;
      const gp_per_hour = ge_price != null ? ge_price * (o.quantity_per_hour || 0) : null;
      return {
        ...o,
        name: item?.name || o.itemSlug,
        image_url: item?.image_url || null,
        ge_price_current: ge_price,
        gp_per_hour,
      };
    }),
  }));
}

// Compute roll-up gp/hr per method (sum across outputs).
function attachDerivedSignals(methods) {
  return methods.map(m => {
    const gp_per_hour = (m.outputs || []).reduce((sum, o) => {
      if (o.gp_per_hour != null) return sum + o.gp_per_hour;
      return sum;
    }, 0);
    const xp_per_hour_mid = m.xp_per_hour
      ? Math.round(((m.xp_per_hour.low || 0) + (m.xp_per_hour.high || 0)) / 2)
      : null;
    return {
      ...m,
      gp_per_hour: gp_per_hour > 0 ? gp_per_hour : null,
      xp_per_hour_mid,
    };
  });
}

// Auto-derive training methods for an artisan skill from seeded Item
// recipes. Each canonical item whose primary recipe matches the skill
// becomes a method. XP/hr is computed from ticks + recipe XP; gp/hr is
// computed from output GE price (minus material costs).
//
// Banking overhead matches the Herblore Ironman planner: ~0.064s per
// action with a 28-slot inventory.
const BANKING_OVERHEAD_SECONDS_PER_ACTION = (3 * 0.6) / 28;

// Per-skill name patterns that signal "not a training method" — prep steps,
// cleaning, mini-game variants. Auto-derive skips these by default so the
// list focuses on what players actually grind.
const AUTO_DERIVE_EXCLUDE_PATTERNS = {
  Herblore: [
    /\(unfinished\)/i,   // unfinished potions are prep, 1 XP/action
    /^Clean /i,          // cleaning herbs is a different activity
    /^Grimy /i,          // grimy herbs (shouldn't appear with recipes but defensive)
  ],
};

async function autoDeriveSkillMethods(skill) {
  // Pull all items that have at least one recipe in the requested skill
  const allItems = await Item.findAll({
    attributes: ['id', 'slug', 'name', 'image_url', 'ge_price_current', 'members'],
    include: [{
      model: ItemRecipe,
      as: 'recipes',
      where: { skill },
      required: true,
    }],
  });

  // Filter out prep/cleaning/minigame items that aren't real training methods.
  const excludePatterns = AUTO_DERIVE_EXCLUDE_PATTERNS[skill] || [];
  const items = allItems.filter(it => !excludePatterns.some(re => re.test(it.name)));

  // For each item, pick the primary recipe (smallest output_quantity = standard variant)
  const methods = [];
  for (const item of items) {
    const recipes = item.recipes || [];
    if (!recipes.length) continue;
    // Prefer the recipe with output_quantity = 1 (standard), then smallest level
    const sorted = [...recipes].sort((a, b) => {
      const oa = a.output_quantity ?? 1;
      const ob = b.output_quantity ?? 1;
      if (oa !== ob) return oa - ob;
      return (a.level ?? 9999) - (b.level ?? 9999);
    });
    const r = sorted[0];
    if (r.xp == null || r.level == null) continue;

    // Compute XP/hr from ticks
    const ticksMatch = String(r.ticks || '').match(/^\s*(\d+)/);
    const baseTicks = ticksMatch ? parseInt(ticksMatch[1], 10) : 2;
    const secondsPerAction = baseTicks * 0.6 + BANKING_OVERHEAD_SECONDS_PER_ACTION;
    const actionsPerHour = 3600 / secondsPerAction;
    const xpPerHour = Math.round(r.xp * actionsPerHour);

    // Cost of materials per hour (if all materials are in our Items table)
    let materialCostPerAction = 0;
    let materialPricesKnown = true;
    for (const m of r.materials || []) {
      if (m.cost != null) {
        materialCostPerAction += m.cost * (m.quantity || 1);
      } else {
        materialPricesKnown = false;
      }
    }
    const grossGpPerHour = (item.ge_price_current || 0) * actionsPerHour * (r.output_quantity || 1);
    const materialCostPerHour = materialCostPerAction * actionsPerHour;
    const netGpPerHour = materialPricesKnown ? grossGpPerHour - materialCostPerHour : grossGpPerHour;

    // Generate a descriptive note since auto-derive has no prose source.
    const materialList = (r.materials || [])
      .map(m => `${m.quantity || 1}× ${m.name}`)
      .join(', ');
    const note = [
      `Made at level ${r.level} (${r.xp} XP per action, ${r.ticks || '2 ticks'}).`,
      materialList ? `Consumes: ${materialList}.` : null,
      grossGpPerHour > 0 ? `Output worth ~${Math.round(item.ge_price_current).toLocaleString()} gp each at current GE price.` : null,
      `Rates are theoretical bank-and-make assuming all materials ready — real practical rates are typically 30–50% lower due to material gathering and inventory turnover.`,
    ].filter(Boolean).join(' ');

    methods.push({
      id: item.slug,
      name: item.name,
      level_required: r.level,
      xp_per_hour: { low: xpPerHour, high: xpPerHour },
      xp_per_hour_mid: xpPerHour,
      outputs: [{
        itemSlug: item.slug,
        name: item.name,
        image_url: item.image_url,
        quantity_per_hour: Math.round(actionsPerHour * (r.output_quantity || 1)),
        ge_price_current: item.ge_price_current,
        gp_per_hour: grossGpPerHour > 0 ? grossGpPerHour : null,
      }],
      inputs: (r.materials || []).map(m => ({
        name: m.name,
        quantity_per_action: m.quantity || 1,
        quantity_per_hour: Math.round(actionsPerHour * (m.quantity || 1)),
        cost_per_unit: m.cost ?? null,
      })),
      lane: 'standard',
      prereqs: r.members_only ? ['Members'] : [],
      // Scores are filled in by a post-process pass once we have the full
      // list and can rank by XP/hr (ironman) and gp/hr (main).
      ironman_score: 'ok',
      main_score: netGpPerHour > 0 ? 'ok' : 'avoid',
      tags: ['auto-derived', item.members ? 'members' : 'f2p'],
      source_url: `https://runescape.wiki/w/${encodeURIComponent(item.name)}`,
      notes: note,
      // Auto-derived signals
      gp_per_hour: grossGpPerHour > 0 ? Math.round(grossGpPerHour) : null,
      gp_per_hour_net: materialPricesKnown ? Math.round(netGpPerHour) : null,
      material_cost_per_hour: Math.round(materialCostPerHour) || null,
      is_auto_derived: true,
    });
  }

  // Sort by level so the rendered list is naturally progressive
  methods.sort((a, b) => a.level_required - b.level_required);

  // Post-process: promote standouts to 'recommended'. Skill methods skew
  // hard toward the highest-tier items (top potion = 50× the gp/hr of a
  // mid-tier one), so a single global threshold flags almost nothing.
  // Instead group by level tier and pick the leader per tier — that way
  // players at every level see a recommendation they can actually use.
  if (methods.length) {
    const tiers = [
      { min: 1,   max: 29 },
      { min: 30,  max: 49 },
      { min: 50,  max: 69 },
      { min: 70,  max: 89 },
      { min: 90,  max: 109 },
      { min: 110, max: 200 },
    ];
    for (const tier of tiers) {
      const inTier = methods.filter(m => m.level_required >= tier.min && m.level_required <= tier.max);
      if (!inTier.length) continue;

      // Top XP/hr in tier → ironman pick
      const bestXp = inTier.reduce((a, b) => (b.xp_per_hour_mid || 0) > (a.xp_per_hour_mid || 0) ? b : a);
      if ((bestXp.xp_per_hour_mid || 0) > 0) bestXp.ironman_score = 'recommended';

      // Top gp/hr in tier → main pick. Only flag if gp/hr is meaningfully positive.
      const bestGp = inTier.reduce((a, b) => (b.gp_per_hour || 0) > (a.gp_per_hour || 0) ? b : a);
      if ((bestGp.gp_per_hour || 0) > 0) bestGp.main_score = 'recommended';
    }
  }
  return methods;
}

// Public API
async function getMethodsForSkill(skill) {
  if (hasCurated(skill)) {
    const { methods } = loadCurated(skill);
    const enriched = await enrichOutputs(methods);
    return attachDerivedSignals(enriched).map(m => ({ ...m, is_auto_derived: false }));
  }
  // Fall back to auto-derive for artisan skills with recipes
  return autoDeriveSkillMethods(skill);
}

module.exports = { getMethodsForSkill };
