#!/usr/bin/env node
'use strict';

/**
 * Restore cateringpackage.menu_items + re-seed Catering Menu Library from seeds.
 * Does not change prices or other package fields.
 *
 *   node scripts/refresh-catering-package-menu-items.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringMenuLibrary } = require('../src/seed/catering-menu-library');
const { findPackageBySlug } = require('../src/seed/catering-shared');

const MENU_ITEMS_BY_SLUG = Object.fromEntries(
  [...ESSENTIAL_PACKAGES, ...ASSISTED_PACKAGES, ...END_TO_END_PACKAGES]
    .filter(pkg => Array.isArray(pkg.menu_items) && pkg.menu_items.length)
    .map(pkg => [pkg.slug, pkg.menu_items])
);

function sanitizeMenuItems(items) {
  return items.map(item => {
    const copy = { ...item };
    delete copy.id;
    delete copy.documentId;
    return copy;
  });
}

function sanitizeCateringBlock(block, menuItems) {
  const next = { ...block, menu_items: sanitizeMenuItems(menuItems) };
  delete next.id;
  delete next.documentId;

  if (next.policy?.documentId) next.policy = next.policy.documentId;
  else if (next.policy && typeof next.policy === 'object') delete next.policy;

  if (next.budget_level?.documentId) next.budget_level = next.budget_level.documentId;

  return next;
}

async function patchPackageMenuItems(strapi, slug, menuItems) {
  const found = await findPackageBySlug(strapi, slug);
  if (!found?.entry?.documentId) {
    return { slug, ok: false, reason: 'not-found' };
  }

  const blocks = Array.isArray(found.entry.packages) ? found.entry.packages : [];
  const cateringIndex = blocks.findIndex(b => b?.__component === 'package.cateringpackage');
  if (cateringIndex < 0) {
    return { slug, ok: false, reason: 'no-catering-block' };
  }

  const nextBlocks = [...blocks];
  nextBlocks[cateringIndex] = sanitizeCateringBlock(blocks[cateringIndex], menuItems);

  await strapi.documents('api::package.package').update({
    documentId: found.entry.documentId,
    data: { packages: nextBlocks },
  });

  try {
    await strapi.documents('api::package.package').publish({
      documentId: found.entry.documentId,
    });
  } catch {
    // ignore
  }

  return { slug, ok: true, rows: menuItems.length };
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const menuResult = await seedCateringMenuLibrary(app);
    console.log(
      `[refresh-catering-menu] library documentId=${menuResult.documentId} updated=${Boolean(menuResult.updated)}`
    );

    const results = [];
    for (const [slug, menuItems] of Object.entries(MENU_ITEMS_BY_SLUG)) {
      results.push(await patchPackageMenuItems(app, slug, menuItems));
    }

    const ok = results.filter(r => r.ok);
    const failed = results.filter(r => !r.ok);
    console.log(`[refresh-catering-menu] menu_items patched=${ok.length}, failed=${failed.length}`);
    for (const row of ok) {
      console.log(`  ✓ ${row.slug} (${row.rows} rows)`);
    }
    for (const row of failed) {
      console.log(`  ✗ ${row.slug}: ${row.reason}`);
    }
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[refresh-catering-menu] failed:', error);
  process.exit(1);
});
