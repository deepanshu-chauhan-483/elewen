'use strict';

/**
 * Link catering + bartending packages to every Social + Corporate event
 * so listing filters return them correctly (Religious stays excluded in frontend).
 */

const CATERING_PACKAGE_SLUGS = [
  'close-circle-catering-1',
  'close-circle-catering-2',
  'close-circle-catering-3',
  'easy-hosting-simply-served-1',
  'easy-hosting-simply-served-2',
  'effortless-hosting',
  'signature-hosting-package',
  'the-full-table-experience',
  'the-social-experience',
  'the-grand-experience',
  'the-social-starters',
  'purely-satvik',
];

const BARTENDING_PACKAGE_SLUGS = [
  'classic-pour',
  'the-house-special-premium-bartending-service',
  'exclusive-package',
];

const ALLOWED_PARENT_CATEGORY_SLUGS = new Set(['social', 'corporate'])

/** Exhibition / Seminar have fixed decor catalogs — do not attach F&B packages there. */
const EXCLUDED_EVENT_SLUGS = new Set(['exhibition-stalls', 'seminar-conference'])

const FALLBACK_SOCIAL_CORPORATE_EVENT_SLUGS = new Set([
  'birthday-parties',
  'anniversaries',
  'house-parties',
  'baby-shower',
  'bridal-shower',
  'bachelors-bachelorette',
  'proposals',
  'diwali-party',
  'haldi',
  'event', // mehndi slug on prod
  'mehndi',
  'engagement',
  'wedding',
  'sufi-night',
  'seminar-conference',
  'corporate-get-together',
])

async function findSocialAndCorporateEvents(strapi) {
  const rows = await strapi.documents('api::event.event').findMany({
    filters: { is_active: { $eq: true } },
    populate: { parent_event: true },
    status: 'published',
    limit: 200,
  })

  return (Array.isArray(rows) ? rows : []).filter(event => {
    const slug = String(event?.slug ?? '')
      .trim()
      .toLowerCase()
    if (EXCLUDED_EVENT_SLUGS.has(slug)) return false

    const parentSlug = String(event?.parent_event?.slug ?? '')
      .trim()
      .toLowerCase()
    if (ALLOWED_PARENT_CATEGORY_SLUGS.has(parentSlug)) return true

    return FALLBACK_SOCIAL_CORPORATE_EVENT_SLUGS.has(slug)
  })
}

async function findPackageBySlug(strapi, slug) {
  for (const status of ['published', 'draft']) {
    const rows = await strapi.documents('api::package.package').findMany({
      filters: { slug: { $eq: slug } },
      status,
      limit: 1,
    });
    if (Array.isArray(rows) && rows[0]) return { entry: rows[0], status };
  }
  return null;
}

async function linkPackageEvents(strapi, { entry, status }, eventDocumentIds) {
  await strapi.documents('api::package.package').update({
    documentId: entry.documentId,
    data: {
      events: {
        set: eventDocumentIds.map(documentId => ({ documentId })),
      },
    },
    status,
  });

  try {
    await strapi.documents('api::package.package').publish({
      documentId: entry.documentId,
    });
  } catch {
    // ignore
  }

  return { documentId: entry.documentId, title: entry.title, slug: entry.slug };
}

async function seedServicePackageEventLinks(strapi, packageSlugs, logPrefix) {
  const events = await findSocialAndCorporateEvents(strapi);
  const eventDocumentIds = events.map(event => event.documentId).filter(Boolean);

  if (!eventDocumentIds.length) {
    strapi.log.warn(`${logPrefix} no social/corporate events found — skipped linking.`)
    return { linked: [], missing: packageSlugs.map(slug => ({ slug, skipped: true, reason: 'no-events' })), eventCount: 0 }
  }

  const results = [];
  for (const slug of packageSlugs) {
    const found = await findPackageBySlug(strapi, slug);
    if (!found) {
      results.push({ slug, skipped: true, reason: 'package-not-found' });
      continue;
    }

    const updated = await linkPackageEvents(strapi, found, eventDocumentIds);
    results.push({ ...updated, skipped: false, eventCount: eventDocumentIds.length });
  }

  const linked = results.filter(item => !item.skipped);
  const missing = results.filter(item => item.skipped);

  strapi.log.info(
    `${logPrefix} linked=${linked.length}, missing=${missing.length}, events=${eventDocumentIds.length}`
  );

  return { linked, missing, eventCount: eventDocumentIds.length };
}

async function seedCateringEventLinks(strapi) {
  return seedServicePackageEventLinks(
    strapi,
    CATERING_PACKAGE_SLUGS,
    '[seed/catering-event-links]'
  );
}

async function seedBartendingEventLinks(strapi) {
  return seedServicePackageEventLinks(
    strapi,
    BARTENDING_PACKAGE_SLUGS,
    '[seed/bartending-event-links]'
  );
}

module.exports = {
  CATERING_PACKAGE_SLUGS,
  BARTENDING_PACKAGE_SLUGS,
  seedCateringEventLinks,
  seedBartendingEventLinks,
};
