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

const FIRST_LAYER_NITTY =
  'Love the look but want a different colour or style direction? Go ahead and book, we’ll connect to customise to match your event vibe.';

const FIRST_LAYER_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'Professional Setup' },
  { text: 'Final Dismantling' },
  { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
  { text: 'No hidden service fees.' },
];

const FIRST_LAYER_SETUP =
  'A small area for our team to work and access to water & electricity. Final print content to be shared prior to the event (timeline will be suggested by team Elewen after booking).';

const FIRST_LAYER_BEST =
  'Home celebrations, terraces, small banquet halls, cafés, or party venues.';

const FIRST_LAYER_WHY =
  'It creates visible impact with minimal elements. Simple styling, clear focal points, and just enough detail to make the space feel decorated.';

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

// HH / other Bohemian packs still use coaster-style entry rows (kept for reference packs below).

const FIRST_LAYER_DESCRIPTION =
  'A foundational décor package that sets the tone of your celebration.';

const BOHEMIAN_PACKAGES = [
  {
    sheet: 'FL 1',
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
    theme_slug_candidates: ['the-first-layer', 'bohemian'],
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
    sheet: 'FL2',
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
    theme_slug_candidates: ['the-first-layer', 'bohemian'],
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
    sheet: 'FL 3',
    title: 'The First Layer 3',
    slug: 'the-first-layer-3',
    theme_name: 'The First Layer',
    budget_level_slug: 'level-3',
    // Full LEVEL 3 cost sheet was not provided — keep structure Figma-aligned like L2.
    base_price: 12200,
    description: FIRST_LAYER_DESCRIPTION,
    key_decor_elements:
      'An impressive entrance with premium floral or balloon styling, plus entry signage or printables/props.',
    nitty_gritty: FIRST_LAYER_NITTY,
    setup_needs: FIRST_LAYER_SETUP,
    best_placed_at: FIRST_LAYER_BEST,
    why_we_love_it: FIRST_LAYER_WHY,
    theme_slug_candidates: ['the-first-layer', 'bohemian'],
    price_covers: FIRST_LAYER_PRICE_COVERS,
    price_breakdown: [
      { label: 'Entry Mirror + candles', amount: 4500 },
      { label: 'Pampous', amount: 1000 },
      { label: 'Glass candle holders with candles', amount: 4500 },
      { label: 'Platform fee', amount: 1000 },
      { label: 'Labour & Transport', amount: 1200 },
    ],
    inclustions: [
      ...firstLayerDecorChoice('fl3', {
        floralLabel: 'Floral decor (premium flowers)',
        balloonArchLabel: 'Balloon arch décor (premium mix)',
      }),
      ...firstLayerSignageChoice('fl3'),
    ],
  },
  {
    sheet: 'PP 2',
    title: 'Pampous Play 2',
    slug: 'pampous-play-2',
    theme_name: 'Pampous Play',
    budget_level_slug: 'level-2',
    base_price: 8300,
    description: 'Elegant floral décor set featuring a decorative vase arrangement, and a matching floor standee, designed to add a sophisticated and stylish touch to any celebration.',
    key_decor_elements: 'Elegant floral décor set featuring a decorative vase arrangement, and a matching floor standee, designed to add a sophisticated and stylish touch to any celebration.',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: '',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'pampous-play'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: 'Vase', amount: 3500 },
      { label: 'Platform fee', amount: 700 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      { text: '5 floral vase centrepieces', group_title: 'Includes' },
      { text: '4 metal floral standees', group_title: 'Includes' },
    ],
  },
  {
    sheet: 'PP 3',
    title: 'Pampous Play 3',
    slug: 'pampous-play-3',
    theme_name: 'Pampous Play',
    budget_level_slug: 'level-3',
    base_price: 13740,
    description: 'Elegant floral décor set featuring a decorative a decorative floor standee and a statment backdrop of fresh flowers, designed to add a sophisticated and stylish touch to any celebration.',
    key_decor_elements: 'Elegant floral décor set featuring a decorative a decorative floor standee and a statment backdrop of fresh flowers, designed to add a sophisticated and stylish touch to any celebr',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: '',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'pampous-play'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: 'Backdrop', amount: 9000 },
      { label: 'Floor Standee', amount: 2400 },
      { label: 'Platform fee', amount: 1140 },
      { label: 'Labour & Transport', amount: 1200 },
    ],
    inclustions: [
      { text: 'Floral ring backdrop', group_title: 'Includes' },
      { text: 'Custom neon sign', group_title: 'Includes' },
      { text: '4 metal floral standees', group_title: 'Includes' },
    ],
  },
  {
    sheet: 'PP3',
    title: 'Less is More 3',
    slug: 'less-is-more-3',
    theme_name: 'Less is More',
    budget_level_slug: 'level-3',
    base_price: 19020,
    description: 'This comprehensive package offers a seamless, high-end look for your celebration, taking the stress out of styling. By combining your entrance statement, aisle styling, and main focal point, we create a cohesive, luxury environment using premium, real pampas textures.',
    key_decor_elements: 'This comprehensive package offers a seamless, high-end look for your celebration, taking the stress out of styling. By combining your entrance statement, aisle styling, and main fo',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: '',
    why_we_love_it: '',
    theme_slug_candidates: ['bohemian', 'less-is-more'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: 'Happy birthday Bckdrop', amount: 7000 },
      { label: 'Real Pampus flowers decor', amount: 4500 },
      { label: '1 Easel', amount: 400 },
      { label: '1 signboard with Pampus decor', amount: 1900 },
      { label: '4 Pampus Standees', amount: 2400 },
      { label: 'Platform fee', amount: 1620 },
      { label: 'Labour & Transport', amount: 1200 },
    ],
    inclustions: [
      { text: 'Happy birthday backdrop', group_title: 'Includes' },
      { text: 'Real pampas decor', group_title: 'Includes' },
      { text: '1 easel', group_title: 'Includes' },
      { text: 'Pampas signboard', group_title: 'Includes' },
      { text: '4 pampas standees', group_title: 'Includes' },
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

async function seedDecorBohemianPackages(strapi) {
  await ensureThemeDocumentId(strapi, { name: 'Bohemian', slug: 'bohemian', display_order: 50 });
  await ensureThemeDocumentId(strapi, {
    name: 'The First Layer',
    slug: 'the-first-layer',
    display_order: 51,
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
