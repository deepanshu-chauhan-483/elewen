'use strict';

module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      accessTokenLifespan: env.int('STRAPI_ADMIN_ACCESS_TOKEN_LIFESPAN', 30 * 60),
      maxRefreshTokenLifespan: env.int(
        'STRAPI_ADMIN_MAX_REFRESH_TOKEN_LIFESPAN',
        30 * 24 * 60 * 60
      ),
      idleRefreshTokenLifespan: env.int(
        'STRAPI_ADMIN_IDLE_REFRESH_TOKEN_LIFESPAN',
        7 * 24 * 60 * 60
      ),
      maxSessionLifespan: env.int('STRAPI_ADMIN_MAX_SESSION_LIFESPAN', 7 * 24 * 60 * 60),
      idleSessionLifespan: env.int('STRAPI_ADMIN_IDLE_SESSION_LIFESPAN', 60 * 60),
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
