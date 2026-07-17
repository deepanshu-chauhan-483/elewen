'use strict';

const { seedDecorPackages } = require('./decor-proposal-shared');

const EVENT_SLUG_CANDIDATES = ['engagement-parties', 'engagement', 'engagements', 'proposal', 'proposals'];

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
      'Think glowing lantern-lit walkways, intricate Jali patterns, candle abras / candle stands, diya wall',
    nitty_gritty:
      'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs:
      'A small area for our team to work, access to water and electricity. Final images prior to the event (timeline will be suggested by team Elewen after booking).',
    best_placed_at:
      'Smaller venues, farmhouses, backyards, or private spaces that comfortably host up to 50-70 guests. Ideal for engagements where you want a celebration with your close family and friends.',
    why_we_love_it:
      'Elewen thinks this one is a dream for an intimate garden engagement or a backyard / terrace celebration.',
    theme_slug_candidates: ['ishq-sufiyana'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
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
    inclustions: [
      {
        text: 'A pathway of 20-25 lanterns (combination of small and big) to guide your guests, all tied together with warm, twinkling lights.',
        group_title: 'Includes',
      },
      { text: 'Fresh, hand-arranged flowers in 5 small and 5 big vases', group_title: 'Includes' },
      { text: 'Traditional floral rangolis at corners', group_title: 'Includes' },
      {
        text: '5 centerpieces - lanterns, small vases with flowers, candles with candle holders',
        group_title: 'Includes',
      },
      {
        text: '12x8ft moon-shaped or double-panel backdrop (you can choose between the 2)',
        group_title: 'Includes',
      },
      {
        text: '6-8ft. long basic bar with black masking, a bar menu and a vase / candles / lantern',
        group_title: 'Includes',
      },
      {
        text: '8ft. tall mirror personalised with a quote on it, with candle abras & decor elements',
        group_title: 'Includes',
      },
      { text: '3 basic cocktail tables', group_title: 'Includes' },
      {
        text: '2 sofa sets (3 sofas to make one complete set) and 2 coffee tables',
        group_title: 'Includes',
      },
      { text: 'Tenting behind the 2 seating lounges', group_title: 'Includes' },
      {
        text: '5 halogen lights (to light up the backdrops) and Fairy lighting on the ceiling (pack of 10 lights)',
        group_title: 'Includes',
      },
    ],
  },
];

async function seedDecorSufiNightPackages(strapi) {
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
