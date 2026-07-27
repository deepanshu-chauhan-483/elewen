'use strict';

/**
 * House Party theme catalog — 7 packages only (separate from General Pack).
 * Phool-Proof uses hp-* slugs so General Pack can keep phool-proof-1/2.
 */

const {
  ensureBudgetLevelDocumentId,
  ensureEventDocumentId,
  ensureThemeDocumentId,
  findEventDocumentId,
  seedDecorPackages,
} = require('./decor-proposal-shared');
const { findPackageBySlug } = require('./catering-shared');

const EVENT_SLUG_CANDIDATES = ['house-parties', 'house-party'];

const HOUSE_PARTY_THEME_CANDIDATES = ['house-party', 'house-parties'];

const HOUSE_PARTY_PACKAGE_SLUGS = [
  'hp-phool-proof-1',
  'hp-phool-proof-2',
  'soft-glow-szn-1',
  'soft-glow-szn-2',
  'soft-glow-szn-3',
  'hosting-hero-essentials',
  'entertainment-kit',
];

const HOUSE_PARTY_NITTY =
  'Love the look but need a different color? Go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.';

const HOUSE_PARTY_SETUP =
  'A small area for our team to work, access to water and electricity.';

const HOUSE_PARTY_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'Professional Setup' },
  { text: 'Final Dismantling' },
  { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
  { text: 'No hidden service fees.' },
];

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

function sheeshaBarAddon() {
  return optionalPackageAddon(
    '2 sheesha with operator + bartender',
    9900,
    'Optional add-on — 2 sheesha with operator and bartender'
  );
}

function baseMeta(overrides = {}) {
  return {
    nitty_gritty: HOUSE_PARTY_NITTY,
    setup_needs: HOUSE_PARTY_SETUP,
    price_covers: HOUSE_PARTY_PRICE_COVERS,
    ...overrides,
  };
}

const HOUSE_PARTY_PACKAGES = [
  {
    sheet: 'PP1',
    title: 'Phool-Proof',
    slug: 'hp-phool-proof-1',
    theme_name: 'House Party',
    theme_slug_candidates: HOUSE_PARTY_THEME_CANDIDATES,
    budget_level_slug: 'level-1',
    base_price: 6000,
    description:
      'Thoughtfully layered floral arrangements that bring softness, balance, and quiet elegance to your celebration.',
    key_decor_elements:
      'Five floral bunches in vases — choose your flower tier to match the mood of the room.',
    ...baseMeta({
      setup_needs:
        'A small area for our team to work, access to water and electricity. Final images prior to the event (timeline will be suggested by team Elewen after booking).',
      best_placed_at:
        'Table centers, console tables, coffee tables or any corner of your house.',
      why_we_love_it: 'This setup turns decor into conversation.',
    }),
    price_breakdown: [
      { label: 'Package Price', amount: 5000 },
      { label: 'Platform fee', amount: 500 },
      { label: 'Transport Fee', amount: 500 },
    ],
    addons: [optionalPackageAddon('20 Premium Stems', 0, 'Optional add-on of 20 premium stems')],
    inclustions: [
      { text: '5 bunches of flowers arranged in 5 vases', group_title: 'Floral Styling' },
      choiceOption('hp-pp1-flowers', 'Flower type (choose 1)', 'Level 1 florals', { amount: 6000 }),
      whenInclusion(
        'hp-pp1-flowers',
        'Level 1 florals',
        'Daisy, roses, gypsophila, baby’s breath — ₹500 per vase'
      ),
      choiceOption('hp-pp1-flowers', 'Flower type (choose 1)', 'Level 2 florals (default)', {
        amount: 6000,
      }),
      whenInclusion(
        'hp-pp1-flowers',
        'Level 2 florals (default)',
        'Carnations, gerbera, rajnigandha — ₹650 per vase'
      ),
      choiceOption('hp-pp1-flowers', 'Flower type (choose 1)', 'Level 3 florals', { amount: 6000 }),
      whenInclusion(
        'hp-pp1-flowers',
        'Level 3 florals',
        'Lily, orchid, eustoma — ₹1,200 per vase'
      ),
    ],
  },
  {
    sheet: 'PP2',
    title: 'Phool-Proof',
    slug: 'hp-phool-proof-2',
    theme_name: 'House Party',
    theme_slug_candidates: HOUSE_PARTY_THEME_CANDIDATES,
    budget_level_slug: 'level-2',
    base_price: 8167,
    description:
      'Thoughtfully layered floral arrangements that bring softness, balance, and quiet elegance to your celebration.',
    key_decor_elements:
      'Table florals, floor vases, and candlelight — a fuller floral layer for the space.',
    ...baseMeta({
      setup_needs:
        'A small area for our team to work, access to water and electricity. Final images prior to the event (timeline will be suggested by team Elewen after booking).',
      best_placed_at:
        'Table centers, console tables, coffee tables or any corner of your house.',
      why_we_love_it: 'This setup turns decor into conversation.',
    }),
    price_breakdown: [
      { label: 'Package Price', amount: 7667 },
      { label: 'Platform fee', amount: 500 },
    ],
    addons: [optionalPackageAddon('20 Premium Stems', 0, 'Optional add-on of 20 premium stems')],
    inclustions: [
      { text: '5 bunches of fresh flowers placed in 5 vases', group_title: 'Table Florals' },
      {
        text: '3 floor vases with fresh flower bunches (1 big + 2 small)',
        group_title: 'Floor Florals',
      },
      { text: '15 glass holders with candles', group_title: 'Candles' },
      choiceOption('hp-pp2-flowers', 'Flower type (choose 1)', 'Level 1 florals', { amount: 8167 }),
      whenInclusion(
        'hp-pp2-flowers',
        'Level 1 florals',
        'Table: Daisy, roses, gypsophila, baby’s breath — ₹500 per vase'
      ),
      whenInclusion(
        'hp-pp2-flowers',
        'Level 1 florals',
        'Floor (1 big + 2 small): Daisy, roses, gypsophila, baby’s breath — ₹1,200 for 3 vases'
      ),
      choiceOption('hp-pp2-flowers', 'Flower type (choose 1)', 'Level 2 florals (default)', {
        amount: 8167,
      }),
      whenInclusion(
        'hp-pp2-flowers',
        'Level 2 florals (default)',
        'Table: Carnations, gerbera, rajnigandha — ₹650 per vase'
      ),
      whenInclusion(
        'hp-pp2-flowers',
        'Level 2 florals (default)',
        'Floor (1 big + 2 small): Carnations, gerbera, rajnigandha — ₹1,550 for 3 vases'
      ),
      choiceOption('hp-pp2-flowers', 'Flower type (choose 1)', 'Level 3 florals', { amount: 8167 }),
      whenInclusion(
        'hp-pp2-flowers',
        'Level 3 florals',
        'Table: Lily, orchid, eustoma — ₹1,200 per vase'
      ),
      whenInclusion(
        'hp-pp2-flowers',
        'Level 3 florals',
        'Floor (1 big + 2 small): Lily, orchid, eustoma — ₹2,600 for 3 vases'
      ),
    ],
  },
  {
    sheet: 'SGS1',
    title: 'Soft Glow Szn',
    slug: 'soft-glow-szn-1',
    theme_name: 'House Party',
    theme_slug_candidates: HOUSE_PARTY_THEME_CANDIDATES,
    budget_level_slug: 'level-1',
    base_price: 12370,
    description:
      'A cozy terrace party setup designed for hosts who want their space to feel effortlessly aesthetic without going over the top. Warm fairy lights, soft candlelight, and elegant styling come together to create the perfect atmosphere for intimate celebrations, chill gatherings, birthdays, or late-night conversations under the stars.',
    key_decor_elements:
      'Fairy lights, floral centerpieces, entrance easel, and soft candlelight.',
    ...baseMeta({
      best_placed_at:
        'Terraces, rooftops, lawns, backyards, balconies, or even a living area (if one wishes to be indoors).',
      why_we_love_it:
        'It’s the kind of setup that instantly makes a house party feel intentional, warm, and aesthetic, without taking away the relaxed, effortless charm of hosting at home.',
    }),
    price_breakdown: [
      { label: 'Package Price', amount: 10700 },
      { label: 'Platform fee', amount: 1070 },
      { label: 'Transport Fee', amount: 600 },
    ],
    inclustions: [
      {
        text: '10 fairy light strings professionally installed with electrician support',
        group_title: 'Ambient Lighting',
      },
      {
        text: '5 small centerpieces with real fresh flowers',
        group_title: 'Floral Vases',
      },
      {
        text: '1 entrance easel with customized welcome signage and florals',
        group_title: 'Entrance Set up',
      },
      {
        text: '5 candles in glass holders',
        group_title: 'Decor Enhancers',
      },
    ],
  },
  {
    sheet: 'SGS2',
    title: 'Soft Glow Szn',
    slug: 'soft-glow-szn-2',
    theme_name: 'House Party',
    theme_slug_candidates: HOUSE_PARTY_THEME_CANDIDATES,
    budget_level_slug: 'level-2',
    base_price: 19020,
    description:
      'A cozy terrace party setup designed for hosts who want their space to feel effortlessly aesthetic without going over the top. Warm fairy lights, soft candlelight, and elegant styling come together to create the perfect atmosphere for intimate celebrations, chill gatherings, birthdays, or late-night conversations under the stars.',
    key_decor_elements:
      'Ambient lighting, florals, bar setup, and cocktail tables for mingling.',
    ...baseMeta({
      best_placed_at:
        'Terraces, rooftops, lawns, backyards, balconies, or even a living area (if one wishes to be indoors).',
      why_we_love_it:
        'It’s the kind of setup that instantly makes a house party feel intentional, warm, and aesthetic, without taking away the relaxed, effortless charm of hosting at home.',
    }),
    price_breakdown: [
      { label: 'Package Price', amount: 16200 },
      { label: 'Platform fee', amount: 1620 },
      { label: 'Transport Fee', amount: 1200 },
    ],
    addons: [sheeshaBarAddon()],
    inclustions: [
      {
        text: '10 fairy light strings professionally installed with electrician support',
        group_title: 'Ambient Lighting',
      },
      {
        text: '5 small centerpieces with real fresh flowers',
        group_title: 'Floral Vases',
      },
      {
        text: '1 entrance easel with customized welcome signage and florals',
        group_title: 'Entrance Set up',
      },
      { text: '5 candles in glass holders', group_title: 'Decor Enhancers' },
      { text: 'Basic bar setup with styling essentials', group_title: 'Bar Setup' },
      { text: '3 cocktail tables for guest mingling and drinks', group_title: 'Cocktail Tables' },
    ],
  },
  {
    sheet: 'SGS3',
    title: 'Soft Glow Szn',
    slug: 'soft-glow-szn-3',
    theme_name: 'House Party',
    theme_slug_candidates: HOUSE_PARTY_THEME_CANDIDATES,
    budget_level_slug: 'level-3',
    base_price: 22650,
    description:
      'A cozy terrace party setup designed for hosts who want their space to feel effortlessly aesthetic without going over the top. Warm fairy lights, soft candlelight, and elegant styling come together to create the perfect atmosphere for intimate celebrations, chill gatherings, birthdays, or late-night conversations under the stars.',
    key_decor_elements:
      'Full terrace setup with lighting, bar, furniture, and catering-ready tables.',
    ...baseMeta({
      best_placed_at:
        'Terraces, rooftops, lawns, backyards, balconies, or even a living area (if one wishes to be indoors).',
      why_we_love_it:
        'It’s the kind of setup that instantly makes a house party feel intentional, warm, and aesthetic, without taking away the relaxed, effortless charm of hosting at home.',
    }),
    price_breakdown: [
      { label: 'Package Price', amount: 19500 },
      { label: 'Platform fee', amount: 1950 },
      { label: 'Transport Fee', amount: 1200 },
    ],
    addons: [sheeshaBarAddon()],
    inclustions: [
      {
        text: '10 fairy light strings with professional installation support',
        group_title: 'Lighting',
      },
      { text: '5 lanterns with bulbs', group_title: 'Lighting' },
      { text: '2 LED parcans / halogen lights', group_title: 'Lighting' },
      {
        text: '5 small floral centerpieces with fresh flowers',
        group_title: 'Floral Centerpieces',
      },
      {
        text: '1 entrance easel with customized signage',
        group_title: 'Entrance Setup',
      },
      { text: '5 candles in glass holders', group_title: 'Decor Enhancers' },
      { text: 'Basic bar setup', group_title: 'Bar Setup' },
      { text: '3 cocktail tables', group_title: 'Furniture' },
      { text: '1 beer pong table with playing material', group_title: 'Furniture' },
      {
        text: '4 rectangular tables with black frill for buffet or catering setup',
        group_title: 'Furniture',
      },
    ],
  },
  {
    sheet: 'HHE',
    title: 'Hosting Hero — The Essentials Pack',
    slug: 'hosting-hero-essentials',
    theme_name: 'House Party',
    theme_slug_candidates: HOUSE_PARTY_THEME_CANDIDATES,
    budget_level_slug: 'level-2',
    base_price: 10990,
    description:
      'The little things guests remember are often the ones hosts forget. This package covers the practical essentials that people notice without realizing why they’re having a better experience.',
    key_decor_elements:
      'Welcome drinks, essentials corner, service tables, signages, and bar setup.',
    ...baseMeta({
      best_placed_at:
        'House parties, birthdays, terrace gatherings, home celebrations, game nights, and private events where guest comfort matters.',
      why_we_love_it:
        'These aren’t the elements guests photograph — they’re the ones that make your event feel easy, comfortable, and well-hosted.',
    }),
    price_breakdown: [
      { label: 'Package Price', amount: 8900 },
      { label: 'Platform fee', amount: 890 },
      { label: 'Transport Fee', amount: 1200 },
    ],
    addons: [sheeshaBarAddon()],
    inclustions: [
      {
        text: '20 shot glasses, serving table, and fun signage',
        group_title: 'Welcome Drinks Station',
      },
      {
        text: 'Dedicated table with tissues, straws, and disposable cutlery for up to 20 guests',
        group_title: 'Tissue & Essentials Corner',
      },
      { text: '2 dustbins placed discreetly for guest convenience', group_title: 'Waste Management' },
      {
        text: '5 rectangular tables with black frill for buffet, catering, or service setup',
        group_title: 'Service Tables',
      },
      {
        text: '3 small easel stands with 3 fun event signages',
        group_title: 'Signages',
      },
      { text: 'Classic bar setup', group_title: 'Bar Setup' },
    ],
  },
  {
    sheet: 'EK',
    title: 'Entertainment Kit',
    slug: 'entertainment-kit',
    theme_name: 'House Party',
    theme_slug_candidates: HOUSE_PARTY_THEME_CANDIDATES,
    budget_level_slug: 'level-1',
    base_price: 4890,
    description:
      'The party starts when guests stop being strangers. This package is packed with fun ice-breakers, drinking games, and interactive moments designed to get conversations flowing, laughter rolling, and everyone involved.',
    key_decor_elements:
      'Entry shots, drinking games, party cards, team games, and beer pong material.',
    ...baseMeta({
      best_placed_at:
        'Perfect for house parties, birthdays, bachelors, bachelorettes, and gatherings where the vibe matters as much as the décor.',
      why_we_love_it:
        'Because great parties aren’t remembered for the décor alone. They’re remembered for the inside jokes, unexpected laughs, and moments that get everyone talking.',
      price_covers: [
        { text: 'The Complete Look' },
        { text: 'Professional Setup' },
        { text: 'Final Dismantling' },
        { text: 'All material on one day rental basis only' },
        { text: 'No hidden service fees.' },
      ],
    }),
    price_breakdown: [
      { label: 'Package Price', amount: 3900 },
      { label: 'Platform fee', amount: 390 },
      { label: 'Transport Fee', amount: 600 },
    ],
    addons: [sheeshaBarAddon()],
    inclustions: [
      {
        text: '20 shot glasses, serving table, and fun signage',
        group_title: 'Entry Shots Station',
      },
      {
        text: '1 oversized Jenga set with drinking dares (rental)',
        group_title: 'Drinking Dares Jenga',
      },
      {
        text: 'Cards Against Humanity-style / social humour / Dobbal game (rental)',
        group_title: 'Party Cards',
      },
      {
        text: '1 customized interactive game with all materials included. Elewen will share 2 game options after booking for you to choose from.',
        group_title: 'Couple / Team Game',
      },
      {
        text: 'Beer pong playing material included. Table to be provided by the host.',
        group_title: 'Beer Pong',
      },
    ],
  },
];

async function repairHousePartyEventLinks(strapi, eventDocumentId) {
  if (!eventDocumentId) return 0;

  let repaired = 0;

  for (const pkgSeed of HOUSE_PARTY_PACKAGES) {
    const found = await findPackageBySlug(strapi, pkgSeed.slug);
    if (!found?.entry?.documentId) continue;

    try {
      await strapi.documents('api::package.package').update({
        documentId: found.entry.documentId,
        data: {
          is_active: true,
          visibility: true,
          events: {
            set: [{ documentId: eventDocumentId }],
          },
        },
      });

      try {
        await strapi.documents('api::package.package').publish({
          documentId: found.entry.documentId,
        });
      } catch {
        // Ignore publish race.
      }

      repaired += 1;
    } catch (error) {
      strapi.log.warn(
        `[seed/decor-house-party] could not repair event link for "${pkgSeed.slug}": ${error?.message || error}`
      );
    }
  }

  return repaired;
}

async function seedDecorHousePartyPackages(strapi) {
  await ensureThemeDocumentId(strapi, {
    name: 'House Party',
    slug: 'house-party',
    display_order: 10,
  });
  await ensureEventDocumentId(strapi, {
    name: 'House Parties',
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

  const result = await seedDecorPackages(strapi, HOUSE_PARTY_PACKAGES, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-house-party',
    refreshExistingDecor: true,
  });

  const housePartyEventId = await findEventDocumentId(strapi, EVENT_SLUG_CANDIDATES);
  const repairedEventLinks = await repairHousePartyEventLinks(strapi, housePartyEventId);

  return { ...result, repairedEventLinks };
}

module.exports = {
  HOUSE_PARTY_PACKAGES,
  HOUSE_PARTY_PACKAGE_SLUGS,
  EVENT_SLUG_CANDIDATES,
  seedDecorHousePartyPackages,
};
