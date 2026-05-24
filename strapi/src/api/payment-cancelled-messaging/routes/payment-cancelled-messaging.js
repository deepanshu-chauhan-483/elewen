'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::payment-cancelled-messaging.payment-cancelled-messaging');
