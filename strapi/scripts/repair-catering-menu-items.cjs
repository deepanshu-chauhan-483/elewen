'use strict';

/**
 * Backfill category_key / pick counts on catering menu_items when CMS rows were
 * saved without enumeration fields (shows as null in the REST API).
 *
 * Usage (from strapi/): node scripts/repair-catering-menu-items.cjs
 */

const path = require('node:path');
const Strapi = require('@strapi/strapi');

function pickHintText(item = {}) {
  return [item?.choose_hint, item?.title, item?.details].filter(Boolean).join(' ');
}

function parseChooseHint(hint = '') {
  const text = String(hint ?? '').trim();
  const splitMatch = text.match(/(\d+)\s*\+\s*(\d+)/);
  const allVegMatch = text.match(/or\s*(\d+)\s*veg/i);
  const vegPick = splitMatch ? Number(splitMatch[1]) : 0;
  const nonvegPick = splitMatch ? Number(splitMatch[2]) : 0;
  const splitTotal = vegPick + nonvegPick;
  const allVegPick = allVegMatch ? Number(allVegMatch[1]) : 0;

  if (splitMatch) {
    const maxPick = allVegPick > 0 ? Math.max(splitTotal, allVegPick) : splitTotal;
    return { maxPick: maxPick > 0 ? maxPick : 1, vegPick, nonvegPick };
  }

  if (allVegPick > 0) {
    return { maxPick: allVegPick, vegPick: allVegPick, nonvegPick: 0 };
  }

  const chooseMatch = text.match(/choose\s*(\d+)/i);
  const maxPick = chooseMatch ? Number(chooseMatch[1]) : 1;
  return { maxPick: maxPick > 0 ? maxPick : 1, vegPick: 0, nonvegPick: 0 };
}

function inferCategoryKeyFromTitle(title = '') {
  const text = String(title ?? '').toLowerCase();
  if (/dessert/.test(text)) return 'dessert';
  if (/starter/.test(text)) return 'starters';
  if (/main\s*course|\bmains\b/.test(text)) return 'main_course_veg';
  if (/accompaniment|rotis|rice.*bread|bread.*rice/.test(text)) return 'rotis_and_rice';
  if (/pre[-\s]?plated/.test(text)) return 'pre_plated';
  if (/\bsoup\b/.test(text)) return 'soup';
  if (/live\s*station/.test(text)) return 'live_stations';
  if (/\bsalad\b/.test(text)) return 'salad';
  if (/raita/.test(text)) return 'raita';
  return null;
}

function inferCategoryKeyExtra(title = '', rules = {}) {
  const text = String(title ?? '').toLowerCase();
  const maxPick = Number(rules.maxPick ?? 0);
  const hasSplitHint = /(\d+)\s*\+\s*(\d+)/.test(text) || /2\s*\+\s*2/.test(text);

  if (/starter/.test(text) && (maxPick >= 4 || hasSplitHint)) return 'starters_non_veg';
  if (/main\s*course|\bmains\b/.test(text) && (maxPick >= 4 || hasSplitHint)) {
    return 'main_course_non_veg';
  }

  return null;
}

function repairMenuItem(item = {}) {
  const title = String(item.title ?? '').trim();
  if (!title) return item;

  const hintText = pickHintText(item);
  const parsed = parseChooseHint(hintText);
  const categoryKey = item.category_key || inferCategoryKeyFromTitle(title);
  const categoryKeyExtra =
    item.category_key_extra || inferCategoryKeyExtra(title, parsed) || null;

  let maxPick = Number(item.max_pick) > 0 ? Number(item.max_pick) : parsed.maxPick;
  let vegPick = Number(item.veg_pick) > 0 ? Number(item.veg_pick) : parsed.vegPick;
  let nonvegPick = Number(item.nonveg_pick) > 0 ? Number(item.nonveg_pick) : parsed.nonvegPick;

  if (vegPick > 0 && nonvegPick > 0) {
    maxPick = Math.max(maxPick, vegPick + nonvegPick);
  }

  if (
    categoryKey === 'starters' &&
    categoryKeyExtra === 'starters_non_veg' &&
    maxPick >= 4 &&
    !vegPick &&
    !nonvegPick
  ) {
    vegPick = 2;
    nonvegPick = 2;
  }

  if (
    categoryKey === 'main_course_veg' &&
    categoryKeyExtra === 'main_course_non_veg' &&
    maxPick >= 4 &&
    !vegPick &&
    !nonvegPick
  ) {
    vegPick = 2;
    nonvegPick = 2;
  }

  return {
    ...item,
    choose_hint: item.choose_hint || hintText || null,
    category_key: categoryKey,
    category_key_extra: categoryKeyExtra,
    max_pick: maxPick,
    min_pick: Number(item.min_pick) > 0 ? Number(item.min_pick) : maxPick,
    veg_pick: vegPick || null,
    nonveg_pick: nonvegPick || null,
  };
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const strapi = await Strapi.createStrapi({ appDir }).load();

  let updatedPackages = 0;

  for (const status of ['published', 'draft']) {
    const packages = await strapi.documents('api::package.package').findMany({
      status,
      populate: { packages: true },
      limit: 200,
    });

    for (const entry of packages) {
      const blocks = Array.isArray(entry.packages) ? entry.packages : [];
      const cateringIndex = blocks.findIndex(
        block => block?.__component === 'package.cateringpackage'
      );

      if (cateringIndex < 0) continue;

      const catering = blocks[cateringIndex];
      const menuItems = Array.isArray(catering.menu_items) ? catering.menu_items : [];
      if (!menuItems.length) continue;

      const repairedItems = menuItems.map(repairMenuItem);
      const changed = JSON.stringify(menuItems) !== JSON.stringify(repairedItems);

      if (!changed) continue;

      const nextBlocks = [...blocks];
      nextBlocks[cateringIndex] = { ...catering, menu_items: repairedItems };

      await strapi.documents('api::package.package').update({
        documentId: entry.documentId,
        data: { packages: nextBlocks },
      });

      try {
        await strapi.documents('api::package.package').publish({
          documentId: entry.documentId,
        });
      } catch {
        // draft-only packages may not publish
      }

      updatedPackages += 1;
      console.log(`Repaired menu_items on "${entry.title}" (${status})`);
    }
  }

  console.log(`Done. Updated ${updatedPackages} package(s).`);
  await strapi.destroy();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
