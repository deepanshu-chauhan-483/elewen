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
    const response = await super.find(ctx);

    if (!Array.isArray(response?.data) || response.data.length === 0) {
      return response;
    }

    return {
      ...response,
      data: await Promise.all(response.data.map(entry => attachReusableAddons(entry, strapi))),
    };
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);

    if (!response?.data) {
      return response;
    }

    return {
      ...response,
      data: await attachReusableAddons(response.data, strapi),
    };
  },
}));
