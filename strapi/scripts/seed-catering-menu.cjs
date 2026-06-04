#!/usr/bin/env node
'use strict';

const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringMenuLibrary } = require('../src/seed/catering-menu-library');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedCateringMenuLibrary(app);
    console.log('[seed/catering-menu] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/catering-menu] failed:', error);
  process.exit(1);
});
