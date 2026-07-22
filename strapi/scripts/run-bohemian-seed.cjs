#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for Birthday Bohemian decor packages.
 * Creates Theme `bohemian` if missing, then upserts packages by slug.
 *
 * The First Layer 1–3 are seeded with theme `the-first-layer` only
 * (House Party / Birthday Party), not under Bohemian UI filter.
 *
 *   cd strapi && node scripts/run-bohemian-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorBohemianPackages } = require('../src/seed/decor-bohemian-packages');

async function dumpSlug(strapi, slug) {
  const rows = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    populate: {
      packages: {
        on: {
          'package.decorpackages': {
            populate: ['inclustions', 'theme'],
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
  const themeSlug = block?.theme?.slug || block?.theme_name || null;

  console.log(
    'VERIFY %s: title=%s price=%s theme=%s',
    slug,
    row.title,
    row.base_price,
    themeSlug
  );
}

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
    await dumpSlug(app, 'the-first-layer-1');
    await dumpSlug(app, 'the-first-layer-2');
    await dumpSlug(app, 'the-first-layer-3');
    await dumpSlug(app, 'signs-and-stems-1');
    await dumpSlug(app, 'signs-and-stems-2');
    await dumpSlug(app, 'signs-and-stems-3');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-bohemian] failed:', error);
  process.exit(1);
});
