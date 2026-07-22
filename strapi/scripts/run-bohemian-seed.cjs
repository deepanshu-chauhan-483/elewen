#!/usr/bin/env node
'use strict';

/**
 * One-shot seed for Birthday Bohemian decor packages.
 * Creates Theme `bohemian` if missing, then upserts packages by slug.
 * Also deletes orphan the-first-layer-* packages that duplicated Signs & Stems.
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

  console.log(
    'VERIFY %s: title=%s price=%s levelincs=%s',
    slug,
    row.title,
    row.base_price,
    JSON.stringify(incs, null, 2)
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
      deletedOrphans: result?.deletedOrphans?.length ?? 0,
      event: result?.eventDocumentId ?? null,
    };
    console.log('[seed/decor-bohemian] done:', JSON.stringify(summary, null, 2));
    await dumpSlug(app, 'signs-and-stems-1');
    await dumpSlug(app, 'signs-and-stems-2');
    await dumpSlug(app, 'signs-and-stems-3');
    await dumpSlug(app, 'the-first-layer-1');
    await dumpSlug(app, 'pampous-play-2');
    await dumpSlug(app, 'pampous-play-3');
    await dumpSlug(app, 'less-is-more-3');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/decor-bohemian] failed:', error);
  process.exit(1);
});
