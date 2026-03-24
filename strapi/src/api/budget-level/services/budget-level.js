'use strict';

/**
 * budget-level service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::budget-level.budget-level');
