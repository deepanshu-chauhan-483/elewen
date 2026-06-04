#!/usr/bin/env node
/**
 * Repo-root helper — runs frontend + admin checks.
 * Docker builds use each app's scripts/check-module-collisions.mjs (build context is app folder only).
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

for (const app of ['frontend', 'admin-pannel']) {
  const script = path.join(root, app, 'scripts', 'check-module-collisions.mjs')
  const result = spawnSync(process.execPath, [script, 'src'], {
    cwd: path.join(root, app),
    stdio: 'inherit',
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('OK: frontend and admin-pannel have no .js/.jsx collisions')
