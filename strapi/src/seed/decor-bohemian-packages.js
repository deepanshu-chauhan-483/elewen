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

function optionalPackageAddon(name, price = 0, description = '') {
  return {
    name,
    price,
    description: description || name,
    visibility: true,
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

const FIRST_LAYER_NITTY =
  'Love the look but want a different colour or style direction? Go ahead and book, we’ll connect to customise to match your event vibe.';

const FIRST_LAYER_PRICE_COVERS = SIGNS_STEMS_PRICE_COVERS;

const FIRST_LAYER_SETUP =
  'A small area for our team to work and access to water & electricity. Final print content to be shared prior to the event (timeline will be suggested by team Elewen after booking).';

const FIRST_LAYER_BEST =
  'Home celebrations, terraces, small banquet halls, cafés, or party venues.';

const FIRST_LAYER_WHY =
  'It creates visible impact with minimal elements. Simple styling, clear focal points, and just enough detail to make the space feel decorated.';

const FIRST_LAYER_DESCRIPTION =
  'A foundational décor package that sets the tone of your celebration.';

function firstLayerDecorChoice(prefix, { floralLabel, balloonArchLabel }) {
  return [
    choiceOption(`${prefix}-decor`, 'Floral or Balloon Decor (choose 1)', floralLabel),
    whenInclusion(
      `${prefix}-decor`,
      floralLabel,
      '5 centerpieces + 4 crates/urli + 5–7 candles (entrance/corner setup)'
    ),
    choiceOption(`${prefix}-decor`, 'Floral or Balloon Decor (choose 1)', balloonArchLabel),
    whenInclusion(
      `${prefix}-decor`,
      balloonArchLabel,
      'Balloon arch + balloon sign + 5 centerpieces'
    ),
    choiceOption(
      `${prefix}-decor`,
      'Floral or Balloon Decor (choose 1)',
      'Ring balloon backdrop with neon sign'
    ),
    whenInclusion(
      `${prefix}-decor`,
      'Ring balloon backdrop with neon sign',
      'Ring balloon backdrop with neon sign'
    ),
  ];
}

function firstLayerSignageChoice(prefix) {
  return [
    choiceOption(`${prefix}-signage`, 'Entry Signage (choose 1)', 'Easel with sign'),
    whenInclusion(
      `${prefix}-signage`,
      'Easel with sign',
      'Easel with sign (recommended with floral entrance styling)'
    ),
    choiceOption(`${prefix}-signage`, 'Entry Signage (choose 1)', 'Printables + Props'),
    whenInclusion(
      `${prefix}-signage`,
      'Printables + Props',
      '1 fun quote / bar menu / 1 neon sign + 15 colourful shot glasses'
    ),
  ];
}

const BOHEMIAN_PACKAGES = [
  // House Party / Birthday Party theme only — NOT shown under Bohemian filter.
  {
    sheet: 'FL 1 HP',
    title: 'The First Layer 1',
    slug: 'the-first-layer-1',
    theme_name: 'The First Layer',
    budget_level_slug: 'level-1',
    base_price: 13250,
    description: FIRST_LAYER_DESCRIPTION,
    key_decor_elements:
      'An impressive entrance along with 5 floral vases that you can set anywhere to enhance the look. Could be further paired with thoughtful detailing with quotes on small easel stands.',
    nitty_gritty: FIRST_LAYER_NITTY,
    setup_needs: FIRST_LAYER_SETUP,
    best_placed_at: FIRST_LAYER_BEST,
    why_we_love_it: FIRST_LAYER_WHY,
    theme_slug_candidates: ['the-first-layer'],
    price_covers: FIRST_LAYER_PRICE_COVERS,
    price_breakdown: [
      { label: 'Floral / Balloon decor (avg)', amount: 7433 },
      { label: 'Entry Signage / Printables', amount: 1500 },
      { label: 'Package Price', amount: 11500 },
      { label: 'Platform fee', amount: 1150 },
      { label: 'Transport and Labour', amount: 600 },
    ],
    inclustions: [
      ...firstLayerDecorChoice('fl1', {
        floralLabel: 'Floral decor',
        balloonArchLabel: 'Balloon arch décor',
      }),
      ...firstLayerSignageChoice('fl1'),
    ],
  },
  {
    sheet: 'FL2 HP',
    title: 'The First Layer 2',
    slug: 'the-first-layer-2',
    theme_name: 'The First Layer',
    budget_level_slug: 'level-2',
    base_price: 15670,
    description: FIRST_LAYER_DESCRIPTION,
    key_decor_elements:
      'An impressive entrance along with 5 premium floral vases that you can set anywhere to enhance the look. Could be further paired with thoughtful detailing with quotes on small easel stands.',
    nitty_gritty: FIRST_LAYER_NITTY,
    setup_needs: FIRST_LAYER_SETUP,
    best_placed_at: FIRST_LAYER_BEST,
    why_we_love_it: FIRST_LAYER_WHY,
    theme_slug_candidates: ['the-first-layer'],
    price_covers: FIRST_LAYER_PRICE_COVERS,
    price_breakdown: [
      { label: 'Floral / Balloon decor (premium)', amount: 9700 },
      { label: 'Entry Signage / Printables', amount: 4000 },
      { label: 'Package Price', amount: 13700 },
      { label: 'Platform fee', amount: 1370 },
      { label: 'Transport and Labour', amount: 600 },
    ],
    inclustions: [
      ...firstLayerDecorChoice('fl2', {
        floralLabel: 'Floral decor (premium flowers)',
        balloonArchLabel: 'Balloon arch décor (premium mix)',
      }),
      ...firstLayerSignageChoice('fl2'),
    ],
  },
  {
    sheet: 'FL 3 HP',
    title: 'The First Layer 3',
    slug: 'the-first-layer-3',
    theme_name: 'The First Layer',
    budget_level_slug: 'level-3',
    base_price: 18420,
    description:
      'Choice-based styling (floral or balloon) with this foundational décor package that sets the tone of your celebration.',
    key_decor_elements:
      'Choice-based styling (floral or balloon) with this foundational décor package that sets the tone of your celebration.',
    nitty_gritty: FIRST_LAYER_NITTY,
    setup_needs: FIRST_LAYER_SETUP,
    best_placed_at: FIRST_LAYER_BEST,
    why_we_love_it: 'Because you get to choose the mood - balloons or florals.',
    theme_slug_candidates: ['the-first-layer'],
    price_covers: FIRST_LAYER_PRICE_COVERS,
    price_breakdown: [
      { label: 'Floral Decor (Premium flowers) / Balloon Arch with sign', amount: 9200 },
      { label: 'Fancy entry signage + flowers or balloons on signage', amount: 5000 },
      { label: 'Printables + Props', amount: 2000 },
      { label: 'Package Price', amount: 16200 },
      { label: 'Platform fee', amount: 1620 },
      { label: 'Transport and Labour', amount: 600 },
    ],
    inclustions: [
      // Guests pick the full floral OR balloon pack — not mix-and-match items.
      choiceOption('fl3-style', 'Choose Your Style', 'FLORAL (Premium Flowers)'),
      whenInclusion('fl3-style', 'FLORAL (Premium Flowers)', '5 centerpieces'),
      whenInclusion('fl3-style', 'FLORAL (Premium Flowers)', 'Entrance floral setup (crates/urli)'),
      whenInclusion('fl3-style', 'FLORAL (Premium Flowers)', '5–7 candles'),
      whenInclusion(
        'fl3-style',
        'FLORAL (Premium Flowers)',
        'Fancy entry signage with flowers'
      ),
      choiceOption('fl3-style', 'Choose Your Style', 'BALLOON (Premium Mix)'),
      whenInclusion('fl3-style', 'BALLOON (Premium Mix)', 'Balloon arch with sign'),
      whenInclusion(
        'fl3-style',
        'BALLOON (Premium Mix)',
        'Fancy entry signage with balloons'
      ),
      { text: '1 fun quote', group_title: 'Printables + Props' },
      { text: '1 Bar menu', group_title: 'Printables + Props' },
      { text: '1 neon sign / 10 shot glasses', group_title: 'Printables + Props' },
    ],
  },
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
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at: '',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'perch-and-pour'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
    price_breakdown: [
      { label: '1 Wooden Bar', amount: 12000 },
      { label: '3 Cocktail Tables', amount: 3000 },
      { label: 'Platform fee', amount: 1500 },
      { label: 'Transportation and Labour Cost', amount: 3200 },
    ],
    inclustions: [
      { text: '1 Wooden Bar' },
      { text: '4 Linen covered Cocktail Tables' },
      { text: '1 customised Bar menu on easel' },
      { text: '1 Bar neon sign' },
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
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at:
      'Nestled under a large tree or on a manicured lawn to create an outdoor "living room."',
    why_we_love_it:
      "It seamlessly blends a cozy, texture-rich lounge with a full-service bar, creating a high-end social sanctuary that guests won't want to leave.",
    theme_slug_candidates: ['bohemian', 'perch-and-pour'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
    price_breakdown: [
      { label: '1 Sofa', amount: 3000 },
      { label: '2 Chairs', amount: 2500 },
      { label: '1 coffee table', amount: 1500 },
      { label: '2 puffies', amount: 1000 },
      { label: 'Bar', amount: 2500 },
      { label: '3 Cocktail Tables', amount: 3000 },
      { label: 'Platform fee', amount: 1350 },
      { label: 'Transportation and Labour Cost', amount: 3200 },
    ],
    inclustions: [
      { text: '1 Cane Sofa', group_title: 'Seating' },
      { text: '2 Cane Chairs', group_title: 'Seating' },
      { text: '1 rectangle cane table', group_title: 'Seating' },
      { text: '2 Plush Cushions', group_title: 'Seating' },
      { text: '1 Basic bar', group_title: 'The Bar' },
      { text: '1 customised menu', group_title: 'The Bar' },
      { text: '3 Cocktail Tables', group_title: 'Social Space' },
      { text: '1 Bar neon sign', group_title: 'Finishing Touches' },
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
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at:
      'Nestled under a large tree or on a manicured lawn to create an outdoor "living room."',
    why_we_love_it:
      "It seamlessly blends a cozy, texture-rich lounge with a full-service bar, creating a high-end social sanctuary that guests won't want to leave.",
    theme_slug_candidates: ['bohemian', 'perch-and-pour'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
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
      { label: 'Transportation and Labour Cost', amount: 3200 },
    ],
    inclustions: [
      { text: '1 Cane Sofa', group_title: 'Seating' },
      { text: '2 Cane Chairs', group_title: 'Seating' },
      { text: '4 Plush Cushions', group_title: 'Seating' },
      { text: '1 Cane Round Table set atop a Premium Carpet', group_title: 'The Hub' },
      {
        text: '1 Wooden Bar with Draping, Fresh Flower Decor, and a customised menu',
        group_title: 'The Bar',
      },
      { text: '2 Cane Cocktail Tables', group_title: 'Social Space' },
      { text: '2 Real Flower Arrangements in Vases', group_title: 'Finishing Touches' },
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
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at: '',
    why_we_love_it:
      'No fuss setup, perfect for a cozy night in or even a part of the decor at your all your Earthy, Boheminian style bashes.',
    theme_slug_candidates: ['bohemian', 'cozy-canopy'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
    price_breakdown: [
      { label: '1 Mattress', amount: 500 },
      { label: '1 Bedsheet', amount: 200 },
      { label: '1 Wooden Frame', amount: 6000 },
      { label: 'DreamCatcher Hanging', amount: 500 },
      { label: '2 low puffies', amount: 1000 },
      { label: 'Cusions', amount: 2000 },
      { label: '2 Rattan Stools', amount: 4000 },
      { label: '10 Candles in glass holders', amount: 2000 },
      { label: 'Platform fee', amount: 1820 },
      { label: 'Transportation and Labour Cost', amount: 3200 },
    ],
    inclustions: [
      { text: '1 Bedsheet', group_title: 'The canopy' },
      { text: '1 Wooden Frame', group_title: 'The canopy' },
      { text: 'DreamCatcher Hanging', group_title: 'The canopy' },
      { text: '2 low puffies', group_title: 'The canopy' },
      { text: 'Cushions', group_title: 'The canopy' },
      { text: '2 Rattan Stools', group_title: 'Finishing Touches' },
      choiceOption('cc2-finish', 'Choose 1', '10 Candles in glass holders'),
      choiceOption('cc2-finish', 'Choose 1', '2 Floral Centrepieces'),
    ],
  },
  {
    sheet: 'PIC 2',
    title: 'Picnic a la Boho 2',
    slug: 'picnic-a-la-boho-2',
    theme_name: 'Picnic a la Boho',
    budget_level_slug: 'level-2',
    base_price: 30700,
    description:
      'An end to end, all you need to throw a dreamy brunch. Complete with full table ensemble and themed backdrop, this package is all rady to get added to your cart.',
    key_decor_elements:
      'An end to end, all you need to throw a dreamy brunch. Complete with full table ensemble and themed backdrop, this package is all rady to get added to your cart.',
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at:
      'Nestled under a large tree or on a manicured lawn to create an outdoor "living room."',
    why_we_love_it:
      "It seamlessly blends a cozy, texture-rich lounge with a full-service bar, creating a high-end social sanctuary that guests won't want to leave.",
    theme_slug_candidates: ['bohemian', 'picnic-a-la-boho'],
    price_covers: SIGNS_STEMS_PRICE_COVERS,
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
      { label: 'Transportation and Labour Cost', amount: 3200 },
    ],
    inclustions: [
      { text: 'Mattress', group_title: 'Picnic Seating & Table Styling' },
      { text: 'Sheet/ Carpet covering', group_title: 'Picnic Seating & Table Styling' },
      { text: 'Long Table- 8 seater', group_title: 'Picnic Seating & Table Styling' },
      { text: 'Cushions', group_title: 'Picnic Seating & Table Styling' },
      { text: 'Placemats- 8 + Cloth Runner 1', group_title: 'Picnic Seating & Table Styling' },
      { text: '4 Vases with Flowers', group_title: 'Picnic Seating & Table Styling' },
      { text: 'Double Panel Backdrop', group_title: 'The Backdrop' },
      { text: 'Balloon Decor', group_title: 'The Backdrop' },
    ],
  },
  {
    sheet: 'VV',
    title: 'Vintage Vines 1',
    slug: 'vintage-vines-1',
    theme_name: 'Vintage Vines',
    budget_level_slug: 'level-1',
    base_price: 19480,
    description:
      'A vintage-inspired wooden ladder adorned with a lush, hand-styled floral vine installation accomapnied by a full-scale focal wall designed to harmonize with your venue',
    key_decor_elements:
      'A vintage-inspired wooden ladder adorned with a lush, hand-styled floral vine installation accomapnied by a full-scale focal wall designed to harmonize with your venue',
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at:
      'Nestled under a large tree or on a manicured lawn to create an outdoor "living room."',
    why_we_love_it:
      'Creates a stylish boho focal point with minimal décor, perfect for effortless photo moments.',
    theme_slug_candidates: ['bohemian', 'vintage-vines'],
    price_covers: PAMPOUS_SIMPLE_PRICE_COVERS,
    price_breakdown: [
      { label: 'Ladder', amount: 1500 },
      { label: 'Flower vine Decor', amount: 3000 },
      { label: 'Backdrop', amount: 9500 },
      { label: '1 neon sign', amount: 800 },
      { label: 'Platform fee', amount: 1480 },
      { label: 'Transportation and Labour Cost', amount: 3200 },
    ],
    inclustions: [
      { text: '1 wooden Ladder', group_title: 'Ladder Accent' },
      { text: 'Flower vine Decor', group_title: 'Ladder Accent' },
      { text: '1 Bohemian Backdrop', group_title: 'Backdrop' },
      { text: '1 neon sign', group_title: 'Backdrop' },
    ],
  },
  {
    sheet: 'CD 23',
    title: 'Catching Dreams 2/3',
    slug: 'catching-dreams-2-3',
    theme_name: 'Catching Dreams',
    budget_level_slug: 'level-2',
    // Core without optional dream-catcher pack + transport + platform = 34100.
    // Optional pack (₹1000) brings total to sheet approx ₹35100.
    base_price: 34100,
    description:
      'A boho-inspired backdrop and wishes corner featuring dream catchers, pampas décor, florals, and personalized guest messages.',
    key_decor_elements:
      'A boho-inspired backdrop and wishes corner featuring dream catchers, pampas décor, florals, and personalized guest messages.',
    nitty_gritty: SIGNS_STEMS_NITTY,
    setup_needs: SIGNS_STEMS_SETUP,
    best_placed_at:
      'Entrance, welcome area, photo corner, or beside the stage at weddings, engagements, and bridal celebrations.',
    why_we_love_it:
      'Combines beautiful décor with a meaningful guest interaction that creates lasting memories.',
    theme_slug_candidates: ['bohemian', 'catching-dreams'],
    price_covers: PAMPOUS_SIMPLE_PRICE_COVERS,
    price_breakdown: [
      { label: 'Wooden Stand', amount: 5000 },
      { label: 'Dream Catchers with blank notes/ customised message- 25', amount: 3000 },
      { label: 'Flower decor base', amount: 2000 },
      { label: 'Wooden Structure', amount: 8000 },
      { label: 'Pampous decor', amount: 3000 },
      { label: 'Fabric+ dream Catcher decor', amount: 2000 },
      { label: 'Vases with floral arrangements', amount: 3000 },
      { label: 'Lanterns', amount: 2000 },
      { label: 'Platform fee', amount: 2900 },
      { label: 'Transportation and Labour Cost', amount: 3200 },
    ],
    inclustions: [
      { text: 'Wooden Structure', group_title: 'Dream Catcher Backdrop' },
      { text: 'Pampous decor', group_title: 'Dream Catcher Backdrop' },
      { text: 'Fabric & dream Catcher decor', group_title: 'Dream Catcher Backdrop' },
      { text: '4 Vases with floral arrangements', group_title: 'Dream Catcher Backdrop' },
      { text: '2 Lanterns', group_title: 'Dream Catcher Backdrop' },
      { text: 'Wooden Stand', group_title: 'Return Favors Stand' },
      {
        text: 'Dream Catchers with blank notes/ customised message- 25',
        group_title: 'Return Favors Stand',
      },
      { text: 'Flower decor base', group_title: 'Return Favors Stand' },
    ],
    addons: [
      optionalPackageAddon(
        'Pack of 10 dream catchers for more guests',
        1000,
        'Optional: Pack of 10 dream catchers for more guests'
      ),
    ],
  },
];

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
  await ensureThemeDocumentId(strapi, {
    name: 'Perch & Pour',
    slug: 'perch-and-pour',
    display_order: 55,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Cozy Canopy',
    slug: 'cozy-canopy',
    display_order: 56,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Picnic a la Boho',
    slug: 'picnic-a-la-boho',
    display_order: 57,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Vintage Vines',
    slug: 'vintage-vines',
    display_order: 58,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Catching Dreams',
    slug: 'catching-dreams',
    display_order: 59,
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

  return seedDecorPackages(strapi, BOHEMIAN_PACKAGES, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-bohemian',
    refreshExistingDecor: true,
  });
}

module.exports = {
  BOHEMIAN_PACKAGES,
  EVENT_SLUG_CANDIDATES,
  seedDecorBohemianPackages,
};
