// Seeder: pulls a list of wiki page titles, parses each via the wiki client,
// upserts to Postgres. Resumable via ItemSyncLog.
//
// MVP scope: a small hand-picked set of potion pages so we prove the schema +
// detail page end-to-end. Run with:
//   node server/jobs/seedItems.js
//
// Expand the WIKI_PAGES list (or replace with a Cargo-driven category query)
// once the pipeline is validated.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const {
  sequelize,
  Item,
  ItemRecipe,
  ItemProduct,
  ItemDisassembly,
  ItemDrop,
  ItemShop,
  ItemSyncLog,
} = require('../models');
const wikiClient = require('../services/wikiClient');
const gePriceClient = require('../services/gePriceClient');

// MVP set — Snapdragon line + a few other staple potions to exercise variety.
const WIKI_PAGES = [
  'Snapdragon potion (unfinished)',
  'Super restore (3)',
  'Prayer potion (3)',
  'Super attack (3)',
  'Super strength (3)',
  'Super defence (3)',
  'Super energy (3)',
  'Antifire (3)',
  'Saradomin brew (3)',
  'Zamorak brew (3)',
  'Overload (4)',
  'Adrenaline potion (3)',
  'Stamina potion (3)',
  'Aggression potion (3)',
  'Extreme attack (3)',
  'Extreme strength (3)',
  'Extreme defence (3)',
  'Extreme magic (3)',
  'Extreme ranging (3)',
  'Extreme necromancy (3)',
];

// Throttle wiki + GE API calls. WeirdGloop accepts ~1 rps; wiki tolerates
// more but be polite.
const REQUEST_DELAY_MS = 1100;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function logSync({ entity_type, entity_key, status, error_message }) {
  await ItemSyncLog.create({
    entity_type,
    entity_key,
    status,
    last_synced_at: new Date(),
    error_message: error_message || null,
  });
}

async function upsertItem(parsed) {
  const { slug, wiki_page_title, name, description, infobox } = parsed;
  if (!infobox) {
    throw new Error(`No infobox parsed for "${wiki_page_title}"`);
  }

  // Categories come from the wiki directly now (action=parse&prop=categories),
  // not heuristic inference.
  const categories = parsed.categories || [];
  const is_trainable = parsed.recipes.length > 0 || parsed.products.length > 0;
  const is_skilling = !!parsed.recipes.find(r => r.skill);

  const [item] = await Item.upsert({
    slug,
    wiki_page_title,
    name,
    image_url: infobox.image_url,
    examine_text: infobox.examine_text,
    description,
    release_date: infobox.release_date,
    members: infobox.members,
    quest_item: infobox.quest_item,
    tradeable: infobox.tradeable,
    equipable: infobox.equipable,
    stackable: infobox.stackable,
    noteable: infobox.noteable,
    disassemblable: infobox.disassemblable,
    destroy_method: infobox.destroy_method,
    backpack_options: infobox.backpack_options,
    ge_value: infobox.ge_value,
    high_alch: infobox.high_alch,
    low_alch: infobox.low_alch,
    weight_kg: infobox.weight_kg,
    ge_buy_limit: infobox.ge_buy_limit,
    ge_item_id: infobox.ge_item_id,
    on_death_reclaimable: infobox.on_death_reclaimable,
    on_death_value: infobox.on_death_value,
    on_death_cost: infobox.on_death_cost,
    categories,
    infobox_raw: infobox.raw || {},
    is_trainable,
    is_skilling,
    last_synced_at: new Date(),
  }, { returning: true, conflictFields: ['slug'] });

  return item;
}

async function replaceRecipes(item, parsed) {
  await ItemRecipe.destroy({ where: { itemId: item.id } });
  for (const r of parsed.recipes) {
    await ItemRecipe.create({
      itemId: item.id,
      skill: r.skill || null,
      level: r.level || null,
      xp: r.xp ?? null,
      ticks: r.ticks || null,
      members_only: r.members_only ?? null,
      materials: r.materials || [],
      output_quantity: r.output_quantity || 1,
      total_cost: r.total_cost ?? null,
      variant_label: r.variant_label || null,
    });
  }
}

async function replaceProducts(item, parsed) {
  await ItemProduct.destroy({ where: { inputItemId: item.id } });
  for (const p of parsed.products) {
    await ItemProduct.create({
      inputItemId: item.id,
      output_item_name: p.output_item_name,
      output_item_slug: p.output_item_slug,
      output_quantity: p.output_quantity || 1,
      skill: p.skill,
      level: p.level,
      xp: p.xp,
      members_only: p.members_only,
      materials: p.materials || [],
      ge_price: p.ge_price,
      ge_volume: p.ge_volume,
    });
  }
}

async function replaceDisassembly(item, parsed) {
  await ItemDisassembly.destroy({ where: { itemId: item.id } });
  if (!parsed.disassembly) return;
  await ItemDisassembly.create({
    itemId: item.id,
    category: parsed.disassembly.category,
    disassembly_xp: parsed.disassembly.disassembly_xp,
    item_quantity_required: parsed.disassembly.item_quantity_required,
    junk_chance: parsed.disassembly.junk_chance,
    materials: parsed.disassembly.materials || [],
  });
}

async function replaceDrops(item, parsed) {
  await ItemDrop.destroy({ where: { itemId: item.id } });
  for (const d of parsed.drops) {
    await ItemDrop.create({
      itemId: item.id,
      source_name: d.source_name,
      source_level: d.source_level,
      quantity_min: d.quantity_min,
      quantity_max: d.quantity_max,
      noted: d.noted ?? false,
      rarity_text: d.rarity_text,
      rarity_chance: d.rarity_chance,
      variant: d.variant,
    });
  }
}

async function replaceShops(item, parsed) {
  await ItemShop.destroy({ where: { itemId: item.id } });
  for (const s of parsed.shops) {
    await ItemShop.create({
      itemId: item.id,
      seller_name: s.seller_name,
      location: s.location,
      stock: s.stock,
      sold_price: s.sold_price,
      bought_price: s.bought_price,
      members_only: s.members_only,
      requirements: s.requirements,
    });
  }
}

async function refreshPrice(item) {
  try {
    // Prefer lookup by id — names with parens (e.g. "Snapdragon potion (unfinished)")
    // sometimes miss in the name index but always resolve by id.
    const live = item.ge_item_id
      ? await gePriceClient.getLatestById(item.ge_item_id)
      : await gePriceClient.getLatestByName(item.name);
    if (live) {
      item.ge_price_current = live.price ?? null;
      item.ge_volume_current = live.volume ?? null;
      item.ge_price_synced_at = new Date();
      await item.save();
    }
  } catch (err) {
    console.warn(`  price refresh failed for ${item.name}:`, err.message);
  }
}

async function seedOne(pageTitle) {
  console.log(`→ ${pageTitle}`);
  const parsed = await wikiClient.fetchItem(pageTitle);
  const item = await upsertItem(parsed);
  await replaceRecipes(item, parsed);
  await replaceProducts(item, parsed);
  await replaceDisassembly(item, parsed);
  await replaceDrops(item, parsed);
  await replaceShops(item, parsed);
  await refreshPrice(item);
  await logSync({
    entity_type: 'item',
    entity_key: item.slug,
    status: 'success',
  });
  console.log(`  ✓ ${item.name} (slug=${item.slug}) — recipes=${parsed.recipes.length}, products=${parsed.products.length}, drops=${parsed.drops.length}, shops=${parsed.shops.length}`);
}

function parseCliArgs(argv) {
  const categories = [];
  const pages = [];
  let reset = false;
  let skipExisting = false;
  for (const arg of argv) {
    if (arg.startsWith('--category=')) {
      categories.push(arg.slice('--category='.length));
    } else if (arg.startsWith('--page=')) {
      pages.push(arg.slice('--page='.length));
    } else if (arg === '--reset') {
      reset = true;
    } else if (arg === '--skip-existing') {
      skipExisting = true;
    }
  }
  return { categories, pages, reset, skipExisting };
}

async function resolvePages({ categories, pages }) {
  const all = [...pages];
  for (const cat of categories) {
    console.log(`Fetching category members for "${cat}"...`);
    const members = await wikiClient.listCategoryMembers(cat);
    console.log(`  found ${members.length} pages`);
    all.push(...members);
  }
  // If nothing was passed at all, fall back to the staple list for safety.
  if (!all.length) return WIKI_PAGES;
  // dedupe, preserve order
  const seen = new Set();
  return all.filter(t => seen.has(t) ? false : (seen.add(t), true));
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Syncing models...');
  await sequelize.sync({ alter: true });

  if (args.reset) {
    console.log('Resetting item tables (--reset)...');
    // TRUNCATE the parent; CASCADE clears recipes/products/disassembly/drops/shops via FK ON DELETE CASCADE.
    await Item.destroy({ where: {}, truncate: { cascade: true } });
  }

  let pages = await resolvePages(args);
  console.log(`Resolved ${pages.length} pages.`);

  if (args.skipExisting) {
    const existing = new Set(
      (await Item.findAll({ attributes: ['slug'] })).map(i => i.slug)
    );
    const before = pages.length;
    pages = pages.filter(t => !existing.has(wikiClient.slugify(t)));
    console.log(`Skipping ${before - pages.length} already-seeded; ${pages.length} new.\n`);
  } else {
    console.log('');
  }

  let ok = 0, fail = 0, skipped = 0;
  for (const pageTitle of pages) {
    try {
      await seedOne(pageTitle);
      ok++;
    } catch (err) {
      fail++;
      console.error(`  ✗ ${pageTitle}: ${err.message}`);
      await logSync({
        entity_type: 'item',
        entity_key: wikiClient.slugify(pageTitle),
        status: 'failed',
        error_message: err.message,
      });
    }
    await sleep(REQUEST_DELAY_MS);
  }
  console.log(`\nDone. ${ok} succeeded, ${fail} failed.`);
  await sequelize.close();
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal seeder error:', err);
    process.exit(1);
  });
}

module.exports = { seedOne, WIKI_PAGES };
