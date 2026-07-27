#!/usr/bin/env node
'use strict';

/**
 * Seeds General Pack (Birthday) + House Party decor catalogs.
 *
 *   cd strapi
 *   $env:SEED_DECOR_REFRESH_EXISTING="true"
 *   node scripts/run-house-party-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const {
  GENERAL_PACK_PACKAGE_SLUGS,
  seedDecorGeneralPackPackages,
} = require('../src/seed/decor-general-pack-packages');
const {
  HOUSE_PARTY_PACKAGE_SLUGS,
  seedDecorHousePartyPackages,
} = require('../src/seed/decor-house-party-packages');

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
  const themeSlug = block?.theme?.slug ?? null;
  const eventSlugs = (row.events || []).map(event => event.slug).filter(Boolean);

  console.log(
    'VERIFY %s: price=%s theme=%s events=%s active=%s title=%s',
    slug,
    row.base_price,
    themeSlug,
    JSON.stringify(eventSlugs),
    row.is_active,
    row.title
  );
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const general = await seedDecorGeneralPackPackages(app);
    const house = await seedDecorHousePartyPackages(app);

    console.log('[seed/decor-general-pack] done:', {
      updated: (general.packages ?? []).filter(item => item.updated).length,
      restoredVisibility: general.restoredVisibility ?? 0,
    });
    console.log('[seed/decor-house-party] done:', {
      updated: (house.packages ?? []).filter(item => item.updated).length,
      repairedEventLinks: house.repairedEventLinks ?? 0,
    });

    for (const slug of GENERAL_PACK_PACKAGE_SLUGS) {
      await dumpSlug(app, slug);
    }
    for (const slug of HOUSE_PARTY_PACKAGE_SLUGS) {
      await dumpSlug(app, slug);
    }
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
