'use strict';

/** Gmail app passwords are 16 chars; .env often includes spaces from Google's copy format. */
function normalizeGmailAppPassword(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim().replace(/^["']|["']$/g, '');
  if (trimmed.includes(' ')) return trimmed.replace(/\s+/g, '');
  return trimmed;
}

function readEnv(get, key, fallback) {
  const v = get(key);
  return v === undefined || v === null || v === '' ? fallback : v;
}

/**
 * @param {(key: string, fallback?: string) => string} get - strapi env() or (k) => process.env[k]
 */
function buildSmtpTransportOptions(get) {
  const provider = String(readEnv(get, 'SMTP_PROVIDER', 'gmail')).toLowerCase();
  const resendKey = readEnv(get, 'RESEND_API_KEY', '');

  if (provider === 'resend' || resendKey) {
    return {
      provider: 'resend',
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'resend',
        pass: resendKey,
      },
    };
  }

  const port = Number(readEnv(get, 'SMTP_PORT', '587'));
  return {
    provider: 'gmail',
    host: readEnv(get, 'SMTP_HOST', 'smtp.gmail.com'),
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: readEnv(get, 'SMTP_USER', ''),
      pass: normalizeGmailAppPassword(readEnv(get, 'SMTP_PASS', '')),
    },
  };
}

module.exports = {
  normalizeGmailAppPassword,
  buildSmtpTransportOptions,
};
