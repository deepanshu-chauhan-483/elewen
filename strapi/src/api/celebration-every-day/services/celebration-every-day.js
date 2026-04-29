'use strict';

/**
 * celebration-every-day service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::celebration-every-day.celebration-every-day');
