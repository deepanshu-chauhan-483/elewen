#!/usr/bin/env node
'use strict';

/**
 * Seed bartending packages + addons, and link catering/bartending packages to events.
 *
 * Stop Strapi first, then:
 *   node scripts/run-bartending-and-event-links-seed.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedBartendingAddons } = require('../src/seed/bartending-addons');
const { seedBartendingPackages } = require('../src/seed/bartending-packages');
const {
  seedCateringEventLinks,
  seedBartendingEventLinks,
} = require('../src/seed/catering-bartending-event-links');
const { seedSheeshaEventLinks } = require('../src/seed/sheesha-event-links');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const addons = await seedBartendingAddons(app);
    const packages = await seedBartendingPackages(app);
    const cateringLinks = await seedCateringEventLinks(app);
    const bartendingLinks = await seedBartendingEventLinks(app);
    const sheeshaLinks = await seedSheeshaEventLinks(app);

    console.log('[seed/bartending-and-event-links] summary');
    console.log(
      `  bartending addons: created=${addons.created.length} updated=${addons.updated.length}`
    );
    console.log(
      `  bartending packages: created=${packages.created.length} updated=${packages.updated.length}`
    );
    console.log(
      `  catering event links: linked=${cateringLinks.linked.length} missing=${cateringLinks.missing.length}`
    );
    console.log(
      `  bartending event links: linked=${bartendingLinks.linked.length} missing=${bartendingLinks.missing.length}`
    );
    console.log(
      `  sheesha event links: linked=${sheeshaLinks.linked.length} missing=${sheeshaLinks.missing.length}`
    );
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/bartending-and-event-links] failed:', error);
  process.exit(1);
});
