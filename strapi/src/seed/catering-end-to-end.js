'use strict';

const { buildCateringComponent, seedCateringPackages } = require('./catering-shared');

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
      {
        title: 'Starters (Choose 2+2) or 4 veg',
        choose_hint: 'Choose 2+2 or 4 veg',
        row_type: 'choose',
        sort_order: 1,
      },
      {
        title: 'Main Course (Choose 2+2) or 4 veg',
        choose_hint: 'Choose 2+2 or 4 veg',
        row_type: 'choose',
        sort_order: 2,
      },
      {
        title: 'Accompaniments (Rice + Breads)',
        row_type: 'included',
        sort_order: 3,
      },
      {
        title: '1 Yoghurt',
        row_type: 'included',
        sort_order: 4,
      },
      {
        title: 'Dessert (Choose 1)',
        row_type: 'choose',
        sort_order: 5,
      },
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
      { title: 'Pre-plated', row_type: 'info', sort_order: 1 },
      {
        title: 'Starters (Choose 3+3) or 6 veg',
        choose_hint: 'Choose 3+3 or 6 veg',
        row_type: 'choose',
        sort_order: 2,
      },
      {
        title: 'Main Course (Choose 2+2) or 4 veg',
        choose_hint: 'Choose 2+2 or 4 veg',
        row_type: 'choose',
        sort_order: 3,
      },
      { title: '1 Salad', row_type: 'included', sort_order: 4 },
      { title: '1 Yoghurt', row_type: 'included', sort_order: 5 },
      {
        title: 'Accompaniments (Rice + Breads)',
        row_type: 'included',
        sort_order: 6,
      },
      {
        title: 'Dessert (Choose 2)',
        row_type: 'choose',
        sort_order: 7,
      },
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
      { title: 'Soup Station 1', row_type: 'included', sort_order: 1 },
      { title: 'Pre-plated', row_type: 'info', sort_order: 2 },
      {
        title: 'Starters (Choose 4+4) or 8 veg',
        choose_hint: 'Choose 4+4 or 8 veg',
        row_type: 'choose',
        sort_order: 3,
      },
      {
        title: 'Main Course (Choose 3+3) or 6 veg',
        choose_hint: 'Choose 3+3 or 6 veg',
        row_type: 'choose',
        sort_order: 4,
      },
      { title: '2 Salad', row_type: 'included', sort_order: 5 },
      { title: '1 Yoghurt', row_type: 'included', sort_order: 6 },
      {
        title: 'Accompaniments (Rice + Breads)',
        row_type: 'included',
        sort_order: 7,
      },
      {
        title: 'Dessert (Choose 2)',
        row_type: 'choose',
        sort_order: 8,
      },
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
      { title: 'Soup Station 2', row_type: 'included', sort_order: 1 },
      { title: 'Pre-plated', row_type: 'info', sort_order: 2 },
      {
        title: 'Starters (Choose 5+5) or 10 veg',
        choose_hint: 'Choose 5+5 or 10 veg',
        row_type: 'choose',
        sort_order: 3,
      },
      {
        title: 'Main Course (Choose 3+3) or 6 veg',
        choose_hint: 'Choose 3+3 or 6 veg',
        row_type: 'choose',
        sort_order: 4,
      },
      { title: '1 Live station', row_type: 'included', sort_order: 5 },
      { title: '3 Salad', row_type: 'included', sort_order: 6 },
      { title: '1 Yoghurt', row_type: 'included', sort_order: 7 },
      {
        title: 'Accompaniments (Rice + Breads)',
        row_type: 'included',
        sort_order: 8,
      },
      {
        title: 'Dessert (Choose 3)',
        row_type: 'choose',
        sort_order: 9,
      },
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
      {
        title: 'Starters (Choose 4+4) or 8 veg',
        choose_hint: 'Choose 4+4 or 8 veg',
        row_type: 'choose',
        sort_order: 1,
      },
      {
        title: 'Main Course (Choose 1+1)',
        choose_hint: 'Choose 1+1',
        row_type: 'choose',
        sort_order: 2,
      },
      {
        title: 'Accompaniments (Rice + Breads)',
        row_type: 'included',
        sort_order: 3,
      },
      { title: '1 Signature dessert', row_type: 'included', sort_order: 4 },
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
      {
        title: '10 curated starters (veg / non-veg)',
        details: 'Includes seafood option',
        row_type: 'choose',
        sort_order: 1,
      },
      {
        title: '6 premium main course selections',
        row_type: 'choose',
        sort_order: 2,
      },
      {
        title: 'Artisan breads, signature rice & curated sides',
        row_type: 'included',
        sort_order: 3,
      },
      {
        title: '3 handcrafted desserts',
        row_type: 'included',
        sort_order: 4,
      },
      { title: '1 Live station', row_type: 'included', sort_order: 5 },
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
    menu_items: [
      {
        title: 'Choice of 8 signature starters (veg / non-veg)',
        details: 'Includes seafood option (fish or prawn)',
        row_type: 'choose',
        sort_order: 1,
      },
      { title: '1 Signature dessert', row_type: 'included', sort_order: 2 },
    ],
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
      { title: '5 Satvik main course creations', row_type: 'included', sort_order: 1 },
      {
        title: 'No onion, no garlic preparations (on request)',
        row_type: 'info',
        sort_order: 2,
      },
      { title: 'Temple-style aromatic rice', row_type: 'included', sort_order: 3 },
      {
        title: 'Fresh salads & house-churned yogurt',
        row_type: 'included',
        sort_order: 4,
      },
      { title: 'Artisan breads', row_type: 'included', sort_order: 5 },
      {
        title: '2 handcrafted eggless desserts',
        row_type: 'included',
        sort_order: 6,
      },
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

async function seedCateringEndToEnd(strapi) {
  return seedCateringPackages(strapi, END_TO_END_PACKAGES, buildEndToEndBlock);
}

module.exports = {
  seedCateringEndToEnd,
  END_TO_END_PACKAGES,
};
