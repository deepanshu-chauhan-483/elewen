'use strict';

module.exports = ({ env }) => ({
  // ─── Cloudinary image uploads ──────────────────────────────────────────────
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
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
