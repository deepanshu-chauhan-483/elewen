'use strict';

/**
 * vendor-service service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::vendor-service.vendor-service');
