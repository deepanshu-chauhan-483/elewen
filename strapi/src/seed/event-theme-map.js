'use strict';

/**
 * Idempotent Word-doc event → themes / decor_flow seed.
 *
 * - Skips Diwali entirely (client packages later).
 * - Writes a before-snapshot for rollback.
 * - SEED_EVENT_THEME_MAP_ROLLBACK=true restores the latest snapshot.
 *
 * Enable: SEED_EVENT_THEME_MAP=true (production requires explicit true).
 */

const fs = require('fs');
const path = require('path');
const {
  ensureThemeDocumentId,
  findEventDocumentId,
  findThemeDocumentId,
} = require('./decor-proposal-shared');

const SNAPSHOT_DIR = path.join(__dirname, '.snapshots');
const LOG_PREFIX = 'seed/event-theme-map';

/** Themes referenced by the Word doc (stable slugs). */
const THEME_SEEDS = [
  { name: 'General Pack', slug: 'birthday-party', display_order: 10 },
  { name: 'House Party', slug: 'house-party', display_order: 20 },
  { name: 'Still Us', slug: 'still-us', display_order: 30 },
  { name: 'Bubbles & Black Tie', slug: 'bubbles-and-black-tie', display_order: 40 },
  { name: 'Bohemian', slug: 'bohemian', display_order: 50 },
  { name: 'Pastel', slug: 'pastel', display_order: 60 },
  { name: 'A little honey', slug: 'a-little-honey', display_order: 70 },
  { name: 'Oh Baby', slug: 'oh-baby', display_order: 80 },
];

/**
 * In-scope Word-doc map. Diwali is intentionally absent.
 * eventSlugCandidates: first match wins for existing CMS rows.
 */
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
];

const SKIP_EVENT_SLUGS = new Set(['diwali-party', 'diwali-parties', 'diwali']);

function ensureSnapshotDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function latestSnapshotPath() {
  ensureSnapshotDir();
  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter(name => name.startsWith('event-theme-map-before-') && name.endsWith('.json'))
    .sort();
  if (!files.length) return null;
  return path.join(SNAPSHOT_DIR, files[files.length - 1]);
}

async function loadEventSnapshotRow(strapi, documentId) {
  if (!documentId) return null;

  for (const status of ['published', 'draft']) {
    try {
      const row = await strapi.documents('api::event.event').findOne({
        documentId,
        status,
        populate: { themes: true },
      });
      if (row) {
        return {
          documentId,
          slug: row.slug,
          name: row.name,
          decor_flow: row.decor_flow ?? null,
          publishedStatus: status,
          themeDocumentIds: (Array.isArray(row.themes) ? row.themes : [])
            .map(theme => theme.documentId)
            .filter(Boolean),
        };
      }
    } catch {
      // Field may not exist yet on very old schemas mid-migrate.
    }
  }

  return { documentId, missing: true };
}

async function writeBeforeSnapshot(strapi) {
  ensureSnapshotDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rows = [];

  for (const eventSeed of EVENT_SEEDS) {
    const documentId = await findEventDocumentId(strapi, eventSeed.slugCandidates);
    rows.push({
      seedName: eventSeed.name,
      slugCandidates: eventSeed.slugCandidates,
      before: await loadEventSnapshotRow(strapi, documentId),
    });
  }

  const filePath = path.join(SNAPSHOT_DIR, `event-theme-map-before-${timestamp}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        note: 'Diwali intentionally excluded. Restore with SEED_EVENT_THEME_MAP_ROLLBACK=true.',
        rows,
      },
      null,
      2
    ),
    'utf8'
  );

  return filePath;
}

async function applyEventSeed(strapi, eventSeed, themeIdBySlug) {
  if (eventSeed.slugCandidates.some(slug => SKIP_EVENT_SLUGS.has(slug))) {
    return { skipped: true, reason: 'diwali-deferred' };
  }

  const documentId = await findEventDocumentId(strapi, eventSeed.slugCandidates);
  if (!documentId) {
    return { skipped: true, reason: 'event-not-found', slugCandidates: eventSeed.slugCandidates };
  }

  const themeDocumentIds = (eventSeed.themeSlugs || [])
    .map(slug => themeIdBySlug.get(slug))
    .filter(Boolean);

  const data = {
    decor_flow: eventSeed.decor_flow,
    themes: {
      set: themeDocumentIds.map(id => ({ documentId: id })),
    },
  };

  await strapi.documents('api::event.event').update({
    documentId,
    data,
  });

  if (eventSeed.unpublish) {
    try {
      await strapi.documents('api::event.event').unpublish({ documentId });
    } catch (error) {
      strapi.log.warn(
        `[${LOG_PREFIX}] Could not unpublish ${eventSeed.name}: ${error?.message || error}`
      );
    }
  } else {
    try {
      await strapi.documents('api::event.event').publish({ documentId });
    } catch (error) {
      strapi.log.warn(
        `[${LOG_PREFIX}] Could not publish ${eventSeed.name}: ${error?.message || error}`
      );
    }
  }

  const after = await loadEventSnapshotRow(strapi, documentId);
  return {
    updated: true,
    documentId,
    decor_flow: eventSeed.decor_flow,
    themeCount: themeDocumentIds.length,
    after,
  };
}

async function restoreFromSnapshot(strapi, snapshotPath) {
  const payload = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const results = [];

  for (const row of payload.rows || []) {
    const before = row.before;
    if (!before?.documentId || before.missing) {
      results.push({ seedName: row.seedName, skipped: true, reason: 'no-before-row' });
      continue;
    }

    await strapi.documents('api::event.event').update({
      documentId: before.documentId,
      data: {
        decor_flow: before.decor_flow ?? null,
        themes: {
          set: (before.themeDocumentIds || []).map(id => ({ documentId: id })),
        },
      },
    });

    if (before.publishedStatus === 'draft') {
      try {
        await strapi.documents('api::event.event').unpublish({ documentId: before.documentId });
      } catch {
        // keep going
      }
    } else {
      try {
        await strapi.documents('api::event.event').publish({ documentId: before.documentId });
      } catch {
        // keep going
      }
    }

    results.push({ seedName: row.seedName, restored: true, documentId: before.documentId });
  }

  return { snapshotPath, results };
}

async function seedEventThemeMap(strapi) {
  if (process.env.SEED_EVENT_THEME_MAP_ROLLBACK === 'true') {
    const snapshotPath = latestSnapshotPath();
    if (!snapshotPath) {
      strapi.log.error(`[${LOG_PREFIX}] Rollback requested but no snapshot found in ${SNAPSHOT_DIR}`);
      return { rolledBack: false, error: 'no-snapshot' };
    }
    strapi.log.info(`[${LOG_PREFIX}] Restoring from ${snapshotPath}`);
    const restoreResult = await restoreFromSnapshot(strapi, snapshotPath);
    strapi.log.info(
      `[${LOG_PREFIX}] Rollback restored=${restoreResult.results.filter(r => r.restored).length}`
    );
    return { rolledBack: true, ...restoreResult };
  }

  strapi.log.info(`[${LOG_PREFIX}] Ensuring themes (Diwali skipped)`);
  const themeIdBySlug = new Map();
  for (const theme of THEME_SEEDS) {
    const existing = await findThemeDocumentId(strapi, [theme.slug]);
    const documentId = existing || (await ensureThemeDocumentId(strapi, theme));
    if (documentId) themeIdBySlug.set(theme.slug, documentId);
  }

  const snapshotPath = await writeBeforeSnapshot(strapi);
  strapi.log.info(`[${LOG_PREFIX}] Before-snapshot written: ${snapshotPath}`);

  const results = [];
  for (const eventSeed of EVENT_SEEDS) {
    const result = await applyEventSeed(strapi, eventSeed, themeIdBySlug);
    results.push({ seedName: eventSeed.name, ...result });
    strapi.log.info(
      `[${LOG_PREFIX}] ${eventSeed.name}: ${JSON.stringify({
        updated: Boolean(result.updated),
        skipped: Boolean(result.skipped),
        reason: result.reason,
        decor_flow: result.decor_flow,
        themeCount: result.themeCount,
      })}`
    );
  }

  // Safety: never touch Diwali even if present under another name in CMS.
  const diwaliId = await findEventDocumentId(strapi, [...SKIP_EVENT_SLUGS]);
  if (diwaliId) {
    strapi.log.info(`[${LOG_PREFIX}] Diwali present (${diwaliId}) — left untouched`);
  }

  return {
    rolledBack: false,
    snapshotPath,
    themeCount: themeIdBySlug.size,
    results,
  };
}

module.exports = {
  THEME_SEEDS,
  EVENT_SEEDS,
  SKIP_EVENT_SLUGS,
  seedEventThemeMap,
};
