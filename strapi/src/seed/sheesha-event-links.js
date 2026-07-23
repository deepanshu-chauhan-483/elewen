'use strict';

/**
 * Link the four core Sheesha / Hookah packages to every Social + Corporate event
 * so listing filters (category/event) return them correctly.
 *
 * Does not touch Religious events (Sheesha is hidden there in the frontend).
 */

const SHEESHA_PACKAGE_SLUGS = [
  'basic-indian-hookah',
  'premium-indian-hookah',
  'basic-turkish-hookah',
  'premium-turkish-hookah',
];

const ALLOWED_PARENT_CATEGORY_SLUGS = new Set(['social', 'corporate']);

/** Exhibition / Seminar have fixed decor catalogs — do not attach Sheesha packages there. */
const EXCLUDED_EVENT_SLUGS = new Set(['exhibition-stalls', 'seminar-conference']);

async function findSheeshaServiceCategory(strapi) {
  const rows = await strapi.documents('api::service-category.service-category').findMany({
    filters: {
      $or: [
        { slug: { $eq: 'sheesha' } },
        { slug: { $eq: 'sheesha-services' } },
        { slug: { $eq: 'hookah' } },
      ],
    },
    status: 'published',
    limit: 5,
  });

  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function findSocialAndCorporateEvents(strapi) {
  const rows = await strapi.documents('api::event.event').findMany({
    filters: { is_active: { $eq: true } },
    populate: { parent_event: true },
    status: 'published',
    limit: 200,
  });

  return (Array.isArray(rows) ? rows : []).filter(event => {
    const slug = String(event?.slug ?? '')
      .trim()
      .toLowerCase();
    if (EXCLUDED_EVENT_SLUGS.has(slug)) return false;

    const parentSlug = String(event?.parent_event?.slug ?? '')
      .trim()
      .toLowerCase();
    return ALLOWED_PARENT_CATEGORY_SLUGS.has(parentSlug);
  });
}

async function findPackageBySlug(strapi, slug) {
  const published = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    limit: 1,
  });
  if (Array.isArray(published) && published[0]) return { entry: published[0], status: 'published' };

  const draft = await strapi.documents('api::package.package').findMany({
    filters: { slug: { $eq: slug } },
    status: 'draft',
    limit: 1,
  });
  if (Array.isArray(draft) && draft[0]) return { entry: draft[0], status: 'draft' };

  return null;
}

async function linkSheeshaPackageEvents(strapi, { entry, status }, eventDocumentIds, sheeshaCategoryDocumentId) {
  const payload = {
    events: {
      set: eventDocumentIds.map(documentId => ({ documentId })),
    },
  };

  if (sheeshaCategoryDocumentId) {
    payload.service_categories = {
      set: [{ documentId: sheeshaCategoryDocumentId }],
    };
  }

  await strapi.documents('api::package.package').update({
    documentId: entry.documentId,
    data: payload,
    status,
  });

  if (status === 'draft') {
    await strapi.documents('api::package.package').publish({
      documentId: entry.documentId,
    });
  } else {
    // Re-publish so relation updates are live for public API consumers.
    try {
      await strapi.documents('api::package.package').publish({
        documentId: entry.documentId,
      });
    } catch {
      // Already published / publish not required
    }
  }

  return { documentId: entry.documentId, title: entry.title, slug: entry.slug };
}

async function seedSheeshaEventLinks(strapi) {
  const logPrefix = '[seed/sheesha-event-links]';
  const events = await findSocialAndCorporateEvents(strapi);
  const eventDocumentIds = events.map(event => event.documentId).filter(Boolean);

  if (!eventDocumentIds.length) {
    throw new Error(`${logPrefix} no social/corporate events found to link.`);
  }

  const sheeshaCategory = await findSheeshaServiceCategory(strapi);
  const sheeshaCategoryDocumentId = sheeshaCategory?.documentId ?? null;

  const results = [];
  for (const slug of SHEESHA_PACKAGE_SLUGS) {
    const found = await findPackageBySlug(strapi, slug);
    if (!found) {
      results.push({ slug, skipped: true, reason: 'package-not-found' });
      continue;
    }

    const updated = await linkSheeshaPackageEvents(
      strapi,
      found,
      eventDocumentIds,
      sheeshaCategoryDocumentId
    );
    results.push({
      ...updated,
      skipped: false,
      eventCount: eventDocumentIds.length,
    });
  }

  const linked = results.filter(item => !item.skipped);
  const missing = results.filter(item => item.skipped);

  strapi.log.info(
    `${logPrefix} linked=${linked.length}, missing=${missing.length}, events=${eventDocumentIds.length}`
  );
  if (linked.length) {
    strapi.log.info(`${logPrefix} updated: ${linked.map(item => item.slug).join(', ')}`);
  }
  if (missing.length) {
    strapi.log.warn(`${logPrefix} missing: ${missing.map(item => item.slug).join(', ')}`);
  }

  return { linked, missing, eventCount: eventDocumentIds.length };
}

module.exports = {
  SHEESHA_PACKAGE_SLUGS,
  seedSheeshaEventLinks,
};
