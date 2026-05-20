'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::payment-failed-messaging.payment-failed-messaging');
