'use strict';

/**
 * Upsert the three bartending listing packages from the client sheet:
 * Classic Pour (₹2,970), Signature Mix (₹3,740), House Special (₹6,050).
 * Exclusive Package sheet rows are add-on options, not listing cards.
 */

const BARTENDING_POLICY_CONTENT =
  'All the material used is on rent and shall be picked up after the event. The cost given above is for one event only.';

const BARTENDING_PACKAGES = [
  {
    title: 'Classic Pour',
    slug: 'classic-pour',
    base_price: 2970,
    bartender_type: 'Classic Pour',
    hours_range: '3-4 hours',
    price_per_extra_hour: 500,
    description:
      'Professional, smooth bar service for intimate gatherings and house parties.\n\nOur reliable, friendly and trained bartender handles drink preparation and guest service so you can relax and enjoy the event without worrying about the bar.',
    ideal_for: 'House parties, birthdays, small celebrations, private gatherings.',
    inclusions: [
      { text: 'Professional trained bartender' },
      { text: 'Standard bar tools and equipment' },
      { text: 'Drink preparation & serving (from the bar)' },
      { text: 'Basic cocktail preparation' },
      { text: 'Bar station organization' },
    ],
    exclusions: [{ text: 'Ingredients' }, { text: 'Alcohol' }, { text: 'Cutlery' }, { text: 'Waiter' }],
    price_breakdown: [
      { label: 'Package total', amount: 2700 },
      { label: 'Platform fee', amount: 270 },
    ],
    pricing_rules: [
      { rule_type: 'hours', value: '3-4 hrs', modifier_type: 'flat_amount', modifier_value: 0 },
      { rule_type: 'hours', value: '4-5 hrs', modifier_type: 'flat_amount', modifier_value: 500 },
      { rule_type: 'hours', value: '5-6 hrs', modifier_type: 'flat_amount', modifier_value: 1000 },
      { rule_type: 'hours', value: '7-8 hrs', modifier_type: 'flat_amount', modifier_value: 1500 },
    ],
  },
  {
    title: 'Signature Mix',
    slug: 'signature-mix',
    base_price: 3740,
    bartender_type: 'Signature Mix',
    hours_range: '3-4 hours',
    price_per_extra_hour: 500,
    description:
      'Elevate your event with a cocktail-focused bar experience.\n\nThe Signature Mix brings a more engaging and refined bar service to your event. Our experienced bartender prepares cocktails with style while interacting with guests to create a lively and memorable bar atmosphere.',
    ideal_for: 'Birthdays, social gatherings, engagement parties, and all your celebrations.',
    inclusions: [
      { text: 'Experienced cocktail bartender' },
      { text: 'Professional bar tools and equipment' },
      { text: 'Cocktail preparation & drink service at the bar' },
      { text: 'Guest interaction & cocktail recommendations' },
      { text: 'Organized bar setup' },
    ],
    exclusions: [{ text: 'Ingredients' }, { text: 'Alcohol' }, { text: 'Glassware (available as add-on)' }],
    price_breakdown: [
      { label: 'Package total', amount: 3400 },
      { label: 'Platform fee', amount: 340 },
    ],
    pricing_rules: [
      { rule_type: 'hours', value: '3-4 hrs', modifier_type: 'flat_amount', modifier_value: 0 },
      { rule_type: 'hours', value: '4-5 hrs', modifier_type: 'flat_amount', modifier_value: 500 },
      { rule_type: 'hours', value: '5-6 hrs', modifier_type: 'flat_amount', modifier_value: 1000 },
      { rule_type: 'hours', value: '7-8 hrs', modifier_type: 'flat_amount', modifier_value: 1500 },
    ],
  },
  {
    title: 'House Special',
    slug: 'the-house-special-premium-bartending-service',
    legacySlugs: ['house-special', 'exclusive-package'],
    base_price: 6050,
    bartender_type: 'House Special',
    hours_range: '3-4 hours',
    price_per_extra_hour: 500,
    description:
      'A high-end bar experience designed to impress your guests.\n\nThe House Special delivers an elevated bar service with a senior bartender skilled in cocktail craft and presentation. Perfect for events where the bar becomes a centerpiece of the experience.',
    ideal_for: 'Social and corporate events, luxury parties, and large celebrations.',
    inclusions: [
      { text: 'Senior bartender / cocktail specialist' },
      { text: 'Full professional bar toolkit' },
      { text: 'Advanced cocktail preparation' },
      { text: 'Engaging guest service experience' },
      { text: 'Professional bar setup management' },
    ],
    exclusions: [{ text: 'Ingredients' }, { text: 'Alcohol' }],
    price_breakdown: [
      { label: 'Package total', amount: 5500 },
      { label: 'Platform fee', amount: 550 },
    ],
    pricing_rules: [
      { rule_type: 'hours', value: '3-4 hrs', modifier_type: 'flat_amount', modifier_value: 0 },
      { rule_type: 'hours', value: '4-5 hrs', modifier_type: 'flat_amount', modifier_value: 500 },
      { rule_type: 'hours', value: '5-6 hrs', modifier_type: 'flat_amount', modifier_value: 1000 },
      { rule_type: 'hours', value: '7-8 hrs', modifier_type: 'flat_amount', modifier_value: 1500 },
    ],
  },
];

function toDescriptionBlocks(text) {
  return String(text ?? '')
    .split(/\n\n+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => ({
      type: 'paragraph',
      children: [{ type: 'text', text: part }],
    }));
}

async function findPackageBySlug(strapi, slug) {
  for (const status of ['published', 'draft']) {
    const rows = await strapi.documents('api::package.package').findMany({
      filters: { slug: { $eq: slug } },
      status,
      populate: { packages: true, service_categories: true },
      limit: 1,
    });
    if (Array.isArray(rows) && rows[0]) return { entry: rows[0], status };
  }
  return null;
}

async function ensureBartendingServiceCategory(strapi) {
  const rows = await strapi.documents('api::service-category.service-category').findMany({
    filters: {
      $or: [{ slug: { $eq: 'bartending' } }, { slug: { $eq: 'bar-tending' } }],
    },
    status: 'published',
    limit: 5,
  });
  if (Array.isArray(rows) && rows[0]) return rows[0];

  return strapi.documents('api::service-category.service-category').create({
    data: {
      name: 'Bartending',
      slug: 'bartending',
      description: 'Professional bartending services for celebrations.',
      is_active: true,
      is_featured: true,
    },
    status: 'published',
  });
}

async function ensureBartendingPolicy(strapi) {
  const existing = await strapi.documents('api::policy.policy').findMany({
    filters: { title: { $eq: 'Material Policy' } },
    status: 'published',
    limit: 1,
  });
  if (Array.isArray(existing) && existing[0]) return existing[0];

  return strapi.documents('api::policy.policy').create({
    data: {
      type: 'material',
      title: 'Material Policy',
      content: BARTENDING_POLICY_CONTENT,
      version: 1,
    },
    status: 'published',
  });
}

function buildBartendingComponent(pkgSeed, policyDocumentId) {
  return {
    __component: 'package.bartendingpackage',
    bartender_type: pkgSeed.bartender_type,
    hours_range: pkgSeed.hours_range,
    price_per_extra_hour: pkgSeed.price_per_extra_hour ?? null,
    ideal_for: pkgSeed.ideal_for,
    inclusions: pkgSeed.inclusions,
    exclusions: pkgSeed.exclusions,
    price_covers: [{ text: 'Bartender service for the selected hours' }],
    price_breakdown: pkgSeed.price_breakdown,
    pricing_rules: pkgSeed.pricing_rules,
    ...(policyDocumentId ? { policy: policyDocumentId } : {}),
  };
}

async function ensureBartendingPackage(strapi, pkgSeed, bartendingCategoryDocumentId, policyDocumentId) {
  const slugCandidates = [pkgSeed.slug, ...(Array.isArray(pkgSeed.legacySlugs) ? pkgSeed.legacySlugs : [])];
  let found = null;
  for (const slug of slugCandidates) {
    found = await findPackageBySlug(strapi, slug);
    if (found) break;
  }

  const bartendingBlock = buildBartendingComponent(pkgSeed, policyDocumentId);

  if (found) {
    const otherBlocks = (Array.isArray(found.entry.packages) ? found.entry.packages : []).filter(
      block => block?.__component !== 'package.bartendingpackage'
    );

    await strapi.documents('api::package.package').update({
      documentId: found.entry.documentId,
      data: {
        title: pkgSeed.title,
        slug: pkgSeed.slug,
        description: toDescriptionBlocks(pkgSeed.description),
        base_price: pkgSeed.base_price,
        is_active: true,
        visibility: true,
        service_categories: {
          set: [{ documentId: bartendingCategoryDocumentId }],
        },
        packages: [...otherBlocks, bartendingBlock],
      },
      status: found.status,
    });

    try {
      await strapi.documents('api::package.package').publish({
        documentId: found.entry.documentId,
      });
    } catch {
      // ignore publish race
    }

    return { skipped: false, updated: true, slug: pkgSeed.slug, documentId: found.entry.documentId };
  }

  const created = await strapi.documents('api::package.package').create({
    data: {
      title: pkgSeed.title,
      slug: pkgSeed.slug,
      description: toDescriptionBlocks(pkgSeed.description),
      base_price: pkgSeed.base_price,
      is_active: true,
      visibility: true,
      service_categories: {
        connect: [{ documentId: bartendingCategoryDocumentId }],
      },
      packages: [bartendingBlock],
    },
    status: 'published',
  });

  return { skipped: false, updated: false, slug: pkgSeed.slug, documentId: created.documentId };
}

async function seedBartendingPackages(strapi) {
  const category = await ensureBartendingServiceCategory(strapi);
  const policy = await ensureBartendingPolicy(strapi);
  const results = [];

  for (const pkgSeed of BARTENDING_PACKAGES) {
    results.push(
      await ensureBartendingPackage(strapi, pkgSeed, category.documentId, policy.documentId)
    );
  }

  const created = results.filter(item => !item.skipped && !item.updated);
  const updated = results.filter(item => item.updated);

  strapi.log.info(
    `[seed/bartending-packages] created=${created.length}, updated=${updated.length}`
  );

  return { created, updated, results };
}

module.exports = {
  BARTENDING_PACKAGES,
  seedBartendingPackages,
};
