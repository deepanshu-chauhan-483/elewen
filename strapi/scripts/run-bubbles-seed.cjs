#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for Bubbles & Black Tie decor packages.
 * Creates Theme `bubbles-and-black-tie` if missing, then upserts by slug.
 *
 *   cd strapi && node scripts/run-bubbles-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const {
  seedDecorBubblesBlackTiePackages,
} = require('../src/seed/decor-bubbles-black-tie-packages');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDecorBubblesBlackTiePackages(app);
    const packages = result?.packages ?? [];
    const summary = {
      created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
      updated: packages.filter(item => item.updated).length,
      repaired: packages.filter(item => item.repaired).length,
      skipped: packages.filter(item => item.skipped).length,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-bubbles-black-tie] done:', JSON.stringify(summary, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-bubbles-black-tie] failed:', error);
  process.exit(1);
});
