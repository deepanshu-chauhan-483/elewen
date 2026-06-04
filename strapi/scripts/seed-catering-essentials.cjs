#!/usr/bin/env node
'use strict';

/**
 * Run catering Essentials seed while Strapi is stopped:
 *   node scripts/seed-catering-essentials.cjs
 *
 * Or leave SEED_CATERING_ESSENTIALS enabled (default) and restart `npm run develop`.
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringEssentials } = require('../src/seed/catering-essentials');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedCateringEssentials(app);
    console.log('[seed/catering] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/catering] failed:', error);
  process.exit(1);
});
