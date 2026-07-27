'use strict';

/**
 * General Pack (Birthday Parties) — full Excel catalog (~22 packages).
 * Separate from House Party theme catalog (see decor-house-party-packages.js).
 */

const {
  ensureBudgetLevelDocumentId,
  ensureEventDocumentId,
  ensureThemeDocumentId,
  findEventDocumentId,
  seedDecorPackages,
} = require('./decor-proposal-shared');
const { findPackageBySlug } = require('./catering-shared');

const EVENT_SLUG_CANDIDATES = [
  'birthday-parties',
  'birthday-celebrations',
  'birthday',
  'birthday-party',
];

const GENERAL_PACK_PACKAGE_SLUGS = [
  'phool-proof-1',
  'phool-proof-2',
  'air-we-go-1',
  'air-we-go-2',
  'air-we-go-2-3',
  'air-we-go-3',
  'raise-the-bar-1',
  'raise-the-bar-1b',
  'raise-the-bar-2',
  'raise-the-bar-2-3',
  'raise-the-bar-3',
  'just-enough-magic-1',
  'just-enough-magic-2',
  'just-enough-magic-3',
  'party-smart-1',
  'party-smart-2',
  'party-smart-2-3',
  'party-smart-3',
  'party-smart-social-2',
  'party-smart-social-3',
  'entry-setup-aarambh-1',
  'aura-upgrade-1',
];

const HOUSE_PARTY_NITTY =
  'Love the look but want a different colour or style direction? Go ahead and book ΓÇö weΓÇÖll connect to customise to match your event vibe.';

const HOUSE_PARTY_SETUP =
  'A small area for our team to work, access to water and electricity.';

const HOUSE_PARTY_BEST =
  'Indoor or outdoor celebration spaces suited to your guest size.';

const HOUSE_PARTY_WHY =
  'A thoughtfully styled setup that elevates the celebration without overwhelming the space.';

const HOUSE_PARTY_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'Professional Setup' },
  { text: 'Final Dismantling' },
  { text: 'Coordination' },
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

function generalPackThemeCandidates(childSlug) {
  return ['birthday-party', 'birthday-parties', childSlug].filter(Boolean);
}

function baseMeta(overrides = {}) {
  return {
    nitty_gritty: HOUSE_PARTY_NITTY,
    setup_needs: HOUSE_PARTY_SETUP,
    best_placed_at: HOUSE_PARTY_BEST,
    why_we_love_it: HOUSE_PARTY_WHY,
    price_covers: HOUSE_PARTY_PRICE_COVERS,
    ...overrides,
  };
}

function partySmartMeta(overrides = {}) {
  return baseMeta({
    nitty_gritty:
      'Love the look but want a different colour or style direction? Go ahead and book, weΓÇÖll connect to customise to match your event vibe.',
    setup_needs:
      'A small area for our team to work and access to water & electricity. Final print content to be shared prior to the event (timeline will be suggested by team Elewen after booking).',
    best_placed_at:
      'Home celebrations, terraces, small banquet halls, caf├⌐s, or intimate party venues.',
    why_we_love_it:
      'Three strong visual elements and a styled bar ΓÇö just the right balance to make your event look complete, polished, and photo-ready.',
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'Final Dismantling' },
      { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
      { text: 'No hidden service fees.' },
    ],
    ...overrides,
  });
}

function partySmartSocialMeta(overrides = {}) {
  return partySmartMeta({
    best_placed_at:
      'Banquet halls, terraces, farmhouses, garden venues, or home celebrations where you want a strong visual impact.',
    ...overrides,
  });
}

/** Party Smart 1 ΓÇö Figma choose-1 groups */
function partySmart1Inclusions() {
  return [
    choiceOption('ps1-styling', 'Floral or Balloon Styling (choose 1)', 'Florals'),
    whenInclusion('ps1-styling', 'Florals', '6 premium table centerpieces'),
    choiceOption('ps1-styling', 'Floral or Balloon Styling (choose 1)', 'Balloons'),
    whenInclusion(
      'ps1-styling',
      'Balloons',
      'Balloon arch with sign & balloon structures to form a backdrop with sign'
    ),

    choiceOption('ps1-entry', 'Entry Setup (choose 1)', 'Floral entrance'),
    whenInclusion(
      'ps1-entry',
      'Floral entrance',
      'Easel with welcome board + floral styling with crates or urli + 5ΓÇô7 candles'
    ),
    choiceOption('ps1-entry', 'Entry Setup (choose 1)', 'Printables'),
    whenInclusion(
      'ps1-entry',
      'Printables',
      'Small signages (Guestbook, Take a Shot, Birthday Quote) with 2 small easels'
    ),

    choiceOption('ps1-focal', 'Focal Element (choose 1)', 'Bar setup'),
    whenInclusion(
      'ps1-focal',
      'Bar setup',
      'Bar table + one flower vase + bar menu + small easel'
    ),
    choiceOption('ps1-focal', 'Focal Element (choose 1)', 'Basic backdrop'),
    whenInclusion(
      'ps1-focal',
      'Basic backdrop',
      'Shine wall / ring with florals or balloons'
    ),

    choiceOption('ps1-highlight', 'Highlight Detail (choose 1)', '3D Letters (2)'),
    choiceOption('ps1-highlight', 'Highlight Detail (choose 1)', 'Neon Sign'),
    whenInclusion('ps1-highlight', 'Neon Sign', 'ΓÇ£Happy BirthdayΓÇ¥ / ΓÇ£Oh BabyΓÇ¥'),
  ];
}

function partySmart2Inclusions() {
  return [
    choiceOption('ps2-styling', 'Florals or Balloons (choose 1)', 'Florals'),
    whenInclusion(
      'ps2-styling',
      'Florals',
      '6 centerpieces + entrance setup (crates/urli) + 5ΓÇô7 candles'
    ),
    choiceOption('ps2-styling', 'Florals or Balloons (choose 1)', 'Balloons'),
    whenInclusion(
      'ps2-styling',
      'Balloons',
      'Balloon arch with sign + balloon backdrop structure'
    ),

    choiceOption('ps2-entry', 'Entry Setup or Printables (choose 1)', 'Entry Setup'),
    whenInclusion('ps2-entry', 'Entry Setup', 'Easel with welcome board'),
    whenInclusion('ps2-entry', 'Entry Setup', 'Floral styling'),
    whenInclusion('ps2-entry', 'Entry Setup', 'Carpet'),
    whenInclusion('ps2-entry', 'Entry Setup', '1 d├⌐cor element'),
    choiceOption('ps2-entry', 'Entry Setup or Printables (choose 1)', 'Printables'),
    whenInclusion(
      'ps2-entry',
      'Printables',
      'Guestbook / Take a Shot / Birthday quote signs with 2 small easels'
    ),

    choiceOption('ps2-backdrop', 'Backdrop or Bar (choose 1)', 'Backdrop'),
    whenInclusion(
      'ps2-backdrop',
      'Backdrop',
      'Shiny wall / ring with flowers or balloons / single panel backdrop (with neon sign or 3D letters)'
    ),
    choiceOption('ps2-backdrop', 'Backdrop or Bar (choose 1)', 'Bar'),
    whenInclusion('ps2-backdrop', 'Bar', 'Bar with menu and a floral vase'),

    { text: '1 round table with linen', group_title: 'Furniture' },
    { text: '8 chairs with linen', group_title: 'Furniture' },
    { text: '2 cocktail tables', group_title: 'Furniture' },
    { text: '2 buffet tables with linen', group_title: 'Furniture' },
  ];
}

function partySmart23Inclusions() {
  return [
    choiceOption('ps23-styling', 'Florals or Balloons (choose 1)', 'Florals'),
    whenInclusion(
      'ps23-styling',
      'Florals',
      '5 centerpieces + entrance setup (crates/urli) + 5ΓÇô7 candles'
    ),
    choiceOption('ps23-styling', 'Florals or Balloons (choose 1)', 'Balloons'),
    whenInclusion(
      'ps23-styling',
      'Balloons',
      'Balloon arch with sign + balloon backdrop structure'
    ),

    choiceOption('ps23-entry', 'Entry Setup or Printables (choose 1)', 'Entry Setup'),
    whenInclusion('ps23-entry', 'Entry Setup', 'Easel with welcome board'),
    whenInclusion('ps23-entry', 'Entry Setup', 'Floral styling'),
    whenInclusion('ps23-entry', 'Entry Setup', 'Carpet'),
    whenInclusion('ps23-entry', 'Entry Setup', '1 d├⌐cor element'),
    choiceOption('ps23-entry', 'Entry Setup or Printables (choose 1)', 'Printables'),
    whenInclusion(
      'ps23-entry',
      'Printables',
      'Guestbook / Take a Shot / Birthday quote signs with 2 small easels'
    ),

    {
      text: 'Shiny wall / ring with flowers or balloons / single panel backdrop',
      group_title: 'Backdrop Setup',
    },
    { text: 'Bar with menu and a floral vase', group_title: 'Bar Setup' },
    { text: '2 round tables with linen', group_title: 'Furniture' },
    { text: '12 chairs with linen', group_title: 'Furniture' },
    { text: '2 cocktail tables', group_title: 'Furniture' },
    { text: '2 buffet tables with linen', group_title: 'Furniture' },
  ];
}

function partySmart3Inclusions() {
  return [
    choiceOption('ps3-styling', 'Florals or Balloons (choose 1)', 'Florals'),
    whenInclusion(
      'ps3-styling',
      'Florals',
      '6 centerpieces + entrance setup (crates/urli) + 5ΓÇô7 candles'
    ),
    choiceOption('ps3-styling', 'Florals or Balloons (choose 1)', 'Balloons'),
    whenInclusion(
      'ps3-styling',
      'Balloons',
      'Balloon arch with sign + balloon backdrop structure'
    ),

    choiceOption('ps3-entry', 'Entry Setup or Printables (choose 1)', 'Entry Setup'),
    whenInclusion('ps3-entry', 'Entry Setup', 'Easel with welcome board'),
    whenInclusion('ps3-entry', 'Entry Setup', 'Floral styling'),
    whenInclusion('ps3-entry', 'Entry Setup', 'Carpet'),
    whenInclusion('ps3-entry', 'Entry Setup', '1 d├⌐cor element'),
    choiceOption('ps3-entry', 'Entry Setup or Printables (choose 1)', 'Printables'),
    whenInclusion(
      'ps3-entry',
      'Printables',
      'Guestbook / Take a Shot / Birthday quote signs with 2 small easels'
    ),

    {
      text: 'Shiny wall / ring with flowers or balloons / single panel backdrop',
      group_title: 'Backdrop Setup',
    },
    { text: 'Bar with menu and a floral vase', group_title: 'Bar Setup' },
    { text: '2 round tables', group_title: 'Premium Furniture' },
    { text: '20 comfortable chairs', group_title: 'Premium Furniture' },
    { text: '2 cocktail tables', group_title: 'Premium Furniture' },
    { text: '4 buffet tables with linen', group_title: 'Premium Furniture' },
  ];
}

function justEnoughMagic1Inclusions() {
  return [
    choiceOption('jem1-styling', 'Florals or Balloons (choose 1)', 'Florals'),
    whenInclusion('jem1-styling', 'Florals', '2ΓÇô4 centerpieces + easel stand'),
    choiceOption('jem1-styling', 'Florals or Balloons (choose 1)', 'Balloons'),
    whenInclusion('jem1-styling', 'Balloons', 'Balloon arch with sign'),

    { text: '1 fun quote printable', group_title: 'Printables' },
    { text: '1 bar menu', group_title: 'Printables' },
    { text: '1 Take a Shot / custom quote sign', group_title: 'Printables' },
    { text: 'Takhat with black masking', group_title: 'Bar Setup' },
    { text: '1 round table', group_title: 'Furniture' },
    { text: '6 chairs', group_title: 'Furniture' },
    { text: '2 cocktail tables', group_title: 'Furniture' },
  ];
}

function justEnoughMagic2Inclusions() {
  return [
    choiceOption('jem2-styling', 'Florals or Balloons (choose 1)', 'Florals'),
    whenInclusion(
      'jem2-styling',
      'Florals',
      '4ΓÇô6 centerpieces + easel stand + entrance crates/urli'
    ),
    choiceOption('jem2-styling', 'Florals or Balloons (choose 1)', 'Balloons'),
    whenInclusion('jem2-styling', 'Balloons', 'Balloon arch with sign + balloon accents'),

    { text: 'Printables set (quote, bar menu, Take a Shot)', group_title: 'Printables' },
    { text: 'Takhat bar with black masking', group_title: 'Bar Setup' },
    { text: '1 round table with linen', group_title: 'Furniture' },
    { text: '8 chairs', group_title: 'Furniture' },
    { text: '2 cocktail tables', group_title: 'Furniture' },
  ];
}

function justEnoughMagicMeta(overrides = {}) {
  return baseMeta({
    nitty_gritty:
      'Love the look but want a different colour or style direction? Go ahead and book, weΓÇÖll connect to customise to match your event vibe.',
    setup_needs:
      'A small area for our team to work and access to water & electricity. Final print content to be shared prior to the event (timeline will be suggested by team Elewen after booking).',
    best_placed_at:
      'Home celebrations, terraces, small banquet halls, caf├⌐s, or party venues.',
    why_we_love_it: 'Warm vibe. Easy hosting. Just enough to make it feel special.',
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'Final Dismantling' },
      { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
      { text: 'No hidden service fees.' },
    ],
    ...overrides,
  });
}

function justEnoughMagic3Inclusions() {
  return [
    choiceOption('jem3-styling', 'Florals or Balloons (choose 1)', 'Florals', {
      amount: 34660,
    }),
    whenInclusion(
      'jem3-styling',
      'Florals',
      '4 centerpieces + entrance setup ΓÇö crates/urli + 5ΓÇô7 candles + easel with sign + florals'
    ),
    choiceOption('jem3-styling', 'Florals or Balloons (choose 1)', 'Balloons', {
      amount: 33010,
    }),
    whenInclusion(
      'jem3-styling',
      'Balloons',
      '4 centerpieces + entrance setup ΓÇö crates/urli + 5ΓÇô7 candles + easel with sign + balloon styling'
    ),
    {
      text: '4 flower vases (big and small) + crates or urlis + 5ΓÇô7 candles in glasses',
      group_title: 'Entrance Setup',
    },
    {
      text: 'Easel with welcome sign + florals ΓÇö text customisable when booking',
      group_title: 'Entrance Setup',
    },
    {
      text: 'Takht bar with black pleated masking',
      group_title: 'Basic Bar Setup',
    },
    {
      text: 'Fancy backdrop (shiny / one facade + balloons etc.) ΓÇö photo-op; text and colour customisable post booking',
      group_title: 'Photo-op',
    },
    { text: '1 round table', group_title: 'Premium Furniture' },
    { text: '6 fancy chairs', group_title: 'Premium Furniture' },
    { text: '2 cocktail tables', group_title: 'Premium Furniture' },
  ];
}

function airWeGoMeta(overrides = {}) {
  return baseMeta({
    nitty_gritty:
      'Love the look but need a different color? go ahead and book! WeΓÇÖll contact you to finalize the perfect shade from our available decor to match your vibe.',
    setup_needs:
      'A small area for our team to work, access to water and electricity. Final images prior to the event (timeline will be suggested by team Elewen after booking).',
    why_we_love_it:
      'Balloons have a unique way of lifting the spirit of a room, turning a simple gathering into a vibrant celebration that feels both lighthearted and intentionally styled.',
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'Final Dismantling' },
      { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
      { text: 'No hidden service fees.' },
    ],
    ...overrides,
  });
}

function airWeGo1Inclusions() {
  return [
    choiceOption('awg1-entry', 'Helium or Standee (choose 1)', 'Loose Helium 7'),
    whenInclusion('awg1-entry', 'Loose Helium 7', '7 loose helium balloons'),
    choiceOption('awg1-entry', 'Helium or Standee (choose 1)', 'Small standee / balloon bouquet'),
    whenInclusion(
      'awg1-entry',
      'Small standee / balloon bouquet',
      '1 small standee or balloon bouquet'
    ),
    choiceOption('awg1-arch', 'Balloon Arch (choose 1)', 'Balloon arch with sign'),
    whenInclusion('awg1-arch', 'Balloon arch with sign', 'Balloon arch with sign'),
    choiceOption(
      'awg1-arch',
      'Balloon Arch (choose 1)',
      '20 balloons stuck on ceiling with ribbons'
    ),
    whenInclusion(
      'awg1-arch',
      '20 balloons stuck on ceiling with ribbons',
      '20 balloons stuck on the ceiling with ribbons'
    ),
  ];
}

function airWeGo23Inclusions() {
  return [
    {
      text: 'Shiny wall with balloon d├⌐cor (6├ù6 ft)',
      group_title: 'Backdrop',
    },
    choiceOption('awg23-helium', 'Helium or Standee (choose 1)', 'Loose Helium 20'),
    whenInclusion('awg23-helium', 'Loose Helium 20', '20 loose helium balloons'),
    choiceOption('awg23-helium', 'Helium or Standee (choose 1)', '2 small standees / bouquet'),
    whenInclusion(
      'awg23-helium',
      '2 small standees / bouquet',
      '2 small standees or balloon bouquet'
    ),
    choiceOption('awg23-accent', 'Neon or Cake Table (choose 1)', 'Custom neon sign'),
    whenInclusion(
      'awg23-accent',
      'Custom neon sign',
      'Custom neon sign ΓÇö mention your occasion / text when booking'
    ),
    choiceOption('awg23-accent', 'Neon or Cake Table (choose 1)', 'Cake table'),
    whenInclusion('awg23-accent', 'Cake table', 'Styled cake table'),
  ];
}

function airWeGo3Inclusions() {
  // Includes section is customer-facing source of truth (helium 10 / 1 standee + both backdrop & 3D).
  return [
    choiceOption('awg3-helium', 'Helium or Standee (choose 1)', 'Loose Helium 10'),
    whenInclusion('awg3-helium', 'Loose Helium 10', '10 loose helium balloons'),
    choiceOption('awg3-helium', 'Helium or Standee (choose 1)', 'Small standee / balloon bouquet'),
    whenInclusion(
      'awg3-helium',
      'Small standee / balloon bouquet',
      '1 small standee or balloon bouquet'
    ),
    { text: 'Balloon backdrop', group_title: 'Backdrop' },
    { text: '3D numbers (2)', group_title: 'Statement Element' },
  ];
}

function aarambh1Inclusions() {
  return [
    choiceOption('aa1-accents', 'Decor Accents (choose 1)', '4 lanterns'),
    choiceOption('aa1-accents', 'Decor Accents (choose 1)', '4 candle abras'),
    choiceOption('aa1-styling', 'Styling Elements (choose 1)', '4 crates'),
    choiceOption('aa1-styling', 'Styling Elements (choose 1)', '4 urlis'),
    { text: '10 candles in glass holders', group_title: 'Lighting' },
    { text: '1 easel stand with printed welcome board + flowers', group_title: 'Welcome Setup' },
    { text: '1 carpet for entrance placement', group_title: 'Welcome Setup' },
  ];
}

function auraUpgrade1Inclusions() {
  return [
    { text: '2 printed quote/information boards with small easel stands', group_title: 'Signage & Styling' },
    { text: '2 neon signs', group_title: 'Signage & Styling' },
    choiceOption('au1-lights', 'Lighting (choose 1)', 'Fairy lights with electrician', {
      amount: 9950,
    }),
    whenInclusion(
      'au1-lights',
      'Fairy lights with electrician',
      '10 strings of fairy lights with electrician for setup'
    ),
    choiceOption('au1-lights', 'Lighting (choose 1)', 'Fairy lights without electrician', {
      amount: 6650,
    }),
    whenInclusion(
      'au1-lights',
      'Fairy lights without electrician',
      '10 strings of fairy lights without electrician'
    ),
  ];
}

function raiseTheBarMeta(overrides = {}) {
  return baseMeta({
    nitty_gritty:
      'Love the look but want a different colour or style direction? Go ahead and book, weΓÇÖll connect to customise to match your event vibe.',
    setup_needs:
      'A small area for our team to work and access to water & electricity. Final print content to be shared prior to the event (timeline will be suggested by team Elewen after booking).',
    best_placed_at:
      'Perfect for house parties, birthdays, and intimate gatherings that need a proper bar corner',
    why_we_love_it:
      'Because a defined bar corner changes the vibe instantly. It gives guests a clear gathering spot and makes the party feel structured and ready',
    price_covers: [
      { text: 'The Complete Look' },
      { text: 'Professional Setup' },
      { text: 'Final Dismantling' },
      { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
      { text: 'No hidden service fees.' },
    ],
    ...overrides,
  });
}

const GENERAL_PACK_PACKAGES = [
  {
    sheet: 'PP1',
    title: 'Phool-Proof 1',
    slug: 'phool-proof-1',
    theme_name: 'Phool-Proof',
    theme_slug_candidates: generalPackThemeCandidates('phool-proof'),
    budget_level_slug: 'level-1',
    // L2 Default total; flower choose-1 amounts swap the displayed package price.
    base_price: 4175,
    description:
      'Thoughtfully layered floral arrangements that bring softness, balance, and quiet elegance to your celebration.',
    key_decor_elements:
      'Five floral bunches in vases ΓÇö choose your flower tier to match the mood of the room.',
    ...baseMeta({
      nitty_gritty:
        'Love the look but need a different color? go ahead and book! WeΓÇÖll contact you to finalize the perfect shade from our available decor to match your vibe.',
      setup_needs:
        'A small area for our team to work, access to water and electricity. Final images prior to the event (timeline will be suggested by team Elewen after booking).',
      best_placed_at:
        'Table centers, console tables, coffee tables or any corner of your house.',
      why_we_love_it: 'This setup turns decor into conversation.',
      price_covers: [
        { text: 'The Complete Look' },
        { text: 'Professional Setup' },
        { text: 'Final Dismantling' },
        { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
        { text: 'No hidden service fees.' },
      ],
    }),
    price_breakdown: [
      { label: '5 bunches (centerpieces) ΓÇö L2 default', amount: 3250 },
      { label: 'Platform fee', amount: 325 },
      { label: 'Transport Fee', amount: 600 },
    ],
    addons: [
      optionalPackageAddon('20 Premium Stems', 0, 'Optional add-on of 20 premium stems'),
    ],
    inclustions: [
      { text: '5 bunches of flowers arranged in 5 vases', group_title: 'Floral Styling' },
      choiceOption('pp1-flowers', 'Flower type (choose 1)', 'Level 1 florals', {
        amount: 3350,
      }),
      whenInclusion(
        'pp1-flowers',
        'Level 1 florals',
        'Daisy, roses, gypsophila, babyΓÇÖs breath ΓÇö Γé╣550 per vase'
      ),
      choiceOption('pp1-flowers', 'Flower type (choose 1)', 'Level 2 florals (default)', {
        amount: 4175,
      }),
      whenInclusion(
        'pp1-flowers',
        'Level 2 florals (default)',
        'Carnations, gerbera, rajnigandha ΓÇö Γé╣650 per vase'
      ),
      choiceOption('pp1-flowers', 'Flower type (choose 1)', 'Level 3 florals', {
        amount: 6650,
      }),
      whenInclusion(
        'pp1-flowers',
        'Level 3 florals',
        'Lily, orchid, eustoma ΓÇö Γé╣1,200 per vase'
      ),
    ],
  },
  {
    sheet: 'PP2',
    title: 'Phool-Proof 2',
    slug: 'phool-proof-2',
    theme_name: 'Phool-Proof',
    theme_slug_candidates: generalPackThemeCandidates('phool-proof'),
    budget_level_slug: 'level-2',
    // L2 Default total; flower choose-1 amounts swap the displayed package price.
    base_price: 7035,
    description:
      'Thoughtfully layered floral arrangements that bring softness, balance, and quiet elegance to your celebration.',
    key_decor_elements:
      'Table florals, floor vases, and candlelight ΓÇö a fuller floral layer for the space.',
    ...baseMeta({
      nitty_gritty:
        'Love the look but need a different color? go ahead and book! WeΓÇÖll contact you to finalize the perfect shade from our available decor to match your vibe.',
      setup_needs:
        'A small area for our team to work, access to water and electricity. Final images prior to the event (timeline will be suggested by team Elewen after booking).',
      best_placed_at:
        'Table centers, console tables, coffee tables or any corner of your house.',
      why_we_love_it: 'This setup turns decor into conversation.',
      price_covers: [
        { text: 'The Complete Look' },
        { text: 'Professional Setup' },
        { text: 'Final Dismantling' },
        { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
        { text: 'No hidden service fees.' },
      ],
    }),
    price_breakdown: [
      { label: '5 bunches (centerpieces) ΓÇö L2 default', amount: 5850 },
      { label: '1 floral set up 1 big+2 Small Vases + candles', amount: 6000 },
      { label: 'Entrance easel flowers (Board excl) + 4 big vases', amount: 4000 },
      { label: 'Platform fee', amount: 585 },
      { label: 'Transport Fee', amount: 600 },
    ],
    addons: [
      optionalPackageAddon('20 Premium Stems', 0, 'Optional add-on of 20 premium stems'),
    ],
    inclustions: [
      {
        text: '5 bunches of fresh flowers placed in 5 vases',
        group_title: 'Table Florals',
      },
      {
        text: '3 floor vases with fresh flower bunches (1 big + 2 small)',
        group_title: 'Floor Florals',
      },
      { text: '15 glass holders with candles', group_title: 'Candles' },
      choiceOption('pp2-flowers', 'Flower type (choose 1)', 'Level 1 florals', {
        amount: 5440,
      }),
      whenInclusion(
        'pp2-flowers',
        'Level 1 florals',
        'Table: Daisy, roses, gypsophila, babyΓÇÖs breath ΓÇö Γé╣500 per vase'
      ),
      whenInclusion(
        'pp2-flowers',
        'Level 1 florals',
        'Floor (1 big + 2 small): Daisy, roses, gypsophila, babyΓÇÖs breath ΓÇö Γé╣1,000 per 3 vases'
      ),
      choiceOption('pp2-flowers', 'Flower type (choose 1)', 'Level 2 florals (default)', {
        amount: 7035,
      }),
      whenInclusion(
        'pp2-flowers',
        'Level 2 florals (default)',
        'Table: Carnations, gerbera, rajnigandha ΓÇö Γé╣650 per vase'
      ),
      whenInclusion(
        'pp2-flowers',
        'Level 2 florals (default)',
        'Floor (1 big + 2 small): Carnations, gerbera, rajnigandha ΓÇö Γé╣1,350 per set'
      ),
      choiceOption('pp2-flowers', 'Flower type (choose 1)', 'Level 3 florals', {
        amount: 9840,
      }),
      whenInclusion(
        'pp2-flowers',
        'Level 3 florals',
        'Table: Lily, orchid, eustoma ΓÇö Γé╣1,200 per vase'
      ),
      whenInclusion(
        'pp2-flowers',
        'Level 3 florals',
        'Floor (1 big + 2 small): Lily, orchid, eustoma ΓÇö Γé╣1,600 per set'
      ),
    ],
  },
  {
    sheet: 'AWG1',
    title: 'Air We Go 1',
    slug: 'air-we-go-1',
    theme_name: 'Air We Go',
    theme_slug_candidates: generalPackThemeCandidates('air-we-go'),
    budget_level_slug: 'level-1',
    base_price: 5605,
    description:
      'Designed to instantly amp up your space and create a refined, celebratory atmosphere.',
    key_decor_elements:
      'Choose helium or a standee/bouquet, plus an arch or ceiling balloon ribbon setup.',
    ...airWeGoMeta(),
    price_breakdown: [
      { label: 'Loose Helium 7 / Small Standee (avg)', amount: 1250 },
      { label: 'Balloon Arch / Ceiling balloons (avg)', amount: 2850 },
      { label: 'Package Price', amount: 4550 },
      { label: 'Platform fee', amount: 455 },
      { label: 'Transport', amount: 600 },
    ],
    inclustions: airWeGo1Inclusions(),
  },
  {
    sheet: 'AWG2',
    title: 'Air We Go 2',
    slug: 'air-we-go-2',
    theme_name: 'Air We Go',
    theme_slug_candidates: generalPackThemeCandidates('air-we-go'),
    budget_level_slug: 'level-2',
    base_price: 4010,
    description:
      'Designed to instantly amp up your space and create a refined, celebratory atmosphere.',
    key_decor_elements:
      'Balloon arch, cake table, birthday digits standee, and celebration bunting.',
    ...airWeGoMeta(),
    price_breakdown: [
      { label: 'Balloon Arch with sign and digits', amount: 2100 },
      { label: 'Cake Table', amount: 1000 },
      { label: 'Package Price', amount: 3100 },
      { label: 'Platform fee', amount: 310 },
      { label: 'Transport fee', amount: 600 },
    ],
    inclustions: [
      { text: 'Balloon arch with sign', group_title: 'Balloon Styling' },
      { text: 'Cake table', group_title: 'Cake Table' },
      { text: 'Birthday digits balloon standee', group_title: 'Balloon Styling' },
      {
        text: 'Happy Birthday / celebration bunting ΓÇö mention your occasion when booking',
        group_title: 'Signage',
      },
    ],
  },
  {
    sheet: 'AWG23',
    title: 'Air We Go 2/3',
    slug: 'air-we-go-2-3',
    theme_name: 'Air We Go',
    theme_slug_candidates: generalPackThemeCandidates('air-we-go'),
    budget_level_slug: 'level-2',
    base_price: 11499,
    description:
      'Designed to instantly amp up your space and create a refined, celebratory atmosphere.',
    key_decor_elements:
      '6├ù6 shiny balloon wall, helium or standees, plus neon sign or cake table.',
    ...airWeGoMeta(),
    price_breakdown: [
      { label: 'Shiny wall with balloon decor', amount: 6000 },
      { label: 'Loose Helium 20 / 2 standees', amount: 2100 },
      { label: 'Neon sign / Cake table', amount: 1000 },
      { label: 'Package Price', amount: 9999 },
      { label: 'Platform fee', amount: 1000 },
      { label: 'Transport Fee', amount: 500 },
    ],
    inclustions: airWeGo23Inclusions(),
  },
  {
    sheet: 'AWG3',
    title: 'Air We Go 3',
    slug: 'air-we-go-3',
    theme_name: 'Air We Go',
    theme_slug_candidates: generalPackThemeCandidates('air-we-go'),
    budget_level_slug: 'level-3',
    base_price: 13030,
    description:
      'Designed to instantly amp up your space and create a refined, celebratory atmosphere.',
    key_decor_elements:
      'Helium or standee choice, balloon backdrop, and 3D numbers.',
    ...airWeGoMeta(),
    price_breakdown: [
      { label: 'Loose Helium / Standee', amount: 2100 },
      { label: 'Balloon backdrop with shiny wall', amount: 6000 },
      { label: '3D Numbers (2)', amount: 2000 },
      { label: 'Package Price', amount: 11300 },
      { label: 'Platform fee', amount: 1130 },
      { label: 'Transport fee', amount: 600 },
    ],
    inclustions: airWeGo3Inclusions(),
  },
  // The First Layer 1ΓÇô3 live in decor-bohemian-packages.js (Bohemian Excel).
  {
    sheet: 'RTB1',
    title: 'Raise the Bar 1',
    slug: 'raise-the-bar-1',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: generalPackThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-1',
    base_price: 5710,
    description:
      'A dedicated bar setup designed to instantly lift the energy of your event. Simple, stylish, and functional.',
    key_decor_elements:
      'Takht bar with black masking, bar menu with easel, bar-themed neon sign, and optional bartender.',
    ...raiseTheBarMeta(),
    price_breakdown: [
      { label: 'Takht Bar', amount: 2500 },
      { label: 'Bar essentials', amount: 500 },
      { label: 'Bar props ΓÇö neon sign', amount: 400 },
      { label: 'Package Price', amount: 4100 },
      { label: 'Transport and Labour', amount: 1200 },
      { label: 'Platform fee', amount: 410 },
    ],
    inclustions: [
      {
        text: 'Bar made with takht and a table ΓÇö black pleated masking for a clean finish',
        group_title: 'Basic Bar Setup',
      },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Props' },
    ],
    addons: [
      optionalPackageAddon(
        'Bartender (4ΓÇô5 hours)',
        4700,
        'Optional but recommended ΓÇö 1 bartender for INR 4,700 for 4ΓÇô5 hours'
      ),
    ],
  },
  {
    sheet: 'RTB1B',
    title: 'Package Bar',
    slug: 'raise-the-bar-1b',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: generalPackThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-1',
    base_price: 6810,
    description:
      'A dedicated bar setup along with a beer pong table, designed to instantly lift the energy of your event. Simple, stylish, and functional.',
    key_decor_elements:
      'Takht bar, bar menu, neon sign, beer pong table, and optional bartender.',
    ...raiseTheBarMeta({
      why_we_love_it:
        'Because a defined bar corner changes the vibe instantly. Bar and beer pong ΓÇö gives guests a clear gathering spot and makes the party feel fun',
    }),
    price_breakdown: [
      { label: 'Takht Bar', amount: 2500 },
      { label: 'Bar essentials', amount: 500 },
      { label: 'Bar props ΓÇö neon sign', amount: 400 },
      { label: 'Beer Pong Table Set-up', amount: 1500 },
      { label: 'Package Price', amount: 5100 },
      { label: 'Transport and Labour', amount: 1200 },
      { label: 'Platform fee', amount: 510 },
    ],
    inclustions: [
      {
        text: 'Bar made with takht and a table ΓÇö black pleated masking for a clean finish',
        group_title: 'Basic Bar Setup',
      },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Props' },
      { text: 'Beer pong table setup', group_title: 'Games' },
    ],
    addons: [
      optionalPackageAddon(
        'Bartender (4ΓÇô5 hours)',
        4700,
        'Optional but recommended ΓÇö 1 bartender for INR 4,700 for 4ΓÇô5 hours'
      ),
    ],
  },
  {
    sheet: 'RTB2',
    title: 'Raise the Bar 2',
    slug: 'raise-the-bar-2',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: generalPackThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-2',
    base_price: 11760,
    description:
      'A dedicated bar setup along with a beer pong table, designed to instantly lift the energy of your event. Simple, stylish, and functional.',
    key_decor_elements:
      'Takht bar, neon, beer pong, and furniture for guests to gather and buffet.',
    ...raiseTheBarMeta({
      why_we_love_it:
        'Because a defined bar corner changes the vibe instantly. Bar and beer pong ΓÇö gives guests a clear gathering spot and makes the party feel fun',
    }),
    price_breakdown: [
      { label: 'Takht Bar', amount: 2500 },
      { label: 'Bar essentials', amount: 500 },
      { label: 'Bar props ΓÇö neon sign', amount: 400 },
      { label: 'Beer Pong Table Set-up', amount: 1500 },
      { label: '1 round table with linen', amount: 500 },
      { label: '6 basic chairs with linens', amount: 1600 },
      { label: '2 basic cocktail tables', amount: 1000 },
      { label: '2 Rectangle tables for buffet with linen', amount: 400 },
      { label: 'Package Price', amount: 9600 },
      { label: 'Transport and Labour', amount: 1200 },
      { label: 'Platform fee', amount: 960 },
    ],
    inclustions: [
      {
        text: 'Bar made with takht and a table ΓÇö black pleated masking for a clean finish',
        group_title: 'Basic Bar Setup',
      },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Props' },
      { text: 'Beer pong table setup', group_title: 'Games' },
      { text: '1 round table with linen', group_title: 'Furniture' },
      { text: '6 basic chairs with linen', group_title: 'Furniture' },
      { text: '2 basic cocktail tables', group_title: 'Furniture' },
      {
        text: '2 rectangle tables for buffet with linen / chat paper',
        group_title: 'Furniture',
      },
    ],
    addons: [
      optionalPackageAddon(
        'Bartender (4ΓÇô5 hours)',
        4700,
        'Optional but recommended ΓÇö 1 bartender for INR 4,700 for 4ΓÇô5 hours'
      ),
    ],
  },
  {
    sheet: 'RTB23',
    title: 'Raise the Bar 2/3',
    slug: 'raise-the-bar-2-3',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: generalPackThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-2',
    base_price: 18820,
    description:
      'A dedicated bar setup along with seating for guests, designed to instantly lift the energy of your event. Simple, stylish, and functional.',
    key_decor_elements:
      'Premium fancy bar, bar menu, neon sign, and furniture for mingling and buffet.',
    ...raiseTheBarMeta({
      why_we_love_it:
        'Because a defined bar corner changes the vibe instantly. Bar and beer pong ΓÇö gives guests a clear gathering spot and makes the party feel fun',
    }),
    price_breakdown: [
      { label: 'Fancy Bar', amount: 6500 },
      { label: 'Bar essentials', amount: 500 },
      { label: '2 round tables with linens', amount: 1000 },
      { label: '12 basic chairs with linens', amount: 3200 },
      { label: '2 basic cocktail tables', amount: 1000 },
      { label: '2 Rectangle tables for buffet with linen', amount: 400 },
      { label: 'Package Price', amount: 14200 },
      { label: 'Transport and Labour', amount: 3200 },
      { label: 'Platform fee', amount: 1420 },
    ],
    inclustions: [
      { text: 'Premium fancy bar setup', group_title: 'Premium Bar Setup' },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Props' },
      { text: '1 round table with linen', group_title: 'Furniture' },
      { text: '8 basic chairs with linen', group_title: 'Furniture' },
      { text: '2 basic cocktail tables', group_title: 'Furniture' },
      {
        text: '2 rectangle tables for buffet with linen',
        group_title: 'Furniture',
      },
    ],
    addons: [
      optionalPackageAddon(
        'Bartender (4ΓÇô5 hours)',
        5700,
        'Optional but recommended ΓÇö 1 bartender for INR 5,700 for 4ΓÇô5 hours'
      ),
    ],
  },
  {
    sheet: 'RTB3',
    title: 'Raise the Bar 3',
    slug: 'raise-the-bar-3',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: generalPackThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-3',
    base_price: 30200,
    description:
      'A dedicated bar setup along with a beer pong table, designed to instantly lift the energy of your event. Simple, stylish, and functional.',
    key_decor_elements:
      'Premium bar cart, beer pong, neon sign, and upgraded fancy furniture.',
    ...raiseTheBarMeta({
      why_we_love_it:
        'Because a defined bar corner changes the vibe instantly. Bar and beer pong ΓÇö gives guests a clear gathering spot and makes the party feel fun',
    }),
    price_breakdown: [
      { label: 'Fancy Bar (cart)', amount: 7000 },
      { label: 'Bar essentials', amount: 500 },
      { label: 'Beer Pong Table Set-up', amount: 1500 },
      { label: '2 fancy round tables', amount: 2500 },
      { label: '20 fancy chairs', amount: 10000 },
      { label: '2 cocktail tables', amount: 4000 },
      { label: '4 Rectangle tables for buffet with linen', amount: 800 },
      { label: 'Package Price', amount: 26500 },
      { label: 'Transport and Labour', amount: 3200 },
      { label: 'Platform fee', amount: 500 },
    ],
    inclustions: [
      { text: 'Premium bar cart setup', group_title: 'Premium Bar Setup' },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Props' },
      { text: 'Beer pong table setup', group_title: 'Games' },
      { text: '1 round table with linen', group_title: 'Furniture' },
      { text: '8 basic chairs with linen', group_title: 'Furniture' },
      { text: '2 cocktail tables', group_title: 'Furniture' },
      {
        text: '2 rectangle tables for buffet with linen',
        group_title: 'Furniture',
      },
    ],
    addons: [
      optionalPackageAddon(
        'Bartender (4ΓÇô5 hours)',
        5700,
        'Optional but recommended ΓÇö 1 bartender for INR 5,700 for 4ΓÇô5 hours'
      ),
    ],
  },
  {
    sheet: 'JEM1',
    title: 'Just Enough Magic 1',
    slug: 'just-enough-magic-1',
    theme_name: 'Just Enough Magic',
    theme_slug_candidates: generalPackThemeCandidates('just-enough-magic'),
    budget_level_slug: 'level-1',
    base_price: 17830,
    description: 'An intimate party setup, perfect for small gatherings that need warmth without heavy d├⌐cor.',
    key_decor_elements:
      'Choose florals or balloons, plus printables, a takhat bar, and compact furniture.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Balloon arch with sign', amount: 5000 },
      { label: 'Transport and Labour', amount: 3200 },
      { label: 'Platform fee', amount: 1330 },
    ],
    inclustions: justEnoughMagic1Inclusions(),
  },
  {
    sheet: 'JEM2',
    title: 'Just Enough Magic 2',
    slug: 'just-enough-magic-2',
    theme_name: 'Just Enough Magic',
    theme_slug_candidates: generalPackThemeCandidates('just-enough-magic'),
    budget_level_slug: 'level-2',
    base_price: 25310,
    description: 'An intimate party setup, perfect for small gatherings that need warmth without heavy d├⌐cor.',
    key_decor_elements:
      'Florals or balloons, printables, bar, and furniture for a fuller small gathering.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Balloon arch with sign', amount: 5000 },
      { label: 'Transport and Labour', amount: 3200 },
      { label: 'Platform fee', amount: 2010 },
    ],
    inclustions: justEnoughMagic2Inclusions(),
  },
  {
    sheet: 'JEM3',
    title: 'Just Enough Magic 3',
    slug: 'just-enough-magic-3',
    theme_name: 'Just Enough Magic',
    theme_slug_candidates: generalPackThemeCandidates('just-enough-magic'),
    budget_level_slug: 'level-3',
    base_price: 34660,
    description:
      'An intimate party setup, perfect for small gatherings that need warmth without heavy d├⌐cor.',
    key_decor_elements:
      'Styled entrance with florals and candles, a relaxed bar setup, and comfortable seating that allows Just Enough Magic to happen!!',
    ...justEnoughMagicMeta(),
    price_breakdown: [
      { label: 'Florals / balloons (avg)', amount: 9000 },
      { label: 'Bar setup ΓÇö takht + black masking', amount: 2500 },
      { label: 'Furniture (fancy)', amount: 4500 },
      { label: 'Fancy backdrop / photo-op', amount: 8000 },
      { label: 'Package Price', amount: 28600 },
      { label: 'Transport and labour', amount: 3200 },
      { label: 'Platform fee', amount: 2860 },
    ],
    inclustions: justEnoughMagic3Inclusions(),
    addons: [
      optionalPackageAddon(
        'Printables pack',
        1500,
        '1 fun quote, bar menu, Take a Shot sign, and 1 game suggestion'
      ),
    ],
  },
  {
    sheet: 'PS1',
    title: 'Party Smart 1',
    slug: 'party-smart-1',
    theme_name: 'Party Smart',
    theme_slug_candidates: generalPackThemeCandidates('party-smart'),
    budget_level_slug: 'level-1',
    base_price: 25750,
    description:
      'A smart, all-in-one party setup that covers the essentials. Designed for hosts who want the space to look lively, styled, and celebration-ready without going over the top.',
    key_decor_elements:
      'A balanced mix of table styling, entrance decor, a visual focal point (backdrop or bar), and playful signage details that tie the entire party together.',
    ...partySmartMeta(),
    price_breakdown: [
      { label: 'Florals / balloons (avg)', amount: 7500 },
      { label: 'Entry setup (avg)', amount: 4000 },
      { label: 'Backdrop or bar (avg)', amount: 8000 },
      { label: '3D letters / neon (avg)', amount: 1000 },
      { label: 'Package Price', amount: 20500 },
      { label: 'Labour and transport', amount: 3200 },
      { label: 'Platform fee', amount: 2050 },
    ],
    inclustions: partySmart1Inclusions(),
  },
  {
    sheet: 'PS2',
    title: 'Party Smart 2',
    slug: 'party-smart-2',
    theme_name: 'Party Smart',
    theme_slug_candidates: generalPackThemeCandidates('party-smart'),
    budget_level_slug: 'level-2',
    base_price: 32680,
    description:
      'A smart, all-in-one party setup with styling, backdrop or bar options, and basic furniture.',
    key_decor_elements:
      'Table styling + entrance d├⌐cor + focal backdrop + bar setup + essential furniture for guest comfort and smooth flow.',
    ...partySmartMeta({
      why_we_love_it:
        'Three strong visual elements and a styled bar along with furniture ΓÇö just the right balance to make your event look complete, polished, and photo-ready.',
    }),
    price_breakdown: [
      { label: 'Florals / balloons (avg)', amount: 7500 },
      { label: 'Entry setup (avg)', amount: 4000 },
      { label: 'Backdrop (avg)', amount: 10000 },
      { label: 'Furniture (basic)', amount: 5300 },
      { label: 'Package Price', amount: 26800 },
      { label: 'Transport', amount: 3200 },
      { label: 'Platform fee', amount: 2680 },
    ],
    inclustions: partySmart2Inclusions(),
  },
  {
    sheet: 'PS23',
    title: 'Party Smart 2/3',
    slug: 'party-smart-2-3',
    theme_name: 'Party Smart',
    theme_slug_candidates: generalPackThemeCandidates('party-smart'),
    budget_level_slug: 'level-2',
    base_price: 47000,
    description:
      'A smart, all-in-one party setup with styling, backdrop, bar, and furniture included.',
    key_decor_elements:
      'Table styling, a proper entrance setup, a photo-ready backdrop, a functional bar, and structured seating layout.',
    ...partySmartMeta({
      why_we_love_it:
        'Three strong visual elements and a styled bar ΓÇö just the right balance to make your event look complete, polished, and photo-ready.',
    }),
    price_breakdown: [
      { label: 'Florals / balloons (avg)', amount: 7500 },
      { label: 'Entry setup (avg)', amount: 4000 },
      { label: 'Backdrop (avg)', amount: 10000 },
      { label: 'Bar setup (avg)', amount: 8000 },
      { label: 'Furniture (basic)', amount: 7000 },
      { label: 'Package Price', amount: 36500 },
      { label: 'Taxes', amount: 3650 },
      { label: 'Platform fee', amount: 3650 },
      { label: 'Transport', amount: 3200 },
    ],
    inclustions: partySmart23Inclusions(),
  },
  {
    sheet: 'PS3',
    title: 'Party Smart 3',
    slug: 'party-smart-3',
    theme_name: 'Party Smart',
    theme_slug_candidates: generalPackThemeCandidates('party-smart'),
    budget_level_slug: 'level-3',
    base_price: 59960,
    description: 'A full-scale party setup with styling, backdrop, bar, and upgraded furniture.',
    key_decor_elements:
      'Floral or balloon styling, a strong photo backdrop, a functional bar area, and upgraded furniture that enhances the overall look of the space.',
    ...partySmartMeta({
      best_placed_at:
        'Home celebrations, terraces, small banquet halls, caf├⌐s, or any party venues.',
      why_we_love_it:
        'Because it upgrades not just the d├⌐cor ΓÇö but the hosting experience. Better seating, stronger visuals, and the option to add warm lighting makes the entire space feel thoughtfully done and celebration-ready.',
    }),
    price_breakdown: [
      { label: 'Florals / balloons (avg)', amount: 7500 },
      { label: 'Entry setup (avg)', amount: 4000 },
      { label: 'Backdrop (avg)', amount: 8000 },
      { label: 'Bar setup (avg)', amount: 10000 },
      { label: 'Premium furniture (avg)', amount: 17800 },
      { label: 'Package Price', amount: 47300 },
      { label: 'Taxes', amount: 4730 },
      { label: 'Platform fee', amount: 4730 },
      { label: 'Transport fee', amount: 3200 },
    ],
    inclustions: partySmart3Inclusions(),
    addons: [
      optionalPackageAddon(
        '10 fairy lights with electrician',
        5000,
        '10 fairy lights with electrician to set it up ΓÇö adds warmth and evening ambience'
      ),
    ],
  },
  {
    sheet: 'SS2',
    title: 'Party Smart Social 2',
    slug: 'party-smart-social-2',
    theme_name: 'Party Smart',
    theme_slug_candidates: generalPackThemeCandidates('party-smart'),
    budget_level_slug: 'level-2',
    base_price: 59520,
    description:
      'A statement backdrop and a well-styled bar ΓÇö the two elements that instantly define your event and dominate your photos.',
    key_decor_elements:
      'Think a large, visually striking panel backdrop for all your pictures, paired with a polished bar setup ΓÇö with supporting entry and interactive decor elements.',
    ...partySmartSocialMeta(),
    price_breakdown: [
      { label: 'Entry setup', amount: 2000 },
      { label: 'Large panel backdrop', amount: 25000 },
      { label: 'Bar setup', amount: 8000 },
      { label: 'Welcome drink wall / DIY wall', amount: 10000 },
      { label: 'Package Price', amount: 51200 },
      { label: 'Transport and labour', amount: 3200 },
      { label: 'Platform fee', amount: 5120 },
      { label: 'Taxes', amount: 5120 },
    ],
    inclustions: [
      {
        text: 'Easel with welcome board, crates, flowers and candles',
        group_title: 'Entry Setup',
      },
      {
        text: 'Large panel backdrop ΓÇö bold, high-impact focal point for photographs and stage moments',
        group_title: 'Backdrop / Photo-op',
      },
      {
        text: 'Styled bar area (fancy options available based on theme)',
        group_title: 'Bar Setup',
      },
      {
        text: 'Welcome drink wall or DIY wall ΓÇö customised to your occasion and theme',
        group_title: 'Decor Element Wall',
      },
    ],
  },
  {
    sheet: 'SS3',
    title: 'Party Smart Social 3',
    slug: 'party-smart-social-3',
    theme_name: 'Party Smart',
    theme_slug_candidates: generalPackThemeCandidates('party-smart'),
    budget_level_slug: 'level-3',
    base_price: 63700,
    description:
      'A statement backdrop and a beautifully styled bar, elevated further with special effects that create unforgettable moments.',
    key_decor_elements:
      'A striking backdrop paired with a premium bar setup, enhanced with SFX elements like cold pyros, entry bursts, or a flower shower.',
    ...partySmartSocialMeta({
      why_we_love_it:
        'Because it doesnΓÇÖt just look good ΓÇö it creates moments. The backdrop sets the frame, the bar builds the vibe, and the SFX adds that cinematic impact.',
    }),
    price_breakdown: [
      { label: 'Entry setup', amount: 2000 },
      { label: 'Large panel backdrop', amount: 25000 },
      { label: 'Bar setup', amount: 8000 },
      { label: 'Welcome drink wall / DIY wall', amount: 10000 },
      { label: 'SFX enhancements', amount: 5000 },
      { label: 'Package Price', amount: 55000 },
      { label: 'Transport and labour', amount: 3200 },
      { label: 'Platform fee', amount: 5500 },
    ],
    inclustions: [
      {
        text: 'Easel with welcome board, crates, florals and candles',
        group_title: 'Entry Setup',
      },
      {
        text: 'High-impact backdrop / photo-op focal point for stage moments and photographs',
        group_title: 'Backdrop / Photo-op',
      },
      { text: '1 premium bar setup', group_title: 'Bar Setup' },
      {
        text: 'Welcome drink wall or DIY wall ΓÇö print customised to your theme',
        group_title: 'Decor Element Wall',
      },
      {
        text: 'Cold pyros / entry effects / flower shower (as per venue feasibility)',
        group_title: 'SFX Additions',
      },
    ],
  },
  {
    sheet: 'AA1',
    title: 'Entry Setup Aarambh 1',
    slug: 'entry-setup-aarambh-1',
    theme_name: 'Aarambh',
    theme_slug_candidates: generalPackThemeCandidates('aarambh'),
    budget_level_slug: 'level-1',
    base_price: 5990,
    description: 'A simple, elegant entrance styling designed to warmly welcome your guests.',
    key_decor_elements:
      'Choose lanterns or abras, crates or urlis, plus candles and a welcome board.',
    ...baseMeta({
      nitty_gritty:
        'Love the look but want a different print or styling direction? Go ahead and book, weΓÇÖll connect to customise the board design and colour to match your event vibe.',
      setup_needs:
        'A small area for our team to work and access to electricity. Final print content to be shared prior to the event (timeline will be suggested by team Elewen after booking).',
      best_placed_at:
        'Home entrances, terrace entries, banquet hall doors, garden pathways, or any event entry point that deserves a graceful welcome moment.',
      why_we_love_it:
        'Terraces, balconies, living rooms, entry walls, bar areas, or any blank space that needs warmth and depth without heavy decor additions.',
      price_covers: [
        { text: 'The Complete Look' },
        { text: 'Professional Setup' },
        { text: 'Final Dismantling' },
        { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
        { text: 'No hidden service fees.' },
      ],
    }),
    price_breakdown: [
      { label: 'Decor accents (avg)', amount: 600 },
      { label: 'Styling elements (avg)', amount: 800 },
      { label: 'Candles', amount: 700 },
      { label: 'Easel with printed board', amount: 1100 },
      { label: 'Carpet', amount: 300 },
      { label: 'Package Price', amount: 4900 },
      { label: 'Platform fee', amount: 490 },
      { label: 'Transport and labour', amount: 600 },
    ],
    inclustions: aarambh1Inclusions(),
  },
  {
    sheet: 'AU1',
    title: 'Aura Upgrade 1',
    slug: 'aura-upgrade-1',
    theme_name: 'Aura Upgrade',
    theme_slug_candidates: generalPackThemeCandidates('aura-upgrade'),
    budget_level_slug: 'level-1',
    base_price: 9950,
    description: 'Designed to add glow, personality, and depth, without adding bulky d├⌐cor.',
    key_decor_elements:
      'Soft cascading fairy lights, glowing neon accents, and minimal print details that add character while keeping the space clean and elegant.',
    ...baseMeta({
      nitty_gritty:
        'Love the idea but want different quotes, neon text, or light placement? Go ahead and book, weΓÇÖll connect to customise it based on your space and existing decor.',
      setup_needs:
        'A small area for our team to work and access to electricity. Final print content to be shared prior to the event (timeline will be suggested by team Elewen after booking).',
      best_placed_at:
        'Terraces, balconies, living rooms, entry walls, bar areas, or any blank space that needs warmth and depth without heavy decor additions.',
      why_we_love_it:
        'Because sometimes you donΓÇÖt need more decor. You just need better lighting and the right glow.',
      price_covers: [
        { text: 'The Complete Look' },
        { text: 'Professional Setup' },
        { text: 'Final Dismantling' },
        { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
        { text: 'No hidden service fees.' },
      ],
    }),
    price_breakdown: [
      { label: '2 printables with small easels', amount: 1600 },
      { label: '2 neon signs', amount: 1200 },
      { label: 'Fairy lights with electrician (avg)', amount: 5500 },
      { label: 'Package Price', amount: 8500 },
      { label: 'Platform fee (10%)', amount: 850 },
      { label: 'Transport and labour', amount: 600 },
    ],
    inclustions: auraUpgrade1Inclusions(),
    addons: [
      optionalPackageAddon('10 candles with glass holders', 1000, '10 candles with glass holders'),
      optionalPackageAddon('1 big easel + print', 1200, '1 big easel + print'),
    ],
  },
];

async function restoreGeneralPackVisibility(strapi, eventDocumentId) {
  let restored = 0;

  for (const slug of GENERAL_PACK_PACKAGE_SLUGS) {
    const found = await findPackageBySlug(strapi, slug);
    if (!found?.entry?.documentId) continue;

    try {
      await strapi.documents('api::package.package').update({
        documentId: found.entry.documentId,
        data: {
          is_active: true,
          visibility: true,
          ...(eventDocumentId
            ? { events: { set: [{ documentId: eventDocumentId }] } }
            : {}),
        },
      });

      try {
        await strapi.documents('api::package.package').publish({
          documentId: found.entry.documentId,
        });
      } catch {
        // Ignore publish races.
      }

      restored += 1;
    } catch (error) {
      strapi.log.warn(
        `[seed/decor-general-pack] could not restore "${slug}": ${error?.message || error}`
      );
    }
  }

  return restored;
}

async function seedDecorGeneralPackPackages(strapi) {
  await ensureThemeDocumentId(strapi, {
    name: 'Birthday Party',
    slug: 'birthday-party',
    display_order: 20,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Phool-Proof',
    slug: 'phool-proof',
    display_order: 30,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Air We Go',
    slug: 'air-we-go',
    display_order: 31,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Raise the Bar',
    slug: 'raise-the-bar',
    display_order: 32,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Just Enough Magic',
    slug: 'just-enough-magic',
    display_order: 33,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Party Smart',
    slug: 'party-smart',
    display_order: 34,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Aarambh',
    slug: 'aarambh',
    display_order: 35,
  });
  await ensureThemeDocumentId(strapi, {
    name: 'Aura Upgrade',
    slug: 'aura-upgrade',
    display_order: 36,
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

  const result = await seedDecorPackages(strapi, GENERAL_PACK_PACKAGES, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-general-pack',
    refreshExistingDecor: true,
  });

  const birthdayEventId = await findEventDocumentId(strapi, EVENT_SLUG_CANDIDATES);
  const restoredVisibility = await restoreGeneralPackVisibility(strapi, birthdayEventId);

  return { ...result, restoredVisibility };
}

module.exports = {
  GENERAL_PACK_PACKAGES,
  GENERAL_PACK_PACKAGE_SLUGS,
  EVENT_SLUG_CANDIDATES,
  seedDecorGeneralPackPackages,
};
