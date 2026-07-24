#!/usr/bin/env node
'use strict';

/**
 * Seed rental furniture packages (Sit-Down / Mix & Mingle / Estate / Puja).
 *
 * Local (Strapi stopped):
 *   cd strapi && node scripts/run-furniture-seed.cjs
 *
 * Production (DigitalOcean):
 *   docker compose run --rm --no-deps strapi node scripts/run-furniture-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedFurniturePackages } = require('../src/seed/furniture-packages');

async function dumpSlug(strapi, slug) {
  const rows = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    populate: {
      service_categories: true,
      packages: {
        on: {
          'package.decorpackages': {
            populate: ['inclustions'],
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
  const services = (row.service_categories || []).map(item => item.slug || item.name);

  console.log(
    'VERIFY %s: price=%s services=%s incs=%s',
    slug,
    row.base_price,
    JSON.stringify(services),
    JSON.stringify(incs, null, 2)
  );
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedFurniturePackages(app);
    console.log(
      '[seed/furniture] summary created=%s updated=%s',
      result.created.length,
      result.updated.length
    );

    await dumpSlug(app, 'the-sit-down-dinner');
    await dumpSlug(app, 'the-estate-party-pack');
    await dumpSlug(app, 'the-puja-celebration');
    await dumpSlug(app, 'mehndi-on-my-mind');
    await dumpSlug(app, 'mehndi-on-my-mind-2-0');
    await dumpSlug(app, 'the-low-lounge-social');
    await dumpSlug(app, 'the-low-lounge-social-2-0');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[run-furniture-seed] failed:', error);
  process.exit(1);
});
