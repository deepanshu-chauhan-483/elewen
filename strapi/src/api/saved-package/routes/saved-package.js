'use strict';

/**
 * saved-package router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::saved-package.saved-package');
