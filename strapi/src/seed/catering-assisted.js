'use strict';

const { buildCateringComponent, seedCateringPackages } = require('./catering-shared');

const ASSISTED_LEVEL_DESCRIPTION =
  'This level caters to people who want good quality food with classic dishes and need waiters to service. Seafood & cutlery is not included in this category of menu.';

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
      {
        title: 'Starters (Choose 6)',
        choose_hint: 'Choose 3+3 or 6 veg',
        category_key: 'starters',
        category_key_extra: 'starters_non_veg',
        row_type: 'choose',
        max_pick: 6,
        veg_pick: 3,
        nonveg_pick: 3,
        sort_order: 1,
      },
      {
        title: 'Main Course (Choose 2)',
        choose_hint: '1+1 or 2 veg',
        category_key: 'main_course_veg',
        category_key_extra: 'main_course_non_veg',
        row_type: 'choose',
        max_pick: 2,
        veg_pick: 1,
        nonveg_pick: 1,
        sort_order: 2,
      },
      {
        title: 'Accompaniments (Rice + Breads)',
        category_key: 'rotis_and_rice',
        row_type: 'included',
        sort_order: 3,
      },
    ],
  },
  {
    title: 'Easy Hosting / Simply Served 2',
    slug: 'easy-hosting-simply-served-2',
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
      {
        title: 'Starters (Choose 8)',
        choose_hint: 'Choose 4+4 or 8 veg',
        category_key: 'starters',
        category_key_extra: 'starters_non_veg',
        row_type: 'choose',
        max_pick: 8,
        veg_pick: 4,
        nonveg_pick: 4,
        sort_order: 1,
      },
      {
        title: 'Main Course (Choose 2)',
        choose_hint: '1+1 or 2 veg',
        category_key: 'main_course_veg',
        category_key_extra: 'main_course_non_veg',
        row_type: 'choose',
        max_pick: 2,
        veg_pick: 1,
        nonveg_pick: 1,
        sort_order: 2,
      },
      {
        title: 'Accompaniments (Rice + Breads)',
        category_key: 'rotis_and_rice',
        row_type: 'included',
        sort_order: 3,
      },
      {
        title: 'Dessert (Choose 1)',
        choose_hint: 'Choose 1',
        category_key: 'dessert',
        row_type: 'choose',
        max_pick: 1,
        sort_order: 4,
      },
    ],
  },
];

function buildAssistedBlock(pkgSeed, policyDocumentId) {
  return buildCateringComponent({
    cateringLevel: 'assisted',
    levelDescription: ASSISTED_LEVEL_DESCRIPTION,
    policyDocumentId,
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
