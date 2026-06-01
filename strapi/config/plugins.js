'use strict';

module.exports = ({ env }) => ({
  // Cloudflare R2 image uploads.
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        baseUrl: env('R2_PUBLIC_URL'),
        rootPath: env('R2_ROOT_PATH', 'uploads'),
        s3Options: {
          endpoint: env('R2_ENDPOINT', `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`),
          region: env('R2_REGION', 'auto'),
          forcePathStyle: env.bool('R2_FORCE_PATH_STYLE', true),
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY_ID'),
            secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
          },
          params: {
            Bucket: env('R2_BUCKET_NAME'),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },

  // ─── Transactional email (forgot-password, email confirmation) ────────────
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env.int('SMTP_PORT', 587),
        secure: false,             // true for port 465, false for 587
        auth: {
          user: env('SMTP_USER'),
          pass: env('SMTP_PASS'), // Gmail: use an App Password, not your account password
        },
      },
      settings: {
        defaultFrom: env('SMTP_FROM', 'noreply@elewen.com'),
        defaultReplyTo: env('SMTP_FROM', 'noreply@elewen.com'),
      },
    },
  },
});
