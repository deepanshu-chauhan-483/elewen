'use strict';

const {
  PROPOSAL_NITTY_GRITTY,
  PROPOSAL_PRICE_COVERS,
  PROPOSAL_SETUP_NEEDS,
  PROPOSAL_SETUP_NEEDS_PC,
  ensureThemeDocumentId,
  slugifyTitle,
  seedProposalPackages,
} = require('./decor-proposal-shared');

const PROPOSAL_THEME_SEEDS = [
  { name: 'The Walk to Forever', slug: 'the-walk-to-forever', display_order: 70 },
  { name: 'The Proposal Spotlight', slug: 'the-proposal-spotlight', display_order: 71 },
  { name: 'Our Story', slug: 'our-story', display_order: 72 },
  { name: 'Our Private Corner', slug: 'our-private-corner', display_order: 73 },
];

function proposalTheme(themeSlug, themeName) {
  return {
    theme_name: themeName,
    theme_slug_candidates: [themeSlug],
  };
}

const PROPOSAL_PACKAGES = [
  // WF 1 — already seeded locally; included for budget_level repair on fresh DBs
  {
    sheet: 'WF 1',
    title: 'The Walk to Forever',
    slug: 'the-walk-to-forever',
    ...proposalTheme('the-walk-to-forever', 'The Walk to Forever'),
    budget_level_slug: 'level-1',
    base_price: 14970,
    description:
      "A romantic setting designed for one unforgettable question, where candlelight, roses, and a beautiful pathway lead to a moment you'll remember forever.",
    key_decor_elements:
      "A romantic setting designed for one unforgettable question, where candlelight, roses, and a beautiful pathway lead to a moment you'll remember forever.",
    best_placed_at:
      'Perfect for terraces, gardens, lawns, balconies or any outdoor space. The set up can be done in a living room / drawing room space too.',
    why_we_love_it:
      'The rose-lined pathway builds anticipation and leads beautifully to the dinner that matters most.',
    price_breakdown: [
      { label: 'Rose Pathway', amount: 6000 },
      { label: 'Candles', amount: 700 },
      { label: 'Big candles', amount: 1500 },
      { label: 'Table with linen', amount: 500 },
      { label: 'Comfortable chairs', amount: 1000 },
      { label: 'Centerpiece', amount: 1000 },
      { label: 'Platform fee', amount: 1070 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      {
        text: 'Pathway styled with flowers on both sides and rose petals in the center',
        group_title: 'Rose Pathway',
      },
      { text: 'Candles in glass holders lining the pathway', group_title: 'Candles' },
      { text: '1 round table with linen', group_title: 'Table Setup' },
      { text: '2 comfortable chairs', group_title: 'Table Setup' },
      { text: '1 floral centerpiece with candles', group_title: 'Table Setup' },
    ],
  },
  {
    sheet: 'WF 2',
    title: 'The Walk to Forever 2',
    slug: 'the-walk-to-forever-2',
    ...proposalTheme('the-walk-to-forever', 'The Walk to Forever'),
    budget_level_slug: 'level-2',
    base_price: 31470,
    description:
      "A romantic setting designed for one unforgettable question, where candlelight, roses, and a beautiful pathway lead to a moment you'll remember forever.",
    key_decor_elements:
      "A romantic setting designed for one unforgettable question, where candlelight, roses, and a beautiful pathway lead to a moment you'll remember forever.",
    best_placed_at:
      'Perfect for terraces, gardens, lawns, balconies or any outdoor space. The set up can be done in a living room / drawing room space too.',
    why_we_love_it:
      'The rose-lined pathway builds anticipation and leads beautifully to the dinner that matters most.',
    price_breakdown: [
      { label: 'Rose Pathway', amount: 8000 },
      { label: 'Candles', amount: 700 },
      { label: 'Big candles', amount: 1500 },
      { label: 'Table with linen', amount: 500 },
      { label: 'Comfortable chairs', amount: 1000 },
      { label: 'Centerpiece', amount: 1000 },
      { label: 'Tenting', amount: 8000 },
      { label: 'Fairy lights and lanterns', amount: 0 },
      { label: 'Lanterns', amount: 5000 },
      { label: 'Platform fee', amount: 2570 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      {
        text: 'Pathway styled with premium flowers on both sides and rose petals in the center',
        group_title: 'Floral Pathway',
      },
      {
        text: 'Statement candles in glass holders along the pathway',
        group_title: 'Floral Pathway',
      },
      {
        text: '8–10 lanterns with candles placed along the pathway',
        group_title: 'Floral Pathway',
      },
      { text: '1 round table with linen', group_title: 'Table Setup' },
      { text: '2 chairs', group_title: 'Table Setup' },
      { text: '1 floral centerpiece', group_title: 'Table Setup' },
      {
        text: 'Canopy-style drapes creating a romantic proposal corner',
        group_title: 'Tenting',
      },
      { text: '5 strings of fairy lights', group_title: 'Lighting' },
      { text: '6–8 hanging lanterns with warm lights', group_title: 'Lighting' },
    ],
  },
  {
    sheet: 'WF 3',
    title: 'The Walk to Forever 3',
    slug: 'the-walk-to-forever-3',
    ...proposalTheme('the-walk-to-forever', 'The Walk to Forever'),
    budget_level_slug: 'level-3',
    base_price: 36970,
    description:
      'A romantic setting designed for one unforgettable question, where a rose-lined pathway leads to a beautifully styled space filled with candlelight, soft drapes, and romantic details.',
    key_decor_elements:
      'A romantic setting designed for one unforgettable question, where a rose-lined pathway leads to a beautifully styled space filled with candlelight, soft drapes, and romantic details.',
    best_placed_at:
      'Perfect for terraces, gardens, lawns, balconies or any outdoor space. The set up can be done in a living room / drawing room space too.',
    why_we_love_it: 'A breathtaking setting designed for the moment that changes everything.',
    price_breakdown: [
      { label: 'Rose Pathway', amount: 8000 },
      { label: 'Candles', amount: 700 },
      { label: 'Big candles', amount: 1500 },
      { label: 'Table with linen', amount: 500 },
      { label: 'Comfortable chairs', amount: 1000 },
      { label: 'Centerpiece', amount: 1000 },
      { label: 'Tenting', amount: 8000 },
      { label: 'Fairy lights and lanterns', amount: 0 },
      { label: 'Lanterns', amount: 5000 },
      { label: 'Table setup elaborate', amount: 5000 },
      { label: 'Platform fee', amount: 3070 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      {
        text: 'Pathway styled with flowers on both sides and rose petals in the center',
        group_title: 'Rose Pathway',
      },
      {
        text: 'Statement candles in glass holders along the pathway',
        group_title: 'Rose Pathway',
      },
      {
        text: '8–10 lanterns with candles placed along the pathway',
        group_title: 'Rose Pathway',
      },
      { text: '1 round table with linen', group_title: 'Table Styling' },
      { text: '2 chairs', group_title: 'Table Styling' },
      { text: '5 floral centerpieces', group_title: 'Table Styling' },
      { text: 'Candles on elegant stands', group_title: 'Table Styling' },
      { text: '"Will You Marry Me" neon sign', group_title: 'Table Styling' },
      { text: 'Styled table runner', group_title: 'Table Styling' },
      {
        text: 'Canopy style drapes creating an intimate proposal corner',
        group_title: 'Tenting',
      },
      { text: '5 strings of fairy lights', group_title: 'Lighting' },
      { text: '6–8 hanging lanterns with warm lights', group_title: 'Lighting' },
    ],
  },
  {
    sheet: 'PS 1',
    title: 'The Proposal Spotlight 1',
    slug: 'the-proposal-spotlight-1',
    ...proposalTheme('the-proposal-spotlight', 'The Proposal Spotlight'),
    budget_level_slug: 'level-1',
    base_price: 8850,
    description:
      'The perfect minimal setup that puts the focus exactly where it belongs — on the moment you ask the question.',
    key_decor_elements:
      'The perfect minimal setup that puts the focus exactly where it belongs — on the moment you ask the question.',
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at:
      'Perfect for home terraces, gardens, hotel rooms, or any intimate proposal spot.',
    why_we_love_it:
      'It creates a romantic focal point where the big question naturally takes center stage.',
    price_breakdown: [
      { label: 'Floral Pathway', amount: 2000 },
      { label: 'Balloons', amount: 4000 },
      { label: 'Candles', amount: 1500 },
      { label: 'Platform fee', amount: 750 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      { text: 'Pathway covered with rose petals', group_title: 'Floral Pathway' },
      { text: 'Heart-shaped balloon backdrop', group_title: 'Backdrop' },
      { text: 'Candles in glass holders', group_title: 'Candles' },
    ],
  },
  {
    sheet: 'PS 2',
    title: 'The Proposal Spotlight 2',
    slug: 'the-proposal-spotlight-2',
    ...proposalTheme('the-proposal-spotlight', 'The Proposal Spotlight'),
    budget_level_slug: 'level-2',
    base_price: 17500,
    description:
      'The perfect minimal setup that puts the focus exactly where it belongs — on the moment you ask the question.',
    key_decor_elements:
      'The perfect minimal setup that puts the focus exactly where it belongs — on the moment you ask the question.',
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at:
      'Perfect for home terraces, gardens, hotel rooms, or any intimate proposal spot.',
    why_we_love_it:
      'It creates a romantic focal point where the big question naturally takes center stage.',
    price_breakdown: [
      { label: 'Backdrop', amount: 6000 },
      { label: 'Balloons', amount: 2000 },
      { label: 'Flowers', amount: 4000 },
      { label: 'Candles', amount: 1000 },
      { label: 'Platform fee', amount: 1300 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Choose 1 backdrop out of the 4 options', group_title: 'Backdrop' },
      { text: 'Balloons / floral styling around the backdrop', group_title: 'Backdrop' },
      { text: 'Rose petals for added romantic detailing', group_title: 'Flowers' },
      { text: 'Candles in glass holders', group_title: 'Candles' },
    ],
  },
  {
    sheet: 'PS 3',
    title: 'The Proposal Spotlight 3',
    slug: 'the-proposal-spotlight-3',
    ...proposalTheme('the-proposal-spotlight', 'The Proposal Spotlight'),
    budget_level_slug: 'level-3',
    base_price: 42800,
    description:
      'The perfect minimal setup that puts the focus exactly where it belongs — on the moment you ask the question.',
    key_decor_elements:
      'The perfect minimal setup that puts the focus exactly where it belongs — on the moment you ask the question.',
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at: 'Perfect for terraces, gardens, resorts, or scenic outdoor venues.',
    why_we_love_it:
      'The elevated platform and sparkling moment turn the proposal into a cinematic memory.',
    price_breakdown: [
      { label: 'Floral Pathway', amount: 15000 },
      { label: 'Candles', amount: 3000 },
      { label: 'Platform', amount: 4000 },
      { label: 'Backdrop', amount: 10000 },
      { label: 'SFX', amount: 4000 },
      { label: 'Platform fee', amount: 3600 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      {
        text: 'Pathway covered with rose petals with floral styling on both sides',
        group_title: 'Floral Pathway',
      },
      {
        text: 'Candles in glass holders along the pathway',
        group_title: 'Candles',
      },
      {
        text: 'Candles on stands at the proposal backdrop',
        group_title: 'Candles',
      },
      { text: 'White round platform for the proposal moment', group_title: 'Platform' },
      { text: 'Ring-style backdrop with floral styling', group_title: 'Backdrop' },
      { text: 'Cold pyros for the big moment', group_title: 'Special Effects' },
    ],
  },
  {
    sheet: 'OS',
    title: 'Our Story',
    slug: 'our-story',
    ...proposalTheme('our-story', 'Our Story'),
    budget_level_slug: 'level-1',
    base_price: 11050,
    description:
      'A deeply personal proposal setup that brings your journey together — photos, memories, and heartfelt notes creating the perfect backdrop for the moment you ask forever.',
    key_decor_elements:
      'A deeply personal proposal setup that brings your journey together — photos, memories, and heartfelt notes creating the perfect backdrop for the moment you ask forever.',
    setup_needs: PROPOSAL_SETUP_NEEDS,
    best_placed_at:
      'Perfect for terraces, gardens, private venues, or indoor spaces where your memories can take center stage.',
    why_we_love_it:
      'It turns the proposal into a beautiful walk through your shared memories before the big "yes."',
    price_breakdown: [
      { label: 'Strings to images', amount: 1500 },
      { label: 'Fairy lights', amount: 5000 },
      { label: 'Candles', amount: 1000 },
      { label: 'Floral bunches', amount: 2000 },
      { label: 'Platform fee', amount: 950 },
      { label: 'Labour & Transport', amount: 600 },
    ],
    inclustions: [
      {
        text: 'Hanging strings of photos and handwritten notes telling your story together',
        group_title: 'Memory Strings',
      },
      {
        text: '10 strings of fairy lights creating a warm glowing backdrop with electrician',
        group_title: 'Lighting',
      },
      { text: 'Candles in glass holders placed around the proposal area', group_title: 'Candles' },
      { text: '2 large floral bunches to frame the setup', group_title: 'Floral Styling' },
    ],
  },
  {
    sheet: 'PC 2',
    title: 'Our Private Corner 2',
    slug: 'our-private-corner-2',
    ...proposalTheme('our-private-corner', 'Our Private Corner'),
    budget_level_slug: 'level-2',
    base_price: 36640,
    description:
      'A dreamy proposal setting where soft drapes, glowing lights, and a candlelit pathway come together to create an intimate space for the moment you ask forever.',
    key_decor_elements:
      'A dreamy proposal setting where soft drapes, glowing lights, and a candlelit pathway come together to create an intimate space for the moment you ask forever.',
    setup_needs: PROPOSAL_SETUP_NEEDS_PC,
    best_placed_at: 'Terraces, balconies, backyards, or any cozy corner.',
    why_we_love_it:
      "Perfect when you want privacy and comfort. It's warm, personal, and feels like a moment made just for the two of you to walk into forever.",
    price_breakdown: [
      { label: 'Canopy set up with fairy lights', amount: 9000 },
      { label: 'Cushions and gadda', amount: 3000 },
      { label: 'Ceiling hangings', amount: 2000 },
      { label: '5 small floral vases', amount: 2000 },
      { label: '2 large vases with florals', amount: 2500 },
      { label: '8-10 candle holders with candles', amount: 3000 },
      { label: '10 candles in glasses', amount: 700 },
      { label: 'Walkway with candles and roses', amount: 1700 },
      { label: 'Low table', amount: 3000 },
      { label: 'Table runner + florals + candles + personal element', amount: 3500 },
      { label: 'Platform fee', amount: 3040 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      {
        text: 'Canopy style setup with fairy lights and ceiling hangings inside the canopy',
        group_title: 'Canopy Setup',
      },
      { text: 'Floor seating with gadda and cushions', group_title: 'Seating' },
      {
        text: '5 small floral vases placed across the setup',
        group_title: 'Floral Styling',
      },
      { text: '2 large floral vases to frame the space', group_title: 'Floral Styling' },
      {
        text: '8–10 decorative candle holders with candles',
        group_title: 'Lighting & Candles',
      },
      { text: '10 candles in glass holders for ambient lighting', group_title: 'Lighting & Candles' },
      { text: 'Pathway styled with candles and rose accents', group_title: 'Walkway' },
      {
        text: 'Low table with table runner, floral arrangement, candles, and personalised element',
        group_title: 'Table Setup',
      },
    ],
  },
  {
    sheet: 'PC 3',
    title: 'Our Private Corner 3',
    slug: 'our-private-corner-3',
    ...proposalTheme('our-private-corner', 'Our Private Corner'),
    budget_level_slug: 'level-3',
    base_price: 30150,
    description:
      'A dreamy proposal setting where soft drapes, glowing lights, and a candlelit pathway come together to create an intimate space for the moment you ask forever.',
    key_decor_elements:
      'A dreamy proposal setting where soft drapes, glowing lights, and a candlelit pathway come together to create an intimate space for the moment you ask forever.',
    setup_needs: PROPOSAL_SETUP_NEEDS_PC,
    best_placed_at: 'Terraces, balconies, backyards, or any cozy corner.',
    why_we_love_it:
      "Perfect when you want privacy and comfort. It's warm, personal, and feels like a moment made just for the two of you to walk into forever.",
    price_breakdown: [
      { label: 'Canopy set up with fairy lights', amount: 9000 },
      { label: 'Neon sign', amount: 800 },
      { label: 'Lanterns with warm lighting', amount: 5000 },
      { label: 'Rose petal walkway with candles', amount: 2500 },
      { label: '5 small floral vases', amount: 2000 },
      { label: 'Crates as decor elements', amount: 2000 },
      { label: '5 cushions', amount: 2000 },
      { label: '20 candles in glasses', amount: 1200 },
      { label: 'Platform fee', amount: 2450 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: 'Canopy tent styling with fairy lights', group_title: 'Canopy Setup' },
      { text: '"Will You Marry Me" neon sign', group_title: 'Canopy Setup' },
      { text: 'Carpet', group_title: 'Canopy Setup' },
      {
        text: 'Rose petal pathway with candles leading to the proposal spot',
        group_title: 'Walkway Styling',
      },
      {
        text: 'Walkway framed with candles and roses',
        group_title: 'Walkway Styling',
      },
      {
        text: 'Lanterns with warm lighting around the setup',
        group_title: 'Walkway Styling',
      },
      { text: '5 small floral vases', group_title: 'Floral Styling' },
      { text: 'Crates used as decorative elements', group_title: 'Decor Elements' },
      { text: '5 cushions for a cozy proposal corner', group_title: 'Decor Elements' },
      {
        text: '20 candles in glass holders for a warm romantic glow',
        group_title: 'Candles',
      },
    ],
  },
];

async function seedDecorProposalPackages(strapi) {
  for (const themeSeed of PROPOSAL_THEME_SEEDS) {
    await ensureThemeDocumentId(strapi, themeSeed);
  }

  return seedProposalPackages(strapi, PROPOSAL_PACKAGES);
}

module.exports = {
  PROPOSAL_THEME_SEEDS,
  PROPOSAL_PACKAGES,
  seedDecorProposalPackages,
  seedWalkToForever: seedDecorProposalPackages,
};
