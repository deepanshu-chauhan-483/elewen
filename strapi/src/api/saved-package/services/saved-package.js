'use strict';

/**
 * saved-package service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::saved-package.saved-package');
