#!/usr/bin/env node
'use strict';

/**
 * Patch cateringpackage.exclusions from seed.
 * Restores menu_items / inclusions only when those arrays are already empty.
 * Does not change package prices or run bootstrap seeds.
 *
 *   npm run patch:catering-exclusions
 */
const BOOTSTRAP_SEED_FLAGS = [
  'SEED_CATERING_ESSENTIALS',
  'SEED_CATERING_MENU',
  'SEED_DELIVERY_CHARGES',
  'SEED_DECOR_PROPOSAL_PACKAGES',
  'SEED_DECOR_ANNIVERSARY_PACKAGES',
  'SEED_INHOUSE_PLANNER',
  'SEED_PRIVACY_POLICY',
  'SEED_TERMS_AND_CONDITIONS',
  'SEED_COUPON_TEMPLATES',
  'SEED_DECOR_BABY_SHOWER_PACKAGES',
  'SEED_DECOR_BACHELORETTE_PACKAGES',
  'SEED_DECOR_EXCEL_PACKAGES',
];

for (const flag of BOOTSTRAP_SEED_FLAGS) {
  process.env[flag] = 'false';
}
process.env.PORT = process.env.PATCH_STRAPI_PORT || '1338';

const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { ESSENTIAL_PACKAGES } = require('../src/seed/catering-essentials');
const { ASSISTED_PACKAGES } = require('../src/seed/catering-assisted');
const { END_TO_END_PACKAGES } = require('../src/seed/catering-end-to-end');
const { normalizeCateringMenuItems } = require('../src/seed/catering-shared');

const PACKAGE_SEEDS = [...ESSENTIAL_PACKAGES, ...ASSISTED_PACKAGES, ...END_TO_END_PACKAGES];

function relationDocumentId(value) {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value.documentId) return String(value.documentId);
  if (value.id != null) return String(value.id);
  return null;
}

function stripRow(item) {
  const copy = { ...item };
  delete copy.id;
  delete copy.documentId;
  return copy;
}

function seedExclusionRows(pkgSeed) {
  return (Array.isArray(pkgSeed?.exclusions) ? pkgSeed.exclusions : [])
    .map(item => String(item?.text ?? '').trim())
    .filter(Boolean)
    .map(text => ({ text }));
}

function exclusionTexts(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(item => String(item?.text ?? '').trim())
    .filter(Boolean);
}

function sameExclusionTexts(left, right) {
  return JSON.stringify(exclusionTexts(left)) === JSON.stringify(exclusionTexts(right));
}

function sanitizeRepeatable(rows) {
  return (Array.isArray(rows) ? rows : []).map(stripRow);
}

function sanitizeAddon(item) {
  const copy = stripRow(item);
  if (Array.isArray(copy.pricing_rules)) {
    copy.pricing_rules = copy.pricing_rules.map(stripRow);
  }
  return copy;
}

function sanitizeCateringBlock(block, exclusions) {
  const next = { ...block, exclusions };
  delete next.id;
  delete next.documentId;

  next.menu_items = sanitizeRepeatable(next.menu_items);
  next.inclusions = sanitizeRepeatable(next.inclusions);
  next.pricing_rules = sanitizeRepeatable(next.pricing_rules);
  next.price_covers = sanitizeRepeatable(next.price_covers);
  next.price_breakdown = sanitizeRepeatable(next.price_breakdown);
  next.addons = (Array.isArray(next.addons) ? next.addons : []).map(sanitizeAddon);

  const policyId = relationDocumentId(next.policy);
  if (policyId) next.policy = policyId;
  else delete next.policy;

  const budgetLevelId = relationDocumentId(next.budget_level);
  if (budgetLevelId) next.budget_level = budgetLevelId;
  else delete next.budget_level;

  return next;
}

const CATERING_COMPONENT_POPULATE = {
  packages: {
    on: {
      'package.cateringpackage': {
        populate: '*',
      },
    },
  },
};

async function findCateringPackageBySlug(strapi, slug) {
  for (const status of ['published', 'draft']) {
    const rows = await strapi.documents('api::package.package').findMany({
      filters: { slug: { $eq: slug } },
      status,
      populate: CATERING_COMPONENT_POPULATE,
      limit: 1,
    });

    if (Array.isArray(rows) && rows[0]) {
      return { entry: rows[0], status };
    }
  }

  return null;
}

async function patchOne(strapi, pkgSeed) {
  const exclusions = seedExclusionRows(pkgSeed);
  if (!exclusions.length) {
    return { slug: pkgSeed.slug, ok: false, reason: 'seed-has-no-exclusions' };
  }

  const found = await findCateringPackageBySlug(strapi, pkgSeed.slug);
  if (!found?.entry?.documentId) {
    return { slug: pkgSeed.slug, ok: false, reason: 'package-not-found' };
  }

  const blocks = Array.isArray(found.entry.packages) ? found.entry.packages : [];
  const cateringIndex = blocks.findIndex(block => block?.__component === 'package.cateringpackage');
  if (cateringIndex < 0) {
    return { slug: pkgSeed.slug, ok: false, reason: 'no-catering-block' };
  }

  const block = blocks[cateringIndex];
  const restoredMenu =
    Array.isArray(block.menu_items) && block.menu_items.length
      ? block.menu_items
      : normalizeCateringMenuItems(pkgSeed.menu_items);
  const restoredInclusions =
    Array.isArray(block.inclusions) && block.inclusions.length
      ? block.inclusions
      : (Array.isArray(pkgSeed.inclusions) ? pkgSeed.inclusions : []).map(item => ({
          text: String(item?.text ?? '').trim(),
        })).filter(item => item.text);

  const restoredMenuFromSeed = !block.menu_items?.length && restoredMenu.length > 0;
  const restoredInclusionsFromSeed = !block.inclusions?.length && restoredInclusions.length > 0;

  if (
    sameExclusionTexts(block.exclusions, exclusions) &&
    !restoredMenuFromSeed &&
    !restoredInclusionsFromSeed
  ) {
    return {
      slug: pkgSeed.slug,
      ok: true,
      skipped: true,
      title: pkgSeed.title,
      count: exclusions.length,
    };
  }

  const nextBlocks = [...blocks];
  nextBlocks[cateringIndex] = sanitizeCateringBlock(
    {
      ...block,
      menu_items: restoredMenu,
      inclusions: restoredInclusions,
    },
    exclusions
  );

  const updated = await strapi.documents('api::package.package').update({
    documentId: found.entry.documentId,
    status: 'published',
    data: { packages: nextBlocks },
    populate: CATERING_COMPONENT_POPULATE,
  });

  const verifiedBlock = (Array.isArray(updated?.packages) ? updated.packages : []).find(
    item => item?.__component === 'package.cateringpackage'
  );
  const verifiedTexts = exclusionTexts(verifiedBlock?.exclusions);
  if (JSON.stringify(verifiedTexts) !== JSON.stringify(exclusions.map(item => item.text))) {
    return {
      slug: pkgSeed.slug,
      ok: false,
      reason: `verify-failed: got ${JSON.stringify(verifiedTexts)}`,
    };
  }
  if (restoredMenuFromSeed && !verifiedBlock?.menu_items?.length) {
    return { slug: pkgSeed.slug, ok: false, reason: 'verify-failed: menu_items still empty' };
  }
  if (restoredInclusionsFromSeed && !verifiedBlock?.inclusions?.length) {
    return { slug: pkgSeed.slug, ok: false, reason: 'verify-failed: inclusions still empty' };
  }

  return {
    slug: pkgSeed.slug,
    ok: true,
    skipped: false,
    title: pkgSeed.title,
    count: exclusions.length,
    restoredMenu: restoredMenuFromSeed,
    restoredInclusions: restoredInclusionsFromSeed,
  };
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const results = [];
    for (const pkgSeed of PACKAGE_SEEDS) {
      results.push(await patchOne(app, pkgSeed));
    }

    const ok = results.filter(item => item.ok && !item.skipped);
    const skipped = results.filter(item => item.ok && item.skipped);
    const failed = results.filter(item => !item.ok);

    console.log(
      `[patch-catering-exclusions] updated=${ok.length}, already-ok=${skipped.length}, failed=${failed.length}`
    );
    for (const item of ok) {
      const extras = [
        item.restoredMenu ? 'menu restored' : null,
        item.restoredInclusions ? 'inclusions restored' : null,
      ].filter(Boolean);
      console.log(
        `  ✓ ${item.title} (${item.slug}) exclusions=${item.count}${extras.length ? ` (${extras.join(', ')})` : ''}`
      );
    }
    for (const item of skipped) {
      console.log(`  = ${item.title} (${item.slug}) already had ${item.count} exclusions`);
    }
    for (const item of failed) {
      console.log(`  ✗ ${item.slug}: ${item.reason}`);
    }

    if (failed.length) process.exitCode = 1;
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[patch-catering-exclusions] failed:', error);
  process.exit(1);
});
