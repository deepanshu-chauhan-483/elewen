'use strict';

const GUEST_PAX_OPTIONS = ['30', '40', '50', '60', '80', '100', '125'];

const CATERING_POLICY_TITLE = 'Policy for all catering packages';

const CATERING_POLICY_SUMMARY = `Policy for all catering packages

1. All the material used is on rent and shall be picked up after the event. The cost given is for one event only.
2. Additional Guests/Staff: Any extra consumption will be charged accordingly.
3. Service Duration: Starters served up to 3 hours. Extension at additional cost.
4. Client Arrangements: Client to provide space, electricity & basic setup for food preparation.
5. Food Preparation: Food is partially prepared in advance, with final cooking and finishing touches completed live at the venue for freshness.`;

function toDescriptionBlocks(text) {
  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', text: String(text ?? '').trim() }],
    },
  ];
}

function buildGuestPricingRules() {
  return GUEST_PAX_OPTIONS.map((value, index) => ({
    rule_type: 'guest_count',
    value,
    modifier_type: 'flat_amount',
    modifier_value: 0,
    __temp_key__: `guest-${index}`,
  }));
}

function buildCateringComponent({
  cateringLevel,
  levelDescription,
  policyDocumentId,
  inclusions,
  exclusions,
  clientRequirements,
  nittyGritty,
  idealFor,
  serviceStyleNotes,
  internalPackageCode,
  pricePerPersonVeg,
  pricePerPersonNonVeg,
  menuItems,
}) {
  return {
    __component: 'package.cateringpackage',
    catering_level: cateringLevel,
    level_description: levelDescription,
    inclusions,
    exclusions,
    client_requirements: clientRequirements,
    nitty_gritty: nittyGritty,
    ideal_for: idealFor,
    service_style_notes: serviceStyleNotes || undefined,
    internal_package_code: internalPackageCode,
    price_per_person_veg: pricePerPersonVeg,
    price_per_person_non_veg: pricePerPersonNonVeg,
    menu_items: menuItems,
    pricing_rules: buildGuestPricingRules(),
    ...(policyDocumentId ? { policy: policyDocumentId } : {}),
  };
}

async function findPublishedBySlug(strapi, uid, slug) {
  const rows = await strapi.documents(uid).findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    limit: 1,
  });

  return Array.isArray(rows) ? rows[0] ?? null : null;
}

function packageHasCateringBlock(entry) {
  const blocks = Array.isArray(entry?.packages) ? entry.packages : [];
  return blocks.some(block => block?.__component === 'package.cateringpackage');
}

async function findPackageBySlug(strapi, slug) {
  for (const status of ['published', 'draft']) {
    const rows = await strapi.documents('api::package.package').findMany({
      filters: { slug: { $eq: slug } },
      status,
      populate: { packages: true },
      limit: 1,
    });

    if (Array.isArray(rows) && rows[0]) {
      return { entry: rows[0], status };
    }
  }

  return null;
}

async function ensureCateringPolicy(strapi) {
  const existing = await strapi.documents('api::policy.policy').findMany({
    filters: { title: { $eq: CATERING_POLICY_TITLE } },
    status: 'published',
    limit: 1,
  });

  if (Array.isArray(existing) && existing[0]) {
    return existing[0];
  }

  const draft = await strapi.documents('api::policy.policy').findMany({
    filters: { title: { $eq: CATERING_POLICY_TITLE } },
    status: 'draft',
    limit: 1,
  });

  if (Array.isArray(draft) && draft[0]) {
    const published = await strapi.documents('api::policy.policy').publish({
      documentId: draft[0].documentId,
    });
    return published?.entries?.[0] ?? draft[0];
  }

  const created = await strapi.documents('api::policy.policy').create({
    data: {
      title: CATERING_POLICY_TITLE,
      type: 'catering',
      summary_text: CATERING_POLICY_SUMMARY,
      content: CATERING_POLICY_SUMMARY,
      version: 1,
    },
    status: 'published',
  });

  return created;
}

async function ensureCateringServiceCategory(strapi) {
  const published = await strapi.documents('api::service-category.service-category').findMany({
    filters: {
      $or: [{ slug: { $eq: 'catering' } }, { name: { $eq: 'Catering' } }],
    },
    status: 'published',
    limit: 1,
  });

  if (Array.isArray(published) && published[0]) {
    return published[0];
  }

  const created = await strapi.documents('api::service-category.service-category').create({
    data: {
      name: 'Catering',
      slug: 'catering',
      description: 'Curated catering packages for home gatherings and celebrations.',
      is_active: true,
      is_featured: true,
    },
    status: 'published',
  });

  return created;
}

async function ensureCateringPackage(strapi, pkgSeed, cateringBlock, cateringCategoryDocumentId) {
  const found = await findPackageBySlug(strapi, pkgSeed.slug);

  if (found) {
    const { entry, status } = found;

    if (packageHasCateringBlock(entry)) {
      return { skipped: true, documentId: entry.documentId, title: pkgSeed.title };
    }

    await strapi.documents('api::package.package').update({
      documentId: entry.documentId,
      data: {
        packages: [cateringBlock],
        service_categories: {
          connect: [{ documentId: cateringCategoryDocumentId }],
        },
      },
    });

    try {
      await strapi.documents('api::package.package').publish({
        documentId: entry.documentId,
      });
    } catch (publishError) {
      strapi.log.warn(
        `[seed/catering] Publish after repair for "${pkgSeed.slug}" (${status}): ${publishError.message}`
      );
    }

    strapi.log.info(
      `[seed/catering] Repaired missing cateringpackage block on "${pkgSeed.title}" (${pkgSeed.slug})`
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
      is_featured: pkgSeed.is_featured ?? false,
      packages: [cateringBlock],
      service_categories: {
        connect: [{ documentId: cateringCategoryDocumentId }],
      },
    },
    status: 'published',
  });

  return { skipped: false, documentId: created.documentId, title: pkgSeed.title };
}

async function seedCateringPackages(strapi, packageSeeds, buildBlockForSeed) {
  const policy = await ensureCateringPolicy(strapi);
  const cateringCategory = await ensureCateringServiceCategory(strapi);
  const policyDocumentId = policy?.documentId;
  const categoryDocumentId = cateringCategory?.documentId;

  if (!policyDocumentId || !categoryDocumentId) {
    throw new Error('Catering seed failed: missing policy or service category documentId.');
  }

  const results = [];

  for (const pkgSeed of packageSeeds) {
    const cateringBlock = buildBlockForSeed(pkgSeed, policyDocumentId);
    const result = await ensureCateringPackage(
      strapi,
      pkgSeed,
      cateringBlock,
      categoryDocumentId
    );
    results.push(result);
  }

  return {
    policyDocumentId,
    categoryDocumentId,
    packages: results,
  };
}

module.exports = {
  GUEST_PAX_OPTIONS,
  CATERING_POLICY_TITLE,
  CATERING_POLICY_SUMMARY,
  toDescriptionBlocks,
  buildGuestPricingRules,
  buildCateringComponent,
  findPublishedBySlug,
  findPackageBySlug,
  packageHasCateringBlock,
  ensureCateringPolicy,
  ensureCateringServiceCategory,
  ensureCateringPackage,
  seedCateringPackages,
};
