#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for House Party decor catalog.
 *
 *   cd strapi
 *   $env:SEED_DECOR_REFRESH_EXISTING="true"
 *   node scripts/run-house-party-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const {
  seedDecorHousePartyBirthdayPackages,
  HOUSE_PARTY_BIRTHDAY_PACKAGES,
} = require('../src/seed/decor-house-party-birthday-packages');

async function dumpSlug(strapi, slug) {
  const rows = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    populate: {
      packages: {
        on: {
          'package.decorpackages': {
            populate: ['inclustions', 'addons', 'elements', 'theme'],
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
  const themeSlug = block?.theme?.slug ?? null;
  const eventSlugs = (row.events || []).map(event => event.slug).filter(Boolean);

  console.log(
    'VERIFY %s: price=%s theme=%s events=%s title=%s',
    slug,
    row.base_price,
    themeSlug,
    JSON.stringify(eventSlugs),
    row.title
  );
}

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
      archivedLegacy: result?.archivedLegacy ?? 0,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-house-party-birthday] done:', JSON.stringify(summary, null, 2));

    for (const pkg of HOUSE_PARTY_BIRTHDAY_PACKAGES) {
      await dumpSlug(app, pkg.slug);
    }
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
