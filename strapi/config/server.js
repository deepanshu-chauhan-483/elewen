'use strict';

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  // Trust X-Forwarded-For from nginx so rate limits apply per real client IP.
  proxy: env.bool('SERVER_PROXY', true),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
