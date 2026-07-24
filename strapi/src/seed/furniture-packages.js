'use strict';

/**
 * Rental furniture listing packages
 * (Sit-Down / Mix & Mingle / Estate / Puja / Mehndi / Low Lounge).
 * Uses decorpackages dynamic-zone shape so detail UI can render grouped inclusions
 * and Choose-1 cards (same Figma pattern as Decor).
 *
 * Customer-facing price = Total Price only. Internal line-item costs stay off-site.
 */

const { toDescriptionBlocks, findPackageBySlug } = require('./catering-shared');
const {
  stripSeedOnlyInclusionFields,
  buildChoiceElementsFromInclusions,
} = require('./decor-choice-elements');

const FURNITURE_POLICY_TITLE = 'Policy for furniture packages (material rental)';
const FURNITURE_POLICY_SUMMARY =
  'All the material used is on rent and shall be picked up after the event. The cost given above is for one event only.';

const FURNITURE_PRICE_COVERS = [
  { text: 'The Complete Furniture Setup' },
  { text: 'Professional Delivery & Setup' },
  { text: 'Final Pickup / Dismantling' },
  { text: 'Coordination with the furniture team handled end-to-end.' },
  { text: 'No hidden service fees.' },
];

const FURNITURE_SETUP_NEEDS =
  'Clear access for delivery, space to place tables and seating, and a flat indoor or outdoor area suitable for furniture setup.';

function choiceOption(groupKey, label, optionTitle) {
  return {
    is_choice_group: true,
    choice_group_key: groupKey,
    choice_group_label: label,
    group_title: label,
    text: optionTitle,
  };
}

function qtyText(qty, name) {
  return `${qty} × ${name}`;
}

function linenNitty({ seats = '', linenNote = true } = {}) {
  const lines = [];
  if (seats) lines.push(`Seats: ${seats}`);
  if (linenNote) {
    lines.push(
      'Linen: Colours and patterns will be shared with you upon booking and can be customised according to your preference and availability.'
    );
  }
  return lines.join('\n');
}

const FURNITURE_PACKAGES = [
  {
    title: 'The Sit-Down Dinner',
    slug: 'the-sit-down-dinner',
    base_price: 18600,
    description:
      'Formal and curated seated dining focusing on guest comfort, elegance, and maximized table space for meals. Includes furniture for dining as well as service.',
    ideal_for:
      'Intimate weddings, anniversary parties, upscale backyard dinners, holiday feasts, or corporate banquets.',
    nitty_gritty: linenNitty({ seats: '25 - 30 Guests' }),
    price_breakdown: [
      { label: 'Package Price', amount: 14000 },
      { label: 'Labour & Transport', amount: 3200 },
      { label: 'Platform fee', amount: 1400 },
    ],
    inclustions: [
      {
        text: qtyText(3, '6ft Rectangular Banquet Table with premium linen and table runner'),
        group_title: 'The Sitting',
      },
      { text: qtyText(25, 'Premium Dining Chairs'), group_title: 'The Sitting' },
      {
        text: qtyText(3, '6ft Buffet Service Table with frill'),
        group_title: 'Kitchen tables for catering',
      },
    ],
  },
  {
    title: 'The Sit-Down Dinner 2.0 (Round Tables)',
    slug: 'the-sit-down-dinner-2-0-round-tables',
    legacySlugs: ['the-sit-down-dinner-2-0', 'the-sit-down-dinner-20-round-tables'],
    base_price: 18600,
    description:
      'Formal and curated seated dining focusing on guest comfort, elegance, and circular layout arrangement. Includes furniture for dining as well as service.',
    ideal_for:
      'Premium weddings, formal anniversary dinners, upscale galas, or high-end corporate banquets.',
    nitty_gritty: linenNitty({ seats: '25 - 30 Guests' }),
    price_breakdown: [
      { label: 'Package Price', amount: 14000 },
      { label: 'Labour & Transport', amount: 3200 },
      { label: 'Platform fee', amount: 1400 },
    ],
    inclustions: [
      {
        text: qtyText(5, 'Round Table with premium linen and table runner'),
        group_title: 'The Sitting',
      },
      { text: qtyText(25, 'Fancy Chairs'), group_title: 'The Sitting' },
      {
        text: qtyText(2, '6 ft rectangular Buffet Tables with frill'),
        group_title: 'Kitchen tables for catering',
      },
    ],
  },
  {
    title: 'The Mix & Mingle',
    slug: 'the-mix-and-mingle',
    base_price: 9250,
    description:
      'High-energy cocktail party layout focused on movement, socializing, and fluid guest interaction. Features an elevated bar zone alongside plenty of high-top standing spaces.',
    ideal_for:
      'Cocktail mixers, milestone birthdays, networking events, pre-wedding parties, or corporate socials.',
    nitty_gritty: linenNitty(),
    price_breakdown: [
      { label: 'Package Price', amount: 5500 },
      { label: 'Labour & Transport', amount: 3200 },
      { label: 'Platform fee', amount: 550 },
    ],
    inclustions: [
      { text: qtyText(1, 'Basic Bar (Elevated)'), group_title: 'The Bar' },
      { text: qtyText(3, 'Cocktail Tables with linen'), group_title: 'The Mingle Zone' },
    ],
  },
  {
    title: 'The Mix & Mingle 2',
    slug: 'the-mix-and-mingle-2',
    legacySlugs: ['the-mix-and-mingle2'],
    base_price: 7150,
    description:
      'High-energy cocktail party layout focused on movement, socializing, and fluid guest interaction. Features an elevated bar zone alongside plenty of high-top standing spaces.',
    ideal_for:
      'Cocktail mixers, milestone birthdays, networking events, pre-wedding parties, or corporate socials.',
    nitty_gritty: linenNitty(),
    price_breakdown: [
      { label: 'Package Price', amount: 6500 },
      { label: 'Labour & Transport', amount: 0 },
      { label: 'Platform fee', amount: 650 },
    ],
    inclustions: [
      { text: qtyText(1, '6 ft Basic Bar (Elevated)'), group_title: 'The Bar' },
      { text: qtyText(3, 'Cocktail Tables — Fancy metal'), group_title: 'The Mingle Zone' },
    ],
  },
  {
    title: 'The Estate Party Pack',
    slug: 'the-estate-party-pack',
    base_price: 21020,
    description:
      'The ultimate all-in-one setup designed for large home gatherings, maximizing space for eating, drinking, and moving around. Features a dedicated 4-table food station, a fully equipped bar, high-top mingling zones, and traditional rectangular banquet seating.',
    ideal_for:
      'Large housewarmings, graduation bashes, milestone family celebrations, or expansive backyard holiday parties.',
    nitty_gritty: linenNitty({ seats: '25 - 30 Guests' }),
    price_breakdown: [
      { label: 'Package Price', amount: 16200 },
      { label: 'Labour & Transport', amount: 3200 },
      { label: 'Platform fee', amount: 1620 },
    ],
    inclustions: [
      { text: qtyText(1, 'Takht Bar'), group_title: 'The Bar & Mingle' },
      choiceOption('estate-cocktail', 'Choose 1', '4 Cocktail Tables with linen'),
      choiceOption('estate-cocktail', 'Choose 1', '4 Cocktail Tables — Basic metal frame'),
      {
        text: qtyText(4, '6ft Buffet Service Table with frill'),
        group_title: 'Kitchen tables for catering',
      },
      { text: qtyText(4, 'Round Table with premium linen'), group_title: 'The Sitting' },
      { text: qtyText(20, 'Dining Chairs'), group_title: 'The Sitting' },
    ],
  },
  {
    title: 'The Puja Celebration',
    slug: 'the-puja-celebration',
    base_price: 9020,
    description:
      'A traditional, serene arrangement perfectly balanced for home prayers, community gatherings, or devotional music sessions. Offers an optimal blend of floor-based Gadda seating and standard chairs to accommodate all family members comfortably.',
    ideal_for: 'Home Pujas, festive prayers, small family hawans, or traditional house blessings.',
    nitty_gritty: linenNitty({ seats: '25 - 30 Guests' }),
    price_breakdown: [
      { label: 'Package Price', amount: 8200 },
      { label: 'Labour & Transport', amount: 3200 },
      { label: 'Platform fee', amount: 820 },
    ],
    inclustions: [
      {
        text: qtyText(1, '4 ft elegant Wooden Table (For Deity Setup)'),
        group_title: 'The Altar & Sacred Space',
      },
      { text: qtyText(6, 'Gadda / Floor Mattresses'), group_title: 'The Floor Seating' },
      {
        text: qtyText(10, 'Cushions (Square & Bolsters) with Covers'),
        group_title: 'The Floor Seating',
      },
      { text: qtyText(10, 'Standard Plastic Chairs'), group_title: 'The Chair Seating' },
    ],
  },
  {
    title: 'Mehndi On My Mind',
    slug: 'mehndi-on-my-mind',
    base_price: 6600,
    description:
      'A colorful, traditional layout optimized for high-energy home or lawn celebrations. Features dedicated seating for mehndi artists and clients, a functional beverage bar station, and a mix of traditional floor mattresses and standard chairs for guests.',
    ideal_for:
      'Home-based Mehendi functions, pre-wedding family mixers, haldi ceremonies, or traditional bridal showers.',
    nitty_gritty: linenNitty(),
    price_breakdown: [
      { label: 'Package Price', amount: 4000 },
      { label: 'Labour & Transport', amount: 2200 },
      { label: 'Platform fee', amount: 400 },
    ],
    inclustions: [
      {
        text: qtyText(6, 'Standard Plastic Chairs (For Artists)'),
        group_title: 'The Mehndi Zone',
      },
      {
        text: qtyText(2, 'Basic Coffee tables (For Henna Supplies)'),
        group_title: 'The Mehndi Zone',
      },
      { text: qtyText(4, 'Premium Chairs (for Guests)'), group_title: 'The Mehndi Zone' },
    ],
  },
  {
    title: 'Mehndi On My Mind 2.0',
    slug: 'mehndi-on-my-mind-2-0',
    legacySlugs: ['mehndi-on-my-mind-20'],
    base_price: 27840,
    description:
      'A colorful, traditional layout optimized for high-energy home or lawn celebrations. Features dedicated seating for mehndi artists and clients, a functional beverage bar station, and a mix of traditional floor mattresses and standard chairs for guests.',
    ideal_for:
      'Home-based Mehendi functions, pre-wedding family mixers, haldi ceremonies, or traditional bridal showers.',
    nitty_gritty: linenNitty(),
    price_breakdown: [
      { label: 'Package Price', amount: 22400 },
      { label: 'Labour & Transport', amount: 3200 },
      { label: 'Platform fee', amount: 2240 },
    ],
    inclustions: [
      { text: qtyText(1, 'Fancy Chair (For the Bride)'), group_title: 'The Bridal Zone' },
      {
        text: qtyText(2, 'Standard Plastic Chairs (For Artists)'),
        group_title: 'The Bridal Zone',
      },
      {
        text: qtyText(4, 'Standard Plastic Chairs (For Artists)'),
        group_title: 'The Mehndi Zone',
      },
      {
        text: qtyText(2, 'Basic Coffee tables (For Henna Supplies)'),
        group_title: 'The Mehndi Zone',
      },
      { text: qtyText(4, 'Premium Chairs (for Guests)'), group_title: 'The Mehndi Zone' },
      { text: qtyText(1, 'Basic Bar (Elevated)'), group_title: 'The Bar & Mingle' },
      { text: qtyText(3, 'Cocktail Tables with linen'), group_title: 'The Bar & Mingle' },
      {
        text: qtyText(4, 'Buffet Tables with frill'),
        group_title: 'The Food Presentation & Service',
      },
      { text: qtyText(3, 'Round Tables with linen'), group_title: 'The Seating' },
      { text: qtyText(12, 'Basic Chairs'), group_title: 'The Seating' },
    ],
  },
  {
    title: 'The Low Lounge Social',
    slug: 'the-low-lounge-social',
    base_price: 11450,
    description:
      'A relaxed, low-profile floor layout designed for ultimate comfort and interactive hosting. Features a central clustered floor mattress setup perfect for laying out board games, art canvases, or charcuterie boards.',
    ideal_for: "Sip and paint nights, girls' night in, board game marathons or kid's Parties",
    nitty_gritty: linenNitty(),
    price_breakdown: [
      { label: 'Package Price', amount: 7500 },
      { label: 'Labour & Transport', amount: 3200 },
      { label: 'Platform fee', amount: 750 },
    ],
    inclustions: [
      {
        text: qtyText(4, 'Gadda / Floor Mattresses with linen'),
        group_title: 'The Floor Lounge',
      },
      { text: qtyText(8, 'Cushions with linen covers'), group_title: 'The Floor Lounge' },
      {
        text: qtyText(
          2,
          'Rectangular Wooden Table 5.5 ft (Low-Height Setup for Games/Paint)'
        ),
        group_title: 'The Floor Lounge',
      },
    ],
  },
  {
    title: 'The Low Lounge Social 2.0',
    slug: 'the-low-lounge-social-2-0',
    legacySlugs: ['the-low-lounge-social2-0', 'the-low-lounge-social-20'],
    base_price: 17500,
    description:
      'A relaxed, low-profile floor layout designed for ultimate comfort and interactive hosting. Features a central clustered floor mattress setup perfect for laying out board games, art canvases, or charcuterie boards, paired with high-top cocktail tables for drinks.',
    ideal_for:
      "Sip and paint nights, girls' night in, board game marathons, or casual movie nights.",
    nitty_gritty: linenNitty(),
    price_breakdown: [
      { label: 'Package Price', amount: 13000 },
      { label: 'Labour & Transport', amount: 3200 },
      { label: 'Platform fee', amount: 1300 },
    ],
    inclustions: [
      { text: qtyText(4, 'Gadda / Floor Mattresses'), group_title: 'The Floor Lounge' },
      { text: qtyText(8, 'Cushions with linen covers'), group_title: 'The Floor Lounge' },
      {
        text: qtyText(2, 'Wooden Table Long (Low-Height Setup for Games/Paint)'),
        group_title: 'The Floor Lounge',
      },
      { text: qtyText(1, 'Takht Bar'), group_title: 'The Bar & Mingle' },
      { text: qtyText(3, 'Cocktail Tables — Basic'), group_title: 'The Bar & Mingle' },
    ],
  },
];

async function ensureFurnitureServiceCategory(strapi) {
  const rows = await strapi.documents('api::service-category.service-category').findMany({
    filters: {
      $or: [
        { slug: { $eq: 'rental-furniture' } },
        { slug: { $eq: 'furniture' } },
        { name: { $eq: 'Furniture' } },
        { name: { $eq: 'Rental Furniture' } },
      ],
    },
    status: 'published',
    limit: 5,
  });
  if (Array.isArray(rows) && rows[0]) return rows[0];

  return strapi.documents('api::service-category.service-category').create({
    data: {
      name: 'Furniture',
      slug: 'rental-furniture',
      description: 'Rent stylish furniture to complete your event setup.',
      is_active: true,
      is_featured: true,
    },
    status: 'published',
  });
}

async function ensureFurniturePolicy(strapi) {
  const existing = await strapi.documents('api::policy.policy').findMany({
    filters: { title: { $eq: FURNITURE_POLICY_TITLE } },
    status: 'published',
    limit: 1,
  });
  if (Array.isArray(existing) && existing[0]) return existing[0];

  return strapi.documents('api::policy.policy').create({
    data: {
      type: 'material',
      title: FURNITURE_POLICY_TITLE,
      summary_text: FURNITURE_POLICY_SUMMARY,
      content: FURNITURE_POLICY_SUMMARY,
      version: 1,
    },
    status: 'published',
  });
}

function buildFurnitureDecorBlock(pkgSeed, policyDocumentId) {
  const inclustions = stripSeedOnlyInclusionFields(pkgSeed.inclustions ?? []);

  return {
    __component: 'package.decorpackages',
    theme_name: 'Furniture',
    key_decor_elements: pkgSeed.description,
    purpose: pkgSeed.ideal_for,
    nitty_gritty: pkgSeed.nitty_gritty,
    best_placed_at: pkgSeed.ideal_for,
    why_we_love_it: pkgSeed.description,
    setup_needs: FURNITURE_SETUP_NEEDS,
    price_covers: FURNITURE_PRICE_COVERS,
    price_breakdown: (pkgSeed.price_breakdown ?? []).filter(row => Number(row?.amount) > 0),
    inclustions,
    elements: buildChoiceElementsFromInclusions(pkgSeed.inclustions ?? []),
    ...(Array.isArray(pkgSeed.addons) && pkgSeed.addons.length ? { addons: pkgSeed.addons } : {}),
    ...(policyDocumentId ? { policy: policyDocumentId } : {}),
  };
}

async function ensureFurniturePackage(strapi, pkgSeed, furnitureCategoryDocumentId, policyDocumentId) {
  const slugCandidates = [pkgSeed.slug, ...(Array.isArray(pkgSeed.legacySlugs) ? pkgSeed.legacySlugs : [])];
  let found = null;
  for (const slug of slugCandidates) {
    found = await findPackageBySlug(strapi, slug);
    if (found) break;
  }

  const furnitureBlock = buildFurnitureDecorBlock(pkgSeed, policyDocumentId);

  if (found) {
    const otherBlocks = (Array.isArray(found.entry.packages) ? found.entry.packages : []).filter(
      block => block?.__component !== 'package.decorpackages'
    );

    await strapi.documents('api::package.package').update({
      documentId: found.entry.documentId,
      data: {
        title: pkgSeed.title,
        slug: pkgSeed.slug,
        description: toDescriptionBlocks(pkgSeed.description),
        base_price: pkgSeed.base_price,
        is_active: true,
        visibility: true,
        service_categories: {
          set: [{ documentId: furnitureCategoryDocumentId }],
        },
        packages: [...otherBlocks, furnitureBlock],
      },
      status: found.status,
    });

    try {
      await strapi.documents('api::package.package').publish({
        documentId: found.entry.documentId,
      });
    } catch {
      // ignore publish race
    }

    return { skipped: false, updated: true, slug: pkgSeed.slug, documentId: found.entry.documentId };
  }

  const created = await strapi.documents('api::package.package').create({
    data: {
      title: pkgSeed.title,
      slug: pkgSeed.slug,
      description: toDescriptionBlocks(pkgSeed.description),
      base_price: pkgSeed.base_price,
      is_active: true,
      visibility: true,
      service_categories: {
        connect: [{ documentId: furnitureCategoryDocumentId }],
      },
      packages: [furnitureBlock],
    },
    status: 'published',
  });

  return { skipped: false, updated: false, slug: pkgSeed.slug, documentId: created.documentId };
}

async function seedFurniturePackages(strapi) {
  const category = await ensureFurnitureServiceCategory(strapi);
  const policy = await ensureFurniturePolicy(strapi);
  const results = [];

  for (const pkgSeed of FURNITURE_PACKAGES) {
    results.push(
      await ensureFurniturePackage(strapi, pkgSeed, category.documentId, policy.documentId)
    );
  }

  const created = results.filter(item => !item.skipped && !item.updated);
  const updated = results.filter(item => item.updated);

  strapi.log.info(
    `[seed/furniture-packages] created=${created.length}, updated=${updated.length}`
  );

  return { created, updated, results };
}

module.exports = {
  FURNITURE_PACKAGES,
  seedFurniturePackages,
};
