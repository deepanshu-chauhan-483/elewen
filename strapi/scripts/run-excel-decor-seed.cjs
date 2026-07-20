#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for Excel-import decor packages (bubbles, sufi, house party).
 * Data only — no images. Idempotent by slug.
 *
 *   cd strapi && node scripts/run-excel-decor-seed.cjs
 *
 * Regenerate modules after Excel changes:
 *   python scripts/parse_package_excel.py
 *   python scripts/generate_decor_seeds.py
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorBubblesBlackTiePackages } = require('../src/seed/decor-bubbles-black-tie-packages');
const { seedDecorSufiNightPackages } = require('../src/seed/decor-sufi-night-packages');
const { seedDecorHousePartyBirthdayPackages } = require('../src/seed/decor-house-party-birthday-packages');
const { seedDecorPastelPackages } = require('../src/seed/decor-pastel-packages');

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
    const bubbles = await seedDecorBubblesBlackTiePackages(app);
    const sufi = await seedDecorSufiNightPackages(app);
    const houseParty = await seedDecorHousePartyBirthdayPackages(app);
    const pastel = await seedDecorPastelPackages(app);

    const summary = [
      summarize('bubbles-black-tie', bubbles),
      summarize('sufi-night', sufi),
      summarize('house-party-birthday', houseParty),
      summarize('pastel', pastel),
    ];

    console.log('[seed/excel-decor] done:', JSON.stringify(summary, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/excel-decor] failed:', error);
  process.exit(1);
});
