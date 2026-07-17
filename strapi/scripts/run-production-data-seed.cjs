#!/usr/bin/env node
'use strict';

/**
 * Full production data seed: Excel decor packages + catering menu/packages/addons.
 * Data only — no images. Idempotent by slug.
 *
 *   docker compose run --rm --no-deps strapi node scripts/run-production-data-seed.cjs
 */
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scripts = [
  'scripts/run-excel-decor-seed.cjs',
  'scripts/run-catering-all.cjs',
];

function runScript(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const script of scripts) {
  runScript(script);
}
