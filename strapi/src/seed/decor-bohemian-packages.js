'use strict';

const {
  ensureBudgetLevelDocumentId,
  ensureEventDocumentId,
  ensureThemeDocumentId,
  seedDecorPackages,
} = require('./decor-proposal-shared');

const EVENT_SLUG_CANDIDATES = [
  'birthday-parties',
  'birthday-celebrations',
  'birthday',
  'birthday-party',
];

function choiceOption(groupKey, label, optionTitle, options = {}) {
  const row = {
    is_choice_group: true,
    choice_group_key: groupKey,
    choice_group_label: label,
    group_title: label,
    text: optionTitle,
  };

  if (options.amount != null) {
    row._choice_amount = options.amount;
  }

  return row;
}

function whenInclusion(parentKey, parentValue, text) {
  return {
    text,
    group_title: `when:${parentKey}:${parentValue}`,
  };
}

const SIGNS_STEMS_DESCRIPTION =
  'Create an immediate sense of warmth from the moment your guests arrive. The Sign & Stem package blends wooden textures with organic florals to set a soulful, bohemian tone for your gathering. A minimalist approach that will never lead you astray.';

const SIGNS_STEMS_NITTY =
  'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.';

const SIGNS_STEMS_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'Professional Setup' },
  { text: 'Final Dismantling' },
  { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
  { text: 'No hidden service fees.' },
];

const SIGNS_STEMS_SETUP =
  'A small area for our team to work, access to water and electricity.';

const SIGNS_STEMS_WHY =
  'It serves as the primary "hello," bridging the gap between the exterior world and the curated atmosphere of your event.';

const PAMPOUS_SIMPLE_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'No hidden service fees.' },
];

const BOHEMIAN_PACKAGES = [
  {
    sheet: 'FL 1',
    title: 'Signs & Stems 1',
    slug: 'signs-and-stems-1',
    theme_name: 'Signs & Stems',
    budget_level_slug: 'level-1',
    base_price: 6980,
    description: SIGNS_STEMS_DESCRIPTION,
    key_decor_elements: SIGNS_STEMS_DESCRIPTION,
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at: '',
    why_we_love_it: SIGNS_STEMS_WHY,
    theme_slug_candidates: ['signs-and-stems', 'bohemian'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
    price_breakdown: [
      { label: 'Entry Sign board', amount: 900 },
      { label: 'Entry Stand', amount: 400 },
      { label: 'Flower Set up on entry', amount: 1000 },
      { label: 'Wooden Coaster', amount: 500 },
      { label: 'Vase', amount: 1000 },
      { label: 'Bunch of flowers', amount: 2000 },
      { label: 'Platform fee', amount: 580 },
      { label: 'Transportation and Labour Cost', amount: 600 },
    ],
    inclustions: [
      { text: '1 entry Easel', group_title: 'Entry setup' },
      { text: '1 entry board', group_title: 'Entry setup' },
      { text: 'Complete flower decor (using real flowers)', group_title: 'Entry setup' },
      { text: '5 wooden coasters', group_title: 'Centrepieces' },
      { text: '5 vases with 5 bunches of real flowers', group_title: 'Centrepieces' },
    ],
  },
  {
    sheet: 'FL2',
    title: 'Signs & Stems 2',
    slug: 'signs-and-stems-2',
    theme_name: 'Signs & Stems',
    budget_level_slug: 'level-2',
    base_price: 9070,
    description: SIGNS_STEMS_DESCRIPTION,
    key_decor_elements: SIGNS_STEMS_DESCRIPTION,
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at: '',
    why_we_love_it: SIGNS_STEMS_WHY,
    theme_slug_candidates: ['signs-and-stems', 'bohemian'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
    price_breakdown: [
      { label: 'Entry Sign board', amount: 900 },
      { label: 'Entry Stand', amount: 400 },
      { label: 'Flower Set up on entry', amount: 1000 },
      { label: 'Wooden Coaster', amount: 500 },
      { label: 'Vase', amount: 1000 },
      { label: 'Bunch of flowers', amount: 3900 },
      { label: 'Platform fee', amount: 770 },
      { label: 'Transportation and Labour Cost', amount: 600 },
    ],
    inclustions: [
      { text: '1 entry Easel', group_title: 'Entry setup' },
      { text: '1 entry board', group_title: 'Entry setup' },
      { text: 'Complete flower decor (using real flowers)', group_title: 'Entry setup' },
      { text: '6 wooden coasters', group_title: 'Centrepieces' },
      { text: '3 vases with 3 bunches of real flowers', group_title: 'Centrepieces' },
      { text: '3 Floral arrangements with candle stands', group_title: 'Centrepieces' },
    ],
  },
  {
    sheet: 'FL 3',
    title: 'Signs & Stems 3',
    slug: 'signs-and-stems-3',
    theme_name: 'Signs & Stems',
    budget_level_slug: 'level-3',
    base_price: 12200,
    description: SIGNS_STEMS_DESCRIPTION,
    key_decor_elements: SIGNS_STEMS_DESCRIPTION,
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at: '',
    why_we_love_it: SIGNS_STEMS_WHY,
    theme_slug_candidates: ['signs-and-stems', 'bohemian'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
    price_breakdown: [
      { label: 'Entry Mirror + candles', amount: 4500 },
      { label: 'Pampous', amount: 1000 },
      { label: 'Glass candle holders with candles', amount: 4500 },
      { label: 'Platform fee', amount: 1000 },
      { label: 'Transportation and Labour Cost', amount: 1200 },
    ],
    inclustions: [
      { text: '1 Engraved mirror', group_title: 'Entry setup' },
      { text: '10 glass candle holders with tealights', group_title: 'Entry setup' },
      {
        text: 'Complete flower decor with disco balls (using real flowers)',
        group_title: 'Entry setup',
      },
      { text: '6 wooden coasters', group_title: 'Centrepieces' },
      { text: '3 vases with 3 bunches of real flowers', group_title: 'Centrepieces' },
      { text: '3 Floral arrangements with candle stands', group_title: 'Centrepieces' },
    ],
  },
  {
    sheet: 'PP 2',
    title: 'Pampous Play 1',
    slug: 'pampous-play-2',
    theme_name: 'Pampous Play',
    budget_level_slug: 'level-1',
    base_price: 8300,
    description:
      'Elegant floral décor set featuring a decorative vase arrangement, and a matching floor standee, designed to add a sophisticated and stylish touch to any celebration.',
    key_decor_elements:
      'Elegant floral décor set featuring a decorative vase arrangement, and a matching floor standee, designed to add a sophisticated and stylish touch to any celebration.',
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at: '',
    why_we_love_it: SIGNS_STEMS_WHY,
    theme_slug_candidates: ['bohemian', 'pampous-play'],
    price_covers: PAMPOUS_SIMPLE_PRICE_COVERS,
    price_breakdown: [
      { label: 'Centrepieces 5 / Vase / Bunch of flowers', amount: 3500 },
      { label: 'Floor Standee with Flower arrangement', amount: 3500 },
      { label: 'Platform fee', amount: 700 },
      { label: 'Transportation and Labour Cost', amount: 600 },
    ],
    inclustions: [
      { text: '5 bunches of flowers in Vases', group_title: 'Centrepieces' },
      { text: '4 metal standees with florals', group_title: 'Standees' },
    ],
  },
  {
    sheet: 'PP 3',
    title: 'Pampous Play 2',
    slug: 'pampous-play-3',
    theme_name: 'Pampous Play',
    budget_level_slug: 'level-2',
    base_price: 13740,
    description:
      'Elegant floral décor set featuring a decorative floor standee and a statement backdrop of fresh flowers, designed to add a sophisticated and stylish touch to any celebration.',
    key_decor_elements:
      'Elegant floral décor set featuring a decorative floor standee and a statement backdrop of fresh flowers, designed to add a sophisticated and stylish touch to any celebration.',
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at: '',
    why_we_love_it: SIGNS_STEMS_WHY,
    theme_slug_candidates: ['bohemian', 'pampous-play'],
    price_covers: PAMPOUS_SIMPLE_PRICE_COVERS,
    price_breakdown: [
      { label: 'Backdrop', amount: 9000 },
      { label: 'Floor Standee', amount: 2400 },
      { label: 'Platform fee', amount: 1140 },
      { label: 'Transportation and Labour Cost', amount: 1200 },
    ],
    inclustions: [
      { text: '1 floral ring Backdrop', group_title: 'Backdrop' },
      { text: '1 Custom Neon sign', group_title: 'Backdrop' },
      { text: '4 metal standees with florals', group_title: 'Standees' },
    ],
  },
  {
    sheet: 'PP3',
    title: 'Pampous Play 3',
    slug: 'less-is-more-3',
    theme_name: 'Pampous Play',
    budget_level_slug: 'level-3',
    base_price: 19020,
    description:
      'This comprehensive package offers a seamless, high-end look for your celebration, taking the stress out of styling. By combining your entrance statement, aisle styling, and main focal point, we create a cohesive, luxury environment using premium, real pampas textures.',
    key_decor_elements:
      'This comprehensive package offers a seamless, high-end look for your celebration, taking the stress out of styling. By combining your entrance statement, aisle styling, and main focal point, we create a cohesive, luxury environment using premium, real pampas textures.',
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at: '',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'pampous-play', 'less-is-more'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
    price_breakdown: [
      { label: 'Happy birthday Backdrop', amount: 7000 },
      { label: 'Real Pampus flowers decor', amount: 4500 },
      { label: '1 Easel', amount: 400 },
      { label: '1 signboard with Pampus decor', amount: 1900 },
      { label: '4 Pampus Standees', amount: 2400 },
      { label: 'Platform fee', amount: 1620 },
      { label: 'Transportation and Labour Cost', amount: 1200 },
    ],
    inclustions: [
      { text: 'Happy birthday Backdrop', group_title: 'The Backdrop' },
      { text: 'Real Pampus flowers decor', group_title: 'The Backdrop' },
      { text: '1 Easel', group_title: 'Entrance' },
      { text: '1 signboard with Pampus decor', group_title: 'Entrance' },
      { text: '4 Pampus Standees', group_title: 'Floral Accents' },
    ],
  },
  {
    sheet: 'Perch 1',
    title: 'Perch & Pour 1',
    slug: 'perch-and-pour-1',
    theme_name: 'Perch & Pour',
    budget_level_slug: 'level-1',
    base_price: 19700,
    description: 'Elevate your hosting ritual with the Perch and Pour collection.',
    key_decor_elements: 'Elevate your hosting ritual with the Perch and Pour collection.',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: '',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'perch-and-pour'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: '1 Wooden Bar', amount: 12000 },
      { label: '3 Cocktail Tables', amount: 3000 },
      { label: 'Platform fee', amount: 1500 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Wooden bar', group_title: 'Includes' },
      { text: '4 cocktail tables', group_title: 'Includes' },
      { text: 'Custom bar menu', group_title: 'Includes' },
      { text: 'Bar neon sign', group_title: 'Includes' },
    ],
  },
  {
    sheet: 'Perch 2',
    title: 'Perch & Pour 2',
    slug: 'perch-and-pour-2',
    theme_name: 'Perch & Pour',
    budget_level_slug: 'level-2',
    base_price: 18050,
    description: 'Elevate your hosting ritual with the Perch and Pour collection.',
    key_decor_elements: 'Elevate your hosting ritual with the Perch and Pour collection.',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: 'Nestled under a large tree or on a manicured lawn to create an outdoor "living room.',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'perch-and-pour'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: '1 Sofa', amount: 3000 },
      { label: '2 Chairs', amount: 2500 },
      { label: '1 coffee table', amount: 1500 },
      { label: '2 puffies', amount: 1000 },
      { label: 'Bar', amount: 2500 },
      { label: '3 Cocktail Tables', amount: 3000 },
      { label: 'Platform fee', amount: 1350 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Cane lounge seating', group_title: 'Includes' },
      { text: 'Basic bar + menu', group_title: 'Includes' },
      { text: '3 cocktail tables', group_title: 'Includes' },
      { text: 'Bar neon sign', group_title: 'Includes' },
    ],
  },
  {
    sheet: 'Perch 3',
    title: 'Perch & Pour 3',
    slug: 'perch-and-pour-3',
    theme_name: 'Perch & Pour',
    budget_level_slug: 'level-3',
    base_price: 31470,
    description: 'Elevate your hosting ritual with the Perch and Pour collection.',
    key_decor_elements: 'Elevate your hosting ritual with the Perch and Pour collection.',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: 'Nestled under a large tree or on a manicured lawn to create an outdoor "living room.',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'perch-and-pour'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: '1 sofa', amount: 3000 },
      { label: '2 Chairs', amount: 2500 },
      { label: '1 table', amount: 1500 },
      { label: '1 carpet under table', amount: 1000 },
      { label: '2 Flower arrangements in vases', amount: 1700 },
      { label: 'Cushions- 4', amount: 2000 },
      { label: 'Bar setup with bar menu', amount: 10000 },
      { label: '2 Cocktail Tables', amount: 4000 },
      { label: 'Platform fee', amount: 2570 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Cane lounge seating', group_title: 'Includes' },
      { text: 'Round table + carpet', group_title: 'Includes' },
      { text: 'Wooden bar with florals', group_title: 'Includes' },
      { text: '2 cocktail tables', group_title: 'Includes' },
      { text: '2 flower vases', group_title: 'Includes' },
    ],
  },
  {
    sheet: 'EH 2',
    title: 'Cozy Canopy 2',
    slug: 'cozy-canopy-2',
    theme_name: 'Cozy Canopy',
    budget_level_slug: 'level-2',
    base_price: 23220,
    description: 'Cozy Canopy seating complete with Rattan accents and dreamy bohemian touches.',
    key_decor_elements: 'Cozy Canopy seating complete with Rattan accents and dreamy bohemian touches.',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: '',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'cozy-canopy'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: '1 Mattress', amount: 500 },
      { label: '1 Bedsheet', amount: 200 },
      { label: '1 Wooden Frame', amount: 6000 },
      { label: 'DreamCatcher Hanging', amount: 500 },
      { label: '2 low puffies', amount: 1000 },
      { label: 'Cusions', amount: 2000 },
      { label: '2 Rattan Stools', amount: 4000 },
      { label: '10 Candles in glass holders', amount: 2000 },
      { label: '2 Floral Centrepieces', amount: 2000 },
      { label: 'Platform fee', amount: 1820 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Wooden canopy frame', group_title: 'Includes' },
      { text: 'Bedsheet + mattress', group_title: 'Includes' },
      { text: 'Dreamcatcher hanging', group_title: 'Includes' },
      { text: '2 low puffies', group_title: 'Includes' },
      { text: 'Cushions', group_title: 'Includes' },
      { text: '2 rattan stools', group_title: 'Includes' },
    ],
  },
  {
    sheet: 'PIC 2',
    title: 'Picnic a la Boho 2',
    slug: 'picnic-a-la-boho-2',
    theme_name: 'Picnic a la Boho',
    budget_level_slug: 'level-2',
    base_price: 30700,
    description: 'An end to end, all you need to throw a dreamy brunch. Complete with full table ensemble and themed backdrop, this package is all rady to get added to your cart.',
    key_decor_elements: 'An end to end, all you need to throw a dreamy brunch. Complete with full table ensemble and themed backdrop, this package is all rady to get added to your cart.',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: 'Nestled under a large tree or on a manicured lawn to create an outdoor "living room.',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'picnic-a-la-boho'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: 'Mattress', amount: 1000 },
      { label: 'Sheet/ Carpet covering', amount: 2000 },
      { label: 'Long Table- 8 seater', amount: 3000 },
      { label: 'Cusions', amount: 2000 },
      { label: 'Placemats- 8 + Cloth Runner 1', amount: 3000 },
      { label: '4 Vases with Flowers', amount: 2000 },
      { label: 'Backdrop', amount: 10000 },
      { label: 'Balloon/ Flower decor on Backdrop', amount: 2000 },
      { label: 'Platform fee', amount: 2500 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Picnic mattress setup', group_title: 'Includes' },
      { text: '8-seater long table', group_title: 'Includes' },
      { text: 'Cushions + placemats', group_title: 'Includes' },
      { text: '4 flower vases', group_title: 'Includes' },
      { text: 'Backdrop with decor', group_title: 'Includes' },
    ],
  },
  {
    sheet: 'VV',
    title: 'Vintage Vines 1',
    slug: 'vintage-vines-1',
    theme_name: 'Vintage Vines',
    budget_level_slug: 'level-1',
    base_price: 19480,
    description: 'A vintage-inspired wooden ladder adorned with a lush, hand-styled floral vine installation accomapnied by a full-scale focal wall designed to harmonize with your venue',
    key_decor_elements: 'A vintage-inspired wooden ladder adorned with a lush, hand-styled floral vine installation accomapnied by a full-scale focal wall designed to harmonize with your venue',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: 'Nestled under a large tree or on a manicured lawn to create an outdoor "living room.',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'vintage-vines'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: 'Ladder', amount: 1500 },
      { label: 'Flower vine Decor', amount: 3000 },
      { label: 'Backdrop', amount: 9500 },
      { label: '1 neon sign', amount: 800 },
      { label: 'Platform fee', amount: 1480 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Wooden ladder', group_title: 'Includes' },
      { text: 'Flower vine decor', group_title: 'Includes' },
      { text: 'Bohemian backdrop', group_title: 'Includes' },
      { text: 'Neon sign', group_title: 'Includes' },
    ],
  },
  {
    sheet: 'CD 23',
    title: 'Catching Dreams 2/3',
    slug: 'catching-dreams-2-3',
    theme_name: 'Catching Dreams',
    budget_level_slug: 'level-2',
    base_price: 35100,
    description: 'A boho-inspired backdrop and wishes corner featuring dream catchers, pampas décor, florals, and personalized guest messages.',
    key_decor_elements: 'A boho-inspired backdrop and wishes corner featuring dream catchers, pampas décor, florals, and personalized guest messages.',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: 'Entrance, welcome area, photo corner, or beside the stage at weddings, engagements, and bridal celebrations.',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'catching-dreams'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: 'Wooden Stand', amount: 5000 },
      { label: 'Dream Catchers with blank notes/ customised message- 25', amount: 3000 },
      { label: 'Flower decor base', amount: 2000 },
      { label: 'Wooden Structure', amount: 8000 },
      { label: 'Pampous decor', amount: 3000 },
      { label: 'Fabric+ dream Catcher decor', amount: 2000 },
      { label: 'Vases with floral arrangements', amount: 3000 },
      { label: 'Lanterns', amount: 2000 },
      { label: 'Pack of 10 dream catchers for more guests', amount: 1000 },
      { label: 'Platform fee', amount: 2900 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Dreamcatcher backdrop', group_title: 'Includes' },
      { text: 'Wooden structure', group_title: 'Includes' },
      { text: 'Pampas + fabric decor', group_title: 'Includes' },
      { text: '4 floral vases', group_title: 'Includes' },
      { text: '2 lanterns', group_title: 'Includes' },
      { text: 'Return favors stand', group_title: 'Includes' },
    ],
  },
];

const ORPHAN_FIRST_LAYER_SLUGS = [
  'the-first-layer-1',
  'the-first-layer-2',
  'the-first-layer-3',
];

/**
 * Older seeds used the-first-layer-* slugs while Signs & Stems used signs-and-stems-*.
 * Both showed under Bohemian as duplicates — delete the orphan First Layer packages.
 */
async function deleteOrphanFirstLayerPackages(strapi) {
  const deleted = [];

  for (const slug of ORPHAN_FIRST_LAYER_SLUGS) {
    for (const status of ['published', 'draft']) {
      const rows = await strapi.documents('api::package.package').findMany({
        filters: { slug: { $eq: slug } },
        status,
        limit: 5,
      });

      for (const row of Array.isArray(rows) ? rows : []) {
        if (!row?.documentId) continue;
        try {
          await strapi.documents('api::package.package').delete({
            documentId: row.documentId,
          });
          deleted.push({ slug, documentId: row.documentId, status });
          strapi.log.info(
            `[seed/decor-bohemian] deleted orphan package slug=${slug} documentId=${row.documentId}`
          );
        } catch (error) {
          strapi.log.warn(
            `[seed/decor-bohemian] failed to delete orphan ${slug}: ${error.message}`
          );
        }
      }
    }
  }

  return deleted;
}

async function seedDecorBohemianPackages(strapi) {
  await ensureThemeDocumentId(strapi, { name: 'Bohemian', slug: 'bohemian', display_order: 50 });
  await ensureThemeDocumentId(strapi, {
    name: 'Signs & Stems',
    slug: 'signs-and-stems',
    display_order: 51,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'The First Layer',
    slug: 'the-first-layer',
    display_order: 52,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Pampous Play',
    slug: 'pampous-play',
    display_order: 53,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Less is More',
    slug: 'less-is-more',
    display_order: 54,
  });
  await ensureEventDocumentId(strapi, {
    name: 'Birthday Parties',
    slugCandidates: EVENT_SLUG_CANDIDATES,
    display_order: 10,
  });
  await ensureBudgetLevelDocumentId(strapi, {
    name: 'Level 1',
    slug: 'level-1',
    display_order: 1,
    description: 'Thoughtfully put together essentials for smaller guest counts.',
  });
  await ensureBudgetLevelDocumentId(strapi, {
    name: 'Level 2',
    slug: 'level-2',
    display_order: 2,
    description: 'A more detailed setup with a stronger visual and service experience.',
  });
  await ensureBudgetLevelDocumentId(strapi, {
    name: 'Level 3',
    slug: 'level-3',
    display_order: 3,
    description: 'Premium styling and service depth for larger or more layered celebrations.',
  });

  const deletedOrphans = await deleteOrphanFirstLayerPackages(strapi);

  const result = await seedDecorPackages(strapi, BOHEMIAN_PACKAGES, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-bohemian',
    refreshExistingDecor: true,
  });

  return {
    ...result,
    deletedOrphans,
  };
}

module.exports = {
  BOHEMIAN_PACKAGES,
  EVENT_SLUG_CANDIDATES,
  seedDecorBohemianPackages,
  deleteOrphanFirstLayerPackages,
};
