'use strict';

const { buildSmtpTransportOptions } = require('./email-smtp.js');
const { buildUploadPluginConfig } = require('./upload.js');

module.exports = ({ env }) => {
  const upload = buildUploadPluginConfig(env);

  return {
    ...(upload ? { upload } : {}),

    // Auth rate limit (default Strapi: 5 req / 5 min — too low for OAuth + retries).
    'users-permissions': {
      config: {
        ratelimit: {
          enabled: env.bool(
            'STRAPI_AUTH_RATELIMIT_ENABLED',
            env('NODE_ENV') === 'production'
          ),
          interval: { min: 1 },
          max: env.int('STRAPI_AUTH_RATELIMIT_MAX', 200),
        },
      },
    },

    // ─── Transactional email (forgot-password, email confirmation) ────────────
    email: {
      config: {
        provider: 'nodemailer',
        providerOptions: (() => {
          const smtp = buildSmtpTransportOptions((key, fallback) => env(key, fallback));
          const { host, port, secure, requireTLS, auth } = smtp;
          return { host, port, secure, requireTLS, auth };
        })(),
        settings: {
          defaultFrom: env('SMTP_FROM', 'noreply@elewen.com'),
          defaultReplyTo: env('SMTP_FROM', 'noreply@elewen.com'),
        },
      },
    },
  };
};
