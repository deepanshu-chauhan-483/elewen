'use strict';

/**
 * package controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const resolveAddonImageUrl = addon => {
  const image = addon?.image;
  if (!image) return null;
  if (typeof image === 'string') return image;

  const rawUrl =
    image.url ??
    image.formats?.medium?.url ??
    image.formats?.small?.url ??
    image.formats?.large?.url ??
    null;

  if (!rawUrl) return null;
  if (String(rawUrl).startsWith('http://') || String(rawUrl).startsWith('https://')) {
    return rawUrl;
  }

  const base = String(process.env.PUBLIC_URL ?? '').replace(/\/$/, '');
  return base ? `${base}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}` : rawUrl;
};

const normalizeAddon = addon => ({
  id: addon?.id,
  documentId: addon?.documentId,
  name: addon?.name ?? '',
  description: addon?.description ?? '',
  price: addon?.price ?? 0,
  max_price: addon?.max_price ?? null,
  addon_scope: addon?.addon_scope ?? 'universal',
  unit: addon?.unit ?? '',
  max_quantity: addon?.max_quantity ?? 1,
  visibility: addon?.visibility !== false,
  image: resolveAddonImageUrl(addon),
});

const isCateringPackageEntry = entry => {
  const serviceSlugs = (Array.isArray(entry?.service_categories) ? entry.service_categories : [])
    .flatMap(category => [
      String(category?.slug ?? '').toLowerCase(),
      String(category?.name ?? '').toLowerCase(),
    ])
    .filter(Boolean);

  if (serviceSlugs.some(slug => slug.includes('catering'))) {
    return true;
  }

  const sections = Array.isArray(entry?.packages) ? entry.packages : [];
  return sections.some(section => section?.__component === 'package.cateringpackage');
};

const isBartendingPackageEntry = entry => {
  const serviceSlugs = (Array.isArray(entry?.service_categories) ? entry.service_categories : [])
    .flatMap(category => [
      String(category?.slug ?? '').toLowerCase(),
      String(category?.name ?? '').toLowerCase(),
    ])
    .filter(Boolean);

  if (serviceSlugs.some(slug => slug.includes('bartend') || slug === 'bar-tending')) {
    return true;
  }

  const sections = Array.isArray(entry?.packages) ? entry.packages : [];
  return sections.some(section => section?.__component === 'package.bartendingpackage');
};

const mergeAddonsById = (...addonGroups) => {
  const seen = new Set();
  const merged = [];

  for (const group of addonGroups) {
    for (const addon of Array.isArray(group) ? group : []) {
      if (!addon || addon.visibility === false) continue;
      const key = String(addon.documentId ?? addon.id ?? addon.name ?? '').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(normalizeAddon(addon));
    }
  }

  return merged;
};

const nestedPackagePopulate = {
  images: true,
  events: {
    populate: {
      parent_event: true,
    },
  },
  service_categories: {
    populate: {
      parent_category: true,
    },
  },
  packages: {
    on: {
      'package.decorpackages': {
        populate: {
          elements: {
            populate: {
              service: true,
            },
          },
          addons: true,
          inclustions: {
            populate: {
              images: true,
            },
          },
          policy: true,
          price_covers: true,
          price_breakdown: true,
          theme: true,
          budget_level: true,
          backdrop_images: true,
        },
      },
      'package.sheeshapackage': {
        populate: {
          elements: {
            populate: {
              service: true,
            },
          },
          addons: true,
          inclusions: true,
          policy: true,
          price_covers: true,
          flavor: true,
        },
      },
      'package.bartendingpackage': {
        populate: {
          inclusions: true,
          exclusions: true,
          policy: true,
          price_covers: true,
          price_breakdown: true,
          budget_level: true,
          pricing_rules: true,
        },
      },
      'package.cateringpackage': {
        populate: {
          menu_items: true,
          inclusions: true,
          exclusions: true,
          addons: true,
          policy: true,
          price_covers: true,
          price_breakdown: true,
          budget_level: true,
          pricing_rules: true,
        },
      },
    },
  },
};

const mergeEntryWithNestedPackages = (entry, nestedEntry) => {
  if (!entry || !nestedEntry) return entry;

  return {
    ...entry,
    images: nestedEntry.images ?? entry.images,
    events: nestedEntry.events ?? entry.events,
    service_categories: nestedEntry.service_categories ?? entry.service_categories,
    packages: nestedEntry.packages ?? entry.packages,
  };
};

const enrichEntriesWithNestedPackages = async (entries, strapi) => {
  const items = Array.isArray(entries) ? entries.filter(entry => entry?.documentId) : [];
  if (!items.length) return entries;

  const nestedEntries = await strapi.documents('api::package.package').findMany({
    documentId: items.map(entry => entry.documentId),
    status: 'published',
    populate: nestedPackagePopulate,
  });

  const nestedByDocumentId = new Map(
    (Array.isArray(nestedEntries) ? nestedEntries : []).map(entry => [entry.documentId, entry])
  );

  return entries.map(entry =>
    mergeEntryWithNestedPackages(entry, nestedByDocumentId.get(entry.documentId))
  );
};

const normalizeCateringDiscountSettings = entry => {
  if (!entry || entry.is_active === false) return null;

  const tiers = (Array.isArray(entry.guest_discount_tiers) ? entry.guest_discount_tiers : [])
    .map(tier => ({
      label: tier?.label ?? '',
      min_pax: Number(tier?.min_pax ?? 0),
      max_pax: Number(tier?.max_pax ?? 0),
      discount_per_person: Number(tier?.discount_per_person ?? 0),
    }))
    .filter(tier => tier.min_pax > 0 && tier.max_pax >= tier.min_pax && tier.discount_per_person > 0)
    .sort((left, right) => left.min_pax - right.min_pax);

  if (!tiers.length) return null;

  return {
    is_active: true,
    discount_title: entry.discount_title ?? 'Guest count discounts',
    discount_note: entry.discount_note ?? '',
    tiers,
  };
};

const loadCateringDiscountSettings = async strapi => {
  const rows = await strapi.documents('api::catering-setting.catering-setting').findMany({
    status: 'published',
    limit: 1,
    populate: { guest_discount_tiers: true },
  });

  const entry = Array.isArray(rows) ? rows[0] ?? null : null;
  return normalizeCateringDiscountSettings(entry);
};

const attachCateringGuestDiscounts = async (entry, strapi, shared = {}) => {
  if (!isCateringPackageEntry(entry)) return entry;

  if (!Object.prototype.hasOwnProperty.call(shared, 'cateringGuestDiscounts')) {
    shared.cateringGuestDiscounts = await loadCateringDiscountSettings(strapi);
  }

  if (!shared.cateringGuestDiscounts) return entry;

  return {
    ...entry,
    catering_guest_discounts: shared.cateringGuestDiscounts,
  };
};

const enrichPackageEntry = async (entry, strapi, shared = {}) => {
  const withAddons = await attachReusableAddons(entry, strapi);
  return attachCateringGuestDiscounts(withAddons, strapi, shared);
};

const attachReusableAddons = async (entry, strapi) => {
  if (!entry?.id) return entry;

  const linkedAddons = await strapi.db.query('api::addon.addon').findMany({
    where: {
      packages: {
        id: entry.id,
      },
    },
    populate: { image: true },
  });

  let scopedAddons = [];
  if (isCateringPackageEntry(entry)) {
    scopedAddons = await strapi.db.query('api::addon.addon').findMany({
      where: {
        addon_scope: 'catering',
      },
      populate: { image: true },
    });
  } else if (isBartendingPackageEntry(entry)) {
    scopedAddons = await strapi.db.query('api::addon.addon').findMany({
      where: {
        addon_scope: 'bartending',
      },
      populate: { image: true },
    });
  }

  return {
    ...entry,
    reusable_addons: mergeAddonsById(linkedAddons, scopedAddons),
  };
};

module.exports = createCoreController('api::package.package', ({ strapi }) => ({
  async find(ctx) {
    if (ctx?.query?.populate?.packages?.on?.['package.decorpackages']?.populate?.inclustions?.populate) {
      delete ctx.query.populate.packages.on['package.decorpackages'].populate.inclustions.populate;
    }

    const response = await super.find(ctx);

    if (!Array.isArray(response?.data) || response.data.length === 0) {
      return response;
    }

    const enrichedEntries = await enrichEntriesWithNestedPackages(response.data, strapi);

    const shared = {};

    return {
      ...response,
      data: await Promise.all(enrichedEntries.map(entry => enrichPackageEntry(entry, strapi, shared))),
    };
  },

  async findOne(ctx) {
    if (ctx?.query?.populate?.packages?.on?.['package.decorpackages']?.populate?.inclustions?.populate) {
      delete ctx.query.populate.packages.on['package.decorpackages'].populate.inclustions.populate;
    }

    const response = await super.findOne(ctx);

    if (!response?.data) {
      return response;
    }

    const [enrichedEntry] = await enrichEntriesWithNestedPackages([response.data], strapi);

    return {
      ...response,
      data: await enrichPackageEntry(enrichedEntry ?? response.data, strapi, {}),
    };
  },
}));
