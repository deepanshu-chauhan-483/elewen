#!/usr/bin/env node
'use strict';

/**
 * Patch only cateringpackage.budget_level from seed slug → Level 1/2/3.
 * Does not rewrite menus, prices, or other fields.
 *
 * Stop Strapi first, then from strapi/:
 *   node scripts/patch-catering-budget-levels.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { ESSENTIAL_PACKAGES } = require('../src/seed/catering-essentials');
const { ASSISTED_PACKAGES } = require('../src/seed/catering-assisted');
const { END_TO_END_PACKAGES } = require('../src/seed/catering-end-to-end');
const { findPackageBySlug } = require('../src/seed/catering-shared');
const { ensureBudgetLevelDocumentId } = require('../src/seed/decor-proposal-shared');

const PACKAGE_SEEDS = [...ESSENTIAL_PACKAGES, ...ASSISTED_PACKAGES, ...END_TO_END_PACKAGES];

function relationDocumentId(value) {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value.documentId) return String(value.documentId);
  if (value.id != null) return String(value.id);
  return null;
}

function sanitizeCateringBlock(block, budgetLevelDocumentId) {
  const next = { ...block, budget_level: budgetLevelDocumentId };

  // Keep component update stable: drop DB-only keys that break document updates.
  delete next.id;
  delete next.documentId;

  if (Array.isArray(next.menu_items)) {
    next.menu_items = next.menu_items.map(item => {
      const copy = { ...item };
      delete copy.id;
      return copy;
    });
  }
  if (Array.isArray(next.inclusions)) {
    next.inclusions = next.inclusions.map(item => {
      const copy = { ...item };
      delete copy.id;
      return copy;
    });
  }
  if (Array.isArray(next.exclusions)) {
    next.exclusions = next.exclusions.map(item => {
      const copy = { ...item };
      delete copy.id;
      return copy;
    });
  }
  if (Array.isArray(next.pricing_rules)) {
    next.pricing_rules = next.pricing_rules.map(item => {
      const copy = { ...item };
      delete copy.id;
      return copy;
    });
  }
  if (Array.isArray(next.addons)) {
    next.addons = next.addons.map(item => {
      const copy = { ...item };
      delete copy.id;
      return copy;
    });
  }
  if (Array.isArray(next.price_covers)) {
    next.price_covers = next.price_covers.map(item => {
      const copy = { ...item };
      delete copy.id;
      return copy;
    });
  }
  if (Array.isArray(next.price_breakdown)) {
    next.price_breakdown = next.price_breakdown.map(item => {
      const copy = { ...item };
      delete copy.id;
      return copy;
    });
  }

  const policyId = relationDocumentId(next.policy);
  if (policyId) next.policy = policyId;
  else delete next.policy;

  return next;
}

async function patchOne(strapi, pkgSeed, levelCache) {
  const levelSlug = String(pkgSeed.budget_level_slug ?? '').trim();
  if (!levelSlug) {
    return { slug: pkgSeed.slug, ok: false, reason: 'no-budget-level-slug' };
  }

  if (!levelCache.has(levelSlug)) {
    const orderMatch = levelSlug.match(/(\d+)/);
    levelCache.set(
      levelSlug,
      await ensureBudgetLevelDocumentId(strapi, {
        slug: levelSlug,
        name: `Level ${orderMatch?.[1] ?? ''}`.trim() || levelSlug,
        display_order: Number(orderMatch?.[1] ?? 0) || 0,
      })
    );
  }

  const budgetLevelDocumentId = levelCache.get(levelSlug);
  if (!budgetLevelDocumentId) {
    return { slug: pkgSeed.slug, ok: false, reason: `missing-budget-level:${levelSlug}` };
  }

  const found = await findPackageBySlug(strapi, pkgSeed.slug);
  if (!found?.entry?.documentId) {
    return { slug: pkgSeed.slug, ok: false, reason: 'package-not-found' };
  }

  const blocks = Array.isArray(found.entry.packages) ? found.entry.packages : [];
  let touched = false;
  const nextBlocks = blocks.map(block => {
    if (block?.__component !== 'package.cateringpackage') return block;
    touched = true;
    return sanitizeCateringBlock(block, budgetLevelDocumentId);
  });

  if (!touched) {
    return { slug: pkgSeed.slug, ok: false, reason: 'no-catering-block' };
  }

  await strapi.documents('api::package.package').update({
    documentId: found.entry.documentId,
    data: { packages: nextBlocks },
  });

  try {
    await strapi.documents('api::package.package').publish({
      documentId: found.entry.documentId,
    });
  } catch {
    // ignore publish race
  }

  return {
    slug: pkgSeed.slug,
    ok: true,
    level: levelSlug,
    title: pkgSeed.title,
  };
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();
  const levelCache = new Map();

  try {
    const results = [];
    for (const pkgSeed of PACKAGE_SEEDS) {
      results.push(await patchOne(app, pkgSeed, levelCache));
    }

    const ok = results.filter(item => item.ok);
    const failed = results.filter(item => !item.ok);

    console.log(`[patch-catering-budget-levels] updated=${ok.length}, failed=${failed.length}`);
    for (const item of ok) {
      console.log(`  ✓ ${item.title} (${item.slug}) → ${item.level}`);
    }
    for (const item of failed) {
      console.log(`  ✗ ${item.slug}: ${item.reason}`);
    }
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[patch-catering-budget-levels] failed:', error);
  process.exit(1);
});
