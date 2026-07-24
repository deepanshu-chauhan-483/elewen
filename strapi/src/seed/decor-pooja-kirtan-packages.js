'use strict';

/**
 * Decor packages for Religious → Pooja / Kirtan (Kesari + Shankh).
 * Figma detail UI: grouped inclusions + Choose 1 (Kesari 3).
 * Customer-facing price = Final Price only. Internal line costs stay off-site.
 *
 * Shankh Final Prices were missing from the client paste — set SHANKH_FINAL_PRICES
 * before those four packages will seed / show.
 */

const {
  PROPOSAL_PRICE_COVERS,
  ensureBudgetLevelDocumentId,
  ensureEventDocumentId,
  ensureThemeDocumentId,
  seedDecorPackages,
} = require('./decor-proposal-shared');

const EVENT_SLUG_CANDIDATES = [
  'pooja-kirtan',
  'pooja',
  'kirtan',
  'pujas-festivals',
  'pujas-and-festivals',
];

/** Fill these Final Prices (₹) before Shankh packages seed. */
const SHANKH_FINAL_PRICES = {
  shankh: null,
  'shankh-2': null,
  'shankh-3': null,
  'shankh-3-1': null,
};

const POOJA_NITTY_GRITTY =
  'Love the look but want a different colour or style direction? Go ahead and book, we’ll connect to customise to match your event vibe.\nRangoli designs can be finalized upon booking. We\'ll share options you can choose from.';

const POOJA_PRICE_COVERS = [
  ...PROPOSAL_PRICE_COVERS,
  { text: 'No hidden service fees.' },
];

const POOJA_SETUP_NEEDS =
  'A small area for our team to work and access to water & electricity.\nFinal print content to be shared prior to the event (timeline will be suggested by team Elewen after booking).';

const KESARI_BEST_PLACED =
  'Home celebrations, terraces, living rooms, or community halls.';

const KESARI_WHY =
  'It creates an instant sacred sanctuary with simple traditional elements, bringing warmth, comfort, and reverence to your home rituals.';

const SHANKH_BEST_PLACED =
  'This setup is designed to bring warmth, grace, and timeless tradition to your pooja, havan, griha pravesh, engagement, or wedding rituals.';

const SHANKH_WHY_BASE =
  'Every element is thoughtfully arranged to create a refined backdrop for moments of devotion and togetherness.';

const SHANKH_WHY_TABLE =
  'Fragrant mogra and rajnigandha trays, complemented by delicate floral arrangements, bring warmth, depth, and sophistication to your space.';

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

const KESARI_PACKAGES = [
  {
    title: 'Kesari',
    slug: 'kesari',
    theme_name: 'Kesari',
    theme_slug_candidates: ['kesari'],
    budget_level_slug: 'level-1',
    base_price: 12700,
    description:
      'A foundational decor and furniture package that sets a serene and authentic tone for your spiritual celebration.\n\nA beautifully draped sacred backdrop paired with fresh marigold accents, antique brass props, and floor-to-ceiling devotional ambiance. Complemented by traditional floor seating and essential family furniture.',
    key_decor_elements:
      'A beautifully draped sacred backdrop paired with fresh marigold accents, antique brass props, and floor-to-ceiling devotional ambiance. Complemented by traditional floor seating and essential family furniture.',
    nitty_gritty: POOJA_NITTY_GRITTY,
    setup_needs: POOJA_SETUP_NEEDS,
    best_placed_at: KESARI_BEST_PLACED,
    why_we_love_it: KESARI_WHY,
    price_covers: POOJA_PRICE_COVERS,
    price_breakdown: [
      { label: 'Package Price', amount: 11000 },
      { label: 'Transport & Labour', amount: 600 },
      { label: 'Platform fee', amount: 1100 },
    ],
    inclustions: [
      {
        text: '1 Traditional Fabric Backdrop (6x6ft) with Marigold Garlands',
        group_title: 'The Backdrop',
      },
      { text: '1 Altar Table with Linen', group_title: 'The Backdrop' },
      { text: '6 Gadda Mattresses + 12 Pillows', group_title: 'The Seating' },
      { text: '8 Standard Plastic Chairs', group_title: 'The Seating' },
      {
        text: '1 Easel with Welcome Sign (add your text when booking)',
        group_title: 'The Entrance',
      },
      { text: '1 Floral floor Rangoli', group_title: 'The Entrance' },
    ],
  },
  {
    title: 'Kesari 2',
    slug: 'kesari-2',
    theme_name: 'Kesari',
    theme_slug_candidates: ['kesari'],
    budget_level_slug: 'level-2',
    base_price: 16880,
    description:
      'A beautifully draped sacred backdrop paired with fresh marigold accents. Complemented by traditional floor seating and essential family furniture. Complete with an entrance setup and loose flowers, this is a full pooja starter pack.',
    key_decor_elements:
      'A beautifully draped sacred backdrop paired with fresh marigold accents. Complemented by traditional floor seating and essential family furniture. Complete with an entrance setup and loose flowers, this is a full pooja starter pack.',
    nitty_gritty: POOJA_NITTY_GRITTY,
    setup_needs: POOJA_SETUP_NEEDS,
    best_placed_at: KESARI_BEST_PLACED,
    why_we_love_it: KESARI_WHY,
    price_covers: POOJA_PRICE_COVERS,
    price_breakdown: [
      { label: 'Package Price', amount: 14800 },
      { label: 'Transport & Labour', amount: 600 },
      { label: 'Platform fee', amount: 1480 },
    ],
    inclustions: [
      {
        text: '1 Traditional Fabric Backdrop (6x6ft) with Marigold Garlands',
        group_title: 'The Backdrop',
      },
      {
        text: '3 Fresh Floral Urli Corner Display with floating diyas and loose petals',
        group_title: 'The Backdrop',
      },
      { text: '1 Altar Table with Linen', group_title: 'The Backdrop' },
      { text: '6 Gadda Mattresses + 12 Pillows', group_title: 'The Seating' },
      { text: '8 Standard Plastic Chairs', group_title: 'The Seating' },
      {
        text: '1 Easel with Welcome Sign (add your text when booking)',
        group_title: 'The Entrance',
      },
      { text: '2 Floral floor Rangoli', group_title: 'The Entrance' },
      {
        text: '4 Cane Baskets with Loose petals (Rose, Marigold)',
        group_title: 'The Entrance',
      },
    ],
  },
  {
    title: 'Kesari 3',
    slug: 'kesari-3',
    theme_name: 'Kesari',
    theme_slug_candidates: ['kesari'],
    budget_level_slug: 'level-3',
    base_price: 26780,
    description:
      'A showstopping sacred backdrop paired with fresh marigold accents. Complemented by traditional floor seating and essential family furniture. Complete with an entrance setup and loose flowers, this is a full pooja starter pack.',
    key_decor_elements:
      'A showstopping sacred backdrop paired with fresh marigold accents. Complemented by traditional floor seating and essential family furniture. Complete with an entrance setup and loose flowers, this is a full pooja starter pack.',
    nitty_gritty: POOJA_NITTY_GRITTY,
    setup_needs: POOJA_SETUP_NEEDS,
    best_placed_at: KESARI_BEST_PLACED,
    why_we_love_it: KESARI_WHY,
    price_covers: POOJA_PRICE_COVERS,
    price_breakdown: [
      { label: 'Package Price', amount: 23800 },
      { label: 'Transport & Labour', amount: 600 },
      { label: 'Platform fee', amount: 2380 },
    ],
    inclustions: [
      { text: '1 Extravagant marigold backdrop', group_title: 'The Backdrop' },
      {
        text: '3 Fresh Floral Urli Corner Display with floating diyas and loose petals',
        group_title: 'The Backdrop',
      },
      { text: '2 Brass diya stands', group_title: 'The Backdrop' },
      { text: '1 Altar Table with Linen', group_title: 'The Backdrop' },
      { text: '6 Gadda Mattresses + 12 Pillows', group_title: 'The Seating' },
      { text: '8 Standard Plastic Chairs', group_title: 'The Seating' },
      {
        text: '1 Easel with Welcome Sign (add your text when booking)',
        group_title: 'The Entrance',
      },
      { text: '1 Floral floor Rangoli', group_title: 'The Entrance' },
      choiceOption(
        'kesari3-decor-highlights',
        'Choose 1',
        'Cane baskets + floating candles'
      ),
      whenInclusion(
        'kesari3-decor-highlights',
        'Cane baskets + floating candles',
        '4 Cane Baskets with Loose petals (Rose, Marigold)'
      ),
      whenInclusion(
        'kesari3-decor-highlights',
        'Cane baskets + floating candles',
        'Glass stands with floating candles and flowers'
      ),
      choiceOption('kesari3-decor-highlights', 'Choose 1', 'Marigold shower corner'),
    ],
  },
];

const SHANKH_PACKAGES = [
  {
    title: 'Shankh',
    slug: 'shankh',
    theme_name: 'Shankh',
    theme_slug_candidates: ['shankh'],
    budget_level_slug: 'level-1',
    base_price: SHANKH_FINAL_PRICES.shankh,
    description:
      'Create a serene and elegant setting for your sacred celebrations with a beautifully curated ceremonial setup.',
    key_decor_elements:
      'Create a serene and elegant setting for your sacred celebrations with a beautifully curated ceremonial setup.',
    nitty_gritty: POOJA_NITTY_GRITTY,
    setup_needs: POOJA_SETUP_NEEDS,
    best_placed_at: SHANKH_BEST_PLACED,
    why_we_love_it: SHANKH_WHY_BASE,
    price_covers: POOJA_PRICE_COVERS,
    price_breakdown: [],
    inclustions: [
      { text: '1 Wooden frame', group_title: 'A Complete Setup' },
      { text: 'Fabric draping', group_title: 'A Complete Setup' },
      { text: 'Mix of premium flower decor', group_title: 'A Complete Setup' },
      { text: '1 Altar Wooden Table with Linen', group_title: 'A Complete Setup' },
      { text: '1 Floral Rangoli', group_title: 'A Complete Setup' },
      { text: '2 Brass diya stands', group_title: 'A Complete Setup' },
      { text: '2 Urlis with flowers', group_title: 'A Complete Setup' },
      { text: '12 Mitti diyas', group_title: 'A Complete Setup' },
    ],
  },
  {
    title: 'Shankh 2',
    slug: 'shankh-2',
    theme_name: 'Shankh',
    theme_slug_candidates: ['shankh'],
    budget_level_slug: 'level-2',
    base_price: SHANKH_FINAL_PRICES['shankh-2'],
    description:
      'Featuring a beautifully styled altar with premium florals, elegant draping, brass accents, floral rangoli, and ambient diya décor, this package is elevated with exquisite table styling.',
    key_decor_elements:
      'Featuring a beautifully styled altar with premium florals, elegant draping, brass accents, floral rangoli, and ambient diya décor, this package is elevated with exquisite table styling.',
    nitty_gritty: POOJA_NITTY_GRITTY,
    setup_needs: POOJA_SETUP_NEEDS,
    best_placed_at: SHANKH_BEST_PLACED,
    why_we_love_it: SHANKH_WHY_TABLE,
    price_covers: POOJA_PRICE_COVERS,
    price_breakdown: [],
    inclustions: [
      { text: '1 Wooden frame', group_title: 'A Complete Setup' },
      { text: 'Fabric draping', group_title: 'A Complete Setup' },
      { text: 'Mix of premium flower decor', group_title: 'A Complete Setup' },
      { text: '1 Altar Wooden Table with Linen', group_title: 'A Complete Setup' },
      { text: '1 Floral Rangoli', group_title: 'A Complete Setup' },
      { text: '2 Brass diya stands', group_title: 'A Complete Setup' },
      { text: '2 Urlis with flowers', group_title: 'A Complete Setup' },
      { text: '12 Mitti diyas', group_title: 'A Complete Setup' },
      {
        text: '5 Metal trays laden with mogra and rajnigandha',
        group_title: 'Table Decor',
      },
      {
        text: '8 Floral arrangements in small vases of assorted sizes',
        group_title: 'Table Decor',
      },
    ],
  },
  {
    title: 'Shankh 3',
    slug: 'shankh-3',
    theme_name: 'Shankh',
    theme_slug_candidates: ['shankh'],
    budget_level_slug: 'level-3',
    base_price: SHANKH_FINAL_PRICES['shankh-3'],
    description:
      'Featuring a beautifully styled altar with premium florals, elegant draping, brass accents, floral rangoli, and ambient diya décor, this package is elevated with exquisite table styling.',
    key_decor_elements:
      'Featuring a beautifully styled altar with premium florals, elegant draping, brass accents, floral rangoli, and ambient diya décor, this package is elevated with exquisite table styling.',
    nitty_gritty: POOJA_NITTY_GRITTY,
    setup_needs: POOJA_SETUP_NEEDS,
    best_placed_at: SHANKH_BEST_PLACED,
    why_we_love_it: SHANKH_WHY_TABLE,
    price_covers: POOJA_PRICE_COVERS,
    price_breakdown: [],
    inclustions: [
      { text: '1 Wooden frame', group_title: 'A Complete Setup' },
      { text: 'Fabric draping', group_title: 'A Complete Setup' },
      { text: 'Mix of premium flower decor', group_title: 'A Complete Setup' },
      { text: '1 Altar Wooden Table with Linen', group_title: 'A Complete Setup' },
      { text: '1 Floral Rangoli', group_title: 'A Complete Setup' },
      { text: '2 Brass diya stands', group_title: 'A Complete Setup' },
      { text: '2 Urlis with flowers', group_title: 'A Complete Setup' },
      { text: '12 Mitti diyas', group_title: 'A Complete Setup' },
      {
        text: '5 Metal trays laden with mogra and rajnigandha',
        group_title: 'Table Decor',
      },
      {
        text: '8 Floral arrangements in small vases of assorted sizes',
        group_title: 'Table Decor',
      },
      {
        text: 'Premium florals (add your text when booking)',
        group_title: 'Entrance Setup',
      },
      { text: 'Easel and Board', group_title: 'Entrance Setup' },
      { text: '2 Floral Vases', group_title: 'Entrance Setup' },
    ],
  },
  {
    title: 'Shankh 3.1',
    slug: 'shankh-3-1',
    legacySlugs: ['shankh-3.1'],
    theme_name: 'Shankh',
    theme_slug_candidates: ['shankh'],
    budget_level_slug: 'level-3',
    base_price: SHANKH_FINAL_PRICES['shankh-3-1'],
    description:
      'Featuring a beautifully styled altar with premium florals, elegant draping, brass accents, floral rangoli, and ambient diya décor, this package is elevated with exquisite table styling.',
    key_decor_elements:
      'Featuring a beautifully styled altar with premium florals, elegant draping, brass accents, floral rangoli, and ambient diya décor, this package is elevated with exquisite table styling.',
    nitty_gritty: POOJA_NITTY_GRITTY,
    setup_needs: POOJA_SETUP_NEEDS,
    best_placed_at: SHANKH_BEST_PLACED,
    why_we_love_it: SHANKH_WHY_TABLE,
    price_covers: POOJA_PRICE_COVERS,
    price_breakdown: [],
    inclustions: [
      { text: '1 Wooden frame', group_title: 'A Complete Setup' },
      { text: 'Fabric draping', group_title: 'A Complete Setup' },
      { text: 'Mix of premium flower decor', group_title: 'A Complete Setup' },
      { text: '1 Altar Wooden Table with Linen', group_title: 'A Complete Setup' },
      { text: '1 Floral Rangoli', group_title: 'A Complete Setup' },
      { text: '2 Brass diya stands', group_title: 'A Complete Setup' },
      { text: '12 Mitti diyas', group_title: 'A Complete Setup' },
      {
        text: 'Premium florals (add your text when booking)',
        group_title: 'Entrance Setup',
      },
      { text: 'Easel and Board', group_title: 'Entrance Setup' },
      { text: '2 Floral Vases', group_title: 'Entrance Setup' },
      { text: '6 Gadda Mattresses + 12 Pillows', group_title: 'The Seating' },
      { text: '8 Standard Plastic Chairs', group_title: 'The Seating' },
    ],
  },
];

const POOJA_KIRTAN_PACKAGES = [...KESARI_PACKAGES, ...SHANKH_PACKAGES];

async function seedDecorPoojaKirtanPackages(strapi) {
  await ensureThemeDocumentId(strapi, {
    name: 'Kesari',
    slug: 'kesari',
    display_order: 80,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Shankh',
    slug: 'shankh',
    display_order: 81,
  });
  await ensureEventDocumentId(strapi, {
    name: 'Pooja / Kirtan',
    slugCandidates: EVENT_SLUG_CANDIDATES,
    display_order: 1,
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

  const readyPackages = POOJA_KIRTAN_PACKAGES.filter(pkg => Number(pkg.base_price) > 0);
  const skippedMissingPrice = POOJA_KIRTAN_PACKAGES.filter(pkg => !(Number(pkg.base_price) > 0)).map(
    pkg => pkg.slug
  );

  if (skippedMissingPrice.length) {
    strapi.log.warn(
      `[seed/decor-pooja-kirtan] Skipping packages with missing Final Price: ${skippedMissingPrice.join(', ')}. Set SHANKH_FINAL_PRICES in decor-pooja-kirtan-packages.js.`
    );
  }

  return seedDecorPackages(strapi, readyPackages, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-pooja-kirtan',
    refreshExistingDecor: true,
  });
}

module.exports = {
  EVENT_SLUG_CANDIDATES,
  KESARI_PACKAGES,
  SHANKH_PACKAGES,
  SHANKH_FINAL_PRICES,
  POOJA_KIRTAN_PACKAGES,
  seedDecorPoojaKirtanPackages,
};
