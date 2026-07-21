'use strict';

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
  'anniversary',
  'anniversary-evenings',
  'anniversaries',
];

const BUBBLES_NITTY_GRITTY =
  'Love the look but need a different color? go ahead and book! We’ll contact you to finalize the perfect shade from our available decor to match your vibe.';

const BUBBLES_PRICE_COVERS = [
  { text: 'The Complete Look' },
  { text: 'Professional Setup' },
  { text: 'Final Dismantling' },
  { text: 'Coordination with decor team handled end-to-end to ensure timely setup.' },
  { text: 'No hidden service fees.' },
];

const BUBBLES_SETUP_NEEDS =
  'A small area for our team to work, access to water and electricity.';

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

function optionalPackageAddon(name, price = 0, description = '') {
  return {
    name,
    price,
    description: description || name,
    visibility: true,
  };
}

const BUBBLES_BLACK_TIE_PACKAGES = [
  {
    sheet: 'GT 1',
    title: 'The Golden Touch 1',
    slug: 'golden-touch-1',
    theme_name: 'The Golden Touch',
    budget_level_slug: 'level-1',
    base_price: 6100,
    description:
      'A little detail goes a long way. The Golden Touch adds elegant table styling and a warm welcome setup that instantly elevates the look of your celebration.',
    key_decor_elements: '',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: '',
    best_placed_at:
      'Perfect for home gatherings or small venue celebrations where elegant table details can instantly lift the atmosphere.',
    why_we_love_it:
      'It adds just the right touch of gold, florals, and style to make a simple celebration feel thoughtfully styled.',
    theme_slug_candidates: ['bubbles-and-black-tie', 'golden-touch'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 2500 },
      { label: 'Entrance Set up', amount: 2500 },
      { label: 'Platform fee', amount: 500 },
      { label: 'Transport', amount: 600 },
    ],
    inclustions: [
      { text: '5 golden floral centrepieces', group_title: 'Floral Vases' },
      { text: 'Entrance easel + florals', group_title: 'Entrance Set up' },
    ],
  },
  {
    sheet: 'GT 2',
    title: 'The Golden Touch 2',
    slug: 'golden-touch-2',
    theme_name: 'The Golden Touch',
    budget_level_slug: 'level-2',
    base_price: 15300,
    description:
      'A refined setup that brings together styled tables, a welcoming entrance, and a sleek bar corner to give your celebration a polished, Gatsby-inspired feel',
    key_decor_elements:
      'Think glowing lantern-lit walkways, intricate Jali patterns, candle abras / candle stands, diya wall.',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: BUBBLES_SETUP_NEEDS,
    best_placed_at:
      'Perfect for home parties or intimate venue celebrations where elegant table and bar styling set the tone.',
    why_we_love_it:
      'It creates a cohesive look with styled tables, candlelight, and a chic bar corner that instantly elevates the celebration.',
    theme_slug_candidates: ['bubbles-and-black-tie', 'golden-touch'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 2500 },
      { label: 'Entrance Set up', amount: 5000 },
      { label: 'Basic Bar Set up', amount: 2500 },
      { label: 'Candles', amount: 1000 },
      { label: 'Platform fee', amount: 1100 },
      { label: 'Transport', amount: 3200 },
    ],
    inclustions: [
      { text: '5 golden floral centrepieces', group_title: 'Floral Vases' },
      { text: 'Welcome easel + board', group_title: 'Entrance Setup' },
      { text: '2 floral vases', group_title: 'Entrance Setup' },
      { text: 'Basic bar setup', group_title: 'Basic Bar Setup' },
      { text: '10 short-glass candles', group_title: 'Basic Bar Setup' },
    ],
  },
  {
    sheet: 'GT 23',
    title: 'The Golden Touch 2/3',
    slug: 'golden-touch-2-3',
    theme_name: 'The Golden Touch',
    budget_level_slug: 'level-2',
    base_price: 29600,
    description:
      "A beautiful balance of elegance and festivity. It's perfect for gatherings where you want the space to feel styled, lively, and celebration-ready.",
    key_decor_elements:
      'Hints of pearls or sequins, statement feathers, warm candlelight to create the perfect atmosphere',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: BUBBLES_SETUP_NEEDS,
    best_placed_at: 'Ideal for birthdays, anniversaries, and intimate celebrations at home venues',
    why_we_love_it: 'It creates a celebration corner that instantly lifts the energy of the entire party',
    theme_slug_candidates: ['bubbles-and-black-tie', 'golden-touch'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 7500 },
      { label: 'Entrance Set up', amount: 5000 },
      { label: 'Basic Bar Set up', amount: 2500 },
      { label: 'Backdrop', amount: 8000 },
      { label: 'Candles', amount: 1000 },
      { label: 'Platform fee', amount: 2400 },
      { label: 'Transport', amount: 3200 },
    ],
    inclustions: [
      { text: '5 premium floral centrepieces', group_title: 'Floral Styling' },
      { text: 'Entrance easel + florals', group_title: 'Entrance Set up' },
      {
        text: 'Shiny wall with balloons',
        group_title: 'Backdrop (choose 1)',
        is_choice_group: true,
        choice_group_key: 'backdrop',
        choice_group_label: 'Backdrop (choose 1)',
      },
      {
        text: 'Single panel with balloons',
        group_title: 'Backdrop (choose 1)',
        is_choice_group: true,
        choice_group_key: 'backdrop',
        choice_group_label: 'Backdrop (choose 1)',
      },
      { text: 'Feature detailing', group_title: 'Decor Elements' },
      { text: '2 LED 3D letters', group_title: 'Decor Elements' },
      { text: '10 short-glass candles', group_title: 'Decor Elements' },
      { text: 'Basic bar setup', group_title: 'Bar Set up' },
    ],
  },
  {
    sheet: 'GT 3',
    title: 'The Golden Touch 3',
    slug: 'golden-touch-3',
    theme_name: 'The Golden Touch',
    budget_level_slug: 'level-3',
    base_price: 56000,
    description:
      'For celebrations that deserve a little extra shine, an elevated setup that brings together refined details and statement styling to create a truly special atmosphere.',
    key_decor_elements:
      'For celebrations that deserve a little extra shine, an elevated setup that brings together refined details and statement styling to create a truly special atmosphere.',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: BUBBLES_SETUP_NEEDS,
    best_placed_at:
      'Perfect for milestone birthdays, anniversaries, or gatherings where you want the celebration to feel elevated and memorable.',
    why_we_love_it:
      'It blends statement pieces with elegant details to create a celebration space that feels truly special.',
    theme_slug_candidates: ['bubbles-and-black-tie', 'golden-touch'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 8000 },
      { label: 'Entrance Set up', amount: 5000 },
      { label: 'Premium Bar Set up', amount: 12000 },
      { label: 'Customized Backdrop', amount: 22000 },
      { label: 'Candles', amount: 1000 },
      { label: 'Platform fee', amount: 4800 },
      { label: 'Transport', amount: 3200 },
    ],
    inclustions: [
      { text: '5 premium floral centrepieces', group_title: 'Centerpieces' },
      { text: 'Golden frame entrance', group_title: 'Entrance Setup' },
      { text: 'Double panel backdrop', group_title: 'Customized Backdrop' },
      { text: 'Premium bar + menu', group_title: 'Premium Bar Setup' },
      { text: 'Printed bar menu', group_title: 'Premium Bar Setup' },
      { text: 'Candles in glass jars', group_title: 'Candles' },
    ],
  },
  {
    sheet: 'SS 1',
    title: 'The Social Setup 1',
    slug: 'social-setup-1',
    theme_name: 'The Social Setup',
    budget_level_slug: 'level-1',
    base_price: 53250,
    description: 'A celebration space designed for people to gather, mingle, and enjoy the moment',
    key_decor_elements:
      'A celebration space designed for people to gather, mingle, and enjoy the moment',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: BUBBLES_SETUP_NEEDS,
    best_placed_at:
      'Great for house parties, terrace celebrations, or venues where guests can mingle and be comfortable',
    why_we_love_it:
      'It creates a warm, lively party environment where everyone naturally gathers and celebrates together',
    theme_slug_candidates: ['bubbles-and-black-tie', 'social-setup'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 9000 },
      { label: '3 centerpieces', amount: 2000 },
      { label: 'Entrance Set up', amount: 4000 },
      { label: 'Basic Bar Set up', amount: 5000 },
      { label: 'Backdrop', amount: 7000 },
      { label: 'Candles', amount: 1000 },
      { label: 'Furniture', amount: 12500 },
      { label: 'Fairy Lights', amount: 5000 },
      { label: 'Platform fee', amount: 4550 },
      { label: 'Transport', amount: 3200 },
    ],
    inclustions: [
      { text: '5 premium floral centrepieces', group_title: 'Centerpieces' },
      { text: '3 cocktail centrepieces', group_title: 'Centerpieces' },
      { text: 'Entrance easel + florals', group_title: 'Entrance Setup' },
      { text: 'Backdrop with balloons', group_title: 'Backdrop' },
      { text: '2 LED 3D letters', group_title: 'Backdrop' },
      { text: 'Basic bar setup', group_title: 'Basic Bar Setup' },
      { text: 'Short-glass candles', group_title: 'Candles' },
      { text: '3 round tables', group_title: 'Classic Furniture' },
      { text: '20 chairs', group_title: 'Classic Furniture' },
      { text: '3 cocktail tables', group_title: 'Classic Furniture' },
      { text: '8–10 fairy light strings', group_title: 'Lighting' },
    ],
  },
  {
    sheet: 'SS2',
    title: 'The Social Setup 2',
    slug: 'social-setup-2',
    theme_name: 'The Social Setup',
    budget_level_slug: 'level-2',
    base_price: 57650,
    description:
      'A well-rounded party setup that brings together seating, lighting, and celebration elements to create a lively space where guests enjoy the evening',
    key_decor_elements:
      'A well-rounded party setup that brings together seating, lighting, and celebration elements to create a lively space where guests enjoy the evening',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: BUBBLES_SETUP_NEEDS,
    best_placed_at: 'Ideal for birthdays, anniversaries, and intimate celebrations at home venues',
    why_we_love_it: 'It creates a celebration corner that instantly lifts the energy of the entire party',
    theme_slug_candidates: ['bubbles-and-black-tie', 'social-setup'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 10000 },
      { label: 'Entrance Set up', amount: 4000 },
      { label: 'Basic Bar Set up', amount: 5000 },
      { label: 'Backdrop', amount: 7000 },
      { label: 'Candles', amount: 1000 },
      { label: 'Furniture', amount: 12500 },
      { label: 'Fairy Lights', amount: 5000 },
      { label: 'Printables / games', amount: 3000 },
      { label: 'lights', amount: 2000 },
      { label: 'Platform fee', amount: 4950 },
      { label: 'Transport', amount: 3200 },
    ],
    // Choose cards (Figma): Backdrop is a selectable choose-1 group, not plain "or" text.
    addons: [
      optionalPackageAddon('Bartender (optional)', 0, 'Optional bartender add-on'),
    ],
    inclustions: [
      {
        text: '5 centerpieces with golden vases styled with premium flowers like carnations, orchids, lilies, etc.',
        group_title: 'Centerpieces',
      },
      { text: '3 centerpiece for the cocktail tables', group_title: 'Centerpieces' },
      {
        text: 'Easel with printed welcome board and floral styling',
        group_title: 'Entrance Setup',
      },
      choiceOption('ss2-backdrop', 'Backdrop (choose 1)', 'Shiny curtain with balloons'),
      whenInclusion('ss2-backdrop', 'Shiny curtain with balloons', '2 LED 3D letters'),
      choiceOption('ss2-backdrop', 'Backdrop (choose 1)', 'Single panel with balloons'),
      whenInclusion('ss2-backdrop', 'Single panel with balloons', '2 LED 3D letters'),
      {
        text: 'Bar with black masking with a customized bar menu',
        group_title: 'Basic Bar Setup',
      },
      { text: 'Candles in short glass holders', group_title: 'Candles' },
      { text: '3 round tables', group_title: 'Furniture' },
      { text: '20 chairs', group_title: 'Furniture' },
      { text: '3 cocktail tables', group_title: 'Furniture' },
      { text: '8 - 10 strings of fairy lights', group_title: 'Lighting' },
      {
        text: '3 - 4 halogen / LED parcans to illuminate the space',
        group_title: 'Lighting',
      },
      {
        text: 'Event printables such as menu, quotes, or a fun game with material and instructions (games like ludo / sequence etc. are not included)',
        group_title: 'Printables / games',
      },
    ],
  },
  {
    sheet: 'SS 23',
    title: 'The Social Setup 2/3',
    slug: 'social-setup-2-3',
    theme_name: 'The Social Setup',
    budget_level_slug: 'level-2',
    base_price: 90650,
    description:
      'A thoughtfully styled celebration space with refined details that make the gathering feel elevated and festive.',
    key_decor_elements:
      'A thoughtfully styled celebration space with refined details that make the gathering feel elevated and festive.',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: BUBBLES_SETUP_NEEDS,
    best_placed_at:
      'Perfect for milestone birthdays, anniversaries, or gatherings where you want the celebration to feel elevated and memorable.',
    why_we_love_it:
      'It blends statement pieces with elegant details to create a celebration space that feels truly special.',
    theme_slug_candidates: ['bubbles-and-black-tie', 'social-setup'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 10000 },
      { label: '3 centerpieces', amount: 2000 },
      { label: 'Entrance Set up', amount: 5000 },
      { label: 'Premium Bar Set up', amount: 15000 },
      { label: 'Customized Backdrop', amount: 15000 },
      { label: 'Candles', amount: 2500 },
      { label: 'Furniture (premium)', amount: 20000 },
      { label: 'Fairy Lights with lanterns', amount: 5000 },
      { label: 'Props (8-10)', amount: 5000 },
      { label: 'Platform fee', amount: 7950 },
      { label: 'Transport', amount: 3200 },
    ],
    inclustions: [
      { text: '5 premium floral centrepieces', group_title: 'Centerpieces' },
      { text: '3 cocktail centrepieces', group_title: 'Centerpieces' },
      { text: 'Golden frame entrance', group_title: 'Entrance Setup' },
      { text: 'Floral styling', group_title: 'Entrance Setup' },
      { text: 'Double panel backdrop', group_title: 'Customized Backdrop' },
      { text: 'Premium bar + menu', group_title: 'Premium Bar Setup' },
      { text: 'Printed bar menu', group_title: 'Premium Bar Setup' },
      { text: 'Candles in glass jars', group_title: 'Candles' },
      { text: '3 round tables', group_title: 'Furniture (Premium)' },
      { text: '20 chairs', group_title: 'Furniture (Premium)' },
      { text: '3 cocktail tables', group_title: 'Furniture (Premium)' },
      { text: '8–10 fairy light strings', group_title: 'Lighting' },
      { text: '8–10 paper lanterns', group_title: 'Lighting' },
      { text: '8–10 themed props', group_title: 'Props' },
    ],
  },
  {
    sheet: 'SS3',
    title: 'The Social Setup 3',
    slug: 'social-setup-3',
    theme_name: 'The Social Setup',
    budget_level_slug: 'level-3',
    base_price: 97250,
    description:
      'A thoughtfully styled celebration space with refined details that make the gathering feel elevated and festive.',
    key_decor_elements:
      'A thoughtfully styled celebration space with refined details that make the gathering feel elevated and festive.',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: BUBBLES_SETUP_NEEDS,
    best_placed_at:
      'Perfect for milestone birthdays, anniversaries, or gatherings where you want the celebration to feel elevated and memorable.',
    why_we_love_it:
      'It blends statement pieces with elegant details to create a celebration space that feels truly special.',
    theme_slug_candidates: ['bubbles-and-black-tie', 'social-setup'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 10000 },
      { label: 'Entrance Set up', amount: 5000 },
      { label: 'Premium Bar Set up', amount: 15000 },
      { label: 'Customized Backdrop', amount: 15000 },
      { label: 'Candles', amount: 2500 },
      { label: 'Furniture (premium)', amount: 20000 },
      { label: 'Fairy Lights with lanterns', amount: 5000 },
      { label: 'Printables', amount: 5000 },
      { label: 'lights', amount: 3000 },
      { label: 'Props (8-10)', amount: 5000 },
      { label: 'Platform fee', amount: 8550 },
      { label: 'Transport', amount: 3200 },
    ],
    inclustions: [
      { text: '5 premium floral centrepieces', group_title: 'Centerpieces' },
      { text: '3 cocktail centrepieces', group_title: 'Centerpieces' },
      { text: 'Golden frame entrance', group_title: 'Entrance Setup' },
      { text: 'Floral styling', group_title: 'Entrance Setup' },
      { text: 'Double panel backdrop', group_title: 'Customized Backdrop' },
      { text: 'Premium bar + menu', group_title: 'Premium Bar Setup' },
      { text: 'Printed bar menu', group_title: 'Premium Bar Setup' },
      { text: 'Candles in glass jars', group_title: 'Candles' },
      { text: '3 round tables', group_title: 'Furniture (Premium)' },
      { text: '20 chairs', group_title: 'Furniture (Premium)' },
      { text: '3 cocktail tables', group_title: 'Furniture (Premium)' },
      { text: '8–10 fairy light strings', group_title: 'Lighting' },
      { text: '8–10 paper lanterns', group_title: 'Lighting' },
      { text: '3–4 LED Parcans', group_title: 'Lighting' },
      { text: '8–10 themed props', group_title: 'Props' },
      { text: 'Event printables', group_title: 'Event Printables' },
    ],
  },
  {
    sheet: 'CP',
    title: 'Complete Package',
    slug: 'complete-package-bubbles-black-tie',
    theme_name: 'Complete Package',
    budget_level_slug: 'level-3',
    base_price: 162700,
    description:
      'A thoughtfully styled celebration space with refined details that make the gathering feel elevated and festive.',
    key_decor_elements:
      'A thoughtfully styled celebration space with refined details that make the gathering feel elevated and festive.',
    nitty_gritty: BUBBLES_NITTY_GRITTY,
    setup_needs: BUBBLES_SETUP_NEEDS,
    best_placed_at:
      'Perfect for milestone birthdays, anniversaries, or gatherings where you want the celebration to feel elevated and memorable.',
    why_we_love_it:
      'It blends statement pieces with elegant details to create a celebration space that feels truly special.',
    theme_slug_candidates: ['bubbles-and-black-tie', 'complete-package'],
    price_covers: BUBBLES_PRICE_COVERS,
    price_breakdown: [
      { label: '5 centerpieces', amount: 10000 },
      { label: 'Entrance Set up', amount: 5000 },
      { label: 'Premium Bar Set up', amount: 15000 },
      { label: 'Customized Backdrop', amount: 15000 },
      { label: 'Candles', amount: 3000 },
      { label: 'Furniture (classic or premium) cost differs', amount: 12500 },
      { label: '3 round tables + 20 chairs + 3 cocktail tables (premium)', amount: 20000 },
      { label: 'Fairy Lights with lanterns', amount: 5000 },
      { label: 'Printables', amount: 5000 },
      { label: 'lights', amount: 3000 },
      { label: 'Veg - 1900 | Non Veg - 2300 (with premium dishes)', amount: 66500 },
      { label: 'props (8-10)', amount: 5000 },
      { label: 'Platform fee', amount: 14500 },
      { label: 'Labour & Transport', amount: 3200 },
    ],
    inclustions: [
      { text: '5 premium floral centrepieces', group_title: 'Includes' },
      { text: 'Golden frame entrance', group_title: 'Includes' },
      { text: 'Premium bar + menu', group_title: 'Includes' },
      { text: 'Double panel backdrop', group_title: 'Includes' },
      { text: 'Furniture set', group_title: 'Includes' },
      { text: 'Fairy lights + lanterns', group_title: 'Includes' },
      { text: 'Printables + props', group_title: 'Includes' },
      { text: 'Catering for 35 pax', group_title: 'Includes' },
    ],
  },
];

async function seedDecorBubblesBlackTiePackages(strapi) {
  await ensureThemeDocumentId(strapi, {
    name: 'Bubbles & Black Tie',
    slug: 'bubbles-and-black-tie',
    display_order: 40,
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

  return seedDecorPackages(strapi, BUBBLES_BLACK_TIE_PACKAGES, {
    eventSlugCandidates: EVENT_SLUG_CANDIDATES,
    logPrefix: 'seed/decor-bubbles-black-tie',
    refreshExistingDecor: true,
  });
}

module.exports = {
  BUBBLES_BLACK_TIE_PACKAGES,
  EVENT_SLUG_CANDIDATES,
  seedDecorBubblesBlackTiePackages,
};
