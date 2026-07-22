#!/usr/bin/env node
'use strict';

/**
 * One-shot delivery charge seed.
 *
 *   cd strapi
 *   # create only when empty:
 *   node scripts/run-delivery-charges-seed.cjs
 *
 *   # update existing pincode rows from Location sheet JSON:
 *   $env:SEED_DELIVERY_REFRESH_EXISTING="true"
 *   node scripts/run-delivery-charges-seed.cjs
 *
 * Docker:
 *   docker compose exec -e SEED_DELIVERY_REFRESH_EXISTING=true strapi node scripts/run-delivery-charges-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDeliveryCharges } = require('../src/seed/delivery-charges');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const refresh = process.env.SEED_DELIVERY_REFRESH_EXISTING === 'true';
    const result = await seedDeliveryCharges(app, { refreshExisting: refresh });
    console.log('[seed/delivery-charges] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/delivery-charges] failed:', error);
  process.exit(1);
});
