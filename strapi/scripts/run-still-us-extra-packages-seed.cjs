#!/usr/bin/env node
'use strict';

/**
 * Seed only 4 Still Us packages (does not wipe other Still Us / Proposal packs):
 *   first-date-2, first-date-3,
 *   still-us-our-private-corner-1, still-us-our-private-corner-2
 *
 * Safe vs Proposal: uses distinct slugs (not our-private-corner-2/3).
 * Safe vs Floating Moments balloons: does not touch floating-moments-* slugs.
 *
 *   cd strapi && node scripts/run-still-us-extra-packages-seed.cjs
 *
 * Docker:
 *   docker compose stop strapi
 *   docker compose run --rm --no-deps strapi node scripts/run-still-us-extra-packages-seed.cjs
 *   docker compose up -d strapi
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const {
  STILL_US_EXTRA_PACKAGE_SLUGS,
  seedStillUsExtraPackages,
} = require('../src/seed/decor-anniversary-packages');

async function dumpSlug(strapi, slug) {
  const rows = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    populate: {
      packages: {
        on: {
          'package.decorpackages': {
            populate: ['theme'],
          },
        },
      },
      events: true,
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
  const eventSlugs = (row.events || []).map(event => event.slug).filter(Boolean);

  console.log(
    'VERIFY %s: title=%s price=%s theme=%s events=%s',
    slug,
    row.title,
    row.base_price,
    themeSlug,
    eventSlugs.join(',') || '(none)'
  );
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedStillUsExtraPackages(app);
    const packages = result?.packages ?? [];
    const summary = {
      expectedSlugs: STILL_US_EXTRA_PACKAGE_SLUGS,
      created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
      updated: packages.filter(item => item.updated).length,
      repaired: packages.filter(item => item.repaired).length,
      skipped: packages.filter(item => item.skipped).length,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/still-us-extra] done:', JSON.stringify(summary, null, 2));

    for (const slug of STILL_US_EXTRA_PACKAGE_SLUGS) {
      await dumpSlug(app, slug);
    }
    // Confirm Proposal Private Corner untouched by slug collision
    await dumpSlug(app, 'our-private-corner-2');
    await dumpSlug(app, 'our-private-corner-3');
    await dumpSlug(app, 'floating-moments-1');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/still-us-extra] failed:', error);
  process.exit(1);
});
