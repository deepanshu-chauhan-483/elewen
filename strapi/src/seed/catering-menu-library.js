'use strict';

const { CATERING_MENU_CATEGORIES } = require('./catering-menu-data');

async function seedCateringMenuLibrary(strapi) {
  const existing = await strapi.documents('api::catering-menu.catering-menu').findMany({
    status: 'published',
    limit: 1,
    populate: { categories: { populate: { dishes: true } } },
  });

  const payload = {
    title: 'Catering menu library',
    categories: CATERING_MENU_CATEGORIES,
  };

  if (Array.isArray(existing) && existing[0]) {
    const updated = await strapi.documents('api::catering-menu.catering-menu').update({
      documentId: existing[0].documentId,
      data: payload,
      status: 'published',
    });
    return { documentId: existing[0].documentId, created: false, updated: true, entry: updated };
  }

  const draft = await strapi.documents('api::catering-menu.catering-menu').findMany({
    status: 'draft',
    limit: 1,
  });

  if (Array.isArray(draft) && draft[0]) {
    await strapi.documents('api::catering-menu.catering-menu').update({
      documentId: draft[0].documentId,
      data: payload,
      status: 'published',
    });
    const published = await strapi.documents('api::catering-menu.catering-menu').publish({
      documentId: draft[0].documentId,
    });
    return {
      documentId: draft[0].documentId,
      created: false,
      updated: true,
      entry: published?.entries?.[0] ?? draft[0],
    };
  }

  const created = await strapi.documents('api::catering-menu.catering-menu').create({
    data: payload,
    status: 'published',
  });

  return { documentId: created.documentId, created: true, updated: false, entry: created };
}

module.exports = { seedCateringMenuLibrary, CATERING_MENU_CATEGORIES };
