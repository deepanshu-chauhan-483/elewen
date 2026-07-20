#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for Birthday Bohemian decor packages.
 * Creates Theme `bohemian` if missing, then upserts packages by slug.
 *
 *   cd strapi && node scripts/run-bohemian-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorBohemianPackages } = require('../src/seed/decor-bohemian-packages');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDecorBohemianPackages(app);
    const packages = result?.packages ?? [];
    const summary = {
      created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
      updated: packages.filter(item => item.updated).length,
      repaired: packages.filter(item => item.repaired).length,
      skipped: packages.filter(item => item.skipped).length,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-bohemian] done:', JSON.stringify(summary, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-bohemian] failed:', error);
  process.exit(1);
});
