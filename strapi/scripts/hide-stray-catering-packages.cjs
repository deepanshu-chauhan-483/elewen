#!/usr/bin/env node
'use strict';

/**
 * Hide non-catalog catering packages from the website (visibility + is_active).
 * Client can also do this manually in Strapi: Package → visibility off / unpublish.
 *
 * From strapi/ (Strapi running or use offline load like patch script):
 *   node scripts/hide-stray-catering-packages.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { ESSENTIAL_PACKAGES } = require('../src/seed/catering-essentials');
const { ASSISTED_PACKAGES } = require('../src/seed/catering-assisted');
const { END_TO_END_PACKAGES } = require('../src/seed/catering-end-to-end');

const CATALOG_SLUGS = new Set(
  [...ESSENTIAL_PACKAGES, ...ASSISTED_PACKAGES, ...END_TO_END_PACKAGES].map(p => p.slug)
);

async function findAllCateringPackages(strapi) {
  const rows = [];
  for (const status of ['published', 'draft']) {
    const batch = await strapi.documents('api::package.package').findMany({
      filters: {
        service_categories: {
          slug: { $in: ['catering'] },
        },
      },
      status,
      populate: { service_categories: true, packages: true },
      limit: 200,
    });
    if (Array.isArray(batch)) rows.push(...batch);
  }
  const byDoc = new Map();
  for (const row of rows) {
    if (row?.documentId) byDoc.set(row.documentId, row);
  }
  return [...byDoc.values()];
}

function hasCateringBlock(entry) {
  return (Array.isArray(entry?.packages) ? entry.packages : []).some(
    block => block?.__component === 'package.cateringpackage'
  );
}

async function hidePackage(strapi, entry) {
  await strapi.documents('api::package.package').update({
    documentId: entry.documentId,
    data: {
      visibility: false,
      is_active: false,
    },
  });

  try {
    await strapi.documents('api::package.package').unpublish({
      documentId: entry.documentId,
    });
  } catch {
    // already draft
  }

  return entry.slug || entry.title;
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const packages = await findAllCateringPackages(app);
    const hidden = [];
    const kept = [];

    for (const entry of packages) {
      if (!hasCateringBlock(entry)) continue;
      const slug = String(entry.slug ?? '').trim();
      if (CATALOG_SLUGS.has(slug)) {
        kept.push(slug);
        continue;
      }
      hidden.push(await hidePackage(app, entry));
    }

    console.log(`[hide-stray-catering] kept=${kept.length}, hidden=${hidden.length}`);
    if (hidden.length) console.log('Hidden:', hidden.join(', '));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[hide-stray-catering] failed:', error);
  process.exit(1);
});
