'use strict';

const BACHELORS_SLUG_CANDIDATES = ['bachelors', 'bachelors-bachelorette', 'bachelorette', 'bachelor'];
const DUPLICATE_BRIDAL_SHOWER_SLUGS = ['bridal-shower', 'bridal-showers'];

const BRIDAL_SHOWER_DISPLAY_NAME = 'Bridal Shower';
const BRIDAL_SHOWER_TAGLINE = 'All about the bride, fun, and great vibes';

async function findEventsBySlugs(strapi, slugs = []) {
  const found = [];

  for (const slug of slugs) {
    const normalized = String(slug ?? '').trim();
    if (!normalized) continue;

    for (const status of ['published', 'draft']) {
      const rows = await strapi.documents('api::event.event').findMany({
        filters: { slug: { $eq: normalized } },
        status,
        limit: 5,
      });

      for (const row of Array.isArray(rows) ? rows : []) {
        if (row?.documentId && !found.some(item => item.documentId === row.documentId)) {
          found.push(row);
        }
      }
    }
  }

  return found;
}

async function renameBachelorsToBridalShower(strapi) {
  const events = await findEventsBySlugs(strapi, BACHELORS_SLUG_CANDIDATES);
  const results = [];

  for (const event of events) {
    const documentId = event.documentId;
    if (!documentId) continue;

    await strapi.documents('api::event.event').update({
      documentId,
      data: {
        name: BRIDAL_SHOWER_DISPLAY_NAME,
        tagline: BRIDAL_SHOWER_TAGLINE,
        is_active: true,
      },
    });
    await strapi.documents('api::event.event').publish({ documentId });

    results.push({
      action: 'renamed',
      documentId,
      slug: event.slug,
      name: BRIDAL_SHOWER_DISPLAY_NAME,
    });
  }

  return results;
}

async function deactivateDuplicateBridalShowerEvents(strapi) {
  const events = await findEventsBySlugs(strapi, DUPLICATE_BRIDAL_SHOWER_SLUGS);
  const results = [];

  for (const event of events) {
    const documentId = event.documentId;
    if (!documentId) continue;

    await strapi.documents('api::event.event').update({
      documentId,
      data: {
        is_active: false,
      },
    });

    try {
      await strapi.documents('api::event.event').unpublish({ documentId });
    } catch {
      // Already unpublished or unpublish unsupported — is_active=false is enough for API filters.
    }

    results.push({
      action: 'deactivated',
      documentId,
      slug: event.slug,
      name: event.name,
    });
  }

  return results;
}

async function seedSocialEventDisplayUpdates(strapi) {
  const renamed = await renameBachelorsToBridalShower(strapi);
  const deactivated = await deactivateDuplicateBridalShowerEvents(strapi);

  return { renamed, deactivated };
}

module.exports = {
  seedSocialEventDisplayUpdates,
  BACHELORS_SLUG_CANDIDATES,
  DUPLICATE_BRIDAL_SHOWER_SLUGS,
};
