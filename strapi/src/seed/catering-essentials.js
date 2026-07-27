'use strict';

const { buildCateringComponent, seedCateringPackages, CATERING_POLICY_TITLE } = require('./catering-shared');
const {
  splitStarterRow,
  splitMainRow,
  accompanimentsRows,
  soupRow,
  prePlatedRow,
  dessertRow,
} = require('./catering-menu-items-shared');

const ESSENTIALS_LEVEL_DESCRIPTION =
  'This level caters to people who want good quality food with classic dishes but do not need waiters, cutlery etc. Seafood is not included in this category of menu.';

const ESSENTIALS_INCLUSIONS = [
  { text: 'Raw material' },
  { text: 'Waiters for food service' },
  { text: 'Live cooking setup with tandoor' },
  { text: 'Cooking staff / Chefs' },
];

const ESSENTIALS_EXCLUSIONS = [
  { text: 'Buffet tables' },
  { text: 'Servers / waiters' },
  { text: 'Serving cutlery' },
  { text: 'Soft beverages & ice' },
];

const ESSENTIALS_CLIENT_REQUIREMENTS =
  'Water supply, Electricity points, Serving Cutlery & host to take care of serving the guests, Kitchen tables.';

const ESSENTIALS_NITTY_GRITTY =
  'Final menu and guest count can be customised after booking; prices may vary accordingly.';

const ESSENTIALS_IDEAL_FOR =
  'Ideal for gatherings that do not require formal service or elaborate setups. This package works well when food can be comfortably managed by your house help using your existing home cutlery and serving arrangements.';

const ESSENTIAL_PACKAGES = [
  {
    title: 'Close Circle Catering 1',
    slug: 'close-circle-catering-1',
    base_price: 1100,
    price_per_person_veg: 1100,
    price_per_person_non_veg: 1200,
    internal_package_code: 'Package 1',
    description:
      'Effortless hosting with just the apt amount of food for your intimate gathering with close friends and family. Perfect for home gatherings where you want professionally prepared food without opting for an elaborate existing setup or servers.',
    inclusions: ESSENTIALS_INCLUSIONS,
    exclusions: ESSENTIALS_EXCLUSIONS,
    client_requirements: ESSENTIALS_CLIENT_REQUIREMENTS,
    menu_items: [
      splitStarterRow(4, 1),
      splitMainRow(4, 2),
      ...accompanimentsRows(3),
      dessertRow(1, 5),
    ],
  },
  {
    title: 'Close Circle Catering 2',
    slug: 'close-circle-catering-2',
    base_price: 1500,
    price_per_person_veg: 1500,
    price_per_person_non_veg: 1500,
    internal_package_code: 'Package 2',
    description:
      'Effortless hosting with just the apt amount of food for your intimate gathering with close friends and family. Perfect for home gatherings where you want professionally prepared food without opting for an elaborate existing setup or servers.',
    inclusions: ESSENTIALS_INCLUSIONS,
    exclusions: ESSENTIALS_EXCLUSIONS,
    client_requirements: ESSENTIALS_CLIENT_REQUIREMENTS,
    menu_items: [
      prePlatedRow(1),
      splitStarterRow(6, 2),
      splitMainRow(4, 3),
      ...accompanimentsRows(4),
      dessertRow(2, 6),
    ],
  },
  {
    title: 'Close Circle Catering 3',
    slug: 'close-circle-catering-3',
    base_price: 2000,
    price_per_person_veg: 2000,
    price_per_person_non_veg: 2000,
    internal_package_code: 'Package 3',
    description:
      'Effortless hosting with just the apt amount of food for your intimate gathering with close friends and family. Perfect for home gatherings where you want professionally prepared food without opting for an elaborate existing setup or servers.',
    inclusions: ESSENTIALS_INCLUSIONS,
    exclusions: ESSENTIALS_EXCLUSIONS,
    client_requirements: ESSENTIALS_CLIENT_REQUIREMENTS,
    menu_items: [
      soupRow(1, { title: 'Soup Station (Choose 1)' }),
      prePlatedRow(2),
      splitStarterRow(8, 3),
      splitMainRow(6, 4),
      ...accompanimentsRows(5),
      dessertRow(2, 7),
    ],
  },
];

function buildEssentialsBlock(pkgSeed, policyDocumentId) {
  return buildCateringComponent({
    cateringLevel: 'essentials',
    levelDescription: ESSENTIALS_LEVEL_DESCRIPTION,
    policyDocumentId,
    inclusions: pkgSeed.inclusions,
    exclusions: pkgSeed.exclusions,
    clientRequirements: pkgSeed.client_requirements,
    nittyGritty: ESSENTIALS_NITTY_GRITTY,
    idealFor: ESSENTIALS_IDEAL_FOR,
    internalPackageCode: pkgSeed.internal_package_code,
    pricePerPersonVeg: pkgSeed.price_per_person_veg,
    pricePerPersonNonVeg: pkgSeed.price_per_person_non_veg,
    menuItems: pkgSeed.menu_items,
  });
}

async function seedCateringEssentials(strapi, options = {}) {
  return seedCateringPackages(strapi, ESSENTIAL_PACKAGES, buildEssentialsBlock, options);
}

module.exports = {
  seedCateringEssentials,
  ESSENTIAL_PACKAGES,
  CATERING_POLICY_TITLE,
};
