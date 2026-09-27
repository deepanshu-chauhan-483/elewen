#!/usr/bin/env node
/**
 * Remote Word-doc event → themes / decor_flow seed against deployed Strapi.
 *
 * Requires Event.decor_flow + Event.themes on the TARGET (deploy Strapi schema first).
 * Diwali is never mutated. Writes a local before-snapshot for rollback.
 *
 * Usage (from repo root):
 *   node scripts/seed-event-theme-map-remote.mjs
 *   node scripts/seed-event-theme-map-remote.mjs --dry-run
 *   node scripts/seed-event-theme-map-remote.mjs --rollback
 *
 * Creds (never commit):
 *   Loads STRAPI_API_TOKEN from api/.env (or env).
 *   STRAPI_URL defaults to https://strapi.elewen.co.in (override via env or --url).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SNAPSHOT_DIR = path.join(ROOT, 'strapi', 'src', 'seed', '.snapshots')

const THEME_SEEDS = [
  { name: 'General Pack', slug: 'birthday-party', display_order: 10 },
  { name: 'House Party', slug: 'house-party', display_order: 20 },
  { name: 'Still Us', slug: 'still-us', display_order: 30 },
  { name: 'Bubbles & Black Tie', slug: 'bubbles-and-black-tie', display_order: 40 },
  { name: 'Bohemian', slug: 'bohemian', display_order: 50 },
  { name: 'Pastel', slug: 'pastel', display_order: 60 },
  { name: 'A little honey', slug: 'a-little-honey', display_order: 70 },
  { name: 'Oh Baby', slug: 'oh-baby', display_order: 80 },
]

const EVENT_SEEDS = [
  {
    name: 'Birthday Party',
    slugCandidates: ['birthday-parties', 'birthday-party', 'birthday'],
    decor_flow: 'theme_step',
    themeSlugs: ['birthday-party', 'bubbles-and-black-tie', 'bohemian', 'pastel'],
  },
  {
    name: 'House Party',
    slugCandidates: ['house-parties', 'house-party'],
    decor_flow: 'theme_step',
    themeSlugs: ['birthday-party', 'house-party'],
  },
  {
    name: 'Anniversary',
    slugCandidates: ['anniversary', 'anniversaries'],
    decor_flow: 'theme_step',
    themeSlugs: ['birthday-party', 'still-us', 'bubbles-and-black-tie'],
  },
  {
    name: 'Baby Shower',
    slugCandidates: ['baby-shower', 'baby-showers'],
    decor_flow: 'theme_step',
    themeSlugs: ['birthday-party', 'a-little-honey', 'oh-baby'],
  },
  {
    name: 'Bridal Shower',
    slugCandidates: ['bridal-shower', 'bridal-showers'],
    decor_flow: 'skip_to_packages',
    themeSlugs: [],
  },
  {
    name: 'Proposal',
    slugCandidates: ['proposal', 'proposals'],
    decor_flow: 'skip_to_packages',
    themeSlugs: [],
  },
  {
    name: 'Mehendi',
    slugCandidates: ['mehendi', 'mehndi'],
    decor_flow: 'consultation',
    themeSlugs: [],
  },
  {
    name: 'Sufi Night',
    slugCandidates: ['sufi-night'],
    decor_flow: 'consultation',
    themeSlugs: [],
  },
  {
    name: 'Haldi',
    slugCandidates: ['haldi'],
    decor_flow: 'consultation',
    themeSlugs: [],
  },
  {
    name: 'Wedding',
    slugCandidates: ['wedding', 'weddings'],
    decor_flow: 'unavailable',
    themeSlugs: [],
    unpublish: true,
  },
  {
    name: 'Engagement',
    slugCandidates: ['engagement'],
    decor_flow: 'unavailable',
    themeSlugs: [],
    unpublish: true,
  },
]

const SKIP_EVENT_SLUGS = new Set(['diwali-party', 'diwali-parties', 'diwali'])

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const text = fs.readFileSync(filePath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value
    }
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    rollback: false,
    url: '',
  }
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    if (arg === '--rollback') args.rollback = true
    if (arg.startsWith('--url=')) args.url = arg.slice('--url='.length)
  }
  return args
}

function ensureSnapshotDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true })
}

function latestSnapshotPath() {
  ensureSnapshotDir()
  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter(name => name.startsWith('event-theme-map-remote-before-') && name.endsWith('.json'))
    .sort()
  if (!files.length) return null
  return path.join(SNAPSHOT_DIR, files[files.length - 1])
}

function createClient(baseUrl, token) {
  async function strapiFetch(apiPath, { method = 'GET', body } = {}) {
    const res = await fetch(`${baseUrl}/api${apiPath}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(`Strapi ${res.status} ${method} ${apiPath}: ${text.slice(0, 600)}`)
    }
    return text ? JSON.parse(text) : null
  }
  return { strapiFetch }
}

async function findTheme(client, slug) {
  const query = [
    `filters[slug][$eq]=${encodeURIComponent(slug)}`,
    'pagination[pageSize]=1',
    'status=draft',
  ].join('&')
  const draft = await client.strapiFetch(`/themes?${query}`)
  if (draft?.data?.[0]) return draft.data[0]

  const published = await client.strapiFetch(
    `/themes?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`
  )
  return published?.data?.[0] ?? null
}

async function ensureTheme(client, theme, dryRun) {
  const existing = await findTheme(client, theme.slug)
  if (existing?.documentId) {
    return { documentId: existing.documentId, created: false, slug: theme.slug }
  }
  if (dryRun) {
    return { documentId: null, created: true, dryRun: true, slug: theme.slug }
  }
  const created = await client.strapiFetch('/themes', {
    method: 'POST',
    body: {
      data: {
        name: theme.name,
        slug: theme.slug,
        is_active: true,
        display_order: theme.display_order,
      },
    },
  })
  const documentId = created?.data?.documentId
  if (documentId) {
    try {
      await client.strapiFetch(`/themes/${documentId}/actions/publish`, { method: 'POST' })
    } catch {
      // publish may already be default
    }
  }
  return { documentId, created: true, slug: theme.slug }
}

async function findEvent(client, slugCandidates) {
  for (const slug of slugCandidates) {
    if (SKIP_EVENT_SLUGS.has(slug)) continue
    const published = await client.strapiFetch(
      `/events?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1&populate[themes]=true`
    )
    if (published?.data?.[0]) return { ...published.data[0], _status: 'published' }

    try {
      const draft = await client.strapiFetch(
        `/events?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1&status=draft&populate[themes]=true`
      )
      if (draft?.data?.[0]) return { ...draft.data[0], _status: 'draft' }
    } catch {
      // draft status may be forbidden for this token
    }
  }
  return null
}

function snapshotFromEvent(event) {
  if (!event) return null
  return {
    documentId: event.documentId,
    slug: event.slug,
    name: event.name,
    decor_flow: event.decor_flow ?? null,
    publishedStatus: event._status || (event.publishedAt ? 'published' : 'draft'),
    themeDocumentIds: (Array.isArray(event.themes) ? event.themes : [])
      .map(theme => theme.documentId)
      .filter(Boolean),
  }
}

async function assertSchemaSupportsFields(client) {
  try {
    await client.strapiFetch('/events?pagination[pageSize]=1&populate[themes]=true')
  } catch (error) {
    const message = String(error.message || error)
    if (message.includes('401') || message.includes('403')) {
      throw new Error(
        'Deployed Strapi rejected the API token (401/403). Use a Full access (or Events+Themes update) token from https://strapi.elewen.co.in/admin → Settings → API Tokens. The token in api/.env is often local-only.\n' +
          `Detail: ${message.slice(0, 300)}`
      )
    }
    if (message.includes('400') || message.includes('Invalid key') || message.includes('themes')) {
      throw new Error(
        'Deployed Strapi is missing Event.themes (and likely decor_flow). Deploy the Strapi schema first, then re-run this script.\n' +
          `Detail: ${message.slice(0, 300)}`
      )
    }
    throw error
  }
}

async function writeBeforeSnapshot(client) {
  ensureSnapshotDir()
  const rows = []
  for (const eventSeed of EVENT_SEEDS) {
    const event = await findEvent(client, eventSeed.slugCandidates)
    rows.push({
      seedName: eventSeed.name,
      slugCandidates: eventSeed.slugCandidates,
      before: snapshotFromEvent(event),
    })
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filePath = path.join(SNAPSHOT_DIR, `event-theme-map-remote-before-${timestamp}.json`)
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        targetHint: 'deployed-strapi',
        note: 'Diwali excluded. Restore with --rollback',
        rows,
      },
      null,
      2
    ),
    'utf8'
  )
  return filePath
}

async function applyEventSeed(client, eventSeed, themeIdBySlug, dryRun) {
  if (eventSeed.slugCandidates.some(slug => SKIP_EVENT_SLUGS.has(slug))) {
    return { skipped: true, reason: 'diwali-deferred' }
  }

  const event = await findEvent(client, eventSeed.slugCandidates)
  if (!event?.documentId) {
    return { skipped: true, reason: 'event-not-found', slugCandidates: eventSeed.slugCandidates }
  }

  const themeDocumentIds = (eventSeed.themeSlugs || [])
    .map(slug => themeIdBySlug.get(slug))
    .filter(Boolean)

  const data = {
    decor_flow: eventSeed.decor_flow,
    themes: {
      set: themeDocumentIds.map(documentId => ({ documentId })),
    },
  }

  if (dryRun) {
    return {
      dryRun: true,
      documentId: event.documentId,
      slug: event.slug,
      decor_flow: eventSeed.decor_flow,
      themeCount: themeDocumentIds.length,
      unpublish: Boolean(eventSeed.unpublish),
    }
  }

  await client.strapiFetch(`/events/${event.documentId}`, {
    method: 'PUT',
    body: { data },
  })

  if (eventSeed.unpublish) {
    try {
      await client.strapiFetch(`/events/${event.documentId}/actions/unpublish`, { method: 'POST' })
    } catch (error) {
      console.warn(`warn: could not unpublish ${event.slug}: ${error.message}`)
    }
  } else if (!event.publishedAt) {
    try {
      await client.strapiFetch(`/events/${event.documentId}/actions/publish`, { method: 'POST' })
    } catch (error) {
      console.warn(`warn: could not publish ${event.slug}: ${error.message}`)
    }
  }

  return {
    updated: true,
    documentId: event.documentId,
    slug: event.slug,
    decor_flow: eventSeed.decor_flow,
    themeCount: themeDocumentIds.length,
  }
}

async function restoreSnapshot(client, snapshotPath, dryRun) {
  const payload = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
  const results = []
  for (const row of payload.rows || []) {
    const before = row.before
    if (!before?.documentId) {
      results.push({ seedName: row.seedName, skipped: true, reason: 'no-before-row' })
      continue
    }
    if (dryRun) {
      results.push({ seedName: row.seedName, dryRun: true, documentId: before.documentId })
      continue
    }
    await client.strapiFetch(`/events/${before.documentId}`, {
      method: 'PUT',
      body: {
        data: {
          decor_flow: before.decor_flow ?? null,
          themes: {
            set: (before.themeDocumentIds || []).map(documentId => ({ documentId })),
          },
        },
      },
    })
    if (before.publishedStatus === 'draft') {
      try {
        await client.strapiFetch(`/events/${before.documentId}/actions/unpublish`, {
          method: 'POST',
        })
      } catch {
        // ignore
      }
    } else {
      try {
        await client.strapiFetch(`/events/${before.documentId}/actions/publish`, { method: 'POST' })
      } catch {
        // ignore
      }
    }
    results.push({ seedName: row.seedName, restored: true, documentId: before.documentId })
  }
  return results
}

async function main() {
  loadEnvFile(path.join(ROOT, 'api', '.env'))
  loadEnvFile(path.join(ROOT, '.env'))

  const args = parseArgs(process.argv.slice(2))
  // Prefer explicit production URL. Ignore docker/local STRAPI_URL from api/.env.
  const baseUrl = (
    args.url ||
    process.env.PUBLIC_STRAPI_URL ||
    process.env.REMOTE_STRAPI_URL ||
    'https://strapi.elewen.co.in'
  ).replace(/\/$/, '')

  const resolvedUrl =
    baseUrl.includes('strapi:1337') || baseUrl.includes('localhost')
      ? 'https://strapi.elewen.co.in'
      : baseUrl

  const token = process.env.STRAPI_API_TOKEN || process.env.STRAPI_ADMIN_TOKEN
  if (!token) {
    console.error('Missing STRAPI_API_TOKEN in api/.env (or env).')
    process.exit(1)
  }

  console.log(`Target: ${resolvedUrl}`)
  console.log(`Mode: ${args.rollback ? 'rollback' : args.dryRun ? 'dry-run' : 'mutate'}`)

  const client = createClient(resolvedUrl, token)
  await assertSchemaSupportsFields(client)

  if (args.rollback) {
    const snapshotPath = latestSnapshotPath()
    if (!snapshotPath) {
      console.error(`No remote snapshot found in ${SNAPSHOT_DIR}`)
      process.exit(1)
    }
    console.log(`Restoring ${snapshotPath}`)
    const results = await restoreSnapshot(client, snapshotPath, args.dryRun)
    console.log(JSON.stringify(results, null, 2))
    return
  }

  const themeIdBySlug = new Map()
  for (const theme of THEME_SEEDS) {
    const result = await ensureTheme(client, theme, args.dryRun)
    if (result.documentId) themeIdBySlug.set(theme.slug, result.documentId)
    console.log(
      `theme ${theme.slug}: ${result.created ? 'create' : 'reuse'}${result.dryRun ? ' (dry-run)' : ''}`
    )
  }

  const snapshotPath = args.dryRun ? null : await writeBeforeSnapshot(client)
  if (snapshotPath) console.log(`Before-snapshot: ${snapshotPath}`)

  const results = []
  for (const eventSeed of EVENT_SEEDS) {
    const result = await applyEventSeed(client, eventSeed, themeIdBySlug, args.dryRun)
    results.push({ seedName: eventSeed.name, ...result })
    console.log(`${eventSeed.name}: ${JSON.stringify(result)}`)
  }

  const diwali = await findEvent(client, [...SKIP_EVENT_SLUGS])
  if (diwali) {
    console.log(`Diwali present (${diwali.documentId} / ${diwali.slug}) — left untouched`)
  } else {
    console.log('Diwali not found — nothing to skip')
  }

  console.log(
    `Done. updated=${results.filter(r => r.updated).length} skipped=${results.filter(r => r.skipped).length}`
  )
}

main().catch(error => {
  console.error(error.message || error)
  process.exit(1)
})
