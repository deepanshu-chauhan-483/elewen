#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for Bubbles & Black Tie decor packages.
 * Creates Theme `bubbles-and-black-tie` if missing, then upserts by slug.
 *
 *   cd strapi && node scripts/run-bubbles-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const {
  seedDecorBubblesBlackTiePackages,
} = require('../src/seed/decor-bubbles-black-tie-packages');

async function dumpSlug(strapi, slug) {
  const rows = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    populate: {
      packages: {
        on: {
          'package.decorpackages': {
            populate: ['inclustions', 'addons', 'price_breakdown'],
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
  const addons = (block?.addons || []).map(item => ({
    name: item.name,
    price: item.price,
  }));

  console.log(
    'VERIFY %s: price=%s addons=%s incs=%s',
    slug,
    row.base_price,
    JSON.stringify(addons),
    JSON.stringify(incs, null, 2)
  );
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDecorBubblesBlackTiePackages(app);
    const packages = result?.packages ?? [];
    const summary = {
      created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
      updated: packages.filter(item => item.updated).length,
      repaired: packages.filter(item => item.repaired).length,
      skipped: packages.filter(item => item.skipped).length,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-bubbles-black-tie] done:', JSON.stringify(summary, null, 2));
    await dumpSlug(app, 'social-setup-2');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-bubbles-black-tie] failed:', error);
  process.exit(1);
});
