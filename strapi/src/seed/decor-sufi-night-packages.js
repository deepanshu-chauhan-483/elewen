'use strict';

const {
  ensureBudgetLevelDocumentId,
  ensureEventDocumentId,
  ensureThemeDocumentId,
  seedDecorPackages,
} = require('./decor-proposal-shared');

const EVENT_SLUG_CANDIDATES = [
  'engagement-parties',
  'engagement',
  'engagements',
  'proposal',
  'proposals',
];

const SUFI_NITTY_GRITTY =
  'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.';

const SUFI_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'Professional Setup' },
  { text: 'Final Dismantling' },
  { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
  { text: 'No hidden service fees.' },
];

const SUFI_SETUP_NEEDS =
  'A small area for our team to work, access to water and electricity. Final images prior to the event (timeline will be suggested by team Elewen after booking).';

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

const SUFI_NIGHT_PACKAGES = [
  {
    sheet: 'IS 1',
    title: 'Ishq Sufiyana 1',
    slug: 'ishq-sufiyana-1',
    theme_name: 'Ishq Sufiyana',
    budget_level_slug: 'level-1',
    base_price: 103000,
    description:
      'A soulful blend of warm lighting, classic brass accents and delicate floral layers, evoking an atmosphere of understated Sufi elegance.',
    key_decor_elements:
      'Think glowing lantern-lit walkways, intricate Jali patterns, candle abras / candle stands, diya wall.',
    nitty_gritty: SUFI_NITTY_GRITTY,
    setup_needs: SUFI_SETUP_NEEDS,
    best_placed_at:
      'Smaller venues, farmhouses, backyards, or private spaces that comfortably host up to 50-70 guests. Ideal for engagements where you want a celebration with your close family and friends.',
    why_we_love_it:
      'It keeps the focus on fun, real moments, and the people who truly matter. It\'s less about heavy décor, more about enjoying the celebration and the company around you.',
    theme_slug_candidates: ['sufi-night', 'ishq-sufiyana', 'ishq-sufi-yana'],
    price_covers: SUFI_PRICE_COVERS,
    price_breakdown: [
      { label: 'Entrance', amount: 10000 },
      { label: 'Flowers', amount: 15000 },
      { label: 'Loose flower rangoli', amount: 1000 },
      { label: 'Centerpieces', amount: 5000 },
      { label: 'Backdrop', amount: 20000 },
      { label: 'Bar', amount: 3500 },
      { label: 'Cocktail tables', amount: 1500 },
      { label: 'Lounge seating', amount: 8000 },
      { label: 'Tenting / fairy lights', amount: 10000 },
      { label: 'Lighting', amount: 8000 },
      { label: 'Decor elements on corners', amount: 10000 },
      { label: 'Photo-op', amount: 10000 },
      { label: 'Labour & Transport', amount: 1000 },
      { label: 'Platform fee', amount: 1000 },
    ],
    // Figma detail layout: fixed inclusion groups + Backdrop choose-1 cards.
    inclustions: [
      {
        text: '20–25 lantern pathway (small and big) with warm twinkling lights',
        group_title: 'Entrance',
      },
      {
        text: 'Fresh flowers in 5 small and 5 big vases',
        group_title: 'Flowers',
      },
      {
        text: 'Traditional floral rangolis at corners',
        group_title: 'Flowers',
      },
      {
        text: '5 centerpieces — lanterns, small flower vases, candles with holders',
        group_title: 'Centerpieces',
      },
      choiceOption('is1-backdrop', 'Backdrop (choose 1)', '12x8 ft moon-shaped backdrop'),
      whenInclusion(
        'is1-backdrop',
        '12x8 ft moon-shaped backdrop',
        'Moon-shaped backdrop for a fuller celebration photo wall'
      ),
      choiceOption('is1-backdrop', 'Backdrop (choose 1)', '12x8 ft double-panel backdrop'),
      whenInclusion(
        'is1-backdrop',
        '12x8 ft double-panel backdrop',
        'Double-panel backdrop for a fuller celebration photo wall'
      ),
      {
        text: '6–8 ft basic bar with black masking, bar menu, and vase / candles / lantern',
        group_title: 'Bar Setup',
      },
      { text: '3 basic cocktail tables', group_title: 'Cocktail Tables' },
      {
        text: '2 sofa sets (3 sofas per set: two 1-seaters + one 3-seater) and 2 coffee tables',
        group_title: 'Lounge Seating',
      },
      {
        text: 'Tenting behind the 2 seating lounges',
        group_title: 'Tenting',
      },
      {
        text: '5 halogen lights to light up the backdrop',
        group_title: 'Lighting',
      },
      {
        text: 'Fairy lighting on the ceiling (pack of 10 lights)',
        group_title: 'Lighting',
      },
      {
        text: 'Candle abras / candle stands, brass vases, jali / arch elements, and diya wall accents',
        group_title: 'Corner Decor Elements',
      },
      {
        text: '8 ft personalised mirror with quote, candle abras and decor elements',
        group_title: 'Photo-op',
      },
    ],
  },
];

async function seedDecorSufiNightPackages(strapi) {
  await ensureThemeDocumentId(strapi, {
    name: 'Sufi Night',
    slug: 'sufi-night',
    display_order: 50,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Ishq Sufiyana',
    slug: 'ishq-sufiyana',
    display_order: 51,
  });
  await ensureEventDocumentId(strapi, {
    name: 'Engagement Parties',
    slugCandidates: EVENT_SLUG_CANDIDATES,
    display_order: 20,
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

  return seedDecorPackages(strapi, SUFI_NIGHT_PACKAGES, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-sufi-night',
    refreshExistingDecor: true,
  });
}

module.exports = {
  SUFI_NIGHT_PACKAGES,
  EVENT_SLUG_CANDIDATES,
  seedDecorSufiNightPackages,
};
