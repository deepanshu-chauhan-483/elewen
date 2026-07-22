'use strict';

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.resolve(__dirname, '../../../Combined_Delivery_Charges.csv');
const JSON_PATHS = [
  path.resolve(__dirname, 'delivery-charges-data.json'),
  path.resolve(__dirname, '../../../frontend/src/data/deliveryCharges.json'),
];

function parseCsvLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }

  parts.push(current);
  return parts;
}

function parseDeliveryChargeCsv(content) {
  const lines = String(content ?? '')
    .trim()
    .split(/\r?\n/);
  const rows = [];

  for (let index = 1; index < lines.length; index += 1) {
    const parts = parseCsvLine(lines[index]);
    const pincode = String(parts[0] ?? '')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pincode) continue;

    rows.push({
      pincode,
      location: String(parts[1] ?? '').trim(),
      addon_600: Number(parts[2] ?? 0) || 0,
      addon_1200: Number(parts[3] ?? 0) || 0,
      addon_3200: Number(parts[4] ?? 0) || 0,
      is_active: true,
    });
  }

  return rows;
}

function loadDeliveryChargeRows() {
  // Prefer JSON seed (Location sheet) over CSV when present.
  for (const jsonPath of JSON_PATHS) {
    if (!fs.existsSync(jsonPath)) continue;
    const rows = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (Array.isArray(rows) && rows.length > 0) {
      return rows;
    }
  }

  if (fs.existsSync(CSV_PATH)) {
    return parseDeliveryChargeCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  }

  throw new Error(
    `[seed/delivery-charges] No data source found. Expected JSON in strapi/src/seed/delivery-charges-data.json or CSV at ${CSV_PATH}`
  );
}

function shouldRefreshExistingDelivery() {
  return process.env.SEED_DELIVERY_REFRESH_EXISTING === 'true';
}

async function seedDeliveryCharges(strapi, options = {}) {
  const refresh =
    typeof options.refreshExisting === 'boolean'
      ? options.refreshExisting
      : shouldRefreshExistingDelivery();

  const rows = loadDeliveryChargeRows();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  if (!refresh) {
    const existing = await strapi.documents('api::delivery-charge.delivery-charge').findMany({
      status: 'published',
      limit: 1,
    });

    if (Array.isArray(existing) && existing.length > 0) {
      return { skipped: true, created: 0, updated: 0, total: existing.length };
    }
  }

  for (const row of rows) {
    const found = await strapi.documents('api::delivery-charge.delivery-charge').findMany({
      filters: { pincode: { $eq: row.pincode } },
      status: 'published',
      limit: 1,
    });

    const existing = Array.isArray(found) ? found[0] : null;

    if (existing?.documentId) {
      if (!refresh) {
        skipped += 1;
        continue;
      }

      await strapi.documents('api::delivery-charge.delivery-charge').update({
        documentId: existing.documentId,
        data: {
          location: row.location,
          addon_600: row.addon_600,
          addon_1200: row.addon_1200,
          addon_3200: row.addon_3200,
          is_active: row.is_active !== false,
        },
      });
      await strapi.documents('api::delivery-charge.delivery-charge').publish({
        documentId: existing.documentId,
      });
      updated += 1;
      continue;
    }

    const entry = await strapi.documents('api::delivery-charge.delivery-charge').create({
      data: row,
    });

    if (entry?.documentId) {
      await strapi.documents('api::delivery-charge.delivery-charge').publish({
        documentId: entry.documentId,
      });
      created += 1;
    }
  }

  return { skipped: false, created, updated, skippedRows: skipped, total: rows.length };
}

module.exports = {
  loadDeliveryChargeRows,
  parseDeliveryChargeCsv,
  seedDeliveryCharges,
};
