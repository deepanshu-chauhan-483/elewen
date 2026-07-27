'use strict';

const { buildCateringComponent, seedCateringPackages } = require('./catering-shared');
const {
  chooseRow,
  splitStarterRow,
  splitMainRow,
  accompanimentsRows,
  soupRow,
  prePlatedRow,
  raitaRow,
  saladRow,
  liveStationRow,
  dessertRow,
  breadsRow,
  riceRow,
} = require('./catering-menu-items-shared');

const END_TO_END_LEVEL_DESCRIPTION =
  'End-to-end catering where food preparation, live cooking, serving staff, buffet setup, and essential logistics are handled professionally so you can host without managing the kitchen or service.';

const END_TO_END_INCLUSIONS = [
  { text: 'Raw material' },
  { text: 'Tandoor' },
  { text: 'Cooking staff' },
  { text: 'Servers / waiters' },
  { text: 'Serving cutlery & crockery' },
  { text: 'Water supply' },
  { text: 'Chefs' },
  { text: 'Mineral water bottles' },
  { text: 'Buffet tables' },
  { text: 'Kitchen tables' },
  { text: 'Lights for the cooking area' },
];

const END_TO_END_EXCLUSIONS = [
  { text: 'Soft beverages & ice' },
  { text: 'Decor' },
];

const END_TO_END_CLIENT_REQUIREMENTS = 'Water supply, Electricity points.';

const END_TO_END_NITTY_GRITTY =
  'Final menu and guest count can be customised after booking; prices may vary accordingly.';

const END_TO_END_IDEAL_FOR =
  'Ideal for gatherings where everything from cooking to serving and buffet setup is handled professionally.';

const SATVIK_INCLUSIONS = [
  { text: 'Raw material' },
  { text: 'Tandoor' },
  { text: 'Cooking staff' },
  { text: 'Servers / waiters' },
  { text: 'Serving cutlery' },
  { text: 'Water supply' },
];

const SATVIK_EXCLUSIONS = [{ text: 'Decor / furniture' }];

const SATVIK_IDEAL_FOR =
  'Ideal for family gatherings, festive occasions, and celebrations where a wholesome vegetarian menu is preferred.';

const END_TO_END_PACKAGES = [
  {
    title: 'Effortless Hosting',
    slug: 'effortless-hosting',
    base_price: 1495,
    price_per_person_veg: 1495,
    price_per_person_non_veg: 1595,
    internal_package_code: 'Package 1',
    description:
      'Perfect for hosts who want a seamless food experience without managing service or setup.',
    inclusions: END_TO_END_INCLUSIONS,
    exclusions: END_TO_END_EXCLUSIONS,
    client_requirements: END_TO_END_CLIENT_REQUIREMENTS,
    menu_items: [
      soupRow(1, { title: 'Soup (Choose 1)' }),
      splitStarterRow(4, 2),
      splitMainRow(4, 3),
      saladRow(4, 1),
      ...accompanimentsRows(5),
      raitaRow(7, 1),
      dessertRow(1, 8),
    ],
  },
  {
    title: 'Signature Hosting Package',
    slug: 'signature-hosting-package',
    base_price: 1995,
    price_per_person_veg: 1995,
    price_per_person_non_veg: 1995,
    internal_package_code: 'Package 2',
    is_featured: true,
    description: 'Our most popular package for elevated home hosting with a fuller menu spread.',
    inclusions: END_TO_END_INCLUSIONS,
    exclusions: END_TO_END_EXCLUSIONS,
    client_requirements: END_TO_END_CLIENT_REQUIREMENTS,
    menu_items: [
      prePlatedRow(1),
      splitStarterRow(6, 2),
      splitMainRow(4, 3),
      saladRow(4, 1),
      raitaRow(5, 1),
      ...accompanimentsRows(6),
      dessertRow(2, 8),
    ],
  },
  {
    title: 'Signature Hosting 2',
    slug: 'signature-hosting-2',
    base_price: 2295,
    price_per_person_veg: 2295,
    price_per_person_non_veg: 2295,
    internal_package_code: 'Package 3',
    description:
      'A richer signature menu with soup station, expanded starters, mains, and desserts for larger celebrations.',
    inclusions: END_TO_END_INCLUSIONS,
    exclusions: END_TO_END_EXCLUSIONS,
    client_requirements: END_TO_END_CLIENT_REQUIREMENTS,
    menu_items: [
      soupRow(1, { title: 'Soup Station (Choose 1)' }),
      prePlatedRow(2),
      splitStarterRow(8, 3),
      splitMainRow(6, 4),
      saladRow(5, 2),
      raitaRow(6, 1),
      ...accompanimentsRows(7),
      dessertRow(2, 9),
    ],
  },
  {
    title: 'The Full Table Experience',
    slug: 'the-full-table-experience',
    base_price: 2800,
    price_per_person_veg: 2800,
    price_per_person_non_veg: 2800,
    internal_package_code: 'Package 4',
    description:
      'Our most expansive table experience with soup stations, live counter, and a wide chef-curated menu.',
    inclusions: END_TO_END_INCLUSIONS,
    exclusions: END_TO_END_EXCLUSIONS,
    client_requirements: END_TO_END_CLIENT_REQUIREMENTS,
    menu_items: [
      soupRow(1, { title: 'Soup Station (Choose 2)', max_pick: 2 }),
      prePlatedRow(2),
      splitStarterRow(10, 3),
      splitMainRow(6, 4),
      liveStationRow(5, 1),
      saladRow(6, 3),
      raitaRow(7, 1),
      ...accompanimentsRows(8),
      dessertRow(3, 10),
    ],
  },
  {
    title: 'The Social Experience',
    slug: 'the-social-experience',
    base_price: 1795,
    price_per_person_veg: 1795,
    price_per_person_non_veg: 1795,
    internal_package_code: 'Package 5',
    description:
      'Designed for social gatherings with generous starters, paired mains, and a signature dessert finish.',
    inclusions: END_TO_END_INCLUSIONS,
    exclusions: END_TO_END_EXCLUSIONS,
    client_requirements: END_TO_END_CLIENT_REQUIREMENTS,
    menu_items: [
      splitStarterRow(8, 1),
      splitMainRow(2, 2),
      saladRow(3, 1),
      raitaRow(4, 1),
      ...accompanimentsRows(5),
      dessertRow(1, 7),
    ],
  },
  {
    title: 'The Grand Experience',
    slug: 'the-grand-experience',
    base_price: 2595,
    price_per_person_veg: 2595,
    price_per_person_non_veg: 2595,
    internal_package_code: 'Package 6',
    description:
      'A grand celebration menu with curated starters, premium mains, artisan sides, desserts, and a live station.',
    inclusions: END_TO_END_INCLUSIONS,
    exclusions: END_TO_END_EXCLUSIONS,
    client_requirements: END_TO_END_CLIENT_REQUIREMENTS,
    menu_items: [
      soupRow(1, { title: 'Soup (Choose 1)' }),
      splitStarterRow(10, 2),
      splitMainRow(6, 3),
      saladRow(4, 2),
      raitaRow(5, 1),
      ...accompanimentsRows(6),
      dessertRow(3, 8),
      liveStationRow(9, 1),
    ],
  },
  {
    title: 'The Social Starters',
    slug: 'the-social-starters',
    base_price: 1495,
    price_per_person_veg: 1495,
    price_per_person_non_veg: 1495,
    internal_package_code: 'Package 7',
    description:
      'Focused on signature starters with seafood options and a dessert finale—ideal for cocktail-style gatherings.',
    inclusions: END_TO_END_INCLUSIONS,
    exclusions: END_TO_END_EXCLUSIONS,
    client_requirements: END_TO_END_CLIENT_REQUIREMENTS,
    menu_items: [splitStarterRow(8, 1), dessertRow(1, 2)],
  },
  {
    title: 'Purely Satvik',
    slug: 'purely-satvik',
    base_price: 1195,
    price_per_person_veg: 1195,
    price_per_person_non_veg: 1195,
    internal_package_code: 'Package 8',
    description:
      'Pure vegetarian. Crafted for sacred gatherings and rituals with satvik preparations and eggless desserts.',
    inclusions: SATVIK_INCLUSIONS,
    exclusions: SATVIK_EXCLUSIONS,
    client_requirements: END_TO_END_CLIENT_REQUIREMENTS,
    nitty_gritty: END_TO_END_NITTY_GRITTY,
    ideal_for: SATVIK_IDEAL_FOR,
    menu_items: [
      chooseRow({
        title: 'Main Course (Choose 5)',
        category_key: 'main_course_veg',
        max_pick: 5,
        sort_order: 1,
      }),
      {
        title: 'No onion, no garlic preparations (on request)',
        row_type: 'info',
        sort_order: 2,
      },
      riceRow(3, 1),
      saladRow(4, 1),
      raitaRow(5, 1),
      breadsRow(6, 2),
      dessertRow(2, 7),
    ],
  },
];

function buildEndToEndBlock(pkgSeed, policyDocumentId) {
  return buildCateringComponent({
    cateringLevel: 'end_to_end',
    levelDescription: END_TO_END_LEVEL_DESCRIPTION,
    policyDocumentId,
    inclusions: pkgSeed.inclusions,
    exclusions: pkgSeed.exclusions,
    clientRequirements: pkgSeed.client_requirements,
    nittyGritty: pkgSeed.nitty_gritty ?? END_TO_END_NITTY_GRITTY,
    idealFor: pkgSeed.ideal_for ?? END_TO_END_IDEAL_FOR,
    serviceStyleNotes: pkgSeed.service_style_notes,
    internalPackageCode: pkgSeed.internal_package_code,
    pricePerPersonVeg: pkgSeed.price_per_person_veg,
    pricePerPersonNonVeg: pkgSeed.price_per_person_non_veg,
    menuItems: pkgSeed.menu_items,
  });
}

async function seedCateringEndToEnd(strapi, options = {}) {
  return seedCateringPackages(strapi, END_TO_END_PACKAGES, buildEndToEndBlock, options);
}

module.exports = {
  seedCateringEndToEnd,
  END_TO_END_PACKAGES,
};
