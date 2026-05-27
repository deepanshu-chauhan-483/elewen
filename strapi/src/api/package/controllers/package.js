'use strict';

/**
 * package controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const addonFields = [
  'id',
  'documentId',
  'name',
  'description',
  'price',
  'unit',
  'max_quantity',
  'visibility',
];

const normalizeAddon = addon => ({
  id: addon?.id,
  documentId: addon?.documentId,
  name: addon?.name ?? '',
  description: addon?.description ?? '',
  price: addon?.price ?? 0,
  unit: addon?.unit ?? '',
  max_quantity: addon?.max_quantity ?? 1,
  visibility: addon?.visibility !== false,
});

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

const attachReusableAddons = async (entry, strapi) => {
  if (!entry?.id) return entry;

  const addons = await strapi.db.query('api::addon.addon').findMany({
    where: {
      packages: {
        id: entry.id,
      },
    },
    select: addonFields,
  });

  return {
    ...entry,
    reusable_addons: Array.isArray(addons) ? addons.map(normalizeAddon) : [],
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

    return {
      ...response,
      data: await Promise.all(enrichedEntries.map(entry => attachReusableAddons(entry, strapi))),
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
      data: await attachReusableAddons(enrichedEntry ?? response.data, strapi),
    };
  },
}));
