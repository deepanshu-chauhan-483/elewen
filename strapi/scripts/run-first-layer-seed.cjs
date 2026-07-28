'use strict';

/**
 * Refresh First Layer (bohemian) + Floating Moments 1 (anniversary) seeds.
 *
 *   cd strapi && node scripts/run-first-layer-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedDecorBohemianPackages } = require('../src/seed/decor-bohemian-packages');
const { seedDecorAnniversaryPackages } = require('../src/seed/decor-anniversary-packages');

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

  const block = (row.packages || []).find(
    item => item?.__component === 'package.decorpackages'
  );
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
    const bohemian = await seedDecorBohemianPackages(app);
    const anniversary = await seedDecorAnniversaryPackages(app);

    console.log(
      '[seed] bohemian:',
      JSON.stringify({
        updated: bohemian.packages.filter(item => item.updated).length,
        created: bohemian.packages.filter(
          item => !item.skipped && !item.repaired && !item.updated
        ).length,
      })
    );
    console.log(
      '[seed] anniversary:',
      JSON.stringify({
        updated: anniversary.packages.filter(item => item.updated).length,
        created: anniversary.packages.filter(
          item => !item.skipped && !item.repaired && !item.updated
        ).length,
      })
    );

    await dumpSlug(app, 'the-first-layer-1');
    await dumpSlug(app, 'floating-moments-1');
    await dumpSlug(app, 'hh-1');
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[run-first-layer-seed] failed:', error);
  process.exit(1);
});
