#!/usr/bin/env node
/**
 * Patch Signature Essentials 3 choice options with ₹5,000 price_surcharge:
 * - Fancy Bar
 * - First backdrop option / Backdrop with bows / Single Panel Backdrop
 *
 * Usage:
 *   STRAPI_URL=https://strapi.elewen.co.in STRAPI_API_TOKEN=<token> node scripts/patch-se3-option-surcharges.mjs
 */

const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '')
const TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_ADMIN_TOKEN
const PACKAGE_SLUG = 'signature-essentials-3'
const SURCHARGE = 5000

if (!TOKEN) {
  console.error('Missing STRAPI_API_TOKEN (or STRAPI_ADMIN_TOKEN).')
  process.exit(1)
}

async function strapiFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Strapi ${res.status} ${method} ${path}: ${text.slice(0, 500)}`)
  }
  return text ? JSON.parse(text) : null
}

function normalizeTitle(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function shouldPatchChoice(row, backdropIndex) {
  if (!row?.is_choice_group) return false
  const title = normalizeTitle(row.text)
  const key = normalizeTitle(row.choice_group_key)

  if (key.includes('se3-bar') && title === 'fancy bar') return true
  if (key.includes('se3-backdrop')) {
    if (title.includes('single panel') || title.includes('backdrop with bows')) return true
    if (backdropIndex === 0) return true
  }
  return false
}

function patchInclusions(inclustions = []) {
  let patched = 0
  let backdropIndex = -1
  const next = (Array.isArray(inclustions) ? inclustions : []).map(row => {
    const key = normalizeTitle(row?.choice_group_key)
    if (row?.is_choice_group && key.includes('se3-backdrop')) {
      backdropIndex += 1
    }
    const indexForRow = key.includes('se3-backdrop') ? backdropIndex : null
    if (!shouldPatchChoice(row, indexForRow)) return row
    patched += 1
    return {
      ...row,
      price_surcharge: SURCHARGE,
    }
  })
  return { next, patched }
}

async function main() {
  const query = [
    `filters[slug][$eq]=${encodeURIComponent(PACKAGE_SLUG)}`,
    'publicationState=preview',
    'pagination[pageSize]=1',
    'populate[packages][on][package.decorpackages][populate][inclustions]=true',
  ].join('&')

  const list = await strapiFetch(`/packages?${query}`)
  const pkg = list?.data?.[0]
  if (!pkg) {
    throw new Error(`Package not found: ${PACKAGE_SLUG}`)
  }

  const packages = Array.isArray(pkg.packages) ? pkg.packages : []
  let totalPatched = 0
  const nextPackages = packages.map(section => {
    if (section?.__component !== 'package.decorpackages') return section
    const { next, patched } = patchInclusions(section.inclustions)
    totalPatched += patched
    return { ...section, inclustions: next }
  })

  if (!totalPatched) {
    console.error('No matching choice options found to patch (Fancy Bar / backdrop 1).')
    process.exit(2)
  }

  const documentId = pkg.documentId
  const updatePath = documentId ? `/packages/${documentId}` : `/packages/${pkg.id}`
  await strapiFetch(updatePath, {
    method: 'PUT',
    body: { data: { packages: nextPackages } },
  })

  try {
    await strapiFetch(`${updatePath}/actions/publish`, { method: 'POST' })
  } catch (error) {
    console.warn(`publish skipped: ${error.message}`)
  }

  console.log(`Patched ${totalPatched} option(s) on ${PACKAGE_SLUG} with price_surcharge=${SURCHARGE}`)
}

main().catch(error => {
  console.error(error.message || error)
  process.exit(1)
})
