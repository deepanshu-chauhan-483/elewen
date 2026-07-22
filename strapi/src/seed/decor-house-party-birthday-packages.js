'use strict';

/**
 * House Party / Birthday general packs.
 * Inclusions use the same choice-group pattern as Bubbles / Baby Shower / Anniversary
 * so the PDP renders maroon selectable option cards (not raw "Choose 1 … OR …" paragraphs).
 */

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
  'house-party',
  'house-parties',
];

const HOUSE_PARTY_NITTY =
  'Love the look but want a different colour or style direction? Go ahead and book — we’ll connect to customise to match your event vibe.';

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

function parentThemeCandidates(childSlug) {
  return ['house-party', 'house-parties', 'birthday-party', 'birthday-parties', childSlug].filter(
    Boolean
  );
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

/** Party Smart 1 — primary broken example in UI */
function partySmart1Inclusions() {
  return [
    choiceOption('ps1-styling', 'Floral or Balloon Styling (choose 1)', 'Florals'),
    whenInclusion('ps1-styling', 'Florals', '6 premium table centerpieces'),
    choiceOption('ps1-styling', 'Floral or Balloon Styling (choose 1)', 'Balloons'),
    whenInclusion('ps1-styling', 'Balloons', 'Balloon arch with sign'),

    choiceOption('ps1-entry', 'Entry Setup (choose 1)', 'Floral entrance'),
    whenInclusion(
      'ps1-entry',
      'Floral entrance',
      'Easel with welcome board + floral styling with crates or urli + 5–7 candles'
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
    whenInclusion('ps1-highlight', 'Neon Sign', 'Happy Birthday / Oh Baby'),
  ];
}

function partySmart2Inclusions() {
  return [
    choiceOption('ps2-styling', 'Florals or Balloons (choose 1)', 'Florals'),
    whenInclusion(
      'ps2-styling',
      'Florals',
      '6 centerpieces + entrance setup (crates/urli) + 5–7 candles'
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
    whenInclusion('ps2-entry', 'Entry Setup', '1 décor element'),
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
      'Shiny wall, ring backdrop, or single panel (neon / 3D letters)'
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
      '5 centerpieces + entrance setup (crates/urli) + 5–7 candles'
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
    whenInclusion('ps23-entry', 'Entry Setup', '1 décor element'),
    choiceOption('ps23-entry', 'Entry Setup or Printables (choose 1)', 'Printables'),
    whenInclusion(
      'ps23-entry',
      'Printables',
      'Guestbook / Take a Shot / Birthday quote signs with 2 small easels'
    ),

    { text: 'Shiny wall / ring / single panel backdrop', group_title: 'Backdrop' },
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
      '6 centerpieces + entrance setup (crates/urli) + 5–7 candles'
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
    whenInclusion('ps3-entry', 'Entry Setup', '1 décor element'),
    choiceOption('ps3-entry', 'Entry Setup or Printables (choose 1)', 'Printables'),
    whenInclusion(
      'ps3-entry',
      'Printables',
      'Guestbook / Take a Shot / Birthday quote signs with 2 small easels'
    ),

    { text: 'Shiny wall / ring / single panel backdrop', group_title: 'Backdrop' },
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
    whenInclusion('jem1-styling', 'Florals', '2–4 centerpieces + easel stand'),
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
      '4–6 centerpieces + easel stand + entrance crates/urli'
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

function justEnoughMagic3Inclusions() {
  return [
    { text: '4 flower vases (big and small) + crates or urlis', group_title: 'Entrance Setup' },
    { text: '5–7 candles in glasses', group_title: 'Entrance Setup' },
    { text: 'Easel with welcome sign + florals', group_title: 'Entrance Setup' },
    { text: 'Basic bar setup', group_title: 'Bar Setup' },
    { text: 'Photo-op (text/colour customisable post booking)', group_title: 'Photo-op' },
    { text: '1 round table', group_title: 'Premium Furniture' },
    { text: '6 fancy chairs', group_title: 'Premium Furniture' },
    { text: '2 cocktail tables', group_title: 'Premium Furniture' },
    { text: '1 fun quote', group_title: 'Optional Printables' },
    { text: 'Bar menu', group_title: 'Optional Printables' },
    { text: 'Take a Shot sign', group_title: 'Optional Printables' },
    { text: '1 game suggestion', group_title: 'Optional Printables' },
  ];
}

function airWeGoMeta(overrides = {}) {
  return baseMeta({
    nitty_gritty:
      'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
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
      text: 'Shiny wall with balloon décor (6×6 ft)',
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
      'Custom neon sign — mention your occasion / text when booking'
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
    { text: '2 printed quote boards with small easels', group_title: 'Signage & Styling' },
    { text: '2 neon signs', group_title: 'Signage & Styling' },
    choiceOption('au1-lights', 'Lighting (choose 1)', 'Fairy lights with electrician'),
    whenInclusion(
      'au1-lights',
      'Fairy lights with electrician',
      '10 strings of fairy lights with electrician setup'
    ),
    choiceOption('au1-lights', 'Lighting (choose 1)', 'Fairy lights without electrician'),
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
      'Love the look but want a different colour or style direction? Go ahead and book, we’ll connect to customise to match your event vibe.',
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

const HOUSE_PARTY_BIRTHDAY_PACKAGES = [
  {
    sheet: 'PP1',
    title: 'Phool-Proof 1',
    slug: 'phool-proof-1',
    theme_name: 'Phool-Proof',
    theme_slug_candidates: parentThemeCandidates('phool-proof'),
    budget_level_slug: 'level-1',
    // L2 Default total; flower choose-1 amounts swap the displayed package price.
    base_price: 4175,
    description:
      'Thoughtfully layered floral arrangements that bring softness, balance, and quiet elegance to your celebration.',
    key_decor_elements:
      'Five floral bunches in vases — choose your flower tier to match the mood of the room.',
    ...baseMeta({
      nitty_gritty:
        'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
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
      { label: '5 bunches (centerpieces) — L2 default', amount: 3250 },
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
        'Daisy, roses, gypsophila, baby’s breath — ₹550 per vase'
      ),
      choiceOption('pp1-flowers', 'Flower type (choose 1)', 'Level 2 florals (default)', {
        amount: 4175,
      }),
      whenInclusion(
        'pp1-flowers',
        'Level 2 florals (default)',
        'Carnations, gerbera, rajnigandha — ₹650 per vase'
      ),
      choiceOption('pp1-flowers', 'Flower type (choose 1)', 'Level 3 florals', {
        amount: 6650,
      }),
      whenInclusion(
        'pp1-flowers',
        'Level 3 florals',
        'Lily, orchid, eustoma — ₹1,200 per vase'
      ),
    ],
  },
  {
    sheet: 'PP2',
    title: 'Phool-Proof 2',
    slug: 'phool-proof-2',
    theme_name: 'Phool-Proof',
    theme_slug_candidates: parentThemeCandidates('phool-proof'),
    budget_level_slug: 'level-2',
    // L2 Default total; flower choose-1 amounts swap the displayed package price.
    base_price: 7035,
    description:
      'Thoughtfully layered floral arrangements that bring softness, balance, and quiet elegance to your celebration.',
    key_decor_elements:
      'Table florals, floor vases, and candlelight — a fuller floral layer for the space.',
    ...baseMeta({
      nitty_gritty:
        'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.',
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
      { label: '5 bunches (centerpieces) — L2 default', amount: 5850 },
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
        'Table: Daisy, roses, gypsophila, baby’s breath — ₹500 per vase'
      ),
      whenInclusion(
        'pp2-flowers',
        'Level 1 florals',
        'Floor (1 big + 2 small): Daisy, roses, gypsophila, baby’s breath — ₹1,000 per 3 vases'
      ),
      choiceOption('pp2-flowers', 'Flower type (choose 1)', 'Level 2 florals (default)', {
        amount: 7035,
      }),
      whenInclusion(
        'pp2-flowers',
        'Level 2 florals (default)',
        'Table: Carnations, gerbera, rajnigandha — ₹650 per vase'
      ),
      whenInclusion(
        'pp2-flowers',
        'Level 2 florals (default)',
        'Floor (1 big + 2 small): Carnations, gerbera, rajnigandha — ₹1,350 per set'
      ),
      choiceOption('pp2-flowers', 'Flower type (choose 1)', 'Level 3 florals', {
        amount: 9840,
      }),
      whenInclusion(
        'pp2-flowers',
        'Level 3 florals',
        'Table: Lily, orchid, eustoma — ₹1,200 per vase'
      ),
      whenInclusion(
        'pp2-flowers',
        'Level 3 florals',
        'Floor (1 big + 2 small): Lily, orchid, eustoma — ₹1,600 per set'
      ),
    ],
  },
  {
    sheet: 'AWG1',
    title: 'Air We Go 1',
    slug: 'air-we-go-1',
    theme_name: 'Air We Go',
    theme_slug_candidates: parentThemeCandidates('air-we-go'),
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
    theme_slug_candidates: parentThemeCandidates('air-we-go'),
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
        text: 'Happy Birthday / celebration bunting — mention your occasion when booking',
        group_title: 'Signage',
      },
    ],
  },
  {
    sheet: 'AWG23',
    title: 'Air We Go 2/3',
    slug: 'air-we-go-2-3',
    theme_name: 'Air We Go',
    theme_slug_candidates: parentThemeCandidates('air-we-go'),
    budget_level_slug: 'level-2',
    base_price: 11499,
    description:
      'Designed to instantly amp up your space and create a refined, celebratory atmosphere.',
    key_decor_elements:
      '6×6 shiny balloon wall, helium or standees, plus neon sign or cake table.',
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
    theme_slug_candidates: parentThemeCandidates('air-we-go'),
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
  // The First Layer 1–3 live in decor-bohemian-packages.js (Bohemian Excel).
  {
    sheet: 'RTB1',
    title: 'Raise the Bar 1',
    slug: 'raise-the-bar-1',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: parentThemeCandidates('raise-the-bar'),
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
      { label: 'Bar props — neon sign', amount: 400 },
      { label: 'Package Price', amount: 4100 },
      { label: 'Transport and Labour', amount: 1200 },
      { label: 'Platform fee', amount: 410 },
    ],
    inclustions: [
      {
        text: 'Bar made with takht and a table — black pleated masking for a clean finish',
        group_title: 'Basic Bar Setup',
      },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Props' },
    ],
    addons: [
      optionalPackageAddon(
        'Bartender (4–5 hours)',
        4700,
        'Optional but recommended — 1 bartender for INR 4,700 for 4–5 hours'
      ),
    ],
  },
  {
    sheet: 'RTB1B',
    title: 'Package Bar',
    slug: 'raise-the-bar-1b',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: parentThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-1',
    base_price: 6810,
    description:
      'A dedicated bar setup along with a beer pong table, designed to instantly lift the energy of your event. Simple, stylish, and functional.',
    key_decor_elements:
      'Takht bar, bar menu, neon sign, beer pong table, and optional bartender.',
    ...raiseTheBarMeta({
      why_we_love_it:
        'Because a defined bar corner changes the vibe instantly. Bar and beer pong — gives guests a clear gathering spot and makes the party feel fun',
    }),
    price_breakdown: [
      { label: 'Takht Bar', amount: 2500 },
      { label: 'Bar essentials', amount: 500 },
      { label: 'Bar props — neon sign', amount: 400 },
      { label: 'Beer Pong Table Set-up', amount: 1500 },
      { label: 'Package Price', amount: 5100 },
      { label: 'Transport and Labour', amount: 1200 },
      { label: 'Platform fee', amount: 510 },
    ],
    inclustions: [
      {
        text: 'Bar made with takht and a table — black pleated masking for a clean finish',
        group_title: 'Basic Bar Setup',
      },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Props' },
      { text: 'Beer pong table setup', group_title: 'Games' },
    ],
    addons: [
      optionalPackageAddon(
        'Bartender (4–5 hours)',
        4700,
        'Optional but recommended — 1 bartender for INR 4,700 for 4–5 hours'
      ),
    ],
  },
  {
    sheet: 'RTB2',
    title: 'Raise the Bar 2',
    slug: 'raise-the-bar-2',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: parentThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-2',
    base_price: 11760,
    description:
      'A dedicated bar setup along with a beer pong table, designed to instantly lift the energy of your event. Simple, stylish, and functional.',
    key_decor_elements:
      'Takht bar, neon, beer pong, and furniture for guests to gather and buffet.',
    ...raiseTheBarMeta({
      why_we_love_it:
        'Because a defined bar corner changes the vibe instantly. Bar and beer pong — gives guests a clear gathering spot and makes the party feel fun',
    }),
    price_breakdown: [
      { label: 'Takht Bar', amount: 2500 },
      { label: 'Bar essentials', amount: 500 },
      { label: 'Bar props — neon sign', amount: 400 },
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
        text: 'Bar made with takht and a table — black pleated masking for a clean finish',
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
        'Bartender (4–5 hours)',
        4700,
        'Optional but recommended — 1 bartender for INR 4,700 for 4–5 hours'
      ),
    ],
  },
  {
    sheet: 'RTB23',
    title: 'Raise the Bar 2/3',
    slug: 'raise-the-bar-2-3',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: parentThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-2',
    base_price: 18820,
    description: 'A premium bar setup with seating for a fuller celebration corner.',
    key_decor_elements: 'Premium bar, neon, and furniture for guests.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Fancy Bar', amount: 6500 },
      { label: 'Bar essentials', amount: 500 },
      { label: '12 basic chairs with linens', amount: 3200 },
      { label: '2 basic cocktail tables', amount: 1000 },
      { label: '2 Rectangle tables for buffet with linen', amount: 400 },
      { label: 'Transport and Labour', amount: 3200 },
      { label: 'Platform fee', amount: 1420 },
    ],
    inclustions: [
      { text: 'Premium bar setup', group_title: 'Premium Bar Setup' },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Essentials' },
      { text: '1 round table with linen', group_title: 'Furniture' },
      { text: '8 basic chairs with linen', group_title: 'Furniture' },
      { text: '2 cocktail tables', group_title: 'Furniture' },
      { text: '2 buffet tables with linen', group_title: 'Furniture' },
    ],
    addons: [
      optionalPackageAddon('Bartender (4–5 hours)', 5700, 'Optional bartender for 4–5 hours'),
    ],
  },
  {
    sheet: 'RTB3',
    title: 'Raise the Bar 3',
    slug: 'raise-the-bar-3',
    theme_name: 'Raise the Bar',
    theme_slug_candidates: parentThemeCandidates('raise-the-bar'),
    budget_level_slug: 'level-3',
    base_price: 30200,
    description: 'A premium bar cart setup with games and upgraded furniture.',
    key_decor_elements: 'Premium bar cart, beer pong, and fancy seating.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Fancy Bar', amount: 7000 },
      { label: 'Bar essentials', amount: 500 },
      { label: 'Games', amount: 1500 },
      { label: '20 fancy chairs', amount: 10000 },
      { label: '2 cocktail tables', amount: 4000 },
      { label: '4 Rectangle tables for buffet with linen', amount: 800 },
      { label: 'Transport and Labour', amount: 3200 },
      { label: 'Platform fee', amount: 500 },
    ],
    inclustions: [
      { text: 'Premium bar cart setup', group_title: 'Premium Bar Setup' },
      { text: 'Bar menu with easel', group_title: 'Bar Essentials' },
      { text: '1 bar-themed neon sign', group_title: 'Bar Essentials' },
      { text: 'Beer pong table setup', group_title: 'Games' },
      { text: '1 round table with linen', group_title: 'Furniture' },
      { text: '20 fancy chairs', group_title: 'Furniture' },
      { text: '2 cocktail tables', group_title: 'Furniture' },
      { text: '4 buffet tables with linen', group_title: 'Furniture' },
    ],
    addons: [
      optionalPackageAddon('Bartender (4–5 hours)', 5700, 'Optional bartender for 4–5 hours'),
    ],
  },
  {
    sheet: 'JEM1',
    title: 'Just Enough Magic 1',
    slug: 'just-enough-magic-1',
    theme_name: 'Just Enough Magic',
    theme_slug_candidates: parentThemeCandidates('just-enough-magic'),
    budget_level_slug: 'level-1',
    base_price: 17830,
    description: 'An intimate party setup, perfect for small gatherings that need warmth without heavy décor.',
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
    theme_slug_candidates: parentThemeCandidates('just-enough-magic'),
    budget_level_slug: 'level-2',
    base_price: 25310,
    description: 'An intimate party setup, perfect for small gatherings that need warmth without heavy décor.',
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
    theme_slug_candidates: parentThemeCandidates('just-enough-magic'),
    budget_level_slug: 'level-3',
    base_price: 34660,
    description: 'An intimate party setup, perfect for small gatherings that need warmth without heavy décor.',
    key_decor_elements: 'Entrance florals, bar, photo-op, premium furniture, and printables.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Transport and labour', amount: 3200 },
      { label: 'Platform fee', amount: 2860 },
    ],
    inclustions: justEnoughMagic3Inclusions(),
  },
  {
    sheet: 'PS1',
    title: 'Party Smart 1',
    slug: 'party-smart-1',
    theme_name: 'Party Smart',
    theme_slug_candidates: parentThemeCandidates('party-smart'),
    budget_level_slug: 'level-1',
    base_price: 25750,
    description:
      'A smart, all-in-one party setup that covers the essentials. Designed for hosts who want the space to look lively, styled, and celebration-ready without going over the top.',
    key_decor_elements:
      'Choose floral or balloon styling, entry setup, a focal bar or backdrop, and a highlight detail.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Balloon Arch with sign & Balloon structures', amount: 7500 },
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
    theme_slug_candidates: parentThemeCandidates('party-smart'),
    budget_level_slug: 'level-2',
    base_price: 32680,
    description:
      'A smart, all-in-one party setup with styling, backdrop or bar options, and basic furniture.',
    key_decor_elements:
      'Florals or balloons, entry or printables, backdrop or bar, plus seating furniture.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Balloon Arch with sign', amount: 7500 },
      { label: 'Platform fee', amount: 2680 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: partySmart2Inclusions(),
  },
  {
    sheet: 'PS23',
    title: 'Party Smart 2/3',
    slug: 'party-smart-2-3',
    theme_name: 'Party Smart',
    theme_slug_candidates: parentThemeCandidates('party-smart'),
    budget_level_slug: 'level-2',
    base_price: 47000,
    description:
      'A smart, all-in-one party setup with styling, backdrop, bar, and furniture included.',
    key_decor_elements:
      'Florals or balloons, entry or printables, backdrop, bar, and fuller furniture.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Balloon Arch with sign', amount: 7500 },
      { label: 'Taxes', amount: 3650 },
      { label: 'Platform fee', amount: 3650 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: partySmart23Inclusions(),
  },
  {
    sheet: 'PS3',
    title: 'Party Smart 3',
    slug: 'party-smart-3',
    theme_name: 'Party Smart',
    theme_slug_candidates: parentThemeCandidates('party-smart'),
    budget_level_slug: 'level-3',
    base_price: 59960,
    description: 'A full-scale party setup with styling, backdrop, bar, and upgraded furniture.',
    key_decor_elements:
      'Florals or balloons, entry or printables, backdrop, bar, and premium furniture.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'Balloon Arch with sign & Balloon structures', amount: 7500 },
      { label: 'Taxes', amount: 4730 },
      { label: 'Platform fee', amount: 4730 },
    ],
    inclustions: partySmart3Inclusions(),
    addons: [
      optionalPackageAddon(
        '10 fairy lights with electrician',
        5000,
        'Adds warmth and evening ambience'
      ),
    ],
  },
  {
    sheet: 'SS2',
    title: 'Party Smart Social 2',
    slug: 'party-smart-social-2',
    theme_name: 'Party Smart',
    theme_slug_candidates: parentThemeCandidates('party-smart'),
    budget_level_slug: 'level-2',
    base_price: 59520,
    description:
      'A statement backdrop and a well-styled bar — the two elements that instantly define your event and dominate your photos.',
    key_decor_elements: 'Entry setup, large panel backdrop, bar, and a custom décor wall.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'entry setup', amount: 2000 },
      { label: 'backdrop', amount: 25000 },
      { label: 'bar set up', amount: 8000 },
      { label: 'Decor Elements', amount: 10000 },
      { label: 'Transport and labour', amount: 3200 },
      { label: 'taxes', amount: 5120 },
      { label: 'Platform fee', amount: 5120 },
    ],
    inclustions: [
      { text: 'Easel with welcome board, crates, flowers and candles', group_title: 'Entry Setup' },
      { text: 'Large panel backdrop', group_title: 'Backdrop' },
      { text: 'Styled bar area', group_title: 'Bar Setup' },
      { text: 'Welcome drink wall or DIY wall', group_title: 'Decor Element' },
    ],
  },
  {
    sheet: 'SS3',
    title: 'Party Smart Social 3',
    slug: 'party-smart-social-3',
    theme_name: 'Party Smart',
    theme_slug_candidates: parentThemeCandidates('party-smart'),
    budget_level_slug: 'level-3',
    base_price: 63700,
    description:
      'A statement backdrop and a beautifully styled bar, elevated further with special effects.',
    key_decor_elements: 'Entry, backdrop, premium bar, décor wall, and SFX additions.',
    ...baseMeta(),
    price_breakdown: [
      { label: 'entry setup', amount: 2000 },
      { label: 'backdrop', amount: 25000 },
      { label: 'bar set up', amount: 8000 },
      { label: 'Decor Elements', amount: 10000 },
      { label: 'Enhancements', amount: 5000 },
      { label: 'Transport and labour', amount: 3200 },
      { label: 'Platform fee', amount: 5500 },
    ],
    inclustions: [
      { text: 'Easel with welcome board, crates, florals and candles', group_title: 'Entry Setup' },
      { text: 'High-impact backdrop / photo-op', group_title: 'Backdrop' },
      { text: '1 premium bar setup', group_title: 'Bar Setup' },
      { text: 'Welcome drink wall or DIY wall', group_title: 'Decor Element' },
      { text: 'Cold pyros / entry effects / flower shower', group_title: 'SFX Additions' },
    ],
  },
  {
    sheet: 'AA1',
    title: 'Entry Setup Aarambh 1',
    slug: 'entry-setup-aarambh-1',
    theme_name: 'Aarambh',
    theme_slug_candidates: parentThemeCandidates('aarambh'),
    budget_level_slug: 'level-1',
    base_price: 4900,
    description: 'A simple, elegant entrance styling designed to warmly welcome your guests.',
    key_decor_elements: 'Choose lanterns or abras, crates or urlis, plus candles and welcome board.',
    ...baseMeta({
      nitty_gritty:
        'Love the look but want a different print or styling direction? Go ahead and book — we’ll customise the board design and colour.',
    }),
    price_breakdown: [
      { label: 'Candles', amount: 700 },
      { label: 'Easel with printed Board', amount: 1100 },
      { label: 'Carpet', amount: 300 },
      { label: 'Transport and labour', amount: 1500 },
      { label: 'Platform fee', amount: 490 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: aarambh1Inclusions(),
  },
  {
    sheet: 'AU1',
    title: 'Aura Upgrade 1',
    slug: 'aura-upgrade-1',
    theme_name: 'Aura Upgrade',
    theme_slug_candidates: parentThemeCandidates('aura-upgrade'),
    budget_level_slug: 'level-1',
    base_price: 9950,
    description: 'Designed to add glow, personality, and depth, without adding bulky décor.',
    key_decor_elements: 'Printables, neon signs, and a fairy-light lighting choice.',
    ...baseMeta({
      nitty_gritty:
        'Love the idea but want different quotes, neon text, or light placement? Go ahead and book — we’ll customise it for your space.',
    }),
    price_breakdown: [
      { label: '2 Printables - quotes / information with small easel', amount: 1600 },
      { label: '2 Neon signs', amount: 1200 },
      { label: '10 strings Fairy lights without electrician', amount: 1000 },
      { label: '1 big easel + print', amount: 1200 },
      { label: 'Platform fee', amount: 0 },
    ],
    inclustions: auraUpgrade1Inclusions(),
    addons: [
      optionalPackageAddon('1 big easel + print', 1200, '1 big easel + print'),
      optionalPackageAddon('10 candles with glass holders', 0, 'Optional candle add-on'),
    ],
  },
];

async function seedDecorHousePartyBirthdayPackages(strapi) {
  await ensureThemeDocumentId(strapi, {
    name: 'House Party',
    slug: 'house-party',
    display_order: 10,
  });
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

  return seedDecorPackages(strapi, HOUSE_PARTY_BIRTHDAY_PACKAGES, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-house-party-birthday',
    refreshExistingDecor: true,
  });
}

module.exports = {
  HOUSE_PARTY_BIRTHDAY_PACKAGES,
  EVENT_SLUG_CANDIDATES,
  seedDecorHousePartyBirthdayPackages,
};
