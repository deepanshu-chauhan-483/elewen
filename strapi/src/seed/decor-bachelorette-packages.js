'use strict';

const {
  seedDecorPackages,
} = require('./decor-proposal-shared');

const BACHELORETTE_EVENT_SLUG_CANDIDATES = [
  'bachelors',
  'bachelors-bachelorette',
  'bachelorette',
  'bachelor',
];

const BACHELORETTE_NITTY_GRITTY =
  'Love the look but need a different color story? Go ahead and book! We will contact you to finalize the perfect shade from our available decor to match your vibe.';

const LFF_NITTY_GRITTY =
  'Want to personalise the bar menu, props, or game elements? Book the setup and we will connect with you to customise the experience from our available options.';

const BR_NITTY_GRITTY =
  'Want to tweak the games or add your own twist? Book the setup and we will connect with you to personalise the experience from our available options.';

const BACHELORETTE_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'Professional Setup' },
  { text: 'No hidden service fees.' },
];

const TB_BEST_PLACED =
  'Living room corners, bedroom backdrops, Airbnb setups, or any cozy space where your girls can gather, click, and celebrate.';

const TB1_WHY = 'It is your perfect "let us get this party started" corner.';

const TB2_WHY =
  'It is minimal but makes a statement — the kind of setup that instantly says this night is going to be fun.';

const TB3_WHY =
  'It balances pretty and playful, giving you a setup that feels like a celebration and an experience.';

const PLN_BEST_PLACED = TB_BEST_PLACED;

const PLN_WHY =
  'It balances pretty and playful, giving you a setup that feels like a celebration and an experience.';

const PP_BEST_PLACED =
  'Living room corners, backyards or terrace areas, Airbnb setups, or any cozy space where your girls can gather, click, and celebrate.';

const PP_WHY = 'It is equal parts aesthetic and interactive — a setup that feels as fun as it looks.';

const LFF_BEST_PLACED = PP_BEST_PLACED;

const LFF_WHY =
  'It breaks the ice instantly, turning the night into a full-blown celebration from the very first game.';

const BR_BEST_PLACED = 'Bedrooms, hotel rooms, or Airbnb stays.';

const BR_WHY =
  'It is simple but magical — that one moment when she walks in and instantly feels celebrated.';

function choiceOption(groupKey, label, optionTitle, options = {}) {
  const parentKey = options.parentKey;
  const parentValue = options.parentValue;
  const resolvedKey =
    parentKey && parentValue ? `when:${parentKey}:${parentValue}>>${groupKey}` : groupKey;

  const row = {
    is_choice_group: true,
    choice_group_key: resolvedKey,
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

function tb2BackdropChoice(prefix) {
  return [
    choiceOption(
      `${prefix}-backdrop`,
      'The Backdrop (choose 1)',
      'Semi-circle backdrop with Balloons and signage'
    ),
    whenInclusion(
      `${prefix}-backdrop`,
      'Semi-circle backdrop with Balloons and signage',
      'Semi-circle backdrop with balloons and signage'
    ),
    choiceOption(
      `${prefix}-backdrop`,
      'The Backdrop (choose 1)',
      'Circular backdrop with Balloons and signage'
    ),
    whenInclusion(
      `${prefix}-backdrop`,
      'Circular backdrop with Balloons and signage',
      'Circular backdrop with balloons and signage'
    ),
  ];
}

function lffBridesmaidsStylingChoice(prefix) {
  return [
    choiceOption(
      `${prefix}-styling`,
      'Bride & Bridesmaids Styling (choose 1)',
      'Sash and crown styling'
    ),
    whenInclusion(`${prefix}-styling`, 'Sash and crown styling', 'Bride sash and crown'),
    whenInclusion(
      `${prefix}-styling`,
      'Sash and crown styling',
      'Customized bridesmaid sashes (up to 10)'
    ),
    choiceOption(
      `${prefix}-styling`,
      'Bride & Bridesmaids Styling (choose 1)',
      'Customized caps'
    ),
    whenInclusion(
      `${prefix}-styling`,
      'Customized caps',
      'Customized caps for bride and bridesmaids'
    ),
  ];
}

function lff3BackdropChoice(prefix) {
  return [
    choiceOption(`${prefix}-backdrop`, 'Backdrop (choose 1)', 'Bow Backdrop with flowers'),
    whenInclusion(
      `${prefix}-backdrop`,
      'Bow Backdrop with flowers',
      'Bow backdrop with flowers'
    ),
    choiceOption(
      `${prefix}-backdrop`,
      'Backdrop (choose 1)',
      'Glitter backdrop with ballons and a neon sign'
    ),
    whenInclusion(
      `${prefix}-backdrop`,
      'Glitter backdrop with ballons and a neon sign',
      'Glitter backdrop with balloons and a neon sign'
    ),
  ];
}

const BACHELORETTE_PACKAGES = [
  {
    sheet: 'TB 1',
    title: 'Tipsy Beginnings 1',
    slug: 'tipsy-beginnings-1',
    theme_name: 'Tipsy Beginnings',
    theme_slug_candidates: ['tipsy-beginnings'],
    budget_level_slug: 'level-1',
    base_price: 6000,
    nitty_gritty: BACHELORETTE_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs:
      'A clean wall or corner space for backdrop setup, access to electricity for lights and neon sign.',
    best_placed_at: TB_BEST_PLACED,
    why_we_love_it: TB1_WHY,
    description:
      'A playful start to a night you will not remember too clearly but will never forget. Think soft glows, popping balloons, and just the right amount of sass to set the mood.',
    key_decor_elements:
      'Draped backdrop with fairy lights, balloon styling, a bride-to-be foil banner, neon sign, and fun photo props.',
    price_breakdown: [
      { label: 'Balloons', amount: 1500 },
      { label: 'Backdrop with fairy lights', amount: 1500 },
      { label: 'Neon sign', amount: 800 },
      { label: 'Bride to be banner', amount: 1000 },
      { label: 'Photo props', amount: 700 },
      { label: 'Platform fee', amount: 500 },
    ],
    inclustions: [
      { text: 'Draped backdrop with fairy lights', group_title: 'The Backdrop' },
      { text: 'Balloon backdrop arrangement', group_title: 'The Backdrop' },
      { text: '1 Bride-to-be foil banner', group_title: 'The Backdrop' },
      { text: '1 neon/LED sign', group_title: 'Statement Element' },
      { text: '5–7 fun photo props', group_title: 'Photo Props' },
    ],
  },
  {
    sheet: 'TB 2',
    title: 'Tipsy Beginnings 2',
    slug: 'tipsy-beginnings-2',
    theme_name: 'Tipsy Beginnings',
    theme_slug_candidates: ['tipsy-beginnings'],
    budget_level_slug: 'level-2',
    base_price: 10670,
    nitty_gritty: BACHELORETTE_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs:
      'A clean wall or corner space for backdrop setup, access to electricity for lights and neon sign.',
    best_placed_at: TB_BEST_PLACED,
    why_we_love_it: TB2_WHY,
    description:
      'A statement bride-themed backdrop layered with balloons — playful, glowy, and just the right amount of extra.',
    key_decor_elements:
      'Bride-to-be themed backdrop, easel styling with printed board and balloon decor, and photo props.',
    price_breakdown: [
      { label: 'Balloons', amount: 2000 },
      { label: 'Bride to be backdrop', amount: 5000 },
      { label: 'Bride to be sign', amount: 1000 },
      { label: 'Photo props', amount: 700 },
      { label: 'Easel styling', amount: 1000 },
      { label: 'Platform fee', amount: 970 },
    ],
    inclustions: [
      ...tb2BackdropChoice('tb2'),
      { text: '1 easel stand with printed board and balloon decor', group_title: 'Easel Styling' },
      { text: '5–7 fun photo props', group_title: 'Photo Props' },
    ],
  },
  {
    sheet: 'TB 3',
    title: 'Tipsy Beginnings 3',
    slug: 'tipsy-beginnings-3',
    theme_name: 'Tipsy Beginnings',
    theme_slug_candidates: ['tipsy-beginnings'],
    budget_level_slug: 'level-3',
    base_price: 15340,
    nitty_gritty: BACHELORETTE_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs:
      'A wall or corner space for the backdrop, table/flat surface for styling elements, and access to electricity.',
    best_placed_at: TB_BEST_PLACED,
    why_we_love_it: TB3_WHY,
    description:
      'A little indulgent, a little dreamy, and a lot of fun. This setup brings together soft glam, playful details, and just the right amount of celebration energy.',
    key_decor_elements:
      'Balloon-styled backdrop, easel styling, champagne glasses, name tent cards, cotton candy, and candle-lit ambience.',
    price_breakdown: [
      { label: 'Balloons', amount: 2000 },
      { label: 'Bride to be backdrop', amount: 6000 },
      { label: 'Easel styling', amount: 1000 },
      { label: 'Champagne glasses with bows', amount: 1000 },
      { label: 'Cotton candy', amount: 500 },
      { label: 'Candles with holders and ribbons', amount: 1500 },
      { label: 'Candles in glasses', amount: 1000 },
      { label: 'Name tent cards', amount: 400 },
      { label: 'Platform fee', amount: 1340 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    addons: [
      optionalPackageAddon('Bar - Takhat and a classic white one', 0, 'Optional bar takhat add-on'),
    ],
    inclustions: [
      { text: 'Balloon styling on backdrop', group_title: 'The Backdrop' },
      { text: 'Bride-to-be themed backdrop', group_title: 'The Backdrop' },
      {
        text: '1 easel stand with printed board and balloon decor',
        group_title: 'Easel Styling',
      },
      {
        text: 'Champagne glasses with ribbon detailing',
        group_title: 'Table Set-up',
      },
      { text: 'Name tent cards for 10 guests', group_title: 'Table Set-up' },
      { text: 'Cotton candy (candy floss)', group_title: 'Table Set-up' },
      {
        text: '8 candles with holders and ribbon accents',
        group_title: 'Lighting & Ambience',
      },
      { text: '10 candles in glass holders', group_title: 'Lighting & Ambience' },
    ],
  },
  {
    sheet: 'PLN 1',
    title: 'Pretty Little Night 1',
    slug: 'pretty-little-night-1',
    theme_name: 'Pretty Little Night',
    theme_slug_candidates: ['pretty-little-night'],
    budget_level_slug: 'level-1',
    base_price: 28170,
    nitty_gritty: BACHELORETTE_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs:
      'A wall or corner space for the backdrop, table/flat surface for styling elements, and access to electricity.',
    best_placed_at: PLN_BEST_PLACED,
    why_we_love_it: PLN_WHY,
    description:
      'An intimate, beautifully styled setup designed for slow conversations, shared laughs, and a night that feels effortlessly special. Think soft florals, cozy seating, and a table that invites you to sit, sip, and spill everything.',
    key_decor_elements:
      'Bow-detailed backdrop, low-table seating with cushions, floral centrepieces, candles, and personalised name tent cards.',
    price_breakdown: [
      { label: 'Backdrop with a bow', amount: 8000 },
      { label: 'Floral centrepieces', amount: 6000 },
      { label: 'Candles', amount: 1000 },
      { label: 'Table runner', amount: 500 },
      { label: 'Table mats', amount: 600 },
      { label: 'Low table', amount: 3000 },
      { label: 'Cushions', amount: 2000 },
      { label: 'Name tent cards', amount: 600 },
      { label: 'Platform fee', amount: 2270 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    addons: [
      optionalPackageAddon(
        'Champagne glasses with bows / Props',
        1000,
        'Optional champagne glasses with bows or props'
      ),
    ],
    inclustions: [
      { text: 'Bow-detailed backdrop setup', group_title: 'The Backdrop' },
      { text: '1 carpet/mat for seating', group_title: 'Seating Setup' },
      { text: '1 low table (seating for 6)', group_title: 'Seating Setup' },
      { text: '8 floor cushions', group_title: 'Seating Setup' },
      { text: 'Table runner and 6 table mats', group_title: 'Table Set-up' },
      { text: '5 floral centerpieces in vases', group_title: 'Table Set-up' },
      { text: '10 candles', group_title: 'Table Set-up' },
      { text: 'Personalised name tent cards (up to 10)', group_title: 'Table Set-up' },
    ],
  },
  {
    sheet: 'PP1',
    title: 'Paint & Prosecco 1',
    slug: 'paint-and-prosecco-1',
    theme_name: 'Paint & Prosecco',
    theme_slug_candidates: ['paint-and-prosecco', 'paint-prosecco'],
    budget_level_slug: 'level-1',
    base_price: 27950,
    nitty_gritty: BACHELORETTE_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs:
      'A wall or corner space for the backdrop, table/flat surface for styling elements, and access to electricity.',
    best_placed_at: PP_BEST_PLACED,
    why_we_love_it: PP_WHY,
    description:
      'An intimate, beautifully styled setup designed for slow conversations, shared laughs, and a hands-on painting experience. Think soft florals, cozy seating, and a table that invites you to sit, sip, and spill everything.',
    key_decor_elements:
      'Bow-detailed backdrop, cozy floor seating, floral centrepieces, personalised name cards, and a guided painting experience with canvases, easels, paints, and brushes.',
    price_breakdown: [
      { label: 'Backdrop with a bow', amount: 8000 },
      { label: 'Floral centrepieces', amount: 6000 },
      { label: 'Candles', amount: 1000 },
      { label: 'Table runner', amount: 500 },
      { label: 'Low table', amount: 600 },
      { label: 'Cushions', amount: 3000 },
      { label: 'Name tent cards', amount: 2000 },
      { label: 'Canvases with easel stands', amount: 900 },
      { label: 'Paints and brushes', amount: 500 },
      { label: 'Platform fee', amount: 2250 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    addons: [
      optionalPackageAddon(
        'Champagne glasses with bows / Props',
        0,
        'Optional champagne glasses with bows or props'
      ),
    ],
    inclustions: [
      { text: '1 Bow-detailed backdrop setup', group_title: 'Backdrop & Styling' },
      { text: '1 low table (seating for 6)', group_title: 'Seating Setup' },
      { text: '8 floor cushions', group_title: 'Seating Setup' },
      { text: 'Table runner', group_title: 'Seating Setup' },
      { text: '5 floral centerpieces in vases', group_title: 'Seating Setup' },
      { text: '10 candles', group_title: 'Seating Setup' },
      { text: 'Personalised name tent cards', group_title: 'Personal Touches' },
      { text: '6 canvases with easel stands', group_title: 'Painting Experience' },
      { text: 'Paints and brushes for each guest', group_title: 'Painting Experience' },
    ],
  },
  {
    sheet: 'LFF 1',
    title: 'Last fun Fling 1',
    slug: 'last-fun-fling-1',
    theme_name: 'Last fun Fling',
    theme_slug_candidates: ['last-fun-fling'],
    budget_level_slug: 'level-1',
    base_price: 14350,
    nitty_gritty: LFF_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs: 'A small open area for games and a wall space for banner setup.',
    best_placed_at: LFF_BEST_PLACED,
    why_we_love_it: LFF_WHY,
    description:
      'A high-energy setup built for laughs, dares, and a little bit of madness. With fun games, playful details, and just enough decor to set the mood, this one is all about letting loose and celebrating the bride the loud way.',
    key_decor_elements:
      'Bra Pong, Shake the Booty, bride and bridesmaid styling, message board, foil banner, and balloon standees.',
    price_breakdown: [
      { label: 'Kiss the miss goodbye message board', amount: 1500 },
      { label: 'Bridesmaid sashes', amount: 3000 },
      { label: 'Bride sash and crown', amount: 1000 },
      { label: 'Games', amount: 3500 },
      { label: 'Bride to be banner', amount: 1500 },
      { label: 'Balloon standees', amount: 2000 },
      { label: 'Platform fee', amount: 1250 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    addons: [
      optionalPackageAddon(
        'Champagne glasses with bows / Props',
        0,
        'Optional champagne glasses with bows or props'
      ),
    ],
    inclustions: [
      {
        text: 'Bra Pong setup (all playing equipment and instructions included)',
        group_title: 'Fun & Games',
      },
      {
        text: 'Shake the Booty game (all playing equipment and instructions included)',
        group_title: 'Fun & Games',
      },
      { text: 'Bride sash and crown', group_title: 'Bride & Bridesmaids Styling' },
      {
        text: 'Customized bridesmaid sashes (up to 10)',
        group_title: 'Bride & Bridesmaids Styling',
      },
      {
        text: '"Kiss the Miss Goodbye" message board with markers',
        group_title: 'Interactive Elements',
      },
      { text: 'Bride-to-be foil banner', group_title: 'Basic Decor' },
      { text: '2 balloon standees', group_title: 'Basic Decor' },
    ],
  },
  {
    sheet: 'LFF 2',
    title: 'Last fun Fling 2',
    slug: 'last-fun-fling-2',
    theme_name: 'Last fun Fling',
    theme_slug_candidates: ['last-fun-fling'],
    budget_level_slug: 'level-2',
    base_price: 27400,
    nitty_gritty: LFF_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs: 'A small open area for games and a wall space for banner setup.',
    best_placed_at: LFF_BEST_PLACED,
    why_we_love_it: LFF_WHY,
    description:
      'A high-energy setup built for laughs, dares, and a little bit of madness. With fun games, playful details, and just enough decor to set the mood, this one is all about letting loose and celebrating the bride the loud way.',
    key_decor_elements:
      'Games, classic bar setup, styling choices, message board, glitter backdrop with neon sign, and printable photo props.',
    price_breakdown: [
      { label: 'Kiss the miss goodbye message board', amount: 1500 },
      { label: 'Bridesmaid sashes', amount: 3000 },
      { label: 'Bride sash and crown', amount: 1000 },
      { label: 'Games', amount: 3500 },
      { label: 'Bride to be banner / backdrop', amount: 8000 },
      { label: 'Classic bar', amount: 2500 },
      { label: 'Customized bar menu', amount: 700 },
      { label: 'Champagne glasses with bows', amount: 1000 },
      { label: 'Printable photo props', amount: 800 },
      { label: 'Platform fee', amount: 2200 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    addons: [
      optionalPackageAddon(
        'Fairy lights with electrician',
        0,
        'Optional fairy lights with electrician'
      ),
    ],
    inclustions: [
      { text: 'Bra Pong setup (with 2 balls)', group_title: 'Fun & Games' },
      { text: 'Shake the Booty game', group_title: 'Fun & Games' },
      { text: 'Classic bar setup', group_title: 'Bar Setup' },
      { text: 'Customized bar menu', group_title: 'Bar Setup' },
      {
        text: 'Champagne glasses with ribbon detailing',
        group_title: 'Bar Setup',
      },
      ...lffBridesmaidsStylingChoice('lff2'),
      {
        text: '"Kiss the Miss Goodbye" message board with markers',
        group_title: 'Interactive Elements',
      },
      {
        text: 'Glitter backdrop with balloons and a neon sign',
        group_title: 'Decor & Photo Props',
      },
      { text: 'Printable photo props', group_title: 'Decor & Photo Props' },
    ],
  },
  {
    sheet: 'LFF 3',
    title: 'Last fun Fling 3',
    slug: 'last-fun-fling-3',
    theme_name: 'Last fun Fling',
    theme_slug_candidates: ['last-fun-fling'],
    budget_level_slug: 'level-3',
    base_price: 43350,
    nitty_gritty: LFF_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs: 'A small open area for games and a wall space for banner setup.',
    best_placed_at: LFF_BEST_PLACED,
    why_we_love_it: LFF_WHY,
    description:
      'A high-energy setup built for laughs, dares, and a little bit of madness. With fun games, playful details, and just enough decor to set the mood, this one is all about letting loose and celebrating the bride the loud way.',
    key_decor_elements:
      'Full bar setup, interactive games, styling choices, message board, premium backdrop options, and printable photo props.',
    price_breakdown: [
      { label: 'Kiss the miss goodbye message board', amount: 1500 },
      { label: 'Bridesmaid sashes', amount: 3000 },
      { label: 'Bride sash and crown', amount: 1000 },
      { label: 'Games', amount: 3500 },
      { label: 'Bride to be backdrop', amount: 15000 },
      { label: 'Customized bar', amount: 10000 },
      { label: 'Customized bar menu', amount: 700 },
      { label: 'Champagne glasses with bows', amount: 1000 },
      { label: 'Printable photo props', amount: 800 },
      { label: 'Platform fee', amount: 3650 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Bra Pong setup (with 2 balls)', group_title: 'Fun & Games' },
      { text: 'Shake the Booty game', group_title: 'Fun & Games' },
      { text: 'Customized bar setup', group_title: 'Bar Setup' },
      { text: 'Customized bar menu', group_title: 'Bar Setup' },
      {
        text: 'Champagne glasses with ribbon detailing',
        group_title: 'Bar Setup',
      },
      ...lffBridesmaidsStylingChoice('lff3'),
      {
        text: '"Kiss the Miss Goodbye" message board with markers',
        group_title: 'Interactive Elements',
      },
      ...lff3BackdropChoice('lff3'),
      { text: 'Printable photo props', group_title: 'Decor & Photo Props' },
    ],
  },
  {
    sheet: 'BR ',
    title: "Bride's Room 1",
    slug: 'brides-room-1',
    theme_name: "Bride's Room",
    theme_slug_candidates: ['brides-room'],
    budget_level_slug: 'level-1',
    base_price: 5000,
    nitty_gritty: BR_NITTY_GRITTY,
    price_covers: BACHELORETTE_PRICE_COVERS,
    setup_needs: 'Access to the room prior to the bride\'s entry for setup.',
    best_placed_at: BR_BEST_PLACED,
    why_we_love_it: BR_WHY,
    description:
      'A sweet, surprise-style setup that transforms the bride\'s room into a soft, celebratory space. With floating balloons and playful details, it creates that perfect walk-in moment she will not forget.',
    key_decor_elements: 'Bride-to-be foil balloons and 60–80 loose balloons for a walk-in surprise.',
    price_breakdown: [
      { label: 'Bride to be foil balloons', amount: 2000 },
      { label: 'Loose balloons', amount: 2000 },
      { label: 'Platform fee', amount: 400 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      { text: 'Foil balloons', group_title: 'Bride-to-be Balloons' },
      { text: '60–80 loose balloons', group_title: 'Loose Balloons' },
    ],
  },
];

async function seedDecorBachelorettePackages(strapi) {
  return seedDecorPackages(strapi, BACHELORETTE_PACKAGES, {
    eventSlugCandidates: BACHELORETTE_EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-bachelorette',
  });
}

module.exports = {
  BACHELORETTE_PACKAGES,
  BACHELORETTE_EVENT_SLUG_CANDIDATES,
  seedDecorBachelorettePackages,
};
