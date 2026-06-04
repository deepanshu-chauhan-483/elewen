#!/usr/bin/env node
'use strict';

/**
 * Re-attach missing package.cateringpackage blocks on existing Package entries.
 * Stop Strapi first, then:
 *   node scripts/seed-catering-repair-packages.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringEssentials } = require('../src/seed/catering-essentials');
const { seedCateringAssisted } = require('../src/seed/catering-assisted');
const { seedCateringEndToEnd } = require('../src/seed/catering-end-to-end');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const essentials = await seedCateringEssentials(app);
    const assisted = await seedCateringAssisted(app);
    const endToEnd = await seedCateringEndToEnd(app);

    const all = [
      ...essentials.packages,
      ...assisted.packages,
      ...endToEnd.packages,
    ];
    const repaired = all.filter(item => item.repaired);
    const skipped = all.filter(item => item.skipped);
    const created = all.filter(item => !item.skipped && !item.repaired);

    console.log(
      `[seed/catering-repair] created=${created.length}, repaired=${repaired.length}, skipped=${skipped.length}`
    );
    if (repaired.length) {
      console.log(
        'Repaired:',
        repaired.map(item => item.title).join(', ')
      );
    }
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/catering-repair] failed:', error);
  process.exit(1);
});
