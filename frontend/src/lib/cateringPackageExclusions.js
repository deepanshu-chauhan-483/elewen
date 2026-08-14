import { resolveCateringCatalogSlug } from './packageFilters'

const ESSENTIALS_EXCLUSIONS = [
  'Buffet tables',
  'Servers / waiters',
  'Serving cutlery',
  'Soft beverages & ice',
]

const ASSISTED_EXCLUSIONS_1 = [
  'Buffet tables',
  'Serving cutlery',
  'Water supply',
  'Soft beverages & ice',
]

const ASSISTED_EXCLUSIONS_2 = [
  'Buffet tables',
  'Serving cutlery',
  'Water supply',
  'Kitchen tables',
  'Electricity points',
]

const END_TO_END_EXCLUSIONS = ['Soft beverages & ice', 'Decor']

const SATVIK_EXCLUSIONS = ['Decor / furniture']

/** Seed exclusions by catering package slug — used only when CMS rows are missing. */
export const CATERING_PACKAGE_EXCLUSIONS = {
  'close-circle-catering-1': ESSENTIALS_EXCLUSIONS,
  'close-circle-catering-2': ESSENTIALS_EXCLUSIONS,
  'close-circle-catering-3': ESSENTIALS_EXCLUSIONS,
  'easy-hosting-simply-served-1': ASSISTED_EXCLUSIONS_1,
  'easy-hosting-simply-served-2': ASSISTED_EXCLUSIONS_2,
  'effortless-hosting': END_TO_END_EXCLUSIONS,
  'signature-hosting-package': END_TO_END_EXCLUSIONS,
  'signature-hosting-2': END_TO_END_EXCLUSIONS,
  'the-full-table-experience': END_TO_END_EXCLUSIONS,
  'the-social-experience': END_TO_END_EXCLUSIONS,
  'the-grand-experience': END_TO_END_EXCLUSIONS,
  'the-social-starters': END_TO_END_EXCLUSIONS,
  'purely-satvik': SATVIK_EXCLUSIONS,
}

const LEVEL_EXCLUSIONS = {
  essentials: ESSENTIALS_EXCLUSIONS,
  assisted: ASSISTED_EXCLUSIONS_1,
  end_to_end: END_TO_END_EXCLUSIONS,
  'end-to-end': END_TO_END_EXCLUSIONS,
}

function titleToSlugKey(title = '') {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveCateringExclusionSlug(pkg) {
  const slug = String(pkg?.slug ?? '').trim()
  const catalog = resolveCateringCatalogSlug(slug) || slug
  if (CATERING_PACKAGE_EXCLUSIONS[catalog]) return catalog
  if (CATERING_PACKAGE_EXCLUSIONS[slug]) return slug

  const titleKey = titleToSlugKey(pkg?.title)
  if (titleKey.includes('signature-hosting-2')) return 'signature-hosting-2'
  if (titleKey.includes('signature-hosting')) return 'signature-hosting-package'
  if (titleKey.includes('satvik')) return 'purely-satvik'
  if (titleKey.includes('social-starters')) return 'the-social-starters'
  if (titleKey.includes('grand-experience')) return 'the-grand-experience'
  if (titleKey.includes('social-experience')) return 'the-social-experience'
  if (titleKey.includes('full-table')) return 'the-full-table-experience'
  if (titleKey.includes('effortless-hosting')) return 'effortless-hosting'
  if (titleKey.includes('simply-served-2') || titleKey.includes('easy-hosting-2')) {
    return 'easy-hosting-simply-served-2'
  }
  if (titleKey.includes('simply-served') || titleKey.includes('easy-hosting')) {
    return 'easy-hosting-simply-served-1'
  }
  if (
    titleKey.includes('close-circle-catering-3') ||
    (titleKey.includes('chef') &&
      (titleKey.includes('choice') || titleKey.includes('selection')))
  ) {
    return 'close-circle-catering-3'
  }
  if (titleKey.includes('close-circle-catering-2')) return 'close-circle-catering-2'
  if (titleKey.includes('close-circle-catering')) return 'close-circle-catering-1'

  return catalog || slug || null
}

/**
 * Catering-only fallback exclusions when CMS nested rows are empty.
 */
export function getCateringPackageExclusions(pkg, cateringSection = null) {
  const slugKey = resolveCateringExclusionSlug(pkg)
  if (slugKey && CATERING_PACKAGE_EXCLUSIONS[slugKey]?.length) {
    return CATERING_PACKAGE_EXCLUSIONS[slugKey]
  }

  const level = String(cateringSection?.catering_level ?? pkg?.catering_level ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
  const normalizedLevel = level === 'end-to-end' ? 'end_to_end' : level

  return LEVEL_EXCLUSIONS[normalizedLevel] ?? []
}
