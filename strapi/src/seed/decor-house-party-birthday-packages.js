'use strict';

/**
 * Back-compat wrapper: seeds General Pack (Birthday) and House Party catalogs separately.
 */

const { seedDecorGeneralPackPackages } = require('./decor-general-pack-packages');
const { seedDecorHousePartyPackages } = require('./decor-house-party-packages');

async function seedDecorHousePartyBirthdayPackages(strapi) {
  const generalPack = await seedDecorGeneralPackPackages(strapi);
  const houseParty = await seedDecorHousePartyPackages(strapi);

  return {
    packages: [...(generalPack.packages ?? []), ...(houseParty.packages ?? [])],
    eventDocumentId: generalPack.eventDocumentId ?? houseParty.eventDocumentId,
    generalPack,
    houseParty,
  };
}

module.exports = {
  seedDecorHousePartyBirthdayPackages,
  seedDecorGeneralPackPackages,
  seedDecorHousePartyPackages,
};
