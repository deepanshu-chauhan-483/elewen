'use strict';

/**
 * vendor-service router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::vendor-service.vendor-service');
