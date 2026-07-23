'use strict';

/**
 * Bartending shared add-ons. Attached to bartending packages via addon_scope=bartending
 * in the package API controller.
 */

const BARTENDING_ADDONS = [
  {
    name: 'Pack of 12 wine glasses',
    description: 'Set of 12 wine glasses for your bar service.',
    price: 0,
    unit: 'pack',
  },
  {
    name: 'Pack of 12 cocktail glasses',
    description: 'Set of 12 cocktail glasses for your bar service.',
    price: 0,
    unit: 'pack',
  },
  {
    name: 'Pack of 12 whiskey glasses',
    description: 'Set of 12 whiskey glasses for your bar service.',
    price: 0,
    unit: 'pack',
  },
  {
    name: 'Pack of 12 mocktail glasses',
    description: 'Set of 12 mocktail glasses for your bar service.',
    price: 0,
    unit: 'pack',
  },
  {
    name: 'Want the bartender to get ingredients?',
    description: 'Bartender sourcing support. Cost of ingredients — on actuals.',
    price: 700,
    unit: 'service',
  },
  {
    name: 'Basic Bar set up',
    description: 'Basic organized bar station setup for your event.',
    price: 0,
    unit: 'setup',
  },
  {
    name: 'Bar set up',
    description: 'Full bar station setup for your event.',
    price: 0,
    unit: 'setup',
  },
  {
    name: 'Molecular Bar',
    description: 'Molecular cocktail experience add-on for exclusive bartending packages.',
    price: 0,
    unit: 'setup',
  },
];

async function findAddonByName(strapi, name) {
  const rows = await strapi.documents('api::addon.addon').findMany({
    filters: { name: { $eq: name } },
    limit: 1,
  });

  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function ensureBartendingAddon(strapi, addonSeed) {
  const existing = await findAddonByName(strapi, addonSeed.name);

  if (existing) {
    const needsUpdate =
      Number(existing.price) !== Number(addonSeed.price) ||
      Number(existing.max_price ?? 0) !== Number(addonSeed.max_price ?? 0) ||
      existing.addon_scope !== 'bartending' ||
      String(existing.description ?? '') !== String(addonSeed.description ?? '') ||
      String(existing.unit ?? '') !== String(addonSeed.unit ?? '');

    if (needsUpdate) {
      await strapi.documents('api::addon.addon').update({
        documentId: existing.documentId,
        data: {
          description: addonSeed.description,
          price: addonSeed.price,
          max_price: addonSeed.max_price ?? null,
          unit: addonSeed.unit ?? '',
          addon_scope: 'bartending',
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
      addon_scope: 'bartending',
      visibility: true,
      max_quantity: 1,
    },
    status: 'published',
  });

  return { skipped: false, updated: false, name: addonSeed.name, documentId: created.documentId };
}

async function seedBartendingAddons(strapi) {
  const results = [];
  for (const addonSeed of BARTENDING_ADDONS) {
    results.push(await ensureBartendingAddon(strapi, addonSeed));
  }

  const created = results.filter(item => !item.skipped && !item.updated);
  const updated = results.filter(item => item.updated);
  const skipped = results.filter(item => item.skipped);

  strapi.log.info(
    `[seed/bartending-addons] created=${created.length}, updated=${updated.length}, skipped=${skipped.length}`
  );

  return { created, updated, skipped, results };
}

module.exports = {
  BARTENDING_ADDONS,
  seedBartendingAddons,
};
