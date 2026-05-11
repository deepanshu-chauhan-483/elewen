'use strict';

/**
 * addon router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::addon.addon');
