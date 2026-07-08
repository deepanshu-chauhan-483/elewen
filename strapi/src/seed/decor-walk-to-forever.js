'use strict';

const { toDescriptionBlocks, findPackageBySlug } = require('./catering-shared');

const PACKAGE_SLUG = 'the-walk-to-forever';

const DECOR_MATERIAL_POLICY_TITLE = 'Policy for decor packages (material rental)';

const DECOR_MATERIAL_POLICY_SUMMARY =
  'All the material used is on rent and shall be picked up after the event. The cost given above is for one event only.';

const WALK_TO_FOREVER_SEED = {
  title: 'The Walk to Forever',
  slug: PACKAGE_SLUG,
  base_price: 14970,
  description:
    "A romantic setting designed for one unforgettable question, where candlelight, roses, and a beautiful pathway lead to a moment you'll remember forever.",
  key_decor_elements:
    "A romantic setting designed for one unforgettable question, where candlelight, roses, and a beautiful pathway lead to a moment you'll remember forever.",
  nitty_gritty:
    "Love the look but need a different color? Go ahead and book! We'll contact you to finalize the perfect shade from our available decor to match your vibe.",
  best_placed_at:
    'Perfect for terraces, gardens, lawns, balconies or any outdoor space. The set up can be done in a living room / drawing room space too.',
  why_we_love_it:
    'The rose-lined pathway builds anticipation and leads beautifully to the dinner that matters most.',
  price_covers: [
    { text: 'The Complete Look' },
    { text: 'Professional Setup' },
    { text: 'Final Dismantling' },
    { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
  ],
  price_breakdown: [
    { label: 'Rose Pathway', amount: 6000 },
    { label: 'Candles', amount: 700 },
    { label: 'Big candles', amount: 1500 },
    { label: 'Table with linen', amount: 500 },
    { label: 'Comfortable chairs', amount: 1000 },
    { label: 'Centerpiece', amount: 1000 },
    { label: 'Platform fee', amount: 1070 },
    { label: 'Labour & Transport', amount: 3200 },
  ],
  inclustions: [
    {
      text: 'Pathway styled with flowers on both sides and rose petals in the center',
      group_title: 'Rose Pathway',
    },
    {
      text: 'Candles in glass holders lining the pathway',
      group_title: 'Candles',
    },
    {
      text: '1 round table with linen',
      group_title: 'Table Setup',
    },
    {
      text: '2 comfortable chairs',
      group_title: 'Table Setup',
    },
    {
      text: '1 floral centerpiece with candles',
      group_title: 'Table Setup',
    },
  ],
};

const EVENT_SLUG_CANDIDATES = [
  'engagement-parties',
  'engagement',
  'proposal',
  'proposals',
];

function packageHasDecorBlock(entry) {
  const blocks = Array.isArray(entry?.packages) ? entry.packages : [];
  return blocks.some(block => block?.__component === 'package.decorpackages');
}

function getDecorBlock(entry) {
  const blocks = Array.isArray(entry?.packages) ? entry.packages : [];
  return blocks.find(block => block?.__component === 'package.decorpackages') ?? null;
}

function decorBlockNeedsTransportRepair(entry) {
  const decor = getDecorBlock(entry);
  if (!decor) return false;

  return (Array.isArray(decor.price_breakdown) ? decor.price_breakdown : []).some(row => {
    const label = String(row?.label ?? '').trim();
    const amount = Number(row?.amount ?? 0);
    return label === 'Transport' && amount === 3200;
  });
}

function buildDecorBlock(pkgSeed, policyDocumentId) {
  return {
    __component: 'package.decorpackages',
    key_decor_elements: pkgSeed.key_decor_elements,
    nitty_gritty: pkgSeed.nitty_gritty,
    best_placed_at: pkgSeed.best_placed_at,
    why_we_love_it: pkgSeed.why_we_love_it,
    price_covers: pkgSeed.price_covers,
    price_breakdown: pkgSeed.price_breakdown,
    inclustions: pkgSeed.inclustions,
    elements: [],
    ...(policyDocumentId ? { policy: policyDocumentId } : {}),
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

  const created = await strapi.documents('api::service-category.service-category').create({
    data: {
      name: 'Decor',
      slug: 'decor',
      description: 'Curated decor and styling packages for celebrations.',
      is_active: true,
      is_featured: true,
    },
    status: 'published',
  });

  return created;
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

async function findEventDocumentId(strapi) {
  for (const slug of EVENT_SLUG_CANDIDATES) {
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

async function ensureWalkToForeverPackage(
  strapi,
  pkgSeed,
  decorBlock,
  decorCategoryDocumentId,
  eventDocumentId
) {
  const found = await findPackageBySlug(strapi, pkgSeed.slug);

  if (found) {
    const { entry, status } = found;

    if (packageHasDecorBlock(entry) && !decorBlockNeedsTransportRepair(entry)) {
      return { skipped: true, documentId: entry.documentId, title: pkgSeed.title };
    }

    if (packageHasDecorBlock(entry) && decorBlockNeedsTransportRepair(entry)) {
      await strapi.documents('api::package.package').update({
        documentId: entry.documentId,
        data: {
          packages: [decorBlock],
        },
      });

      try {
        await strapi.documents('api::package.package').publish({
          documentId: entry.documentId,
        });
      } catch (publishError) {
        strapi.log.warn(
          `[seed/decor] Publish after transport repair for "${pkgSeed.slug}" (${status}): ${publishError.message}`
        );
      }

      strapi.log.info(
        `[seed/decor] Repaired transport breakdown label on "${pkgSeed.title}" (${pkgSeed.slug})`
      );

      return {
        skipped: false,
        repaired: true,
        documentId: entry.documentId,
        title: pkgSeed.title,
      };
    }

    if (packageHasDecorBlock(entry)) {
      return { skipped: true, documentId: entry.documentId, title: pkgSeed.title };
    }

    await strapi.documents('api::package.package').update({
      documentId: entry.documentId,
      data: {
        packages: [decorBlock],
        service_categories: {
          connect: [{ documentId: decorCategoryDocumentId }],
        },
        ...(eventDocumentId
          ? { events: { connect: [{ documentId: eventDocumentId }] } }
          : {}),
      },
    });

    try {
      await strapi.documents('api::package.package').publish({
        documentId: entry.documentId,
      });
    } catch (publishError) {
      strapi.log.warn(
        `[seed/decor] Publish after repair for "${pkgSeed.slug}" (${status}): ${publishError.message}`
      );
    }

    strapi.log.info(
      `[seed/decor] Repaired missing decorpackages block on "${pkgSeed.title}" (${pkgSeed.slug})`
    );

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

async function seedWalkToForever(strapi) {
  const policy = await ensureDecorMaterialPolicy(strapi);
  const decorCategory = await ensureDecorServiceCategory(strapi);
  const eventDocumentId = await findEventDocumentId(strapi);

  const policyDocumentId = policy?.documentId;
  const categoryDocumentId = decorCategory?.documentId;

  if (!policyDocumentId || !categoryDocumentId) {
    throw new Error('Decor seed failed: missing policy or service category documentId.');
  }

  if (!eventDocumentId) {
    strapi.log.warn(
      `[seed/decor] No event found for slugs [${EVENT_SLUG_CANDIDATES.join(', ')}] — package created without event link.`
    );
  }

  const decorBlock = buildDecorBlock(WALK_TO_FOREVER_SEED, policyDocumentId);
  const result = await ensureWalkToForeverPackage(
    strapi,
    WALK_TO_FOREVER_SEED,
    decorBlock,
    categoryDocumentId,
    eventDocumentId
  );

  return {
    policyDocumentId,
    categoryDocumentId,
    eventDocumentId,
    package: result,
  };
}

module.exports = {
  PACKAGE_SLUG,
  WALK_TO_FOREVER_SEED,
  seedWalkToForever,
};
