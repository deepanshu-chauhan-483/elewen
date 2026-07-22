#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for Ishq Sufiyana / Sufi Night decor packages.
 *
 *   cd strapi && node scripts/run-sufi-seed.cjs
 *   # or: npm run seed:sufi
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorSufiNightPackages } = require('../src/seed/decor-sufi-night-packages');

async function dumpSlug(strapi, slug) {
  const rows = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    populate: {
      packages: {
        on: {
          'package.decorpackages': {
            populate: ['inclustions', 'price_breakdown'],
          },
        },
      },
    },
    limit: 1,
  });

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) {
    console.log('VERIFY %s: NOT FOUND', slug);
    return;
  }

  const block = (row.packages || []).find(item => item?.__component === 'package.decorpackages');
  const incs = (block?.inclustions || []).map(item => ({
    group: item.choice_group_label || item.group_title,
    text: item.text,
    choice: Boolean(item.is_choice_group),
  }));

  console.log(
    'VERIFY %s: price=%s incs=%s',
    slug,
    row.base_price,
    JSON.stringify(incs, null, 2)
  );
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDecorSufiNightPackages(app);
    const packages = result?.packages ?? [];
    const summary = {
      created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
      updated: packages.filter(item => item.updated).length,
      repaired: packages.filter(item => item.repaired).length,
      skipped: packages.filter(item => item.skipped).length,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-sufi-night] done:', JSON.stringify(summary, null, 2));
    await dumpSlug(app, 'ishq-sufiyana-1');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-sufi-night] failed:', error);
  process.exit(1);
});
