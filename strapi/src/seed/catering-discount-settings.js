'use strict';

const DEFAULT_GUEST_DISCOUNT_TIERS = [
  {
    label: '51 - 75 pax',
    min_pax: 51,
    max_pax: 75,
    discount_per_person: 100,
  },
  {
    label: '76 - 100 pax',
    min_pax: 76,
    max_pax: 100,
    discount_per_person: 200,
  },
  {
    label: '100 - 125 pax',
    min_pax: 100,
    max_pax: 125,
    discount_per_person: 250,
  },
];

async function findPublishedCateringSetting(strapi) {
  const rows = await strapi.documents('api::catering-setting.catering-setting').findMany({
    status: 'published',
    limit: 1,
    populate: { guest_discount_tiers: true },
  });

  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function seedCateringDiscountSettings(strapi) {
  const payload = {
    is_active: true,
    discount_title: 'Guest count discounts',
    discount_note:
      'Per-person discount off the catering package rate based on guest count selected at booking.',
    guest_discount_tiers: DEFAULT_GUEST_DISCOUNT_TIERS,
  };

  const existing = await findPublishedCateringSetting(strapi);

  if (existing?.documentId) {
    await strapi.documents('api::catering-setting.catering-setting').update({
      documentId: existing.documentId,
      data: payload,
    });
    const published = await strapi.documents('api::catering-setting.catering-setting').publish({
      documentId: existing.documentId,
    });
    return {
      updated: true,
      documentId: existing.documentId,
      entry: published?.entries?.[0] ?? existing,
    };
  }

  const draft = await strapi.documents('api::catering-setting.catering-setting').findMany({
    status: 'draft',
    limit: 1,
  });

  if (Array.isArray(draft) && draft[0]?.documentId) {
    await strapi.documents('api::catering-setting.catering-setting').update({
      documentId: draft[0].documentId,
      data: payload,
    });
    const published = await strapi.documents('api::catering-setting.catering-setting').publish({
      documentId: draft[0].documentId,
    });
    return {
      updated: true,
      documentId: draft[0].documentId,
      entry: published?.entries?.[0] ?? draft[0],
    };
  }

  const created = await strapi.documents('api::catering-setting.catering-setting').create({
    data: payload,
    status: 'published',
  });

  return { created: true, documentId: created.documentId, entry: created };
}

module.exports = {
  seedCateringDiscountSettings,
  DEFAULT_GUEST_DISCOUNT_TIERS,
};
