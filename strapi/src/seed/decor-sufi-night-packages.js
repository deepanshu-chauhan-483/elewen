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
    base_price: 103000.0,
    description: 'Ishq Sufiyana 1',
    key_decor_elements: 'Ishq Sufiyana 1',
    nitty_gritty: 'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs: 'A small area for our team to work, access to water and electricity.',
    best_placed_at: 'Indoor or outdoor celebration spaces suited to your guest size.',
    why_we_love_it: 'It keeps the focus on fun, real moments, and the people who truly matter. It\'s less about heavy décor, more about enjoying the celebration and the company around you.',
    theme_slug_candidates: ['ishq-sufiyana'],
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'No hidden service fees.' },
    ],
    price_breakdown: [
      { label: 'Loose flower rangoli', amount: 1000.0 },
      { label: 'Centerpices', amount: 5000.0 },
      { label: 'Bar', amount: 3500.0 },
      { label: 'Decor elements on corners', amount: 10000.0 },
      { label: 'Photo-op', amount: 10000.0 },
      { label: 'Package Price', amount: 101000.0 },
      { label: 'Labour & Transport', amount: 1000.0 },
      { label: 'Platform fee', amount: 1000.0 },
    ],
    inclustions: [
      { text: 'A pathway of 20-25 lanterns (combination of small and big) to guide your guests, all tied together with warm, twinkling lights.', group_title: 'Includes' },
      { text: 'Fresh, hand-arranged flowers in 5 small and 5 big vases Traditional floral rangolis at corners 5 centerpieces - lanterns, small vases with flowers, candles with candle holders 12x8ft moon-shaped or double-panel backdrop (you can choose between the 2) 6-8f', group_title: 'Includes' },
      { text: 't. long basic bar with black masking, a bar menu and a vase / candles / lantern 8ft.', group_title: 'Includes' },
      { text: 'tall mirror personalised with a quote on it, with candle abras & decor elements 3 basic cocktail tables 2 sofa sets (3 sofas to make one complete set) and 2 coffee tables Tenting behind the 2 seating lounges 5 halogen lights (to light up the bacdrops) and', group_title: 'Includes' },
      { text: 'Fairy lighting on the ceiling (pack of 10 lights)', group_title: 'Includes' },
    ],
  },
];

async function seedDecorSufiNightPackages(strapi) {
  return seedDecorPackages(strapi, SUFI_NIGHT_PACKAGES, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-sufi-night',
  });
}

module.exports = {
  SUFI_NIGHT_PACKAGES,
  EVENT_SLUG_CANDIDATES,
  seedDecorSufiNightPackages,
};
