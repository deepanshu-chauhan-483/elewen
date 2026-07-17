#!/usr/bin/env node
'use strict';

/**
 * One-shot bachelorette decor package seed — data only (no images).
 *
 * Local:
 *   cd strapi && node scripts/run-bachelorette-seed.cjs
 *
 * Docker:
 *   docker compose stop strapi
 *   docker compose run --rm --no-deps strapi node scripts/run-bachelorette-seed.cjs
 *   docker compose up -d strapi
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorBachelorettePackages } = require('../src/seed/decor-bachelorette-packages');

function summarize(result) {
  const packages = result?.packages ?? [];
  return {
    created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
    updated: packages.filter(item => item.updated).length,
    repaired: packages.filter(item => item.repaired).length,
    skipped: packages.filter(item => item.skipped).length,
    event: result?.eventDocumentId ?? null,
  };
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDecorBachelorettePackages(app);
    console.log('[seed/decor-bachelorette] done:', JSON.stringify(summarize(result), null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-bachelorette] failed:', error);
  process.exit(1);
});
