#!/usr/bin/env node
'use strict';

/**
 * One-shot delivery charge seed. Skips if any row already exists.
 *
 *   cd strapi && node scripts/run-delivery-charges-seed.cjs
 *
 * Docker:
 *   docker compose stop strapi
 *   docker compose run --rm --no-deps strapi node scripts/run-delivery-charges-seed.cjs
 *   docker compose up -d strapi
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDeliveryCharges } = require('../src/seed/delivery-charges');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDeliveryCharges(app);
    console.log('[seed/delivery-charges] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/delivery-charges] failed:', error);
  process.exit(1);
});
