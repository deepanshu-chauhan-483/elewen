'use strict';

const GUEST_PAX_OPTIONS = ['30', '40', '50', '60', '80', '100', '125'];

const CATERING_POLICY_TITLE = 'Policy for all catering packages';

const CATERING_POLICY_SUMMARY = `Policy for all catering packages

1. All the material used is on rent and shall be picked up after the event. The cost given is for one event only.
2. Additional Guests/Staff: Any extra consumption will be charged accordingly.
3. Service Duration: Starters served up to 5 hours. Extension at additional cost.
4. Client Arrangements: Client to provide space, electricity & basic setup for food preparation.
5. Food Preparation: Food is partially prepared in advance, with final cooking and finishing touches completed live at the venue for freshness.`;

function toDescriptionBlocks(text) {
  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', text: String(text ?? '').trim() }],
    },
  ];
}

function buildGuestPricingRules() {
  return GUEST_PAX_OPTIONS.map((value, index) => ({
    rule_type: 'guest_count',
    value,
    modifier_type: 'flat_amount',
    modifier_value: 0,
    __temp_key__: `guest-${index}`,
  }));
}

function pickMenuHintText(item = {}) {
  return [item?.choose_hint, item?.title, item?.details].filter(Boolean).join(' ');
}

function parseChooseHint(hint = '') {
  const text = String(hint ?? '').trim();
  const splitMatch = text.match(/(\d+)\s*\+\s*(\d+)/);
  const allVegMatch = text.match(/or\s*(\d+)\s*veg/i);
  const vegPick = splitMatch ? Number(splitMatch[1]) : 0;
  const nonvegPick = splitMatch ? Number(splitMatch[2]) : 0;
  const splitTotal = vegPick + nonvegPick;
  const allVegPick = allVegMatch ? Number(allVegMatch[1]) : 0;

  if (splitMatch) {
    const maxPick = allVegPick > 0 ? Math.max(splitTotal, allVegPick) : splitTotal;
    return { maxPick: maxPick > 0 ? maxPick : 1, vegPick, nonvegPick };
  }

  if (allVegPick > 0) {
    return { maxPick: allVegPick, vegPick: allVegPick, nonvegPick: 0 };
  }

  const chooseMatch = text.match(/choose\s*(\d+)/i);
  const maxPick = chooseMatch ? Number(chooseMatch[1]) : 0;
  return { maxPick: maxPick > 0 ? maxPick : 0, vegPick: 0, nonvegPick: 0 };
}

function inferCategoryKeyFromTitle(title = '') {
  const text = String(title ?? '').toLowerCase();
  if (/dessert/.test(text)) return 'dessert';
  if (/starter/.test(text)) return 'starters';
  if (/main\s*course|\bmains\b/.test(text)) return 'main_course_veg';
  if (/pre[-\s]?plated/.test(text)) return 'pre_plated';
  if (/\bsoup\b/.test(text)) return 'soup';
  if (/live\s*station/.test(text)) return 'live_stations';
  if (/\bsalad\b/.test(text)) return 'salad';
  if (/raita|yoghurt|yogurt/.test(text)) return 'raita';
  if (/\bbread/.test(text)) return 'rotis_and_rice';
  if (/\brice\b/.test(text) && !/bread/.test(text)) return 'rice';
  if (/accompaniment|rotis|artisan breads/.test(text)) return 'rotis_and_rice';
  return null;
}

function inferCategoryKeyExtra(title = '', rules = {}) {
  const text = String(title ?? '').toLowerCase();
  const maxPick = Number(rules.maxPick ?? 0);
  const hasSplitHint = /(\d+)\s*\+\s*(\d+)/.test(text) || /2\s*\+\s*2/.test(text);

  if (/starter/.test(text) && (maxPick >= 2 || hasSplitHint || /non-?veg/i.test(text))) {
    return 'starters_non_veg';
  }
  if (
    /main\s*course|\bmains\b/.test(text) &&
    (maxPick >= 2 || hasSplitHint || /non-?veg/i.test(text))
  ) {
    return 'main_course_non_veg';
  }

  return null;
}

function normalizeCateringMenuItems(menuItems = []) {
  if (!Array.isArray(menuItems)) return [];

  return menuItems.map((item, index) => {
    const title = String(item?.title ?? '').trim();
    if (!title) return item;

    const hintText = pickMenuHintText(item);
    const parsed = parseChooseHint(hintText);
    const categoryKey = item.category_key || inferCategoryKeyFromTitle(title);
    const categoryKeyExtra =
      item.category_key_extra || inferCategoryKeyExtra(title, parsed) || undefined;

    let maxPick = Number(item.max_pick) > 0 ? Number(item.max_pick) : parsed.maxPick;
    let vegPick = Number(item.veg_pick) > 0 ? Number(item.veg_pick) : parsed.vegPick;
    let nonvegPick =
      Number(item.nonveg_pick) > 0 ? Number(item.nonveg_pick) : parsed.nonvegPick;

    if (vegPick > 0 && nonvegPick > 0) {
      maxPick = Math.max(maxPick || 0, vegPick + nonvegPick);
    }

    if (
      categoryKey === 'starters' &&
      categoryKeyExtra === 'starters_non_veg' &&
      maxPick >= 4 &&
      !vegPick &&
      !nonvegPick
    ) {
      vegPick = Math.floor(maxPick / 2);
      nonvegPick = Math.floor(maxPick / 2);
    }

    if (
      categoryKey === 'main_course_veg' &&
      categoryKeyExtra === 'main_course_non_veg' &&
      maxPick >= 2 &&
      !vegPick &&
      !nonvegPick
    ) {
      vegPick = Math.floor(maxPick / 2) || 1;
      nonvegPick = Math.floor(maxPick / 2) || 1;
    }

    return {
      ...item,
      title,
      choose_hint: item.choose_hint || (parsed.maxPick ? hintText : item.choose_hint),
      category_key: categoryKey || undefined,
      category_key_extra: categoryKeyExtra,
      max_pick: maxPick > 0 ? maxPick : undefined,
      min_pick:
        Number(item.min_pick) > 0
          ? Number(item.min_pick)
          : maxPick > 0
            ? maxPick
            : undefined,
      veg_pick: vegPick > 0 ? vegPick : undefined,
      nonveg_pick: nonvegPick > 0 ? nonvegPick : undefined,
      sort_order: item.sort_order ?? index + 1,
    };
  });
}

function buildCateringComponent({
  cateringLevel,
  levelDescription,
  policyDocumentId,
  budgetLevelDocumentId,
  inclusions,
  exclusions,
  clientRequirements,
  nittyGritty,
  idealFor,
  serviceStyleNotes,
  internalPackageCode,
  pricePerPersonVeg,
  pricePerPersonNonVeg,
  menuItems,
}) {
  return {
    __component: 'package.cateringpackage',
    catering_level: cateringLevel,
    level_description: levelDescription,
    inclusions,
    exclusions,
    client_requirements: clientRequirements,
    nitty_gritty: nittyGritty,
    ideal_for: idealFor,
    service_style_notes: serviceStyleNotes || undefined,
    internal_package_code: internalPackageCode,
    price_per_person_veg: pricePerPersonVeg,
    price_per_person_non_veg: pricePerPersonNonVeg,
    menu_items: normalizeCateringMenuItems(menuItems),
    pricing_rules: buildGuestPricingRules(),
    ...(policyDocumentId ? { policy: policyDocumentId } : {}),
    ...(budgetLevelDocumentId ? { budget_level: budgetLevelDocumentId } : {}),
  };
}

async function findPublishedBySlug(strapi, uid, slug) {
  const rows = await strapi.documents(uid).findMany({
    filters: { slug: { $eq: slug } },
    status: 'published',
    limit: 1,
  });

  return Array.isArray(rows) ? rows[0] ?? null : null;
}

function packageHasCateringBlock(entry) {
  const blocks = Array.isArray(entry?.packages) ? entry.packages : [];
  return blocks.some(block => block?.__component === 'package.cateringpackage');
}

function cateringNestedFieldsPopulated(block) {
  if (!block || block.__component !== 'package.cateringpackage') return true;
  return (
    (Array.isArray(block.menu_items) && block.menu_items.length > 0) ||
    (Array.isArray(block.inclusions) && block.inclusions.length > 0)
  );
}

async function findPackageBySlug(strapi, slug) {
  for (const status of ['published', 'draft']) {
    const rows = await strapi.documents('api::package.package').findMany({
      filters: { slug: { $eq: slug } },
      status,
      populate: {
        packages: {
          on: {
            'package.cateringpackage': {
              populate: '*',
            },
          },
        },
      },
      limit: 1,
    });

    if (Array.isArray(rows) && rows[0]) {
      return { entry: rows[0], status };
    }
  }

  return null;
}

async function ensureCateringPolicy(strapi) {
  const existing = await strapi.documents('api::policy.policy').findMany({
    filters: { title: { $eq: CATERING_POLICY_TITLE } },
    status: 'published',
    limit: 1,
  });

  if (Array.isArray(existing) && existing[0]) {
    return existing[0];
  }

  const draft = await strapi.documents('api::policy.policy').findMany({
    filters: { title: { $eq: CATERING_POLICY_TITLE } },
    status: 'draft',
    limit: 1,
  });

  if (Array.isArray(draft) && draft[0]) {
    const published = await strapi.documents('api::policy.policy').publish({
      documentId: draft[0].documentId,
    });
    return published?.entries?.[0] ?? draft[0];
  }

  const created = await strapi.documents('api::policy.policy').create({
    data: {
      title: CATERING_POLICY_TITLE,
      type: 'catering',
      summary_text: CATERING_POLICY_SUMMARY,
      content: CATERING_POLICY_SUMMARY,
      version: 1,
    },
    status: 'published',
  });

  return created;
}

async function ensureCateringServiceCategory(strapi) {
  const published = await strapi.documents('api::service-category.service-category').findMany({
    filters: {
      $or: [{ slug: { $eq: 'catering' } }, { name: { $eq: 'Catering' } }],
    },
    status: 'published',
    limit: 1,
  });

  if (Array.isArray(published) && published[0]) {
    return published[0];
  }

  const created = await strapi.documents('api::service-category.service-category').create({
    data: {
      name: 'Catering',
      slug: 'catering',
      description: 'Curated catering packages for home gatherings and celebrations.',
      is_active: true,
      is_featured: true,
    },
    status: 'published',
  });

  return created;
}

function shouldRefreshExistingCatering() {
  const raw = String(process.env.CATERING_REFRESH_EXISTING ?? '')
    .trim()
    .toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

async function ensureCateringPackage(
  strapi,
  pkgSeed,
  cateringBlock,
  cateringCategoryDocumentId,
  options = {}
) {
  const refreshExisting =
    typeof options.refreshExisting === 'boolean'
      ? options.refreshExisting
      : shouldRefreshExistingCatering();
  const found = await findPackageBySlug(strapi, pkgSeed.slug);

  if (found) {
    const { entry, status } = found;
    const hasBlock = packageHasCateringBlock(entry);

    if (hasBlock && !refreshExisting) {
      // Still sync budget_level so Level 1/2/3 can be corrected without rewriting menus.
      const existingBlocks = Array.isArray(entry.packages) ? entry.packages : [];
      const nextBudgetLevel = cateringBlock?.budget_level ?? null;
      let levelChanged = false;
      const nextBlocks = existingBlocks.map(block => {
        if (block?.__component !== 'package.cateringpackage') return block;
        const current =
          block?.budget_level?.documentId ??
          block?.budget_level?.id ??
          block?.budget_level ??
          null;
        if (String(current ?? '') === String(nextBudgetLevel ?? '')) return block;
        levelChanged = true;
        return {
          ...block,
          budget_level: nextBudgetLevel,
        };
      });

      if (levelChanged && nextBudgetLevel) {
        const nestedMissing = existingBlocks.some(
          block =>
            block?.__component === 'package.cateringpackage' && !cateringNestedFieldsPopulated(block)
        );
        if (nestedMissing) {
          strapi.log.warn(
            `[seed/catering] Skip budget_level rewrite for "${pkgSeed.slug}" because nested catering fields were not populated`
          );
          return { skipped: true, documentId: entry.documentId, title: pkgSeed.title };
        }

        const sanitized = nextBlocks.map(block => {
          if (block?.__component !== 'package.cateringpackage') return block;
          const copy = { ...block, budget_level: nextBudgetLevel };
          delete copy.id;
          delete copy.documentId;
          if (copy.policy?.documentId) copy.policy = copy.policy.documentId;
          else if (copy.policy && typeof copy.policy === 'object') delete copy.policy;
          return copy;
        });

        await strapi.documents('api::package.package').update({
          documentId: entry.documentId,
          data: { packages: sanitized },
        });

        try {
          await strapi.documents('api::package.package').publish({
            documentId: entry.documentId,
          });
        } catch (publishError) {
          strapi.log.warn(
            `[seed/catering] Publish after budget_level sync for "${pkgSeed.slug}" (${status}): ${publishError.message}`
          );
        }

        return {
          skipped: false,
          updated: true,
          budgetLevelOnly: true,
          documentId: entry.documentId,
          title: pkgSeed.title,
        };
      }

      return { skipped: true, documentId: entry.documentId, title: pkgSeed.title };
    }

    await strapi.documents('api::package.package').update({
      documentId: entry.documentId,
      data: {
        title: pkgSeed.title,
        description: toDescriptionBlocks(pkgSeed.description),
        base_price: pkgSeed.base_price,
        is_active: true,
        visibility: true,
        is_featured: pkgSeed.is_featured ?? false,
        packages: [cateringBlock],
        service_categories: {
          connect: [{ documentId: cateringCategoryDocumentId }],
        },
      },
    });

    try {
      await strapi.documents('api::package.package').publish({
        documentId: entry.documentId,
      });
    } catch (publishError) {
      strapi.log.warn(
        `[seed/catering] Publish after ${hasBlock ? 'refresh' : 'repair'} for "${pkgSeed.slug}" (${status}): ${publishError.message}`
      );
    }

    if (hasBlock) {
      strapi.log.info(
        `[seed/catering] Refreshed cateringpackage on "${pkgSeed.title}" (${pkgSeed.slug})`
      );
      return {
        skipped: false,
        updated: true,
        documentId: entry.documentId,
        title: pkgSeed.title,
      };
    }

    strapi.log.info(
      `[seed/catering] Repaired missing cateringpackage block on "${pkgSeed.title}" (${pkgSeed.slug})`
    );

    return {
      skipped: false,
      repaired: true,
      documentId: entry.documentId,
      title: pkgSeed.title,
    };
  }

  const created = await strapi.documents('api::package.package').create({
    data: {
      title: pkgSeed.title,
      slug: pkgSeed.slug,
      description: toDescriptionBlocks(pkgSeed.description),
      base_price: pkgSeed.base_price,
      is_active: true,
      visibility: true,
      is_featured: pkgSeed.is_featured ?? false,
      packages: [cateringBlock],
      service_categories: {
        connect: [{ documentId: cateringCategoryDocumentId }],
      },
    },
    status: 'published',
  });

  return { skipped: false, documentId: created.documentId, title: pkgSeed.title };
}

async function seedCateringPackages(strapi, packageSeeds, buildBlockForSeed, options = {}) {
  const policy = await ensureCateringPolicy(strapi);
  const cateringCategory = await ensureCateringServiceCategory(strapi);
  const policyDocumentId = policy?.documentId;
  const categoryDocumentId = cateringCategory?.documentId;
  const { ensureBudgetLevelDocumentId } = require('./decor-proposal-shared');
  const levelCache = new Map();

  if (!policyDocumentId || !categoryDocumentId) {
    throw new Error('Catering seed failed: missing policy or service category documentId.');
  }

  const results = [];

  for (const pkgSeed of packageSeeds) {
    let budgetLevelDocumentId = null;
    const levelSlug = String(pkgSeed.budget_level_slug ?? '').trim();
    if (levelSlug) {
      if (!levelCache.has(levelSlug)) {
        const orderMatch = levelSlug.match(/(\d+)/);
        levelCache.set(
          levelSlug,
          await ensureBudgetLevelDocumentId(strapi, {
            slug: levelSlug,
            name: `Level ${orderMatch?.[1] ?? ''}`.trim() || levelSlug,
            display_order: Number(orderMatch?.[1] ?? 0) || 0,
          })
        );
      }
      budgetLevelDocumentId = levelCache.get(levelSlug);
    }

    const cateringBlock = buildBlockForSeed(pkgSeed, policyDocumentId, budgetLevelDocumentId);
    const result = await ensureCateringPackage(
      strapi,
      pkgSeed,
      cateringBlock,
      categoryDocumentId,
      options
    );
    results.push(result);
  }

  return {
    policyDocumentId,
    categoryDocumentId,
    packages: results,
  };
}

module.exports = {
  GUEST_PAX_OPTIONS,
  CATERING_POLICY_TITLE,
  CATERING_POLICY_SUMMARY,
  toDescriptionBlocks,
  buildGuestPricingRules,
  buildCateringComponent,
  findPublishedBySlug,
  findPackageBySlug,
  packageHasCateringBlock,
  cateringNestedFieldsPopulated,
  normalizeCateringMenuItems,
  shouldRefreshExistingCatering,
  ensureCateringPolicy,
  ensureCateringServiceCategory,
  ensureCateringPackage,
  seedCateringPackages,
};
