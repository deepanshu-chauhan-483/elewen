'use strict';

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  // Trust X-Forwarded-* from nginx so rate limits apply per real client IP and
  // ctx.secure reflects the original HTTPS request. Strapi v5 requires the
  // nested `koa` key (a plain boolean here is silently ignored), which left
  // ctx.secure === false behind the TLS-terminating proxy and made
  // koa-session's `secure: true` cookie throw "Cannot send secure cookie over
  // unencrypted connection" on /api/connect/google.
  proxy: {
    koa: env.bool('SERVER_PROXY', true),
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
});
