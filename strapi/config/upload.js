'use strict';

const PLACEHOLDER_PATTERN = /^(your_|changeme|replace_me|xxx)/i;

function isConfiguredValue(value) {
  if (value === undefined || value === null) return false;
  const trimmed = String(value).trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_PATTERN.test(trimmed);
}

function isR2Configured(env) {
  return (
    isConfiguredValue(env('R2_ACCOUNT_ID')) &&
    isConfiguredValue(env('R2_ACCESS_KEY_ID')) &&
    isConfiguredValue(env('R2_SECRET_ACCESS_KEY')) &&
    isConfiguredValue(env('R2_BUCKET_NAME'))
  );
}

function buildR2UploadConfig(env) {
  const accountId = env('R2_ACCOUNT_ID');
  const endpoint = env(
    'R2_ENDPOINT',
    accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined
  );

  return {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        baseUrl: env('R2_PUBLIC_URL'),
        rootPath: env('R2_ROOT_PATH', 'uploads'),
        s3Options: {
          endpoint,
          region: env('R2_REGION', 'auto'),
          forcePathStyle: env.bool('R2_FORCE_PATH_STYLE', true),
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY_ID'),
            secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
          },
          params: {
            Bucket: env('R2_BUCKET_NAME'),
            // R2 does not support S3 ACLs. null prevents the provider default (public-read).
            ACL: null,
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  };
}

function buildUploadPluginConfig(env) {
  if (!isR2Configured(env)) {
    if (env('NODE_ENV') !== 'test') {
      console.warn(
        '[upload] R2 env vars missing — using local disk (public/uploads). Set R2_* in .env for Cloudflare R2.'
      );
    }
    return null;
  }

  return buildR2UploadConfig(env);
}

module.exports = {
  isR2Configured,
  buildUploadPluginConfig,
};
