#!/usr/bin/env node
'use strict';

const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringAssisted } = require('../src/seed/catering-assisted');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedCateringAssisted(app);
    console.log('[seed/catering-assisted] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/catering-assisted] failed:', error);
  process.exit(1);
});
