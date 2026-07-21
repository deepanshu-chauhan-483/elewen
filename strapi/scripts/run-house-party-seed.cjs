#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for House Party / Birthday general packs.
 * Upserts inclusions as choice groups + short card tags.
 *
 *   cd strapi
 *   $env:SEED_DECOR_REFRESH_EXISTING="true"
 *   node scripts/run-house-party-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const {
  seedDecorHousePartyBirthdayPackages,
} = require('../src/seed/decor-house-party-birthday-packages');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDecorHousePartyBirthdayPackages(app);
    const packages = result?.packages ?? [];
    const summary = {
      created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
      updated: packages.filter(item => item.updated).length,
      repaired: packages.filter(item => item.repaired).length,
      skipped: packages.filter(item => item.skipped).length,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-house-party-birthday] done:', JSON.stringify(summary, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-house-party-birthday] failed:', error);
  process.exit(1);
});
