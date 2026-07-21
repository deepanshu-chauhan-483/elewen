'use strict';

const { createStrapi } = require('@strapi/strapi');

async function main() {
  const app = await createStrapi().load();
  app.log.level = 'error';

  try {
    const { seedTermsAndConditions } = require('../src/seed/terms-and-conditions');
    const result = await seedTermsAndConditions(app);
    console.log(
      JSON.stringify({
        ok: true,
        documentId: result.documentId,
        created: Boolean(result.created),
        updated: Boolean(result.updated),
      })
    );
  } finally {
    await app.destroy();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
