#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for House Party / Birthday general packs.
 * Upserts inclusions as choice groups + short card tags.
 *
 *   cd strapi
 *   $env:SEED_DECOR_REFRESH_EXISTING="true"
 *   node scripts/run-house-party-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const {
  seedDecorHousePartyBirthdayPackages,
} = require('../src/seed/decor-house-party-birthday-packages');

async function dumpSlug(strapi, slug) {
  const rows = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    populate: {
      packages: {
        on: {
          'package.decorpackages': {
            populate: ['inclustions', 'addons', 'elements'],
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
  const addons = (block?.addons || []).map(item => ({ name: item.name, price: item.price }));
  const elements = (block?.elements || []).map(item => ({
    title: item.title,
    base_price: item.base_price,
  }));

  console.log(
    'VERIFY %s: price=%s addons=%s elements=%s incs=%s',
    slug,
    row.base_price,
    JSON.stringify(addons),
    JSON.stringify(elements),
    JSON.stringify(incs, null, 2)
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
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-house-party-birthday] done:', JSON.stringify(summary, null, 2));
    await dumpSlug(app, 'phool-proof-1');
    await dumpSlug(app, 'phool-proof-2');
    await dumpSlug(app, 'air-we-go-1');
    await dumpSlug(app, 'air-we-go-2');
    await dumpSlug(app, 'air-we-go-2-3');
    await dumpSlug(app, 'air-we-go-3');
    await dumpSlug(app, 'raise-the-bar-1');
    await dumpSlug(app, 'raise-the-bar-1b');
    await dumpSlug(app, 'raise-the-bar-2');
    await dumpSlug(app, 'raise-the-bar-2-3');
    await dumpSlug(app, 'raise-the-bar-3');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-house-party-birthday] failed:', error);
  process.exit(1);
});
