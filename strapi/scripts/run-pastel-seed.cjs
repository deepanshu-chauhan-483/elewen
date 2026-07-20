#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for Birthday Pastel decor packages.
 * Creates Theme `pastel` if missing, then upserts packages by slug.
 *
 *   cd strapi && node scripts/run-pastel-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorPastelPackages } = require('../src/seed/decor-pastel-packages');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDecorPastelPackages(app);
    const packages = result?.packages ?? [];
    const summary = {
      created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
      updated: packages.filter(item => item.updated).length,
      repaired: packages.filter(item => item.repaired).length,
      skipped: packages.filter(item => item.skipped).length,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-pastel] done:', JSON.stringify(summary, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-pastel] failed:', error);
  process.exit(1);
});
