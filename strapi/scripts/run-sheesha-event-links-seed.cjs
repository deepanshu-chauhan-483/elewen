#!/usr/bin/env node
'use strict';

/**
 * Link Basic/Premium Indian & Turkish Hookah packages to Social + Corporate events.
 *
 * Stop Strapi first (or run against a DB this process can open), then:
 *   node scripts/run-sheesha-event-links-seed.cjs
 *
 * For production CMS used by local Vite (/cms proxy), run this on the server
 * that hosts Strapi, or update Events on each package in Strapi Admin.
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedSheeshaEventLinks } = require('../src/seed/sheesha-event-links');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedSheeshaEventLinks(app);
    console.log(
      `[seed/sheesha-event-links] done linked=${result.linked.length} missing=${result.missing.length} events=${result.eventCount}`
    );
    if (result.missing.length) {
      console.log(
        'Missing packages:',
        result.missing.map(item => item.slug).join(', ')
      );
    }
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/sheesha-event-links] failed:', error);
  process.exit(1);
});
