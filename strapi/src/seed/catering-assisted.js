'use strict';

const { buildCateringComponent, seedCateringPackages } = require('./catering-shared');
const {
  splitStarterRow,
  splitMainRow,
  accompanimentsRows,
  raitaRow,
  saladRow,
  dessertRow,
} = require('./catering-menu-items-shared');

const ASSISTED_LEVEL_DESCRIPTION =
  'This level caters to people who want good quality food with classic dishes and need waiters to SERVE. Sea food and DINING cutlery not included in this category of menu.';

const ASSISTED_INCLUSIONS = [
  { text: 'Raw material' },
  { text: 'Waiters for food service' },
  { text: 'Live cooking setup with tandoor' },
  { text: 'Cooking staff / Chefs' },
];

const ASSISTED_NITTY_GRITTY =
  'Final menu and guest count can be customised after booking; prices may vary accordingly.';

const ASSISTED_IDEAL_FOR =
  'Ideal for close gatherings where you want the ease of professional catering along with serving staff, allowing you to host comfortably without depending on house help.';

const ASSISTED_PACKAGES = [
  {
    title: 'Easy Hosting / Simply Served 1',
    slug: 'easy-hosting-simply-served-1',
    budget_level_slug: 'level-1',
    base_price: 1700,
    price_per_person_veg: 1700,
    price_per_person_non_veg: 1700,
    internal_package_code: 'Package 1',
    service_style_notes: 'Price includes cost of serving staff.',
    description:
      'A convenient catering package for intimate gatherings where you want quality food and dedicated serving staff, so you can spend time with your guests instead of managing service.',
    inclusions: ASSISTED_INCLUSIONS,
    exclusions: [
      { text: 'Buffet tables' },
      { text: 'Serving cutlery' },
      { text: 'Water supply' },
      { text: 'Soft beverages & ice' },
    ],
    client_requirements:
      'Water supply, Electricity points, Serving Cutlery, Kitchen Tables.',
    menu_items: [
      splitStarterRow(6, 1),
      splitMainRow(2, 2),
      ...accompanimentsRows(3),
    ],
  },
  {
    title: 'Easy Hosting / Simply Served 2',
    slug: 'easy-hosting-simply-served-2',
    budget_level_slug: 'level-2',
    base_price: 2000,
    price_per_person_veg: 2000,
    price_per_person_non_veg: 2000,
    internal_package_code: 'Package 2',
    service_style_notes: 'Price includes cost of serving staff.',
    description:
      'A convenient catering package for intimate gatherings where you want quality food and dedicated serving staff, so you can spend time with your guests instead of managing service.',
    inclusions: ASSISTED_INCLUSIONS,
    exclusions: [
      { text: 'Buffet tables' },
      { text: 'Serving cutlery' },
      { text: 'Water supply' },
      { text: 'Kitchen tables' },
      { text: 'Electricity points' },
    ],
    client_requirements: 'Water supply, Electricity points, Serving Cutlery.',
    menu_items: [
      splitStarterRow(8, 1),
      splitMainRow(2, 2),
      saladRow(3, 1),
      raitaRow(4, 1),
      ...accompanimentsRows(5),
      dessertRow(1, 7),
    ],
  },
];

function buildAssistedBlock(pkgSeed, policyDocumentId, budgetLevelDocumentId) {
  return buildCateringComponent({
    cateringLevel: 'assisted',
    levelDescription: ASSISTED_LEVEL_DESCRIPTION,
    policyDocumentId,
    budgetLevelDocumentId,
    inclusions: pkgSeed.inclusions,
    exclusions: pkgSeed.exclusions,
    clientRequirements: pkgSeed.client_requirements,
    nittyGritty: ASSISTED_NITTY_GRITTY,
    idealFor: ASSISTED_IDEAL_FOR,
    serviceStyleNotes: pkgSeed.service_style_notes,
    internalPackageCode: pkgSeed.internal_package_code,
    pricePerPersonVeg: pkgSeed.price_per_person_veg,
    pricePerPersonNonVeg: pkgSeed.price_per_person_non_veg,
    menuItems: pkgSeed.menu_items,
  });
}

async function seedCateringAssisted(strapi, options = {}) {
  return seedCateringPackages(strapi, ASSISTED_PACKAGES, buildAssistedBlock, options);
}

module.exports = {
  seedCateringAssisted,
  ASSISTED_PACKAGES,
};
