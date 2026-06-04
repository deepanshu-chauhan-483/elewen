#!/usr/bin/env node
/**
 * Fail if the same directory contains both foo.js and foo.jsx (Linux/Rolldown ambiguity).
 * Usage: node scripts/check-module-collisions.mjs <dir> [dir...]
 */
import fs from 'node:fs'
import path from 'node:path'

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx'])
const roots = process.argv.slice(2)

if (roots.length === 0) {
  console.error('Usage: node scripts/check-module-collisions.mjs <src-dir> [...]')
  process.exit(1)
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue
    }
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full)
    }
  }
  return files
}

const collisions = []

for (const root of roots) {
  const abs = path.resolve(root)
  if (!fs.existsSync(abs)) {
    console.error(`Missing directory: ${abs}`)
    process.exit(1)
  }

  const byDirBase = new Map()

  for (const file of walk(abs)) {
    const dir = path.dirname(file)
    const base = path.basename(file, path.extname(file)).toLowerCase()
    const key = `${dir}::${base}`
    const list = byDirBase.get(key) ?? []
    list.push(file)
    byDirBase.set(key, list)
  }

  for (const [key, files] of byDirBase) {
    const exts = new Set(files.map(f => path.extname(f)))
    if (files.length > 1 && exts.size > 1) {
      collisions.push({ key, files })
    }
  }
}

if (collisions.length > 0) {
  console.error('Module name collisions (same basename, different extensions in one folder):\n')
  for (const { files } of collisions) {
    for (const f of files) {
      console.error(`  - ${f}`)
    }
    console.error('')
  }
  process.exit(1)
}

console.log(`OK: no .js/.jsx collisions under ${roots.join(', ')}`)
