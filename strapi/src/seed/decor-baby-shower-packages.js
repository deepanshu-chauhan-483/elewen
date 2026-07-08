'use strict';

const {
  PROPOSAL_NITTY_GRITTY,
  PROPOSAL_SETUP_NEEDS,
  seedDecorPackages,
} = require('./decor-proposal-shared');

const BABY_SHOWER_EVENT_SLUG_CANDIDATES = [
  'baby-shower',
  'baby-showers',
  'a-little-honey',
];

const BABY_SHOWER_NITTY_GRITTY =
  `${PROPOSAL_NITTY_GRITTY} We will contact you to confirm the customised message after booking.`;

const BABY_SHOWER_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'No hidden service fees.' },
];

const BUZZING_BEST_PLACED =
  'Perfect for entrances, welcome corners, apartment lobbies, intimate indoor celebrations, or garden baby showers.';

const BUZZING_WHY =
  'Simple, fresh, and effortlessly charming, this setup creates the sweetest first impression without overwhelming the space.';

const LITTLE_STROLL_DESCRIPTION =
  'A cozy and elegant baby shower setup featuring floral-styled signage, themed backdrops, delicate centrepieces, and personalised printables to bring your Little Honey celebration to life.';

const LITTLE_STROLL_WHY =
  'Soft florals, honey-inspired details, and delicate personalised touches come together to create a baby shower setup that feels warm, elegant, and thoughtfully styled.';

const HH_DESCRIPTION =
  'A premium, cohesive baby shower experience that takes care of every detail from the moment guests arrive.';

const HH_BEST_PLACED =
  'Indoor-outdoor venues, chic boutique spaces, or minimalist modern halls featuring plenty of natural light and open space to let the styled stations shine.';

const OH_BABY_DESCRIPTION =
  'A sweet and simple setup to welcome guests into your celebration. With a charming entry display, soft balloon accents, and delicate floral centrepieces, this package adds just the right touch of warmth and festivity to your Little Honey baby shower.';

const OBB_BEST_PLACED =
  'Perfect for entrances, welcome corners, dessert tables, or intimate indoor celebrations.';

const OBB_WHY =
  'A soft and charming setup that adds the sweetest welcome touch to your baby shower with playful balloons and delicate floral accents.';

const BBB_BEST_PLACED =
  'Ideal for outdoor venues or banquet spaces, or dedicated photo and cake cutting corners.';

const BBB_WHY =
  'Playful yet elegant, this setup brings together teddy details, soft balloons, and statement backdrops to create a picture-perfect baby shower celebration.';

const UU_BEST_PLACED =
  'Perfect for banquet halls, spacious living rooms, clubhouses, or indoor venues with dedicated areas for styling, games, dining, and celebrations.';

const UU_WHY =
  'A complete baby shower experience designed with playful details, elegant styling, and interactive touches that bring every corner of the celebration to life.';

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

function simplePriceBreakdown(decorAmount, labour = 600) {
  const platform = Math.round(decorAmount * 0.1);

  return {
    base_price: decorAmount + platform + labour,
    price_breakdown: [
      { label: 'Decor package', amount: decorAmount },
      { label: 'Platform fee', amount: platform },
      { label: 'Labour & Transport', amount: labour },
    ],
  };
}

function sheetPrice(decorAmount, platformFee, labour, breakdown = []) {
  return {
    base_price: decorAmount + platformFee + labour,
    price_breakdown: [
      ...breakdown,
      { label: 'Platform fee', amount: platformFee },
      { label: 'Labour & Transport', amount: labour },
    ],
  };
}

function obb1StyleChoice(prefix) {
  return [
    choiceOption(`${prefix}-style`, 'Choose your style', 'Balloon style'),
    whenInclusion(`${prefix}-style`, 'Balloon style', '1 easel and board with balloon accent on easel'),
    whenInclusion(`${prefix}-style`, 'Balloon style', '3 bear balloon centrepieces'),
    choiceOption(`${prefix}-style`, 'Choose your style', 'Floral style'),
    whenInclusion(`${prefix}-style`, 'Floral style', '1 easel and board with floral accent on easel'),
    whenInclusion(`${prefix}-style`, 'Floral style', '3 floral baby sock centrepieces'),
  ];
}

function obb2StyleChoice(prefix) {
  return [
    choiceOption(`${prefix}-style`, 'Choose your style', 'Balloon style'),
    whenInclusion(`${prefix}-style`, 'Balloon style', '1 easel and board with balloon accent on easel'),
    whenInclusion(`${prefix}-style`, 'Balloon style', '5 bear balloon centrepieces'),
    whenInclusion(`${prefix}-style`, 'Balloon style', '1 baby balloon corner'),
    choiceOption(`${prefix}-style`, 'Choose your style', 'Floral style'),
    whenInclusion(`${prefix}-style`, 'Floral style', '1 easel and board with floral accent on easel'),
    whenInclusion(`${prefix}-style`, 'Floral style', 'Floral baby sock centrepieces'),
    whenInclusion(`${prefix}-style`, 'Floral style', '1 floral balloon corner'),
  ];
}

function obb3SetupStyleChoice(prefix) {
  return [
    choiceOption(`${prefix}-setup`, 'Entry & centrepieces (choose 1)', 'Balloon style'),
    whenInclusion(`${prefix}-setup`, 'Balloon style', '1 easel and board with balloon accent on easel'),
    whenInclusion(`${prefix}-setup`, 'Balloon style', '3 bear balloon centrepieces'),
    choiceOption(`${prefix}-setup`, 'Entry & centrepieces (choose 1)', 'Floral style'),
    whenInclusion(`${prefix}-setup`, 'Floral style', '1 easel and board with floral accent on easel'),
    whenInclusion(`${prefix}-setup`, 'Floral style', '3 floral baby sock centrepieces'),
  ];
}

function ohBabyBackdropChoice(prefix) {
  return [
    choiceOption(`${prefix}-backdrop`, 'The Backdrop (choose 1)', 'Oh Baby Backdrop'),
    whenInclusion(`${prefix}-backdrop`, 'Oh Baby Backdrop', 'Oh Baby themed balloon backdrop'),
    choiceOption(`${prefix}-backdrop`, 'The Backdrop (choose 1)', 'Bear Backdrop'),
    whenInclusion(`${prefix}-backdrop`, 'Bear Backdrop', 'Bear themed balloon backdrop'),
  ];
}

function ohBabyCornerStyleChoice(prefix) {
  return [
    choiceOption(`${prefix}-corner`, 'Baby Corner (choose 1)', 'Baby balloon corner'),
    whenInclusion(`${prefix}-corner`, 'Baby balloon corner', 'Styled baby balloon corner'),
    choiceOption(`${prefix}-corner`, 'Baby Corner (choose 1)', 'Floral balloon corner'),
    whenInclusion(`${prefix}-corner`, 'Floral balloon corner', 'Styled floral balloon corner'),
  ];
}

function bloomEntranceAndCentrepieces() {
  return [
    { text: '1 Easel', group_title: 'Entrance Setup' },
    { text: '1 Board', group_title: 'Entrance Setup' },
    { text: 'Balloon accent', group_title: 'Entrance Setup' },
    { text: '5 bear with balloon centrepieces', group_title: 'Centrepieces' },
  ];
}

function bloomBackdropChoice(prefix) {
  return [
    choiceOption(`${prefix}-backdrop`, 'The Backdrop (choose 1)', 'Baby Cane Backdrop'),
    whenInclusion(`${prefix}-backdrop`, 'Baby Cane Backdrop', 'Baby cane backdrop styling'),
    choiceOption(`${prefix}-backdrop`, 'The Backdrop (choose 1)', 'Baby in Bloom Backdrop'),
    whenInclusion(`${prefix}-backdrop`, 'Baby in Bloom Backdrop', 'Baby in Bloom backdrop styling'),
  ];
}

function babyCornerBlocksOrBalloonChoice(prefix) {
  return [
    choiceOption(`${prefix}-corner`, 'Baby Corner (choose 1)', 'B-A-B-Y blocks'),
    whenInclusion(`${prefix}-corner`, 'B-A-B-Y blocks', 'B-A-B-Y letter blocks'),
    choiceOption(`${prefix}-corner`, 'Baby Corner (choose 1)', 'Hot air balloon decor'),
    whenInclusion(`${prefix}-corner`, 'Hot air balloon decor', 'Hot air balloon decor styling'),
  ];
}

function diaperGamesChoice(prefix) {
  return [
    choiceOption(`${prefix}-games`, 'Games and Engagements (choose 1)', 'Diaper Pong'),
    whenInclusion(
      `${prefix}-games`,
      'Diaper Pong',
      'Printed board with diapers attached and 3 small balls'
    ),
    choiceOption(`${prefix}-games`, 'Games and Engagements (choose 1)', 'Diaper Momento setup'),
    whenInclusion(
      `${prefix}-games`,
      'Diaper Momento setup',
      '20 diapers, 1 basket, 1 pack coloured pens, and small easel'
    ),
  ];
}

function lsEntryAndCentrepieces() {
  return [
    { text: '1 Easel', group_title: 'Entry Setup' },
    { text: '1 Board', group_title: 'Entry Setup' },
    { text: 'Floral decor on board', group_title: 'Entry Setup' },
    { text: '5 wooden log bases', group_title: 'Centrepieces' },
    { text: '5 pairs of baby mittens', group_title: 'Centrepieces' },
    { text: "5 glass vases with fresh baby's breath", group_title: 'Centrepieces' },
  ];
}

function honeyBackdropChoice(prefix) {
  return [
    choiceOption(`${prefix}-backdrop`, 'Backdrop (choose 1)', 'A little honey'),
    whenInclusion(`${prefix}-backdrop`, 'A little honey', 'Balloon backdrop — A little honey theme'),
    choiceOption(`${prefix}-backdrop`, 'Backdrop (choose 1)', 'Mama to bee'),
    whenInclusion(`${prefix}-backdrop`, 'Mama to bee', 'Balloon backdrop — Mama to bee theme'),
  ];
}

function printableCornersChoice(prefix) {
  return [
    choiceOption(`${prefix}-printables`, 'Printable Corners (choose 1)', '3 Framed custom messages'),
    whenInclusion(
      `${prefix}-printables`,
      '3 Framed custom messages',
      '3 framed custom message displays'
    ),
    choiceOption(`${prefix}-printables`, 'Printable Corners (choose 1)', 'Bar menu'),
    whenInclusion(`${prefix}-printables`, 'Bar menu', '1 custom bar menu display'),
  ];
}

function hhEntryAndCentrepieces() {
  return [
    { text: '1 Easel', group_title: 'Entry Setup' },
    { text: '1 Board', group_title: 'Entry Setup' },
    { text: 'Floral decor on board', group_title: 'Entry Setup' },
    { text: '6 wooden log bases', group_title: 'Centrepieces' },
    { text: '12 honeycomb candles', group_title: 'Centrepieces' },
    { text: '6 glass vases with fresh flowers', group_title: 'Centrepieces' },
  ];
}

function ohBabeeBackdropChoice(prefix) {
  return [
    choiceOption(`${prefix}-backdrop`, 'Backdrop (choose 1)', 'Oh Babee'),
    whenInclusion(`${prefix}-backdrop`, 'Oh Babee', 'Balloon backdrop — Oh Babee theme'),
    choiceOption(`${prefix}-backdrop`, 'Backdrop (choose 1)', 'Mama to bee'),
    whenInclusion(`${prefix}-backdrop`, 'Mama to bee', 'Balloon backdrop — Mama to bee theme'),
  ];
}

const bw1Price = simplePriceBreakdown(4500);
const bw2Price = simplePriceBreakdown(5800);
const bw3Price = simplePriceBreakdown(11200, 3200);
const ls1Price = simplePriceBreakdown(11000);
const ls2Price = simplePriceBreakdown(15800, 3200);
const ls3Price = simplePriceBreakdown(21000, 3200);
const ls31Price = simplePriceBreakdown(24500, 3200);
const hh1Price = simplePriceBreakdown(25500, 3200);
const hh2Price = simplePriceBreakdown(31000, 3200);
const hh3Price = simplePriceBreakdown(52000, 3200);

const BABY_SHOWER_PACKAGES = [
  {
    sheet: 'BW1',
    title: 'Buzzing Welcome 1',
    slug: 'buzzing-welcome-1',
    theme_name: 'Buzzing Welcome',
    theme_slug_candidates: ['buzzing-welcome', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-1',
    ...bw1Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BUZZING_BEST_PLACED,
    why_we_love_it: BUZZING_WHY,
    description:
      'A sweet and simple setup to welcome guests into your celebration. With a charming entry display, soft balloon accents, and delicate floral centrepieces, this package adds just the right touch of warmth and festivity to your Little Honey baby shower.',
    key_decor_elements:
      'Charming entry display, soft balloon accents, and delicate floral centrepieces with lemons.',
    inclustions: [
      { text: '1 Easel', group_title: 'Entry Setup' },
      { text: '1 Board', group_title: 'Entry Setup' },
      { text: 'Balloon accent', group_title: 'Entry Setup' },
      {
        text: '5 bunches of flowers in vases with lemons',
        group_title: 'Centrepieces',
      },
    ],
  },
  {
    sheet: 'BW2',
    title: 'Buzzing Welcome 2',
    slug: 'buzzing-welcome-2',
    theme_name: 'Buzzing Welcome',
    theme_slug_candidates: ['buzzing-welcome', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-2',
    ...bw2Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BUZZING_BEST_PLACED,
    why_we_love_it: BUZZING_WHY,
    description:
      'A cheerful welcome setup featuring a balloon-styled entry sign, playful baby balloons, and sweet themed printables that instantly set the tone for a joyful baby shower.',
    key_decor_elements:
      'Balloon-styled entry sign, playful baby balloons, floral centrepieces, and a styled baby corner.',
    inclustions: [
      { text: '1 Easel', group_title: 'Entry Setup' },
      { text: '1 Board', group_title: 'Entry Setup' },
      { text: 'Balloon accent', group_title: 'Entry Setup' },
      {
        text: '5 bunches of flowers in vases with lemons',
        group_title: 'Centrepieces',
      },
      { text: 'B-A-B-Y blocks', group_title: 'Baby Corner' },
      {
        text: '2 helium balloon bunches (15 balloons)',
        group_title: 'Baby Corner',
      },
    ],
  },
  {
    sheet: 'BW3',
    title: 'Buzzing Welcome 3',
    slug: 'buzzing-welcome-3',
    theme_name: 'Buzzing Welcome',
    theme_slug_candidates: ['buzzing-welcome', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-3',
    ...bw3Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BUZZING_BEST_PLACED,
    why_we_love_it: BUZZING_WHY,
    description:
      'A styled setup featuring a floral welcome entry, a charming stroller accent, and a soft balloon backdrop that creates the perfect little corner for photos and celebrations.',
    key_decor_elements:
      'Floral welcome entry, baby corner styling, and a soft balloon backdrop for photos.',
    inclustions: [
      { text: '1 Easel', group_title: 'Entry Setup' },
      { text: '1 Board (custom)', group_title: 'Entry Setup' },
      { text: 'Balloon accent', group_title: 'Entry Setup' },
      { text: 'B-A-B-Y blocks', group_title: 'Baby Corner' },
      {
        text: '2 helium balloon bunches (15 balloons)',
        group_title: 'Baby Corner',
      },
      ...honeyBackdropChoice('bw3'),
    ],
  },
  {
    sheet: 'LS',
    title: 'Little stroll 1',
    slug: 'little-stroll-1',
    theme_name: 'Little Stroll',
    theme_slug_candidates: ['little-stroll', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-1',
    ...ls1Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BUZZING_BEST_PLACED,
    why_we_love_it: LITTLE_STROLL_WHY,
    description: LITTLE_STROLL_DESCRIPTION,
    key_decor_elements:
      'Floral-styled signage, themed backdrop, delicate centrepieces, and personalised printables.',
    inclustions: [
      ...lsEntryAndCentrepieces(),
      ...honeyBackdropChoice('ls1'),
      {
        text: '3 framed custom messages',
        group_title: 'Printables',
      },
    ],
  },
  {
    sheet: 'LS2',
    title: 'Little stroll 2',
    slug: 'little-stroll-2',
    theme_name: 'Little Stroll',
    theme_slug_candidates: ['little-stroll', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-2',
    ...ls2Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BUZZING_BEST_PLACED,
    why_we_love_it: LITTLE_STROLL_WHY,
    description: LITTLE_STROLL_DESCRIPTION,
    key_decor_elements:
      'Floral signage, backdrop, centrepieces, printables, and fresh floral bunches.',
    inclustions: [
      ...lsEntryAndCentrepieces(),
      ...honeyBackdropChoice('ls2'),
      ...printableCornersChoice('ls2'),
      {
        text: '3 floral bunch arrangements in glass vases',
        group_title: 'Florals',
      },
    ],
  },
  {
    sheet: 'LS3',
    title: 'Little stroll 3',
    slug: 'little-stroll-3',
    theme_name: 'Little Stroll',
    theme_slug_candidates: ['little-stroll', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-3',
    ...ls3Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BUZZING_BEST_PLACED,
    why_we_love_it: LITTLE_STROLL_WHY,
    description: LITTLE_STROLL_DESCRIPTION,
    key_decor_elements:
      'Full room styling with backdrop, florals, printables, and a styled bar setup.',
    inclustions: [
      ...lsEntryAndCentrepieces(),
      ...honeyBackdropChoice('ls3'),
      ...printableCornersChoice('ls3'),
      {
        text: '3 floral bunch arrangements in glass vases',
        group_title: 'Florals',
      },
      { text: '1 Basic bar', group_title: 'Furniture' },
      { text: '3 cocktail tables', group_title: 'Furniture' },
    ],
  },
  {
    sheet: 'LS3.1',
    title: 'Little stroll 3.1',
    slug: 'little-stroll-3-1',
    theme_name: 'Little Stroll',
    theme_slug_candidates: ['little-stroll', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-3',
    ...ls31Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BUZZING_BEST_PLACED,
    why_we_love_it: LITTLE_STROLL_WHY,
    description: LITTLE_STROLL_DESCRIPTION,
    key_decor_elements:
      'Double-panel backdrop, bar setup, florals, and a dedicated cake table.',
    inclustions: [
      ...lsEntryAndCentrepieces(),
      choiceOption('ls31-backdrop', 'Double Panel Backdrop (choose 1)', 'Oh Babee'),
      whenInclusion('ls31-backdrop', 'Oh Babee', 'Double panel balloon backdrop — Oh Babee theme'),
      choiceOption('ls31-backdrop', 'Double Panel Backdrop (choose 1)', 'Mama to bee'),
      whenInclusion(
        'ls31-backdrop',
        'Mama to bee',
        'Double panel balloon backdrop — Mama to bee theme'
      ),
      ...printableCornersChoice('ls31'),
      {
        text: '3 floral bunch arrangements in glass vases',
        group_title: 'Florals',
      },
      { text: '1 Basic bar', group_title: 'Furniture' },
      { text: '3 cocktail tables', group_title: 'Furniture' },
      { text: '1 cake table', group_title: 'Furniture' },
    ],
  },
  {
    sheet: 'HH1',
    title: 'HH1',
    slug: 'hh-1',
    theme_name: 'Honey Hive',
    theme_slug_candidates: ['honey-hive', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-1',
    ...hh1Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: HH_BEST_PLACED,
    why_we_love_it: LITTLE_STROLL_WHY,
    description: HH_DESCRIPTION,
    key_decor_elements:
      'Premium centrepieces, backdrop, printables, and a complete bar and cake station.',
    inclustions: [
      ...hhEntryAndCentrepieces(),
      ...ohBabeeBackdropChoice('hh1'),
      ...printableCornersChoice('hh1'),
      { text: '1 Basic bar', group_title: 'Furniture' },
      { text: '3 cocktail tables', group_title: 'Furniture' },
      { text: '1 cake table', group_title: 'Furniture' },
    ],
  },
  {
    sheet: 'HH2',
    title: 'HH2',
    slug: 'hh-2',
    theme_name: 'Honey Hive',
    theme_slug_candidates: ['honey-hive', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-2',
    ...hh2Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: HH_BEST_PLACED,
    why_we_love_it: LITTLE_STROLL_WHY,
    description: HH_DESCRIPTION,
    key_decor_elements:
      'Premium styling with guest wish station, premium bar cart, and styled furniture.',
    inclustions: [
      ...hhEntryAndCentrepieces(),
      ...ohBabeeBackdropChoice('hh2'),
      ...printableCornersChoice('hh2'),
      { text: '1 leave a wish station', group_title: 'Guest Engagement' },
      { text: '1 Premium bar cart', group_title: 'Furniture' },
      { text: '3 cocktail tables', group_title: 'Furniture' },
      { text: '1 cake table', group_title: 'Furniture' },
    ],
  },
  {
    sheet: 'HH3',
    title: 'HH3',
    slug: 'hh-3',
    theme_name: 'Honey Hive',
    theme_slug_candidates: ['honey-hive', 'a-little-honey', 'little-honey'],
    budget_level_slug: 'level-3',
    ...hh3Price,
    nitty_gritty: BABY_SHOWER_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: HH_BEST_PLACED,
    why_we_love_it: LITTLE_STROLL_WHY,
    description: HH_DESCRIPTION,
    key_decor_elements:
      'Full venue experience with wish station, dining tables, chairs, and cocktail styling.',
    inclustions: [
      ...hhEntryAndCentrepieces(),
      ...ohBabeeBackdropChoice('hh3'),
      ...printableCornersChoice('hh3'),
      { text: '1 Box', group_title: 'Leave a Wish Station' },
      { text: '1 leave a wish sign', group_title: 'Leave a Wish Station' },
      { text: '30 wish papers', group_title: 'Leave a Wish Station' },
      { text: '3 coloured pens', group_title: 'Leave a Wish Station' },
      { text: '4 round tables with linen', group_title: 'Furniture' },
      { text: '20 basic chairs', group_title: 'Furniture' },
      { text: '3 cocktail tables', group_title: 'Furniture' },
      { text: '1 cake table', group_title: 'Furniture' },
    ],
  },
  {
    sheet: 'OBB1',
    title: 'Oh Baby Basics 1',
    slug: 'oh-baby-basics-1',
    theme_name: 'Oh Baby Basics',
    theme_slug_candidates: ['oh-baby-basics', 'oh-baby', 'baby-shower'],
    budget_level_slug: 'level-1',
    ...sheetPrice(4200, 420, 600, [{ label: 'Package decor', amount: 4200 }]),
    nitty_gritty: PROPOSAL_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: OBB_BEST_PLACED,
    why_we_love_it: OBB_WHY,
    description: OH_BABY_DESCRIPTION,
    key_decor_elements:
      'Charming entry display with your choice of balloon or floral styling and matching centrepieces.',
    inclustions: [...obb1StyleChoice('obb1')],
  },
  {
    sheet: 'OBB2',
    title: 'Oh Baby Basics 2',
    slug: 'oh-baby-basics-2',
    theme_name: 'Oh Baby Basics',
    theme_slug_candidates: ['oh-baby-basics', 'oh-baby', 'baby-shower'],
    budget_level_slug: 'level-2',
    ...sheetPrice(7000, 700, 600, [{ label: 'Package decor', amount: 7000 }]),
    nitty_gritty: PROPOSAL_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: OBB_BEST_PLACED,
    why_we_love_it: OBB_WHY,
    description: OH_BABY_DESCRIPTION,
    key_decor_elements:
      'Welcome entry, styled centrepieces, and a baby corner in balloon or floral styling.',
    inclustions: [...obb2StyleChoice('obb2')],
  },
  {
    sheet: 'OBB3',
    title: 'Oh Baby Basics 3',
    slug: 'oh-baby-basics-3',
    theme_name: 'Oh Baby Basics',
    theme_slug_candidates: ['oh-baby-basics', 'oh-baby', 'baby-shower'],
    budget_level_slug: 'level-3',
    ...sheetPrice(16700, 1670, 1200, [
      { label: 'Entry and centrepieces', amount: 4200 },
      { label: 'Backdrop', amount: 10000 },
      { label: 'Baby corner', amount: 2500 },
    ]),
    nitty_gritty: PROPOSAL_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: OBB_BEST_PLACED,
    why_we_love_it: OBB_WHY,
    description: OH_BABY_DESCRIPTION,
    key_decor_elements:
      'Styled entry, statement backdrop, and baby corner — each with balloon or floral options.',
    inclustions: [
      ...obb3SetupStyleChoice('obb3'),
      ...ohBabyBackdropChoice('obb3'),
      ...ohBabyCornerStyleChoice('obb3'),
    ],
  },
  {
    sheet: 'BBB1',
    title: 'Baby in Bloom 1',
    slug: 'baby-in-bloom-1',
    theme_name: 'Baby in Bloom',
    theme_slug_candidates: ['baby-in-bloom', 'oh-baby', 'baby-shower'],
    budget_level_slug: 'level-1',
    ...sheetPrice(23000, 2300, 3200, [
      { label: 'Entrance setup', amount: 2000 },
      { label: 'Centrepieces', amount: 2000 },
      { label: 'Baby corner balloon', amount: 4500 },
      { label: 'B-A-B-Y blocks', amount: 2500 },
      { label: 'Backdrop', amount: 12000 },
    ]),
    nitty_gritty: PROPOSAL_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BBB_BEST_PLACED,
    why_we_love_it: BBB_WHY,
    description: OH_BABY_DESCRIPTION,
    key_decor_elements:
      'Teddy centrepieces, baby corner styling, and a statement backdrop for photos.',
    inclustions: [
      ...bloomEntranceAndCentrepieces(),
      { text: '2 baby corner balloon clusters', group_title: 'Baby Corner' },
      { text: 'B-A-B-Y letter blocks', group_title: 'Baby Corner' },
      { text: 'Hot air balloon decor', group_title: 'Baby Corner' },
      ...bloomBackdropChoice('bbb1'),
    ],
  },
  {
    sheet: 'BBB2',
    title: 'Baby in Bloom 2',
    slug: 'baby-in-bloom-2',
    theme_name: 'Baby in Bloom',
    theme_slug_candidates: ['baby-in-bloom', 'oh-baby', 'baby-shower'],
    budget_level_slug: 'level-2',
    ...sheetPrice(23000, 2300, 3200, [
      { label: 'Entrance setup', amount: 2000 },
      { label: 'Centrepieces', amount: 2000 },
      { label: 'Baby corner', amount: 2500 },
      { label: 'Backdrop', amount: 12000 },
      { label: 'Games and engagements', amount: 4500 },
    ]),
    nitty_gritty: PROPOSAL_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: BBB_BEST_PLACED,
    why_we_love_it: BBB_WHY,
    description: OH_BABY_DESCRIPTION,
    key_decor_elements:
      'Statement backdrop, baby corner styling, and an interactive guest game station.',
    inclustions: [
      ...bloomEntranceAndCentrepieces(),
      { text: 'B-A-B-Y letter blocks', group_title: 'Baby Corner' },
      { text: 'Hot air balloon decor', group_title: 'Baby Corner' },
      ...bloomBackdropChoice('bbb2'),
      ...diaperGamesChoice('bbb2'),
    ],
  },
  {
    sheet: 'UU1',
    title: 'Up Up & Baby 1',
    slug: 'up-up-and-baby-1',
    theme_name: 'Up Up & Baby',
    theme_slug_candidates: ['up-up-and-baby', 'oh-baby', 'baby-shower'],
    budget_level_slug: 'level-2',
    ...sheetPrice(29100, 2910, 3200, [
      { label: 'Entrance setup', amount: 2000 },
      { label: 'Centrepieces', amount: 2000 },
      { label: 'Baby corner', amount: 2500 },
      { label: 'Backdrop', amount: 12000 },
      { label: 'Diaper momento game', amount: 4500 },
      { label: 'Basic bar', amount: 2500 },
      { label: 'Cocktail tables', amount: 3000 },
      { label: 'Cake table', amount: 600 },
    ]),
    nitty_gritty: PROPOSAL_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: UU_BEST_PLACED,
    why_we_love_it: UU_WHY,
    description: OH_BABY_DESCRIPTION,
    key_decor_elements:
      'Full celebration styling with backdrop, games, bar setup, and cocktail tables.',
    inclustions: [
      ...bloomEntranceAndCentrepieces(),
      ...babyCornerBlocksOrBalloonChoice('uu1'),
      ...bloomBackdropChoice('uu1'),
      {
        text: 'Diaper Momento setup — 20 diapers, 1 basket, 1 pack coloured pens, small easel',
        group_title: 'Games and Engagements',
      },
      { text: '1 basic bar with black masking', group_title: 'Bar Setup' },
      { text: '3 cocktail tables', group_title: 'Bar Setup' },
      { text: '1 cake table', group_title: 'Bar Setup' },
    ],
  },
  {
    sheet: 'UU2',
    title: 'Up Up & Baby 2',
    slug: 'up-up-and-baby-2',
    theme_name: 'Up Up & Baby',
    theme_slug_candidates: ['up-up-and-baby', 'oh-baby', 'baby-shower'],
    budget_level_slug: 'level-3',
    ...sheetPrice(40500, 4050, 3200, [
      { label: 'Entrance setup', amount: 2000 },
      { label: 'Centrepieces', amount: 2000 },
      { label: 'Baby corner', amount: 2500 },
      { label: 'Backdrop', amount: 12000 },
      { label: 'Diaper momento game', amount: 4500 },
      { label: 'Basic bar', amount: 2500 },
      { label: 'Cocktail tables', amount: 3000 },
      { label: 'Cake table', amount: 1000 },
      { label: 'Round tables with linens', amount: 1500 },
      { label: 'Basic chairs', amount: 4500 },
      { label: 'Fairy lights and electrician', amount: 5000 },
    ]),
    nitty_gritty: PROPOSAL_NITTY_GRITTY,
    price_covers: BABY_SHOWER_PRICE_COVERS,
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: UU_BEST_PLACED,
    why_we_love_it: UU_WHY,
    description: OH_BABY_DESCRIPTION,
    key_decor_elements:
      'Complete venue experience with dining furniture, lighting, bar, games, and backdrop styling.',
    inclustions: [
      ...bloomEntranceAndCentrepieces(),
      ...babyCornerBlocksOrBalloonChoice('uu2'),
      ...bloomBackdropChoice('uu2'),
      {
        text: 'Diaper Momento setup — 20 diapers, 1 basket, 1 pack coloured pens, small easel',
        group_title: 'Games and Engagements',
      },
      { text: '1 basic bar with black masking', group_title: 'Bar Setup' },
      { text: '3 cocktail tables', group_title: 'Bar Setup' },
      { text: '1 cake table', group_title: 'Furniture' },
      { text: '3 round tables with linens', group_title: 'Furniture' },
      { text: '15 basic chairs', group_title: 'Furniture' },
      { text: '10 fairy light strings', group_title: 'Lighting' },
      { text: 'Electrician for lighting setup', group_title: 'Lighting' },
    ],
  },
];

async function seedDecorBabyShowerPackages(strapi) {
  return seedDecorPackages(strapi, BABY_SHOWER_PACKAGES, {
    eventSlugCandidates: BABY_SHOWER_EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-baby-shower',
  });
}

module.exports = {
  BABY_SHOWER_PACKAGES,
  BABY_SHOWER_EVENT_SLUG_CANDIDATES,
  seedDecorBabyShowerPackages,
};
