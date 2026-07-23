#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for all catering data from Final Catering Menu Excel sources.
 * Idempotent by slug — skips packages that already exist with a catering block
 * unless CATERING_REFRESH_EXISTING=1 (force overwrite prices + menu_items).
 *
 *   CATERING_REFRESH_EXISTING=1 node scripts/run-catering-all.cjs
 *   docker compose run --rm --no-deps -e CATERING_REFRESH_EXISTING=1 strapi node scripts/run-catering-all.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringEssentials } = require('../src/seed/catering-essentials');
const { seedCateringAssisted } = require('../src/seed/catering-assisted');
const { seedCateringEndToEnd } = require('../src/seed/catering-end-to-end');
const { seedCateringAddons } = require('../src/seed/catering-addons');
const { seedCateringDiscountSettings } = require('../src/seed/catering-discount-settings');
const { seedCateringMenuLibrary } = require('../src/seed/catering-menu-library');
const { shouldRefreshExistingCatering } = require('../src/seed/catering-shared');

function summarize(label, result) {
  const packages = result?.packages ?? [];
  return {
    label,
    created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
    updated: packages.filter(item => item.updated).length,
    repaired: packages.filter(item => item.repaired).length,
    skipped: packages.filter(item => item.skipped).length,
    documentId: result?.documentId ?? null,
  };
}

async function main() {
  const refreshExisting = shouldRefreshExistingCatering();
  const seedOptions = { refreshExisting };
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    console.log(
      `[seed/catering-all] refreshExisting=${refreshExisting} (set CATERING_REFRESH_EXISTING=1 to overwrite)`
    );
    const essentials = await seedCateringEssentials(app, seedOptions);
    const assisted = await seedCateringAssisted(app, seedOptions);
    const endToEnd = await seedCateringEndToEnd(app, seedOptions);
    const addons = await seedCateringAddons(app);
    const discounts = await seedCateringDiscountSettings(app);
    const menu = await seedCateringMenuLibrary(app);
    const addonRows = addons?.addons ?? [];

    const summary = [
      summarize('essentials', essentials),
      summarize('assisted', assisted),
      summarize('end-to-end', endToEnd),
      {
        label: 'addons',
        created: addonRows.filter(row => !row.skipped && !row.updated).length,
        updated: addonRows.filter(row => row.updated).length,
        skipped: addonRows.filter(row => row.skipped).length,
      },
      {
        label: 'discounts',
        created: discounts?.created ? 1 : 0,
        updated: discounts?.updated ? 1 : 0,
        documentId: discounts?.documentId ?? null,
      },
      {
        label: 'menu-library',
        created: menu?.created ? 1 : 0,
        updated: menu?.updated ? 1 : 0,
        documentId: menu?.documentId ?? null,
      },
    ];

    console.log('[seed/catering-all] done:', JSON.stringify(summary, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/catering-all] failed:', error);
  process.exit(1);
});
