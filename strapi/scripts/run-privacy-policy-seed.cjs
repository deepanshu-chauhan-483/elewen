'use strict';

const { createStrapi } = require('@strapi/strapi');

async function main() {
  const app = await createStrapi().load();
  app.log.level = 'error';

  try {
    const { seedPrivacyPolicy } = require('../src/seed/privacy-policy');
    const result = await seedPrivacyPolicy(app);
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
