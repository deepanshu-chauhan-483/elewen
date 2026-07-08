'use strict';

const { toDescriptionBlocks, findPackageBySlug } = require('./catering-shared');
const { shouldRefreshExistingDecor } = require('./seed-env');

const DECOR_MATERIAL_POLICY_TITLE = 'Policy for decor packages (material rental)';

const DECOR_MATERIAL_POLICY_SUMMARY =
  'All the material used is on rent and shall be picked up after the event. The cost given above is for one event only.';

const PROPOSAL_EVENT_SLUG_CANDIDATES = ['proposals', 'proposal', 'engagement-parties', 'engagement'];

const PROPOSAL_NITTY_GRITTY =
  "Love the look but need a different color? Go ahead and book! We'll contact you to finalize the perfect shade from our available decor to match your vibe.";

const PROPOSAL_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'Professional Setup' },
  { text: 'Final Dismantling' },
  { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
];

const PROPOSAL_SETUP_NEEDS =
  'A small area for our team to work, access to water and electricity';

const PROPOSAL_SETUP_NEEDS_PC =
  'A small area for our team to work, access to water and electricity. Final images needed prior to the event (timeline will be suggested by team Elewen after booking).';

function slugifyTitle(title = '') {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function packageHasDecorBlock(entry) {
  const blocks = Array.isArray(entry?.packages) ? entry.packages : [];
  return blocks.some(block => block?.__component === 'package.decorpackages');
}

function buildDecorBlock(pkgSeed, policyDocumentId, budgetLevelDocumentId, themeDocumentId) {
  return {
    __component: 'package.decorpackages',
    theme_name: pkgSeed.theme_name,
    key_decor_elements: pkgSeed.key_decor_elements,
    nitty_gritty: pkgSeed.nitty_gritty ?? PROPOSAL_NITTY_GRITTY,
    best_placed_at: pkgSeed.best_placed_at,
    why_we_love_it: pkgSeed.why_we_love_it,
    setup_needs: pkgSeed.setup_needs,
    price_covers: pkgSeed.price_covers ?? PROPOSAL_PRICE_COVERS,
    price_breakdown: pkgSeed.price_breakdown,
    inclustions: pkgSeed.inclustions,
    elements: [],
    ...(policyDocumentId ? { policy: policyDocumentId } : {}),
    ...(budgetLevelDocumentId ? { budget_level: budgetLevelDocumentId } : {}),
    ...(themeDocumentId ? { theme: themeDocumentId } : {}),
  };
}

async function ensureDecorServiceCategory(strapi) {
  const published = await strapi.documents('api::service-category.service-category').findMany({
    filters: {
      $or: [{ slug: { $eq: 'decor' } }, { name: { $eq: 'Decor' } }],
    },
    status: 'published',
    limit: 1,
  });

  if (Array.isArray(published) && published[0]) {
    return published[0];
  }

  return strapi.documents('api::service-category.service-category').create({
    data: {
      name: 'Decor',
      slug: 'decor',
      description: 'Curated decor and styling packages for celebrations.',
      is_active: true,
      is_featured: true,
    },
    status: 'published',
  });
}

async function ensureDecorMaterialPolicy(strapi) {
  const existing = await strapi.documents('api::policy.policy').findMany({
    filters: { title: { $eq: DECOR_MATERIAL_POLICY_TITLE } },
    status: 'published',
    limit: 1,
  });

  if (Array.isArray(existing) && existing[0]) {
    return existing[0];
  }

  const draft = await strapi.documents('api::policy.policy').findMany({
    filters: { title: { $eq: DECOR_MATERIAL_POLICY_TITLE } },
    status: 'draft',
    limit: 1,
  });

  if (Array.isArray(draft) && draft[0]) {
    const published = await strapi.documents('api::policy.policy').publish({
      documentId: draft[0].documentId,
    });
    return published?.entries?.[0] ?? draft[0];
  }

  return strapi.documents('api::policy.policy').create({
    data: {
      title: DECOR_MATERIAL_POLICY_TITLE,
      type: 'material',
      summary_text: DECOR_MATERIAL_POLICY_SUMMARY,
      content: DECOR_MATERIAL_POLICY_SUMMARY,
      version: 1,
    },
    status: 'published',
  });
}

async function findEventDocumentId(strapi, slugCandidates = PROPOSAL_EVENT_SLUG_CANDIDATES) {
  for (const slug of slugCandidates) {
    const rows = await strapi.documents('api::event.event').findMany({
      filters: { slug: { $eq: slug } },
      status: 'published',
      limit: 1,
    });

    if (Array.isArray(rows) && rows[0]?.documentId) {
      return rows[0].documentId;
    }
  }

  return null;
}

async function findThemeDocumentId(strapi, slugCandidates = []) {
  for (const slug of slugCandidates) {
    const normalizedSlug = String(slug ?? '').trim();
    if (!normalizedSlug) continue;

    const rows = await strapi.documents('api::theme.theme').findMany({
      filters: { slug: { $eq: normalizedSlug } },
      status: 'published',
      limit: 1,
    });

    if (Array.isArray(rows) && rows[0]?.documentId) {
      return rows[0].documentId;
    }
  }

  return null;
}

async function findBudgetLevelDocumentId(strapi, levelSlug) {
  const slug = String(levelSlug ?? '').trim();
  if (!slug) return null;

  const rows = await strapi.documents('api::budget-level.budget-level').findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    limit: 1,
  });

  return Array.isArray(rows) && rows[0]?.documentId ? rows[0].documentId : null;
}

async function ensureProposalPackage(
  strapi,
  pkgSeed,
  decorBlock,
  decorCategoryDocumentId,
  eventDocumentId,
  options = {}
) {
  const found = await findPackageBySlug(strapi, pkgSeed.slug);

  if (found) {
    const { entry, status } = found;

    if (packageHasDecorBlock(entry)) {
      if (options.refreshExistingDecor) {
        await strapi.documents('api::package.package').update({
          documentId: entry.documentId,
          data: {
            title: pkgSeed.title,
            description: toDescriptionBlocks(pkgSeed.description),
            base_price: pkgSeed.base_price,
            packages: [decorBlock],
            service_categories: {
              connect: [{ documentId: decorCategoryDocumentId }],
            },
            ...(eventDocumentId ? { events: { connect: [{ documentId: eventDocumentId }] } } : {}),
          },
        });

        try {
          await strapi.documents('api::package.package').publish({
            documentId: entry.documentId,
          });
        } catch (publishError) {
          strapi.log.warn(
            `[seed/decor] Publish after refresh for "${pkgSeed.slug}" (${status}): ${publishError.message}`
          );
        }

        return {
          skipped: false,
          updated: true,
          documentId: entry.documentId,
          title: pkgSeed.title,
        };
      }

      return { skipped: true, documentId: entry.documentId, title: pkgSeed.title };
    }

    await strapi.documents('api::package.package').update({
      documentId: entry.documentId,
      data: {
        packages: [decorBlock],
        service_categories: {
          connect: [{ documentId: decorCategoryDocumentId }],
        },
        ...(eventDocumentId ? { events: { connect: [{ documentId: eventDocumentId }] } } : {}),
      },
    });

    try {
      await strapi.documents('api::package.package').publish({
        documentId: entry.documentId,
      });
    } catch (publishError) {
      strapi.log.warn(
        `[seed/decor-proposal] Publish after repair for "${pkgSeed.slug}" (${status}): ${publishError.message}`
      );
    }

    return {
      skipped: false,
      repaired: true,
      documentId: entry.documentId,
      title: pkgSeed.title,
    };
  }

  const created = await strapi.documents('api::package.package').create({
    data: {
      title: pkgSeed.title,
      slug: pkgSeed.slug,
      description: toDescriptionBlocks(pkgSeed.description),
      base_price: pkgSeed.base_price,
      is_active: true,
      visibility: true,
      is_featured: false,
      packages: [decorBlock],
      service_categories: {
        connect: [{ documentId: decorCategoryDocumentId }],
      },
      ...(eventDocumentId ? { events: { connect: [{ documentId: eventDocumentId }] } } : {}),
    },
    status: 'published',
  });

  return { skipped: false, documentId: created.documentId, title: pkgSeed.title };
}

async function seedDecorPackages(strapi, packageSeeds = [], options = {}) {
  const eventSlugCandidates = options.eventSlugCandidates ?? PROPOSAL_EVENT_SLUG_CANDIDATES;
  const logPrefix = options.logPrefix ?? 'seed/decor';

  const policy = await ensureDecorMaterialPolicy(strapi);
  const decorCategory = await ensureDecorServiceCategory(strapi);
  const eventDocumentId = await findEventDocumentId(strapi, eventSlugCandidates);

  const policyDocumentId = policy?.documentId;
  const categoryDocumentId = decorCategory?.documentId;

  if (!policyDocumentId || !categoryDocumentId) {
    throw new Error(`${logPrefix} seed failed: missing policy or service category documentId.`);
  }

  if (!eventDocumentId) {
    strapi.log.warn(
      `[${logPrefix}] No event found for slugs [${eventSlugCandidates.join(', ')}] — packages created without event link.`
    );
  }

  const levelCache = new Map();
  const themeCache = new Map();
  const results = [];

  for (const pkgSeed of packageSeeds) {
    let budgetLevelDocumentId = null;

    if (pkgSeed.budget_level_slug) {
      if (!levelCache.has(pkgSeed.budget_level_slug)) {
        levelCache.set(
          pkgSeed.budget_level_slug,
          await findBudgetLevelDocumentId(strapi, pkgSeed.budget_level_slug)
        );
      }
      budgetLevelDocumentId = levelCache.get(pkgSeed.budget_level_slug);

      if (!budgetLevelDocumentId) {
        strapi.log.warn(
          `[${logPrefix}] Budget level "${pkgSeed.budget_level_slug}" not found for "${pkgSeed.title}"`
        );
      }
    }

    let themeDocumentId = null;

    if (Array.isArray(pkgSeed.theme_slug_candidates) && pkgSeed.theme_slug_candidates.length) {
      const themeCacheKey = pkgSeed.theme_slug_candidates.join('|');

      if (!themeCache.has(themeCacheKey)) {
        themeCache.set(
          themeCacheKey,
          await findThemeDocumentId(strapi, pkgSeed.theme_slug_candidates)
        );
      }
      themeDocumentId = themeCache.get(themeCacheKey);
    }

    const decorBlock = buildDecorBlock(
      pkgSeed,
      policyDocumentId,
      budgetLevelDocumentId,
      themeDocumentId
    );
    const result = await ensureProposalPackage(
      strapi,
      pkgSeed,
      decorBlock,
      categoryDocumentId,
      eventDocumentId,
      {
        refreshExistingDecor:
          typeof options.refreshExistingDecor === 'boolean'
            ? options.refreshExistingDecor
            : shouldRefreshExistingDecor(),
      }
    );
    results.push(result);
  }

  return {
    policyDocumentId,
    categoryDocumentId,
    eventDocumentId,
    packages: results,
  };
}

async function seedProposalPackages(strapi, packageSeeds = []) {
  return seedDecorPackages(strapi, packageSeeds, {
    eventSlugCandidates: PROPOSAL_EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-proposal',
  });
}

module.exports = {
  DECOR_MATERIAL_POLICY_TITLE,
  PROPOSAL_NITTY_GRITTY,
  PROPOSAL_PRICE_COVERS,
  PROPOSAL_SETUP_NEEDS,
  PROPOSAL_SETUP_NEEDS_PC,
  slugifyTitle,
  buildDecorBlock,
  findEventDocumentId,
  findThemeDocumentId,
  seedDecorPackages,
  seedProposalPackages,
};
