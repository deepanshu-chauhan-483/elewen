'use strict';

/**
 * Shared catering add-ons (30 pax baseline). Linked to all catering packages via
 * addon_scope=catering in the package API controller — no per-package relation required.
 */

const CATERING_ADDONS = [
  {
    name: 'Live Station',
    description:
      'LIVE PASTA & WOODFIRE PIZZA THEATRE · ASIAN DIM SUM EXPERIENCE · LUXE INDIAN CHAAT STUDIO · RAMEN / ASIAN BOWL BAR · DESSERT ATELIER (LIVE PLATING). Exact range calculated according to the dishes you choose.',
    price: 200,
    max_price: 500,
    unit: '30 pax',
  },
  {
    name: 'Soup Station',
    description: 'Price range calculated according to the soup selection.',
    price: 50,
    max_price: 150,
    unit: '30 pax',
  },
  {
    name: 'Dessert',
    description: 'Add-on dessert options for your menu.',
    price: 50,
    max_price: 200,
    unit: '30 pax',
  },
  {
    name: 'Pre-Plated Platter',
    description: 'Pre-plated service for your guest count.',
    price: 2500,
    max_price: 5000,
    unit: '30 pax',
  },
  {
    name: 'Serving staff/chef/housekeeping',
    description: 'Chef ₹1,500 · Serving staff ₹2,500 · Housekeeping ₹1,500 (for 30 pax).',
    price: 1500,
    max_price: 2500,
    unit: '30 pax',
  },
  {
    name: 'Cutlery',
    description: 'Serving cutlery & crockery add-on for your event.',
    price: 8000,
    max_price: 15000,
    unit: '30 pax',
  },
  {
    name: 'water bottles',
    description: 'Mineral water bottles.',
    price: 25,
    unit: '30 pax',
  },
  {
    name: 'Grazing Table',
    description:
      'A visually stunning spread of premium cheeses, artisanal breads & global small bites designed to impress. From ₹995 onwards — exact range calculated according to your selection.',
    price: 995,
    unit: '30 pax onwards',
  },
  {
    name: 'Afternoon Hi-tea',
    description:
      'Elegant high-tea with handcrafted beverages, savouries & indulgent desserts perfect for intimate gatherings.',
    price: 1495,
    unit: '30 pax',
  },
  {
    name: 'Buffet & Kitchen Tables',
    description: '5 buffet tables with frill + 2 kitchen tables.',
    price: 2500,
    unit: '30 pax',
  },
];

async function findAddonByName(strapi, name) {
  const rows = await strapi.documents('api::addon.addon').findMany({
    filters: { name: { $eq: name } },
    limit: 1,
  });

  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function ensureCateringAddon(strapi, addonSeed) {
  const existing = await findAddonByName(strapi, addonSeed.name);

  if (existing) {
    const needsUpdate =
      Number(existing.price) !== Number(addonSeed.price) ||
      Number(existing.max_price ?? 0) !== Number(addonSeed.max_price ?? 0) ||
      existing.addon_scope !== 'catering' ||
      String(existing.description ?? '') !== String(addonSeed.description ?? '');

    if (needsUpdate) {
      await strapi.documents('api::addon.addon').update({
        documentId: existing.documentId,
        data: {
          description: addonSeed.description,
          price: addonSeed.price,
          max_price: addonSeed.max_price ?? null,
          unit: addonSeed.unit ?? '',
          addon_scope: 'catering',
          visibility: true,
        },
      });
      return { skipped: false, updated: true, name: addonSeed.name, documentId: existing.documentId };
    }

    return { skipped: true, name: addonSeed.name, documentId: existing.documentId };
  }

  const created = await strapi.documents('api::addon.addon').create({
    data: {
      name: addonSeed.name,
      description: addonSeed.description,
      price: addonSeed.price,
      max_price: addonSeed.max_price ?? null,
      unit: addonSeed.unit ?? '',
      addon_scope: 'catering',
      visibility: true,
      max_quantity: 1,
    },
  });

  return { skipped: false, name: addonSeed.name, documentId: created.documentId };
}

async function seedCateringAddons(strapi) {
  const results = [];

  for (const addonSeed of CATERING_ADDONS) {
    const result = await ensureCateringAddon(strapi, addonSeed);
    results.push(result);
  }

  return { addons: results };
}

module.exports = {
  seedCateringAddons,
  CATERING_ADDONS,
};
