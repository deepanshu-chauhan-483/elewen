#!/usr/bin/env node
'use strict';

/**
 * Rename Bachelors / Bachelorette → Bridal Shower and deactivate duplicate Bridal Shower event.
 *
 * Local:
 *   cd strapi && node scripts/run-social-event-rename.cjs
 *
 * Docker:
 *   docker compose exec strapi node scripts/run-social-event-rename.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedSocialEventDisplayUpdates } = require('../src/seed/social-event-display-updates');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedSocialEventDisplayUpdates(app);
    console.log('[seed/social-event-display] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/social-event-display] failed:', error);
  process.exit(1);
});
