'use strict';

const {
  PROPOSAL_PRICE_COVERS,
  PROPOSAL_SETUP_NEEDS_PC,
  ensureEventDocumentId,
  ensureThemeDocumentId,
  seedDecorPackages,
} = require('./decor-proposal-shared');

const ANNIVERSARY_EVENT_SLUG_CANDIDATES = [
  'anniversary',
  'anniversary-evenings',
  'anniversaries',
  'anniversary-packages',
  'still-us',
];

const ANNIVERSARY_SETUP_NEEDS = PROPOSAL_SETUP_NEEDS_PC;

const TABLE_STORIES_BEST_PLACED =
  'Table centers, console tables, coffee tables or any corner of your house — perfect for spots where guests pause, sit, and connect.';

const TABLE_STORIES_WHY = 'This setup turns decor into conversation.';

const FLOATING_MOMENTS_BEST_PLACED =
  'Entry points, backdrop areas, living / bed rooms, terraces, or party corners — anywhere you want an instant pop of celebration.';

const FLOATING_MOMENTS_WHY =
  'It adds emotion without going overboard — balloons that float and memories that stay.';

const FIRST_DATE_BEST_PLACED =
  'Terraces, balconies, backyards, or even a cosy corner of a 5-star hotel or boutique property.';

const FIRST_DATE_WHY =
  "It's the perfect gift to your partner — an experience that lets you pause time and go on your first date, all over again.";

const PRIVATE_CORNER_BEST_PLACED =
  'Terraces, balconies, backyards, or any cozy corner.';

const PRIVATE_CORNER_WHY =
  "Perfect when you want privacy and comfort. It's warm, personal, and feels like a moment made just for the two of you.";

const UNDER_THE_STARS_BEST_PLACED =
  'Terraces, rooftops, lawns, backyards, balconies, or even a room (if one wishes to be indoors).';

const UNDER_THE_STARS_WHY =
  'A perfect way for slowing down, playing, spending quality time or watching a movie together under the stars.';

const UNDER_THE_STARS_SETUP_NEEDS =
  'A small area for our team to work, access to water and electricity. Laptop or firestick to play a movie of your choice. Active Internet connection.';

const ALL_THAT_MATTERS_BEST_PLACED =
  'Your living or dining room. Or even rooftop terraces or gardens.';

const ALL_THAT_MATTERS_WHY =
  "It's something special but effortless. This for those occasions where you feel don't want to elaborate it this time.";

const ALL_THAT_MATTERS_SETUP_NEEDS =
  'A small area for our team to work, access to water and electricity. Images for the backdrop (timeline will be suggested by team Elewen after booking). Active Internet connection.';

const SIGNATURE_ESSENTIALS_BEST_PLACED =
  'House parties and small venues where you want a neat, well-styled setup.';

const SIGNATURE_ESSENTIALS_WHY =
  'It delivers a complete event look with all the right essentials.';

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

const ANNIVERSARY_PACKAGES = [
  {
    sheet: 'TS 1',
    title: 'Table Stories 1',
    slug: 'table-stories-1',
    theme_name: 'Table Stories',
    theme_slug_candidates: ['table-stories', 'still-us'],
    budget_level_slug: 'level-1',
    base_price: 5550,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: TABLE_STORIES_BEST_PLACED,
    why_we_love_it: TABLE_STORIES_WHY,
    description:
      'Centerpieces with photographs that weave timeless accents into a decor story. It feels deeply personal yet effortlessly elegant.',
    key_decor_elements:
      'Think framed memories resting on flower vases, subtle nods to time, capturing emotions that do not fade.',
    price_breakdown: [
      { label: '5 bunches centerpieces', amount: 2000 },
      { label: '5 pictures on vases', amount: 2500 },
      { label: 'Platform fee', amount: 450 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      { text: '5 bunches of flowers arranged in 5 vases', group_title: 'Floral Centerpieces' },
      { text: '5 printed photos placed on the vases', group_title: 'Floral Centerpieces' },
    ],
  },
  {
    sheet: 'TS 2',
    title: 'Table Stories 2',
    slug: 'table-stories-2',
    theme_name: 'Table Stories',
    theme_slug_candidates: ['table-stories', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 6980,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: TABLE_STORIES_BEST_PLACED,
    why_we_love_it: TABLE_STORIES_WHY,
    description:
      'This centerpiece concept blends florals, photographs, and soft candlelight to create an intimate storytelling experience across your tables.',
    key_decor_elements:
      'Think delicate floral bunches, photographs on easel stands, handwritten-style notes, and candle-lit accents that invite guests to pause, read, and feel.',
    price_breakdown: [
      { label: '5 bunches centerpieces', amount: 2500 },
      { label: '5 pictures on vases', amount: 350 },
      { label: '10 candles in glasses', amount: 500 },
      { label: '5 easel stands', amount: 200 },
      { label: 'Display option', amount: 2250 },
      { label: 'Platform fee', amount: 580 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      choiceOption('ts2-setup', 'Choose 1', 'Floral Memory Setup', { amount: 4730 }),
      whenInclusion('ts2-setup', 'Floral Memory Setup', '5 floral centerpieces in vases'),
      whenInclusion('ts2-setup', 'Floral Memory Setup', '5 printed photos on vases'),
      whenInclusion('ts2-setup', 'Floral Memory Setup', '10 candles in glass holders'),
      whenInclusion(
        'ts2-setup',
        'Floral Memory Setup',
        '5 photos on mini easel stands with space for personalized notes'
      ),
      choiceOption('ts2-setup', 'Choose 1', 'Image Placards', { amount: 6980 }),
      whenInclusion('ts2-setup', 'Image Placards', '5 image placards'),
      whenInclusion(
        'ts2-setup',
        'Image Placards',
        '5 frames with quotes on love, life and togetherness'
      ),
    ],
  },
  {
    sheet: 'TS 2/3',
    title: 'Table Stories 2/3',
    slug: 'table-stories-2-3',
    theme_name: 'Table Stories',
    theme_slug_candidates: ['table-stories', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 7805,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: TABLE_STORIES_BEST_PLACED,
    why_we_love_it: TABLE_STORIES_WHY,
    description:
      'This centerpiece concept blends florals, photographs, and soft candlelight to create an intimate storytelling experience across your tables.',
    key_decor_elements:
      'Think delicate floral bunches, photographs on easel stands, handwritten-style notes, and candle-lit accents that invite guests to pause, read, and feel.',
    price_breakdown: [
      { label: '5 bunches centerpieces', amount: 2500 },
      { label: '5 pictures on vases', amount: 350 },
      { label: '10 candles in glasses', amount: 2500 },
      { label: '5 easel stands', amount: 200 },
      { label: '5 wooden logs', amount: 1000 },
      { label: 'Platform fee', amount: 655 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      choiceOption('ts23-setup', 'Choose 1', 'Floral Memory Setup'),
      whenInclusion('ts23-setup', 'Floral Memory Setup', '5 floral arrangements in vases'),
      whenInclusion('ts23-setup', 'Floral Memory Setup', '5 printed photos'),
      whenInclusion('ts23-setup', 'Floral Memory Setup', '10 candles in glass holders'),
      whenInclusion('ts23-setup', 'Floral Memory Setup', '5 photos on mini easel stands'),
      whenInclusion('ts23-setup', 'Floral Memory Setup', '5 personalized tent notes'),
      whenInclusion('ts23-setup', 'Floral Memory Setup', '5 wooden logs for styling'),
      choiceOption('ts23-setup', 'Choose 1', 'Photo Display Setup'),
      choiceOption('ts23-image-display', 'Image Display (choose 1)', '7 image placards', {
        parentKey: 'ts23-setup',
        parentValue: 'Photo Display Setup',
      }),
      choiceOption('ts23-image-display', 'Image Display (choose 1)', '10 framed photos', {
        parentKey: 'ts23-setup',
        parentValue: 'Photo Display Setup',
      }),
      whenInclusion(
        'ts23-setup',
        'Photo Display Setup',
        '7 frames with quotes on love, life and togetherness'
      ),
    ],
  },
  {
    sheet: 'TS 3',
    title: 'Table Stories 3',
    slug: 'table-stories-3',
    theme_name: 'Table Stories',
    theme_slug_candidates: ['table-stories', 'still-us'],
    budget_level_slug: 'level-3',
    base_price: 9950,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: TABLE_STORIES_BEST_PLACED,
    why_we_love_it: TABLE_STORIES_WHY,
    description:
      'This centerpiece concept blends florals / letters, photographs, and soft candlelight to create an intimate storytelling experience across your tables.',
    key_decor_elements:
      'Think delicate floral bunches or thoughtful letters, photographs on easel stands, handwritten-style notes, and candle-lit accents that invite guests to pause, read, and feel.',
    price_breakdown: [
      { label: '5 floral arrangements', amount: 4000 },
      { label: '5 vases with pictures', amount: 4000 },
      { label: '10 candles in glasses', amount: 500 },
      { label: 'Platform fee', amount: 850 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      choiceOption('ts3-setup', 'Choose 1', 'Floral Setup'),
      whenInclusion('ts3-setup', 'Floral Setup', '5 floral arrangements in vases'),
      choiceOption('ts3-setup', 'Choose 1', 'Memory Notes Setup'),
      whenInclusion(
        'ts3-setup',
        'Memory Notes Setup',
        '5 "Letters We Never Wrote" / quotes on marriage, memories and milestones shared'
      ),
      {
        text: '5 customised centrepieces with images on all 4 sides',
        group_title: 'Included in both options',
      },
      { text: '10 candles in glass holders', group_title: 'Included in both options' },
    ],
  },
  {
    sheet: 'FM 1',
    title: 'Floating Moments 1',
    slug: 'floating-moments-1',
    theme_name: 'Floating Moments',
    theme_slug_candidates: ['floating-moments', 'still-us'],
    budget_level_slug: 'level-1',
    base_price: 6100,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: FLOATING_MOMENTS_BEST_PLACED,
    why_we_love_it: FLOATING_MOMENTS_WHY,
    description:
      'Floating hearts, personalised balloon accents, and milestone standees that instantly turn any corner into a celebration.',
    key_decor_elements:
      'An intimate, beautifully styled setup designed for slow conversations. Think soft florals, cozy seating, and a table that invites you to sit, sip, and spill everything.',
    price_breakdown: [
      { label: 'Balloon setup', amount: 2500 },
      { label: 'Balloon arch / standees', amount: 2500 },
      { label: 'Platform fee', amount: 500 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    // Same choice pattern as HH1: is_choice_group rows → "What's included" option cards
    inclustions: [
      choiceOption('fm1-balloon-setup', 'Balloon Setup', 'Loose Helium 10 heart shaped balloons with sign'),
      choiceOption('fm1-balloon-setup', 'Balloon Setup', 'Balloon Bouquet'),
      choiceOption('fm1-arch-setup', 'Balloon Arch Setup', 'Balloon Arch with sign'),
      choiceOption('fm1-arch-setup', 'Balloon Arch Setup', '2 small standees (10 years)'),
    ],
  },
  {
    sheet: 'FM 2',
    title: 'Floating Moments 2',
    slug: 'floating-moments-2',
    theme_name: 'Floating Moments',
    theme_slug_candidates: ['floating-moments', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 6485,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: FLOATING_MOMENTS_BEST_PLACED,
    why_we_love_it: FLOATING_MOMENTS_WHY,
    description:
      'Floating helium balloons paired with hanging photo memories and milestone standees, turning celebration into a visual story.',
    key_decor_elements:
      'Floating helium balloons paired with hanging photo memories and milestone standees, turning celebration into a visual story.',
    price_breakdown: [
      { label: '10 loose helium balloons', amount: 1500 },
      { label: '10 pictures hung with balloons', amount: 500 },
      { label: '2 small standees', amount: 2850 },
      { label: 'Happy Anniversary sign', amount: 500 },
      { label: 'Platform fee', amount: 535 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      { text: '10 loose helium balloons', group_title: 'Balloon Styling' },
      { text: '10 pictures hung with balloons', group_title: 'Balloon Styling' },
      { text: '2 small standees ("10 Years")', group_title: 'Balloon Styling' },
      { text: '"Happy Anniversary" sign made with balloons', group_title: 'Balloon Styling' },
    ],
  },
  {
    sheet: 'FM 2/3',
    title: 'Floating Moments 2/3',
    slug: 'floating-moments-2-3',
    theme_name: 'Floating Moments',
    theme_slug_candidates: ['floating-moments', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 11050,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: FLOATING_MOMENTS_BEST_PLACED,
    why_we_love_it: FLOATING_MOMENTS_WHY,
    description:
      'A full-scale celebration setup combining floating balloons, suspended photo memories, and a bold signature highlight. Perfect if you just want to add a little magic.',
    key_decor_elements:
      'A full-scale celebration setup combining floating balloons, suspended photo memories, and a bold signature highlight.',
    price_breakdown: [
      { label: '10 loose helium balloons', amount: 1500 },
      { label: '10 pictures hung with balloons', amount: 500 },
      { label: 'Easel stand with customised board', amount: 2850 },
      { label: 'Backdrop highlight', amount: 4650 },
      { label: 'Platform fee', amount: 950 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      { text: '10 loose helium balloons', group_title: 'Balloon Styling' },
      { text: '10 pictures hung with balloons', group_title: 'Balloon Styling' },
      {
        text: '1 easel stand with customised board, styled with balloons',
        group_title: 'Balloon Styling',
      },
      choiceOption('fm23-backdrop', 'Choose 1', 'Balloon Ring Backdrop', { amount: 11050 }),
      whenInclusion('fm23-backdrop', 'Balloon Ring Backdrop', 'Balloon ring backdrop with neon sign'),
      whenInclusion(
        'fm23-backdrop',
        'Balloon Ring Backdrop',
        'Neon options: "Still Us", "I Love You", or "Happy Anniversary"'
      ),
      choiceOption('fm23-backdrop', 'Choose 1', 'Illuminated Letters Setup', { amount: 6400 }),
      whenInclusion(
        'fm23-backdrop',
        'Illuminated Letters Setup',
        '2 large LED letters styled with lights and balloons'
      ),
    ],
  },
  {
    sheet: 'FM 3',
    title: 'Floating Moments 3',
    slug: 'floating-moments-3',
    theme_name: 'Floating Moments',
    theme_slug_candidates: ['floating-moments', 'still-us'],
    budget_level_slug: 'level-3',
    base_price: 16400,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at:
      'This package is ideal when you want your party to look professionally done, feel celebratory, and photograph well, without adding layers you do not really need.',
    why_we_love_it: 'You spend smart, keep it clean, and still get a complete event-like setup.',
    description:
      'Perfect if you want just the essentials done right — a styled entry, balloons, a backdrop, and a bar. So your space looks like an event without going overboard.',
    key_decor_elements:
      'Perfect if you want just the essentials done right — a styled entry, balloons, a backdrop, and a bar.',
    price_breakdown: [
      { label: 'Entry easel with balloons', amount: 2000 },
      { label: 'Bar or backdrop setup', amount: 10000 },
      { label: 'Neon sign', amount: 800 },
      { label: 'Platform fee', amount: 1200 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Entry easel with balloons', group_title: 'Entrance' },
      choiceOption('fm3-highlight', 'Choose 1', 'Bar Setup'),
      whenInclusion('fm3-highlight', 'Bar Setup', 'Bar styled with balloons'),
      choiceOption('fm3-highlight', 'Choose 1', 'Backdrop Setup'),
      whenInclusion('fm3-highlight', 'Backdrop Setup', 'Single panel / shimmer wall backdrop'),
      {
        text: 'Neon sign — "Still Us", "I Love You" or "Happy Anniversary"',
        group_title: 'Neon Sign',
      },
    ],
  },
  {
    sheet: 'FD 1/2',
    title: 'First Date 1',
    slug: 'first-date-1',
    theme_name: 'First Date',
    theme_slug_candidates: ['first-date', 'still-us'],
    budget_level_slug: 'level-1',
    base_price: 13430,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: FIRST_DATE_BEST_PLACED,
    why_we_love_it: FIRST_DATE_WHY,
    description:
      'A ready-to-go romantic setup with warm lights, candles, and a private table for two. Perfect when you want to do something special without overthinking it.',
    key_decor_elements:
      'A ready-to-go romantic setup with warm lights, candles, and a private table for two.',
    price_breakdown: [
      { label: 'Ambient lighting', amount: 5000 },
      { label: 'Walkway with lanterns and roses', amount: 1700 },
      { label: 'Table with linen and chairs', amount: 1600 },
      { label: 'Table centerpiece', amount: 1000 },
      { label: 'Platform fee', amount: 930 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      choiceOption('fd1-lighting', 'Choose 1', 'Fairy Light Setup'),
      whenInclusion(
        'fd1-lighting',
        'Fairy Light Setup',
        '10 strings of fairy lights, each covering 10–12 ft.'
      ),
      choiceOption('fd1-lighting', 'Choose 1', 'Lantern Lighting Setup'),
      whenInclusion('fd1-lighting', 'Lantern Lighting Setup', '10 paper lanterns with lights'),
      {
        text: '5 lanterns with candles and rose pathway leading to the setup',
        group_title: 'Pathway Décor',
      },
      { text: 'Basic table with black linen', group_title: 'Furniture' },
      { text: '2 chairs with black linen', group_title: 'Furniture' },
      { text: '1 table centerpiece with 2–3 candles', group_title: 'Table Setup' },
    ],
  },
  {
    sheet: 'FD 2',
    title: 'First Date 2',
    slug: 'first-date-2',
    theme_name: 'First Date',
    theme_slug_candidates: ['first-date', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 19590,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: FIRST_DATE_BEST_PLACED,
    why_we_love_it: FIRST_DATE_WHY,
    description:
      'A ready-to-go romantic setup with warm lights, candles, and a private table for two. Perfect when you want to do something special without overthinking it.',
    key_decor_elements:
      'A ready-to-go romantic setup with warm lights, candles, lantern accents, and a styled private table for two.',
    price_breakdown: [
      { label: 'Ambient lighting', amount: 5000 },
      { label: '8–10 lanterns with candles', amount: 3000 },
      { label: 'Walkway with candles and roses', amount: 1700 },
      { label: 'Round table with linen and two chairs', amount: 1700 },
      { label: 'Floral runner, candles & personal element', amount: 3500 },
      { label: 'Platform fee', amount: 1490 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      choiceOption('fd2-lighting', 'Choose 1', 'Fairy Light Setup'),
      whenInclusion(
        'fd2-lighting',
        'Fairy Light Setup',
        '10 strings of fairy lights, each covering 10–12 ft.'
      ),
      choiceOption('fd2-lighting', 'Choose 1', 'Lantern Lighting Setup'),
      whenInclusion(
        'fd2-lighting',
        'Lantern Lighting Setup',
        '10–15 paper lanterns with lights'
      ),
      {
        text: 'Warm-lit lanterns, roses and candles walkway leading to the setup',
        group_title: 'Pathway Décor',
      },
      { text: '1 round table', group_title: 'Furniture' },
      { text: '2 comfortable chairs', group_title: 'Furniture' },
      { text: 'Floral table runner', group_title: 'Table Setup' },
      { text: 'Candles', group_title: 'Table Setup' },
      {
        text: 'Personalised element (4–5 pictures / favourite memory highlights)',
        group_title: 'Table Setup',
      },
      {
        text: '8–10 lanterns with candles as decor accents',
        group_title: 'Decor Elements',
      },
    ],
  },
  {
    sheet: 'FD 3',
    title: 'First Date 3',
    slug: 'first-date-3',
    theme_name: 'First Date',
    theme_slug_candidates: ['first-date', 'still-us'],
    budget_level_slug: 'level-3',
    base_price: 27290,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: FIRST_DATE_BEST_PLACED,
    why_we_love_it: FIRST_DATE_WHY,
    description:
      'A ready-to-go romantic setup with warm lights, candles, and a private table for two. Perfect when you want to do something special without overthinking it.',
    key_decor_elements:
      'Romantic table for two with ambient lighting, lantern accents, and a canopy-inspired drape structure.',
    price_breakdown: [
      { label: 'Ambient lighting', amount: 5000 },
      { label: 'Paper lanterns with lights', amount: 1000 },
      { label: '8–10 lanterns with candles', amount: 3000 },
      { label: 'Walkway with candles and roses', amount: 1700 },
      { label: 'Round table with linen and two chairs', amount: 1700 },
      { label: 'Floral runner, candles & personal element', amount: 3500 },
      { label: 'Tent / canopy with drapes', amount: 6000 },
      { label: 'Platform fee', amount: 2190 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      choiceOption('fd3-lighting', 'Choose 1', 'Fairy Light Setup'),
      whenInclusion(
        'fd3-lighting',
        'Fairy Light Setup',
        '10 strings of fairy lights, each covering 10–12 ft.'
      ),
      choiceOption('fd3-lighting', 'Choose 1', 'Lantern Lighting Setup'),
      whenInclusion(
        'fd3-lighting',
        'Lantern Lighting Setup',
        '10–15 paper lanterns with lights'
      ),
      {
        text: 'Warm-lit lanterns, roses and candles walkway leading to the setup',
        group_title: 'Pathway Décor',
      },
      { text: '1 round table', group_title: 'Furniture' },
      { text: '2 comfortable chairs', group_title: 'Furniture' },
      { text: 'Floral table runner', group_title: 'Table Setup' },
      { text: 'Candles', group_title: 'Table Setup' },
      {
        text: 'Personalised element (4–5 pictures / favourite memory highlights)',
        group_title: 'Table Setup',
      },
      {
        text: '8–10 lanterns with candles as decor accents',
        group_title: 'Decor Elements',
      },
      {
        text: 'Canopy-inspired structure with drapes, creating a cosy and intimate space',
        group_title: 'Canopy Styling',
      },
    ],
  },
  {
    sheet: 'PC SU 1',
    title: 'Our Private Corner 1',
    slug: 'still-us-our-private-corner-1',
    theme_name: 'Our Private Corner',
    theme_slug_candidates: ['our-private-corner', 'still-us'],
    budget_level_slug: 'level-1',
    base_price: 22890,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: PRIVATE_CORNER_BEST_PLACED,
    why_we_love_it: PRIVATE_CORNER_WHY,
    description:
      'A dreamy canopy setup with soft drapes, fairy lights, cozy cushions, and candlelit details that create your own little world.',
    key_decor_elements:
      'A dreamy canopy setup with soft drapes, fairy lights, cozy cushions, and candlelit details.',
    price_breakdown: [
      { label: 'Canopy setup with fairy lights', amount: 8000 },
      { label: 'Cushions and gadda', amount: 3000 },
      { label: '3 small floral vases', amount: 2000 },
      { label: '5 candles in glasses', amount: 600 },
      { label: 'Walkway with candles and roses', amount: 1700 },
      { label: 'Low table', amount: 1500 },
      { label: '2 centerpieces with candles', amount: 1100 },
      { label: 'Platform fee', amount: 1790 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Canopy-style setup with fairy lights', group_title: 'Canopy Styling' },
      { text: 'Floor seating with cushions and gadda', group_title: 'Seating' },
      { text: 'Walkway with candles and roses', group_title: 'Pathway Décor' },
      { text: 'Low table with runner', group_title: 'Table Setup' },
      { text: '2 centrepieces with candles', group_title: 'Table Setup' },
      { text: '3 small floral vases', group_title: 'Floral Accents' },
      { text: '5 candles in glass holders', group_title: 'Lighting Accents' },
    ],
  },
  {
    sheet: 'PC SU 2',
    title: 'Our Private Corner 2',
    slug: 'still-us-our-private-corner-2',
    theme_name: 'Our Private Corner',
    theme_slug_candidates: ['our-private-corner', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 34990,
    setup_needs: ANNIVERSARY_SETUP_NEEDS,
    best_placed_at: PRIVATE_CORNER_BEST_PLACED,
    why_we_love_it: PRIVATE_CORNER_WHY,
    description:
      'A dreamy canopy setup with soft drapes, fairy lights, cozy cushions, and candlelit details that create your own little world.',
    key_decor_elements:
      'Elevated canopy styling with florals, candle accents, personalised table details, and a couple game experience.',
    price_breakdown: [
      { label: 'Canopy setup with fairy lights', amount: 9000 },
      { label: 'Cushions and gadda', amount: 3000 },
      { label: 'Ceiling hangings', amount: 800 },
      { label: '5 small floral vases', amount: 2000 },
      { label: '2 large vases with florals', amount: 2500 },
      { label: '8–10 candle holders with candles', amount: 3000 },
      { label: '10 candles in glasses', amount: 600 },
      { label: 'Walkway with candles and roses', amount: 1700 },
      { label: 'Low table', amount: 1500 },
      { label: 'Table runner, florals, candles & personal element', amount: 3500 },
      { label: 'Intimate engagement game', amount: 1300 },
      { label: 'Platform fee', amount: 2890 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Canopy-style setup with fairy lights', group_title: 'Canopy Styling' },
      { text: 'Ceiling hangings within the canopy', group_title: 'Canopy Styling' },
      { text: 'Floor seating with cushions and gadda', group_title: 'Seating' },
      { text: 'Walkway with candles and roses', group_title: 'Pathway Décor' },
      { text: '5 small floral vases', group_title: 'Floral Styling' },
      { text: '2 large floral vases', group_title: 'Floral Styling' },
      {
        text: '8–10 assorted candle holders with candles',
        group_title: 'Lighting Accents',
      },
      { text: '10 candles in glass holders', group_title: 'Lighting Accents' },
      { text: 'Low table with styling', group_title: 'Table Setup' },
      { text: 'Table runner', group_title: 'Table Setup' },
      { text: 'Florals and candles', group_title: 'Table Setup' },
      {
        text: 'Personalised element (pictures / favourite memory highlights)',
        group_title: 'Table Setup',
      },
      {
        text: 'Couple game with guided prompts and complete setup for a private moment together',
        group_title: 'Experience Element',
      },
    ],
  },
  {
    sheet: 'US 1/2',
    title: 'Under the Stars 1',
    slug: 'under-the-stars-1',
    theme_name: 'Under the Stars',
    theme_slug_candidates: ['under-the-stars', 'still-us'],
    budget_level_slug: 'level-1',
    base_price: 6800,
    setup_needs: UNDER_THE_STARS_SETUP_NEEDS,
    best_placed_at: UNDER_THE_STARS_BEST_PLACED,
    why_we_love_it: UNDER_THE_STARS_WHY,
    description:
      'A cozy, open-air setup with soft lights, floor seating, candles, and thoughtful details.',
    key_decor_elements:
      'A cozy, open-air setup with soft lights, floor seating, candles, and thoughtful details.',
    price_breakdown: [
      { label: 'Fairy lights', amount: 2500 },
      { label: 'Floral vases', amount: 2000 },
      { label: 'Candles in glasses', amount: 600 },
      { label: 'Walkway with candles and roses', amount: 1700 },
      { label: 'Coffee tables', amount: 1000 },
      { label: 'Experience element', amount: 1300 },
      { label: 'Platform fee', amount: 500 },
      { label: 'Labour & Transport', amount: 1000 },
    ],
    inclustions: [
      { text: '3–5 fairy light strings', group_title: 'Ambient Lighting' },
      { text: 'Floor seating with gadda and cushions', group_title: 'Seating' },
      { text: 'Walkway with rose petals and candles', group_title: 'Pathway Décor' },
      { text: '5 small floral vases', group_title: 'Floral Styling' },
      { text: '10 candles in glass holders', group_title: 'Lighting Accents' },
      { text: '2 coffee tables styled for snacks, drinks, or activities', group_title: 'Tables & Styling' },
      choiceOption('us12-experience', 'Choose 1 Experience Option', 'Couple Connection Game'),
      whenInclusion(
        'us12-experience',
        'Couple Connection Game',
        'Guided game with prompts, instructions, and all materials included'
      ),
      choiceOption('us12-experience', 'Choose 1 Experience Option', 'Movie Night Setup'),
      whenInclusion('us12-experience', 'Movie Night Setup', 'Projector screen'),
      whenInclusion('us12-experience', 'Movie Night Setup', 'HDMI wire'),
      whenInclusion('us12-experience', 'Movie Night Setup', 'Sound system'),
      whenInclusion(
        'us12-experience',
        'Movie Night Setup',
        'Laptop / Firestick and internet connection to be arranged by the client'
      ),
    ],
  },
  {
    sheet: 'US 2/3',
    title: 'Under the Stars 2',
    slug: 'under-the-stars-2',
    theme_name: 'Under the Stars',
    theme_slug_candidates: ['under-the-stars', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 34660,
    setup_needs: UNDER_THE_STARS_SETUP_NEEDS,
    best_placed_at: UNDER_THE_STARS_BEST_PLACED,
    why_we_love_it: UNDER_THE_STARS_WHY,
    description:
      'A cozy, open-air setup with soft lights, floor seating, candles, and thoughtful details.',
    key_decor_elements:
      'A cozy, open-air setup with soft lights, floor seating, candles, and thoughtful details.',
    price_breakdown: [
      { label: 'Fairy lights', amount: 5000 },
      { label: 'Premium cushions and gadda', amount: 4000 },
      { label: 'Floral vases', amount: 2000 },
      { label: 'Candle holders and glasses', amount: 3600 },
      { label: 'Walkway with candles and roses', amount: 1700 },
      { label: 'Coffee tables and puff', amount: 2300 },
      { label: 'Experience element', amount: 5000 },
      { label: 'Platform fee', amount: 2860 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: '3–5 fairy light strings', group_title: 'Ambient Lighting' },
      { text: 'Floor seating with premium gadda and cushions', group_title: 'Seating' },
      { text: 'Walkway with rose petals and candles', group_title: 'Pathway Décor' },
      { text: '5 small floral vases', group_title: 'Floral Styling' },
      { text: '10 candles in glass holders', group_title: 'Lighting Accents' },
      { text: '2 coffee tables styled for snacks, drinks, or activities', group_title: 'Tables Setup' },
      choiceOption('us23-experience', 'Choose 1 Experience Option', 'Couple Connection Game'),
      whenInclusion(
        'us23-experience',
        'Couple Connection Game',
        'Guided game with prompts, instructions, and all materials included'
      ),
      choiceOption('us23-experience', 'Choose 1 Experience Option', 'Movie Night Experience'),
      whenInclusion('us23-experience', 'Movie Night Experience', 'Plasma screen'),
      whenInclusion('us23-experience', 'Movie Night Experience', 'HDMI wire'),
      whenInclusion('us23-experience', 'Movie Night Experience', 'Sound system'),
      whenInclusion(
        'us23-experience',
        'Movie Night Experience',
        'Laptop / Firestick and internet connection to be arranged by the client'
      ),
    ],
  },
  {
    sheet: 'ATM 1',
    title: 'All That Matters 1',
    slug: 'all-that-matters-1',
    theme_name: 'All That Matters',
    theme_slug_candidates: ['all-that-matters', 'still-us'],
    budget_level_slug: 'level-1',
    base_price: 26850,
    setup_needs: ALL_THAT_MATTERS_SETUP_NEEDS,
    best_placed_at: ALL_THAT_MATTERS_BEST_PLACED,
    why_we_love_it: ALL_THAT_MATTERS_WHY,
    description:
      'A warm, effortless setup for intimate celebrations — styled table, entrance, corners, and a basic bar. You provide the dinner table.',
    key_decor_elements:
      'A warm, effortless setup for intimate celebrations — styled table, entrance, corners, and a basic bar.',
    price_breakdown: [
      { label: 'Table setup', amount: 8000 },
      { label: 'Entrance styling', amount: 3500 },
      { label: 'Decor corners', amount: 4500 },
      { label: 'Basic bar', amount: 5455 },
      { label: 'Platform fee', amount: 2145 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Floral table runner with candles and décor accents', group_title: 'Table Setup' },
      { text: 'Dinner table to be provided by the client', group_title: 'Table Setup' },
      { text: 'Entry easel with floral setup', group_title: 'Entrance Styling' },
      { text: 'Crates, candles, and floral vases styled across corners', group_title: 'Decor Corners' },
      { text: 'Basic bar with black masking and menu display', group_title: 'Bar Setup' },
    ],
  },
  {
    sheet: 'ATM 2',
    title: 'All That Matters 2',
    slug: 'all-that-matters-2',
    theme_name: 'All That Matters',
    theme_slug_candidates: ['all-that-matters', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 39500,
    setup_needs: ALL_THAT_MATTERS_SETUP_NEEDS,
    best_placed_at: ALL_THAT_MATTERS_BEST_PLACED,
    why_we_love_it: ALL_THAT_MATTERS_WHY,
    description:
      'Everything in level 1, plus a long dining table with chairs and a photo backdrop for close friends and family.',
    key_decor_elements:
      'Everything in level 1, plus a long dining table with chairs and a photo backdrop for close friends and family.',
    price_breakdown: [
      { label: 'Table setup with chairs', amount: 12000 },
      { label: 'Entrance styling', amount: 3500 },
      { label: 'Decor corners', amount: 5000 },
      { label: 'Basic bar with neon', amount: 6500 },
      { label: 'Double panel backdrop', amount: 6000 },
      { label: 'Platform fee', amount: 3300 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Long dining table with chairs and floral runner', group_title: 'Table Setup' },
      { text: 'Candles and personalised décor elements on the table', group_title: 'Table Setup' },
      { text: 'Entry easel with floral setup', group_title: 'Entrance Styling' },
      { text: 'Crates, candles, and floral vases styled across corners', group_title: 'Venue Styling' },
      { text: 'Basic bar (6 × 3.5 ft.) with black masking', group_title: 'Bar Setup' },
      { text: 'Menu display', group_title: 'Bar Setup' },
      { text: 'Neon sign', group_title: 'Bar Setup' },
      {
        text: '8 × 8 ft. double panel backdrop with images of close friends and family',
        group_title: 'Backdrop',
      },
    ],
  },
  {
    sheet: 'ATM 3',
    title: 'All That Matters 3',
    slug: 'all-that-matters-3',
    theme_name: 'All That Matters',
    theme_slug_candidates: ['all-that-matters', 'still-us'],
    budget_level_slug: 'level-3',
    base_price: 82840,
    setup_needs: ALL_THAT_MATTERS_SETUP_NEEDS,
    best_placed_at: ALL_THAT_MATTERS_BEST_PLACED,
    why_we_love_it: ALL_THAT_MATTERS_WHY,
    description:
      'The full experience — premium bar, canopy draping, a larger backdrop, and richer décor across every corner.',
    key_decor_elements:
      'The full experience — premium bar, canopy draping, a larger backdrop, and richer décor across every corner.',
    price_breakdown: [
      { label: 'Table setup', amount: 15000 },
      { label: 'Entrance styling', amount: 5000 },
      { label: 'Decor corners and accents', amount: 12000 },
      { label: 'Fancy bar setup', amount: 18000 },
      { label: '12 × 8 ft. backdrop', amount: 15000 },
      { label: 'Canopy draping', amount: 7309 },
      { label: 'Platform fee', amount: 7231 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Floral table runner with candles and décor elements', group_title: 'Table Setup' },
      { text: 'Photos, fruits, and personalised accents on the table', group_title: 'Table Setup' },
      { text: 'Dinner menu placed on the table', group_title: 'Table Setup' },
      { text: 'Entry easel with floral setup', group_title: 'Entrance Styling' },
      { text: 'Crates, candles, and floral vases styled across corners', group_title: 'Decor Corners' },
      { text: 'Additional décor elements to enhance the overall vibe', group_title: 'Decor Corners' },
      { text: '6 ft. bar setup with menu display and neon sign', group_title: 'Bar Setup' },
      {
        text: '12 × 8 ft. backdrop with images of close friends and family',
        group_title: 'Backdrop',
      },
      { text: 'Canopy-style drapes creating an intimate space', group_title: 'Canopy Styling' },
    ],
  },
  {
    sheet: 'SE 1',
    title: 'Signature Essentials 1',
    slug: 'signature-essentials-1',
    theme_name: 'Signature Essentials',
    theme_slug_candidates: ['signature-essentials', 'still-us'],
    budget_level_slug: 'level-1',
    base_price: 19370,
    setup_needs: ALL_THAT_MATTERS_SETUP_NEEDS,
    best_placed_at: SIGNATURE_ESSENTIALS_BEST_PLACED,
    why_we_love_it: SIGNATURE_ESSENTIALS_WHY,
    description:
      'All the important elements. Clean, stylish, and pocket-friendly — this package instantly upgrades your space without going overboard.',
    key_decor_elements:
      'All the important elements. Clean, stylish, and pocket-friendly — this package instantly upgrades your space without going overboard.',
    price_breakdown: [
      { label: 'Entrance easel', amount: 1500 },
      { label: 'Backdrop (up to ₹6K)', amount: 6000 },
      { label: 'Printables on easel stands', amount: 1500 },
      { label: 'Basic bar', amount: 2500 },
      { label: 'Decor elements', amount: 2000 },
      { label: 'Centerpieces', amount: 1200 },
      { label: 'Platform fee', amount: 1470 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Entry easel stand with florals / balloons', group_title: 'Entrance Setup' },
      { text: 'Any backdrop within a ₹6K budget', group_title: 'Backdrop' },
      { text: '2–3 quotes printed and placed on mini easel stands', group_title: 'Table Accents' },
      { text: '3 small floral centrepieces in vases', group_title: 'Table Accents' },
      { text: 'Basic takhat bar with black masking', group_title: 'Bar Setup' },
      { text: 'Neon sign, candles, and vases across the venue', group_title: 'Decor Elements' },
    ],
  },
  {
    sheet: 'SE 2',
    title: 'Signature Essentials 2',
    slug: 'signature-essentials-2',
    theme_name: 'Signature Essentials',
    theme_slug_candidates: ['signature-essentials', 'still-us'],
    budget_level_slug: 'level-2',
    base_price: 31470,
    setup_needs: ALL_THAT_MATTERS_SETUP_NEEDS,
    best_placed_at: SIGNATURE_ESSENTIALS_BEST_PLACED,
    why_we_love_it: SIGNATURE_ESSENTIALS_WHY,
    description:
      'An upgraded essentials package with landmark entrance, single-panel backdrop, guest-book experience, and venue styling.',
    key_decor_elements:
      'An upgraded essentials package with landmark entrance, single-panel backdrop, guest-book experience, and venue styling.',
    price_breakdown: [
      { label: 'Landmark entrance easel', amount: 4000 },
      { label: 'Single panel backdrop', amount: 9000 },
      { label: 'Printables and table accents', amount: 3500 },
      { label: 'Basic bar with neon', amount: 3500 },
      { label: 'Venue styling corners', amount: 3500 },
      { label: 'Guest book experience', amount: 3127 },
      { label: 'Platform fee', amount: 2563 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Landmark easel with florals / balloons', group_title: 'Entrance Setup' },
      { text: 'Single panel backdrop', group_title: 'Backdrop' },
      { text: '2–3 quotes printed and placed on easel stands', group_title: 'Table Accents' },
      { text: '3 small floral centerpieces with photo frames for styling', group_title: 'Table Accents' },
      { text: 'Basic bar with black masking, menu display, and neon sign', group_title: 'Bar Setup' },
      { text: 'Candles, crates, and mirrors / frames styled across 2–3 corners', group_title: 'Venue Styling' },
      {
        text: '"Sign the Guest Book" interactive game — complete setup with all materials',
        group_title: 'Experience Element',
      },
    ],
  },
  {
    sheet: 'SE 3',
    title: 'Signature Essentials 3',
    slug: 'signature-essentials-3',
    theme_name: 'Signature Essentials',
    theme_slug_candidates: ['signature-essentials', 'still-us'],
    budget_level_slug: 'level-3',
    base_price: 60620,
    setup_needs: ALL_THAT_MATTERS_SETUP_NEEDS,
    best_placed_at: SIGNATURE_ESSENTIALS_BEST_PLACED,
    why_we_love_it: SIGNATURE_ESSENTIALS_WHY,
    description:
      'A complete décor setup with all the essentials — elevated, detailed, and thoughtfully layered for occasions that deserve more than the basics.',
    key_decor_elements:
      'A complete décor setup with all the essentials — elevated, detailed, and thoughtfully layered.',
    price_breakdown: [
      { label: 'Entrance highlight', amount: 8000 },
      { label: 'Backdrop', amount: 23000 },
      { label: 'Printables', amount: 1500 },
      { label: 'Bar setup', amount: 2500 },
      { label: 'Decor elements', amount: 7000 },
      { label: 'Centerpieces', amount: 4000 },
      { label: 'Guest book experience', amount: 1200 },
      { label: 'Fairy lights', amount: 5000 },
      { label: 'Platform fee', amount: 5220 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      choiceOption('se3-entrance', 'Entrance Setup (choose 1)', 'Floral Easel Entrance'),
      whenInclusion('se3-entrance', 'Floral Easel Entrance', 'Landmark easel with florals'),
      whenInclusion('se3-entrance', 'Floral Easel Entrance', 'Carpet and crates styling'),
      choiceOption('se3-entrance', 'Entrance Setup (choose 1)', 'Initials in Crates'),
      whenInclusion(
        'se3-entrance',
        'Initials in Crates',
        'Couple initials styled in crates with candles and lights'
      ),
      choiceOption('se3-entrance', 'Entrance Setup (choose 1)', 'Mirror Entrance'),
      whenInclusion('se3-entrance', 'Mirror Entrance', 'Mirror with florals and carpet'),
      choiceOption('se3-entrance', 'Entrance Setup (choose 1)', 'Crates Entrance'),
      whenInclusion('se3-entrance', 'Crates Entrance', 'Styled crates with florals and balloons'),
      choiceOption('se3-backdrop', 'Backdrop (choose 1)', 'Single Panel Backdrop'),
      choiceOption('se3-backdrop', 'Backdrop (choose 1)', 'Shimmer Wall Backdrop'),
      choiceOption('se3-backdrop', 'Backdrop (choose 1)', 'Double Panel Backdrop'),
      { text: '2–3 quotes with easel stands', group_title: 'Printables' },
      choiceOption('se3-bar', 'Bar Setup (choose 1)', 'Basic Bar'),
      whenInclusion('se3-bar', 'Basic Bar', 'Takhat bar with black masking'),
      whenInclusion('se3-bar', 'Basic Bar', 'Bar menu display and neon sign'),
      choiceOption('se3-bar', 'Bar Setup (choose 1)', 'Fancy Bar'),
      whenInclusion('se3-bar', 'Fancy Bar', 'Fancy bar with premium décor styling'),
      {
        text: 'Candles, ladder with memory lane, mirrors and frames',
        group_title: 'Decor Elements',
      },
      { text: '5 floral bunches in vases with small photo frames', group_title: 'Centerpieces' },
      {
        text: 'Sign the guest book / interactive game — setup and execution with all materials',
        group_title: 'Experience Element',
      },
      { text: 'Fairy lights across the venue', group_title: 'Lighting' },
    ],
  },
];

const STILL_US_EXTRA_PACKAGE_SLUGS = [
  'first-date-2',
  'first-date-3',
  'still-us-our-private-corner-1',
  'still-us-our-private-corner-2',
];

const STILL_US_EXTRA_PACKAGES = ANNIVERSARY_PACKAGES.filter(pkg =>
  STILL_US_EXTRA_PACKAGE_SLUGS.includes(pkg.slug)
);

async function ensureAnniversaryEvent(strapi) {
  return ensureEventDocumentId(strapi, {
    name: 'Anniversary',
    slugCandidates: ANNIVERSARY_EVENT_SLUG_CANDIDATES,
    display_order: 20,
  });
}

async function ensureAnniversaryThemes(strapi) {
  const themes = [
    { name: 'Still Us', slug: 'still-us', display_order: 60 },
    { name: 'Table Stories', slug: 'table-stories', display_order: 61 },
    { name: 'Floating Moments', slug: 'floating-moments', display_order: 62 },
    { name: 'First Date', slug: 'first-date', display_order: 63 },
    { name: 'Our Private Corner', slug: 'our-private-corner', display_order: 64 },
    { name: 'Under the Stars', slug: 'under-the-stars', display_order: 65 },
    { name: 'All That Matters', slug: 'all-that-matters', display_order: 66 },
    { name: 'Signature Essentials', slug: 'signature-essentials', display_order: 67 },
  ];

  for (const theme of themes) {
    await ensureThemeDocumentId(strapi, theme);
  }
}

async function seedDecorAnniversaryPackages(strapi) {
  await ensureAnniversaryEvent(strapi);
  await ensureAnniversaryThemes(strapi);
  return seedDecorPackages(strapi, ANNIVERSARY_PACKAGES, {
    eventSlugCandidates: ANNIVERSARY_EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-anniversary',
    refreshExistingDecor: true,
  });
}

/**
 * Seed only the 4 Still Us extras (First Date 2/3 + Still Us Private Corner 1/2).
 * Does not touch Proposal Private Corner slugs or existing Floating Moments balloons.
 */
async function seedStillUsExtraPackages(strapi) {
  await ensureAnniversaryEvent(strapi);
  await ensureAnniversaryThemes(strapi);

  return seedDecorPackages(strapi, STILL_US_EXTRA_PACKAGES, {
    eventSlugCandidates: ANNIVERSARY_EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/still-us-extra',
    refreshExistingDecor: true,
  });
}

module.exports = {
  ANNIVERSARY_PACKAGES,
  ANNIVERSARY_EVENT_SLUG_CANDIDATES,
  STILL_US_EXTRA_PACKAGES,
  STILL_US_EXTRA_PACKAGE_SLUGS,
  seedDecorAnniversaryPackages,
  seedStillUsExtraPackages,
};
