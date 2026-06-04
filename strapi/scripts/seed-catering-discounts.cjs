#!/usr/bin/env node
'use strict';

const path = require('node:path');
const Strapi = require('@strapi/strapi');
const { seedCateringDiscountSettings } = require('../src/seed/catering-discount-settings');

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const result = await seedCateringDiscountSettings(app);
    console.log('[seed/catering-discounts] done:', JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[seed/catering-discounts] failed:', error);
  process.exit(1);
});
