'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(
  'api::payment-cancelled-messaging.payment-cancelled-messaging'
);
