#!/usr/bin/env node
'use strict';

/**
 * Link sheesha hookah packages to Social + Corporate events via Strapi REST API.
 *
 * Usage (from repo root or strapi/):
 *   node strapi/scripts/link-sheesha-events-via-api.cjs
 *
 * Requires:
 *   STRAPI_URL or PUBLIC_STRAPI_URL (default https://strapi.elewen.co.in)
 *   STRAPI_API_TOKEN (full-access API token)
 *
 * Loads tokens from repo-root `.env` / `api/.env` when present.
 */

const fs = require('node:fs');
const path = require('node:path');

const SHEESHA_PACKAGE_SLUGS = [
  'basic-indian-hookah',
  'premium-indian-hookah',
  'basic-turkish-hookah',
  'premium-turkish-hookah',
];

const ALLOWED_PARENT_CATEGORY_SLUGS = new Set(['social', 'corporate']);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function resolveBaseUrl() {
  return (
    process.env.STRAPI_CONTENT_URL ||
    process.env.PUBLIC_STRAPI_URL ||
    process.env.STRAPI_URL ||
    'https://strapi.elewen.co.in'
  ).replace(/\/$/, '');
}

async function api(pathname, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${resolveBaseUrl()}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const message = json?.error?.message || json?.raw || response.statusText;
    throw new Error(`${method} ${pathname} -> ${response.status}: ${message}`);
  }

  return json;
}

async function main() {
  const root = path.resolve(__dirname, '../..');
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, 'api', '.env'));
  loadEnvFile(path.join(root, 'strapi', '.env'));

  const token = process.env.STRAPI_API_TOKEN;
  if (!token) {
    throw new Error('STRAPI_API_TOKEN is required');
  }

  console.log(`[link-sheesha-events] base=${resolveBaseUrl()}`);

  const eventsRes = await api(
    '/api/events?filters[is_active][$eq]=true&populate[parent_event][fields][0]=slug&pagination[pageSize]=100',
    { token }
  );

  const eventDocumentIds = (eventsRes.data || [])
    .filter(event =>
      ALLOWED_PARENT_CATEGORY_SLUGS.has(
        String(event?.parent_event?.slug ?? '')
          .trim()
          .toLowerCase()
      )
    )
    .map(event => event.documentId)
    .filter(Boolean);

  if (!eventDocumentIds.length) {
    throw new Error('No social/corporate events found');
  }

  console.log(`[link-sheesha-events] events=${eventDocumentIds.length}`);

  for (const slug of SHEESHA_PACKAGE_SLUGS) {
    const found = await api(
      `/api/packages?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`,
      { token }
    );
    const entry = found?.data?.[0];
    if (!entry?.documentId) {
      console.warn(`[link-sheesha-events] missing package slug=${slug}`);
      continue;
    }

    await api(`/api/packages/${entry.documentId}`, {
      method: 'PUT',
      token,
      body: {
        data: {
          events: {
            set: eventDocumentIds.map(documentId => ({ documentId })),
          },
        },
      },
    });

    console.log(`[link-sheesha-events] linked ${slug} -> ${eventDocumentIds.length} events`);
  }

  console.log('[link-sheesha-events] done');
}

main().catch(error => {
  console.error('[link-sheesha-events] failed:', error.message || error);
  process.exit(1);
});
