#!/usr/bin/env node
'use strict';

/**
 * Seed Religious → Pooja / Kirtan decor packages (Kesari + Shankh).
 *
 * Local (Strapi stopped):
 *   cd strapi && node scripts/run-pooja-kirtan-seed.cjs
 *
 * Production:
 *   docker compose run --rm --no-deps strapi node scripts/run-pooja-kirtan-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorPoojaKirtanPackages } = require('../src/seed/decor-pooja-kirtan-packages');

async function dumpSlug(strapi, slug) {
  const rows = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    populate: {
      events: { populate: ['parent_event'] },
      service_categories: true,
      packages: {
        on: {
          'package.decorpackages': {
            populate: ['inclustions', 'budget_level', 'theme'],
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
  const events = (row.events || []).map(item => ({
    slug: item.slug,
    parent: item.parent_event?.slug,
  }));

  console.log(
    'VERIFY %s: price=%s level=%s theme=%s events=%s incs=%s',
    slug,
    row.base_price,
    block?.budget_level?.slug || null,
    block?.theme?.slug || block?.theme_name || null,
    JSON.stringify(events),
    JSON.stringify(incs, null, 2)
  );
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedDecorPoojaKirtanPackages(app);
    const packages = result?.packages ?? [];
    console.log(
      '[seed/decor-pooja-kirtan] summary',
      JSON.stringify(
        {
          created: packages.filter(item => !item.skipped && !item.repaired && !item.updated).length,
          updated: packages.filter(item => item.updated).length,
          repaired: packages.filter(item => item.repaired).length,
          skipped: packages.filter(item => item.skipped).length,
          event: result?.eventDocumentId ?? null,
        },
        null,
        2
      )
    );

    await dumpSlug(app, 'kesari');
    await dumpSlug(app, 'kesari-2');
    await dumpSlug(app, 'kesari-3');
    await dumpSlug(app, 'shankh');
    await dumpSlug(app, 'shankh-2');
    await dumpSlug(app, 'shankh-3');
    await dumpSlug(app, 'shankh-3-1');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[run-pooja-kirtan-seed] failed:', error);
  process.exit(1);
});
