#!/usr/bin/env node
'use strict';

const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringAddons } = require('../src/seed/catering-addons');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedCateringAddons(app);
    console.log('[seed/catering-addons] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/catering-addons] failed:', error);
  process.exit(1);
});
