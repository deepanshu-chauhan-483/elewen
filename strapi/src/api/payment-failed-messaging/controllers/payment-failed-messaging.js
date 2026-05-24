'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::payment-failed-messaging.payment-failed-messaging');
