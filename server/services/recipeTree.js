// Recipe tree expansion — given a target item, recursively look up the
// recipes of its materials so the caller can plan an Ironman-style gather
// list. Stops at:
//   - a configurable max depth (default 2)
//   - any material that has no Herblore/Cooking/etc. recipe in our DB
//     (those are "gather-level" items — herbs, vials of water, secondaries)
//   - any material we don't have in the items DB (returned as a leaf)
const { Op } = require('sequelize');
const { Item, ItemRecipe } = require('../models');

// Slugify must match wikiClient.slugify exactly so material names → DB slugs
// resolve consistently.
function slugify(name) {
  return String(name || '')
    .replace(/\+/g, '_plus')
    .replace(/&/g, '_and')
    .replace(/'/g, '')
    .replace(/\s+/g, '_')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

// Pick the "real" recipe for an item when it has multiple.
// Some wiki pages list both the standard recipe (output_quantity = 1) and a
// bulk variant (e.g. output_quantity = 5 for "make 5 Overloads at once").
// We want the simplest variant. Preference:
//   1. Recipes matching the requested skill with a valid level+xp
//   2. Among matches, smallest output_quantity (typically 1)
//   3. Among ties, smallest level (less weird high-level variants)
//   4. Fall back to any valid recipe, else the first one.
function pickPrimaryRecipe(recipes, preferSkill) {
  if (!recipes || !recipes.length) return null;

  const score = (r) => [
    r.output_quantity ?? 1,    // smaller is better
    r.level ?? 9999,           // smaller is better
  ];
  const cmp = (a, b) => {
    const sa = score(a), sb = score(b);
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sa[i] - sb[i];
    return 0;
  };

  if (preferSkill) {
    const matches = recipes.filter(r => r.skill === preferSkill && r.xp != null && r.level != null);
    if (matches.length) return matches.slice().sort(cmp)[0];
  }
  const valid = recipes.filter(r => r.skill && r.xp != null && r.level != null);
  if (valid.length) return valid.slice().sort(cmp)[0];
  return recipes[0];
}

// Fetch one item + its recipes by slug. Returns null if missing.
async function fetchBySlug(slug) {
  return Item.findOne({
    where: { slug },
    attributes: ['id', 'slug', 'name', 'image_url', 'members', 'ge_price_current', 'is_skilling', 'is_trainable', 'categories'],
    include: [{ model: ItemRecipe, as: 'recipes' }],
  });
}

// Drop a trailing dose suffix ("_3", "_4", "_6") so a material named
// "Extreme attack (3)" resolves to the canonical "Extreme attack" page
// (which most multi-dose wiki pages redirect to).
function canonicalizeSlug(slug) {
  return slug.replace(/_[1-6]$/, '');
}

// Batch fetch by a set of slugs to avoid N+1 in deeper expansions.
// Falls back to dose-stripped canonical slugs for any miss.
async function fetchBySlugs(slugs) {
  if (!slugs.length) return new Map();
  const items = await Item.findAll({
    where: { slug: { [Op.in]: slugs } },
    attributes: ['id', 'slug', 'name', 'image_url', 'members', 'ge_price_current', 'is_skilling', 'is_trainable', 'categories'],
    include: [{ model: ItemRecipe, as: 'recipes' }],
  });
  const map = new Map(items.map(it => [it.slug, it]));

  // For misses, retry against canonicalized (dose-stripped) slug.
  const misses = slugs.filter(s => !map.has(s));
  const canonicalMisses = [...new Set(misses.map(canonicalizeSlug).filter(s => !map.has(s)))];
  if (canonicalMisses.length) {
    const more = await Item.findAll({
      where: { slug: { [Op.in]: canonicalMisses } },
      attributes: ['id', 'slug', 'name', 'image_url', 'members', 'ge_price_current', 'is_skilling', 'is_trainable', 'categories'],
      include: [{ model: ItemRecipe, as: 'recipes' }],
    });
    const canonicalMap = new Map(more.map(it => [it.slug, it]));
    for (const original of misses) {
      const canonical = canonicalizeSlug(original);
      if (canonicalMap.has(canonical)) {
        map.set(original, canonicalMap.get(canonical));
      }
    }
  }
  return map;
}

// Recursive expander. Builds:
//   { item, recipe, materials: [{ name, quantity, child? }] }
// `child` is the same shape; absent for leaves.
async function expand(slug, { depth, preferSkill, visited }) {
  if (visited.has(slug)) return null; // cycle guard
  visited.add(slug);

  const item = await fetchBySlug(slug);
  if (!item) return { unknown: true, slug, name: slug };

  const recipe = pickPrimaryRecipe(item.recipes, preferSkill);
  const node = {
    item: {
      id: item.id,
      slug: item.slug,
      name: item.name,
      image_url: item.image_url,
      members: item.members,
      ge_price_current: item.ge_price_current,
    },
    recipe: recipe ? {
      id: recipe.id,
      skill: recipe.skill,
      level: recipe.level,
      xp: recipe.xp,
      ticks: recipe.ticks,
      output_quantity: recipe.output_quantity || 1,
    } : null,
    materials: [],
  };

  if (!recipe || depth <= 0) return node;

  // Resolve child slugs in one query
  const matEntries = (recipe.materials || []).map(m => ({
    name: m.name,
    quantity: m.quantity || 1,
    slug: slugify(m.name),
  }));
  const childMap = await fetchBySlugs(matEntries.map(m => m.slug));

  for (const m of matEntries) {
    const childItem = childMap.get(m.slug);
    if (!childItem) {
      // Material not in DB — leaf with name only.
      node.materials.push({ name: m.name, quantity: m.quantity, leaf: true });
      continue;
    }
    // Only recurse if the child has a Herblore recipe with skill+xp.
    // Materials like Vial of water / Clean torstol / Snape grass that lack
    // a Herblore recipe become leaves naturally — they're gathered.
    const childRecipe = pickPrimaryRecipe(childItem.recipes, preferSkill);
    const shouldRecurse = depth > 0
      && childRecipe
      && childRecipe.skill === preferSkill
      && childRecipe.xp != null;

    if (shouldRecurse) {
      const child = await expand(childItem.slug, {
        depth: depth - 1,
        preferSkill,
        visited: new Set(visited), // separate cycle set per branch
      });
      node.materials.push({
        name: m.name,
        quantity: m.quantity,
        child,
      });
    } else {
      // Treat as gather-level leaf, but include its DB metadata for the UI.
      node.materials.push({
        name: m.name,
        quantity: m.quantity,
        leaf: true,
        item: {
          slug: childItem.slug,
          name: childItem.name,
          image_url: childItem.image_url,
          members: childItem.members,
          ge_price_current: childItem.ge_price_current,
          categories: childItem.categories,
        },
      });
    }
  }

  return node;
}

async function buildRecipeTree(slug, { depth = 2, preferSkill = 'Herblore' } = {}) {
  return expand(slug, { depth, preferSkill, visited: new Set() });
}

module.exports = { buildRecipeTree, slugify };
