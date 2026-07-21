#!/usr/bin/env node
'use strict';

/**
 * Restore Public-role find/findOne permissions for all api::* content types.
 * Local CMS was returning 403 Forbidden on /api/packages, /api/events, etc.
 *
 *   cd strapi && node scripts/repair-public-permissions.cjs
 */
const path = require('node:path');
const Strapi = require('@strapi/strapi');

async function ensurePermission(strapi, roleId, action) {
  const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
    where: { action, role: roleId },
  });
  if (existing) return false;

  await strapi.db.query('plugin::users-permissions.permission').create({
    data: { action, role: roleId },
  });
  return true;
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const app = await Strapi.createStrapi({ appDir }).load();

  try {
    const publicRole = await app.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole?.id) {
      throw new Error('Public role not found');
    }

    const contentTypes = Object.keys(app.contentTypes).filter(uid => uid.startsWith('api::'));
    let created = 0;
    const actions = [];

    for (const uid of contentTypes) {
      const ct = app.contentTypes[uid];
      const kind = ct?.kind;
      if (kind === 'singleType') {
        actions.push(`${uid}.find`);
      } else {
        actions.push(`${uid}.find`, `${uid}.findOne`);
      }
    }

    for (const action of actions) {
      if (await ensurePermission(app, publicRole.id, action)) {
        created += 1;
        console.log(`[repair-public-permissions] granted ${action}`);
      }
    }

    console.log(
      JSON.stringify(
        {
          publicRoleId: publicRole.id,
          contentTypes: contentTypes.length,
          actionsChecked: actions.length,
          permissionsCreated: created,
        },
        null,
        2
      )
    );
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error('[repair-public-permissions] failed:', error);
  process.exit(1);
});
