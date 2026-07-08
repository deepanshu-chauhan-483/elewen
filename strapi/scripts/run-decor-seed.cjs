#!/usr/bin/env node
'use strict';

/**
 * One-shot decor package seed — safe for production (no DB drop).
 * Does not touch package images (R2 links in DB are preserved).
 *
 * Local:
 *   cd strapi && node scripts/run-decor-seed.cjs
 *
 * Docker (Strapi must be stopped to avoid DB lock contention):
 *   docker compose stop strapi
 *   docker compose run --rm --no-deps strapi node scripts/run-decor-seed.cjs
 *   docker compose up -d strapi
 *
 * Optional: SEED_DECOR_REFRESH_EXISTING=true updates text/pricing on packages
 * that already have a decor block (images still preserved).
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorProposalPackages } = require('../src/seed/decor-proposal-packages');
const { seedDecorAnniversaryPackages } = require('../src/seed/decor-anniversary-packages');
const { seedDecorBabyShowerPackages } = require('../src/seed/decor-baby-shower-packages');

function summarize(label, result) {
  const packages = result?.packages ?? [];
  return {
    label,
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
    const proposal = await seedDecorProposalPackages(app);
    const anniversary = await seedDecorAnniversaryPackages(app);
    const babyShower = await seedDecorBabyShowerPackages(app);

    const summary = [
      summarize('proposal', proposal),
      summarize('anniversary', anniversary),
      summarize('baby-shower', babyShower),
    ];

    console.log('[seed/decor] done:', JSON.stringify(summary, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor] failed:', error);
  process.exit(1);
});
