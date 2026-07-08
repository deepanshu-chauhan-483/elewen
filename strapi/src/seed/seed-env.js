'use strict';

/**
 * Production: seeds run only when ENV=true (opt-in, one-shot or boot).
 * Development: seeds run unless ENV=false (opt-out).
 */
function isSeedEnabled(envName) {
  const value = process.env[envName];
  if (process.env.NODE_ENV === 'production') {
    return value === 'true';
  }
  return value !== 'false';
}

/** Sync decor text/pricing on packages that already have a decor block. Never touches images. */
function shouldRefreshExistingDecor() {
  return process.env.SEED_DECOR_REFRESH_EXISTING === 'true';
}

module.exports = {
  isSeedEnabled,
  shouldRefreshExistingDecor,
};
