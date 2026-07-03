'use strict';

const r2PublicUrl = process.env.R2_PUBLIC_URL;
const r2MediaSources = [
  'market-assets.strapi.io',
  'https://*.r2.dev',
  'https://*.r2.cloudflarestorage.com',
  'https://res.cloudinary.com',
  'https://*.cloudinary.com',
  ...(r2PublicUrl ? [r2PublicUrl] : []),
];

module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', ...r2MediaSources],
          'media-src': ["'self'", 'data:', 'blob:', ...r2MediaSources],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000').split(',').map(o => o.trim()),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: '500mb',
      jsonLimit: '500mb',
      textLimit: '500mb',
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
