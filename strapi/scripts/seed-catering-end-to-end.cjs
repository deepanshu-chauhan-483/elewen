#!/usr/bin/env node
'use strict';

const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringEndToEnd } = require('../src/seed/catering-end-to-end');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedCateringEndToEnd(app);
    console.log('[seed/catering-end-to-end] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/catering-end-to-end] failed:', error);
  process.exit(1);
});
