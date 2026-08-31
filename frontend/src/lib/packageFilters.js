import { inferLevelSlugFromCateringLevel } from './cateringPricing'

const normalizeValue = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const normalizeLevelSlug = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeThemeSlug = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Client-renamed slugs → canonical seed slug (menus / fallbacks). */
export const CATERING_SLUG_ALIASES = {
  'smart-serve-1': 'close-circle-catering-2',
  'smart-serve': 'close-circle-catering-2',
  'chefs-selection': 'close-circle-catering-3',
  'chef-s-selection': 'close-circle-catering-3',
  'chefs-choice': 'close-circle-catering-3',
  'chef-s-choice': 'close-circle-catering-3',
  'chef-choice': 'close-circle-catering-3',
  'signature-hosting': 'signature-hosting-package',
  'easy-hosting': 'easy-hosting-simply-served-1',
  'easy-hosting-1': 'easy-hosting-simply-served-1',
  'simply-served': 'easy-hosting-simply-served-2',
  'simply-served-1': 'easy-hosting-simply-served-2',
  'easy-hosting-2': 'easy-hosting-simply-served-2',
}

export function resolveCateringCatalogSlug(slug) {
  const key = normalizeValue(slug)
  if (!key) return ''
  return CATERING_SLUG_ALIASES[key] || key
}

/** Listing Level 1/2/3: catering tier first (essentials/assisted/end_to_end), then budget_level. */
function getCateringCmsLevel(pkg) {
  const fromCateringLevel = inferLevelSlugFromCateringLevel(pkg?.catering_level)
  if (fromCateringLevel) return fromCateringLevel

  const fromLevelSlug = normalizeLevelSlug(pkg?.level_slug)
  if (/^level-\d+$/.test(fromLevelSlug)) return fromLevelSlug
  return ''
}

function packageMatchesLevelFilter(pkg, { levelSlug = '', levelId = '', serviceSlug = '' } = {}) {
  if (!levelSlug && !levelId) return true

  const normalizedService = normalizeServiceSlug(serviceSlug)
  if (normalizedService === 'catering') {
    const cmsLevel = getCateringCmsLevel(pkg)
    if (!cmsLevel) return false
    if (!levelSlug) return true
    return normalizeLevelSlug(levelSlug) === cmsLevel
  }

  const normalizedFilterSlug = normalizeLevelSlug(levelSlug)
  const normalizedPackageSlug = normalizeLevelSlug(pkg?.level_slug)
  const slugMatch = Boolean(
    normalizedFilterSlug && normalizedPackageSlug && normalizedFilterSlug === normalizedPackageSlug
  )
  const idMatch = Boolean(
    levelId && pkg?.level_id && normalizeValue(pkg.level_id) === normalizeValue(levelId)
  )

  return slugMatch || idMatch
}

/** Split an already event/theme-filtered decor list by budget level (no re-applying event/theme). */
export function filterPackagesByBudgetLevel(packages, { levelSlug = '', levelId = '' } = {}) {
  return (Array.isArray(packages) ? packages : []).filter(pkg =>
    packageMatchesLevelFilter(pkg, { levelSlug, levelId, serviceSlug: 'decor' })
  )
}

/** Amazon-style Min / Max price filter using package base_price. */
export function parsePriceFilterValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const amount = Number(raw.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(amount) || amount < 0) return null
  return amount
}

export function filterPackagesByPriceRange(packages, { minPrice = null, maxPrice = null } = {}) {
  const hasMin = minPrice != null && Number.isFinite(minPrice)
  const hasMax = maxPrice != null && Number.isFinite(maxPrice)
  if (!hasMin && !hasMax) return Array.isArray(packages) ? packages : []

  let low = hasMin ? minPrice : null
  let high = hasMax ? maxPrice : null
  if (low != null && high != null && low > high) {
    const swap = low
    low = high
    high = swap
  }

  return (Array.isArray(packages) ? packages : []).filter(pkg => {
    const price = Number(pkg?.base_price ?? 0)
    if (low != null && price < low) return false
    if (high != null && price > high) return false
    return true
  })
}

function packageHasServiceSlug(pkg, serviceSlug) {
  const normalized = normalizeServiceSlug(serviceSlug)
  if (!normalized) return false
  return (Array.isArray(pkg?.service_slugs) ? pkg.service_slugs : []).some(
    value => normalizeServiceSlug(value) === normalized
  )
}

function resolvePackagePrimaryServiceSlug(pkg) {
  const slugs = (Array.isArray(pkg?.service_slugs) ? pkg.service_slugs : [])
    .map(normalizeServiceSlug)
    .filter(Boolean)
  const preferred = ['rental-furniture', 'catering', 'bartending', 'sheesha', 'decor']
  for (const slug of preferred) {
    if (slugs.includes(slug)) return slug
  }
  return slugs[0] || ''
}

/**
 * Sheesha / catering / bartending packages are offered across Social + Corporate.
 * Until every package is fully event-linked in CMS, keep them visible under those
 * categories instead of hiding them behind incomplete event relations.
 */
const UNIVERSAL_OCCASION_SERVICE_SLUGS = new Set([
  'sheesha',
  'catering',
  'bartending',
  'rental-furniture',
])

function servicePassesOccasionFilters(pkg, { categorySlug = '', eventSlug = '', eventId = '' } = {}) {
  const isUniversalService = [...UNIVERSAL_OCCASION_SERVICE_SLUGS].some(slug =>
    packageHasServiceSlug(pkg, slug)
  )
  if (!isUniversalService) return false

  const category = normalizeValue(categorySlug)
  if (category === 'religious') return false
  if (category && category !== 'social' && category !== 'corporate') return false

  // Event selection is allowed for UX, but does not exclude these service packages.
  void eventSlug
  void eventId
  return true
}

const normalizeList = values =>
  (Array.isArray(values) ? values : []).map(value => normalizeValue(value)).filter(Boolean)

function getPackageKey(pkg) {
  return String(pkg?.documentId ?? pkg?.id ?? '').trim()
}

function isSamePackage(left, right) {
  const leftKey = getPackageKey(left)
  const rightKey = getPackageKey(right)
  return Boolean(leftKey && rightKey && leftKey === rightKey)
}

function listsOverlap(leftValues, rightValues) {
  const rightSet = new Set(normalizeList(rightValues))
  return normalizeList(leftValues).some(value => rightSet.has(value))
}

function getCategoryMatchScore(currentPkg, candidatePkg) {
  let score = 0

  if (listsOverlap(currentPkg?.event_slugs, candidatePkg?.event_slugs)) score += 4
  if (listsOverlap(currentPkg?.event_ids, candidatePkg?.event_ids)) score += 4
  if (listsOverlap(currentPkg?.category_slugs, candidatePkg?.category_slugs)) score += 2
  if (listsOverlap(currentPkg?.category_ids, candidatePkg?.category_ids)) score += 2

  const currentCategory = normalizeValue(currentPkg?.category)
  const candidateCategory = normalizeValue(candidatePkg?.category)
  if (currentCategory && candidateCategory && currentCategory === candidateCategory) {
    score += 1
  }

  return score
}

function sharesEventCategory(currentPkg, candidatePkg) {
  return getCategoryMatchScore(currentPkg, candidatePkg) > 0
}

function matchesServiceSlug(pkg, serviceSlug) {
  const normalizedServiceSlug = normalizeServiceSlug(serviceSlug)
  if (!normalizedServiceSlug) return true

  return (Array.isArray(pkg?.service_slugs) ? pkg.service_slugs : []).some(
    slug => normalizeServiceSlug(slug) === normalizedServiceSlug
  )
}

export function getRelatedPackages(allPackages, currentPkg, options = {}) {
  const { limit = 12, serviceSlug = '', matchesPackage = () => true } = options
  const packages = (Array.isArray(allPackages) ? allPackages : []).filter(matchesPackage)
  const candidates = packages.filter(pkg => !isSamePackage(pkg, currentPkg))

  const scorePackage = pkg => {
    let score = getCategoryMatchScore(currentPkg, pkg)
    if (matchesServiceSlug(pkg, serviceSlug)) score += 1
    return score
  }

  const categoryMatches = candidates
    .filter(pkg => sharesEventCategory(currentPkg, pkg))
    .sort((left, right) => scorePackage(right) - scorePackage(left))

  if (categoryMatches.length > 0) {
    return categoryMatches.slice(0, limit).map(pkg => ({
      ...pkg,
      serviceSlug: pkg.serviceSlug || pkg.service_slugs?.[0] || serviceSlug || '',
    }))
  }

  const serviceFallback = candidates
    .filter(pkg => matchesServiceSlug(pkg, serviceSlug))
    .slice(0, limit)

  return serviceFallback.map(pkg => ({
    ...pkg,
    serviceSlug: pkg.serviceSlug || pkg.service_slugs?.[0] || serviceSlug || '',
  }))
}

function pickDistinctCoverIndex(images, position, packageIndex, blockedUrls) {
  if (!images.length) return 0

  const start = (position + Number(packageIndex ?? position)) % images.length
  const orderedIndexes = images.map((_, index) => (start + index) % images.length)

  for (const index of orderedIndexes) {
    const url = images[index]
    if (!blockedUrls.has(url)) return index
  }

  return start
}

export function assignDistinctCoverIndices(packages, options = {}) {
  const columns = Math.max(1, Number(options.columns ?? 3))
  const coverUrlByPosition = []

  return (Array.isArray(packages) ? packages : []).map((pkg, position) => {
    const images = (Array.isArray(pkg?.images) ? pkg.images : []).filter(Boolean)

    if (!images.length) {
      return { ...pkg, coverImageIndex: 0 }
    }

    const blockedUrls = new Set()

    if (position > 0 && coverUrlByPosition[position - 1]) {
      blockedUrls.add(coverUrlByPosition[position - 1])
    }

    const abovePosition = position - columns
    if (abovePosition >= 0 && coverUrlByPosition[abovePosition]) {
      blockedUrls.add(coverUrlByPosition[abovePosition])
    }

    const coverImageIndex = pickDistinctCoverIndex(
      images,
      position,
      pkg._index ?? pkg.id,
      blockedUrls
    )

    coverUrlByPosition[position] = images[coverImageIndex]

    return { ...pkg, coverImageIndex }
  })
}

export const normalizeServiceSlug = value => {
  const normalized = normalizeValue(value)
  if (normalized === 'bar-tending') return 'bartending'
  if (normalized === 'sheesha-services') return 'sheesha'
  if (normalized === 'decoration') return 'decor'
  if (normalized === 'furniture') return 'rental-furniture'
  if (normalized === 'decor-services') return 'decor'
  return normalized
}

/** Map CMS slug variants → product slug (birthday-celebrations → birthday-parties). */
const EVENT_SLUG_ALIASES = {
  anniversary: 'anniversary',
  anniversaries: 'anniversary',
  'anniversary-celebrations': 'anniversary',
  mehndi: 'mehendi',
  proposals: 'proposal',
  'bachelors-bachelorette': 'bachelors',
  bachelorette: 'bachelors',
  bachelor: 'bachelors',
  'birthday-celebrations': 'birthday-parties',
  birthday: 'birthday-parties',
  'birthday-party': 'birthday-parties',
  'house-party': 'house-parties',
  'baby-showers': 'baby-shower',
  'bridal-showers': 'bridal-shower',
  'diwali-parties': 'diwali-party',
  weddings: 'wedding',
  'exhibition-stall': 'exhibition-stalls',
  exhibition: 'exhibition-stalls',
  seminar: 'seminar-conference',
  conference: 'seminar-conference',
  'seminar-conferences': 'seminar-conference',
  'seminars-conferences': 'seminar-conference',
  pooja: 'pooja-kirtan',
  kirtan: 'pooja-kirtan',
  'pooja-events': 'pooja-kirtan',
  'pooja-event': 'pooja-kirtan',
  'pujas-festivals': 'pooja-kirtan',
  'pujas-and-festivals': 'pooja-kirtan',
  'puja-kirtan': 'pooja-kirtan',
}

export function canonicalizeEventSlug(slug) {
  const normalized = normalizeValue(slug)
  if (!normalized) return ''
  return EVENT_SLUG_ALIASES[normalized] ?? normalized
}

export function eventSlugsMatch(left, right) {
  const a = canonicalizeEventSlug(left)
  const b = canonicalizeEventSlug(right)
  if (!a || !b) return false
  if (a === b) return true
  const aToken = a.split('-')[0]
  const bToken = b.split('-')[0]
  return Boolean(aToken && aToken === bToken)
}

const CORPORATE_CONSULTATION_EVENT_SLUGS = new Set(['exhibition-stalls', 'seminar-conference'])

/** Corporate exhibition / seminar decor — derived from CMS event links, not slug lists. */
export function isCorporateDecorPackage(pkg) {
  if (!pkg) return false

  const eventSlugs = Array.isArray(pkg.event_slugs) ? pkg.event_slugs : []
  return eventSlugs.some(slug => CORPORATE_CONSULTATION_EVENT_SLUGS.has(canonicalizeEventSlug(slug)))
}

const includesNormalized = (values, target) => {
  const normalizedTarget = normalizeValue(target)
  if (!normalizedTarget) return true

  return (Array.isArray(values) ? values : []).some(
    value => normalizeValue(value) === normalizedTarget
  )
}

const includesEventSlug = (values, target) => {
  const normalizedTarget = normalizeValue(target)
  if (!normalizedTarget) return true

  return (Array.isArray(values) ? values : []).some(value =>
    eventSlugsMatch(value, normalizedTarget)
  )
}

function slugifyThemeValue(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getThemeSlugVariants(theme) {
  return [
    ...new Set(
      [
        normalizeValue(theme?.slug),
        slugifyThemeValue(theme?.slug),
        slugifyThemeValue(theme?.label),
      ].filter(Boolean)
    ),
  ]
}

function collectThemeSlugsFromPackages(packages) {
  const slugs = new Set()

  for (const pkg of packages) {
    for (const slug of pkg?.theme_slugs ?? []) {
      const canonical = slugifyThemeValue(slug)
      if (canonical) slugs.add(canonical)
    }
  }

  return slugs
}

function dedupeThemesBySlug(themes) {
  const seen = new Set()

  return (Array.isArray(themes) ? themes : []).filter(theme => {
    const key = normalizeThemeSlug(theme?.slug)
    const canonicalKey = DECOR_THEME_ALLOWLIST_ALIASES[key] ?? key
    if (!canonicalKey || seen.has(canonicalKey)) return false
    seen.add(canonicalKey)
    return true
  })
}

function themeMatchesSlugSet(theme, usedSlugs) {
  const variants = getThemeSlugVariants(theme).map(variant => slugifyThemeValue(variant)).filter(Boolean)

  if (variants.some(variant => usedSlugs.has(variant))) return true

  // Parent picker themes (still-us) match when packages only store child slugs.
  return variants.some(variant => {
    for (const expandedSlug of expandThemeFilterSlugs(variant)) {
      if (usedSlugs.has(expandedSlug)) return true
    }
    return false
  })
}


/** Never show General Pack theme or its decor packages (mehendi only). */
const EVENTS_WITHOUT_GENERAL_PACK_CATALOG = new Set(['mehendi'])

/** Bridal / Diwali: theme step shows General Pack only; packages appear after theme selection. */
const GENERAL_PACK_THEME_ONLY_EVENT_SLUGS = new Set(['bridal-shower', 'diwali-party'])

function eventBlocksGeneralPackCatalog(eventSlug = '') {
  return EVENTS_WITHOUT_GENERAL_PACK_CATALOG.has(canonicalizeEventSlug(eventSlug))
}

function eventUsesGeneralPackThemeOnly(eventSlug = '') {
  return GENERAL_PACK_THEME_ONLY_EVENT_SLUGS.has(canonicalizeEventSlug(eventSlug))
}

/** Events that must pick a decor theme before the levels/packages grid. */
const DECOR_EVENTS_REQUIRING_THEME_SELECTION = new Set([
  'anniversary',
  'house-parties',
  'baby-shower',
  'birthday-parties',
  'bridal-shower',
  'diwali-party',
])

function eventRequiresDecorThemeSelection(eventSlug = '') {
  if (eventUsesGeneralPackThemeOnly(eventSlug)) return true
  return DECOR_EVENTS_REQUIRING_THEME_SELECTION.has(canonicalizeEventSlug(eventSlug))
}

export function requiresDecorThemeSelection(eventSlug = '') {
  return eventRequiresDecorThemeSelection(eventSlug)
}

export function requiresGeneralPackThemeSelection(eventSlug = '') {
  return eventUsesGeneralPackThemeOnly(eventSlug)
}

const DECOR_THEME_ALLOWLIST_ALIASES = {
  'general-pack': 'birthday-party',
  'bubbles-black-tie': 'bubbles-and-black-tie',
  'bubbles-and-black-tie-1': 'bubbles-and-black-tie',
  'little-honey': 'a-little-honey',
  'ishq-sufiyana': 'sufi-night',
  'oh-baby-basics': 'oh-baby',
}

/**
 * Parent picker themes -> child package theme slugs (CMS may link the child only).
 * URL/parent theme matching only — not a package catalog.
 */
const THEME_PARENT_CHILD_SLUGS = {
  'still-us': [
    'table-stories',
    'floating-moments',
    'first-date',
    'our-private-corner',
    'under-the-stars',
    'all-that-matters',
    'signature-essentials',
  ],
  'bubbles-and-black-tie': ['golden-touch', 'social-setup', 'complete-package'],
  pastel: [
    'delilah',
    'floral-firsts',
    'pastel-pop',
    'under-the-lights-canopy',
    'pretty-in-pastel',
    'starlit-spirits',
    'words-we-keep',
    'sip-and-slove',
    'bloom-bar',
  ],
  bohemian: [
    'signs-and-stems',
    'pampous-play',
    'less-is-more',
    'perch-and-pour',
    'cozy-canopy',
    'picnic-a-la-boho',
    'vintage-vines',
    'catching-dreams',
  ],
  'a-little-honey': ['buzzing-welcome', 'little-stroll', 'honey-hive', 'little-honey'],
  'little-honey': ['buzzing-welcome', 'little-stroll', 'honey-hive', 'a-little-honey'],
  'oh-baby': ['oh-baby-basics', 'baby-in-bloom', 'up-up-and-baby', 'baby-shower'],
  'sufi-night': ['ishq-sufiyana'],
  'ishq-sufiyana': ['sufi-night'],
  'house-party': ['house-party', 'house-parties'],
  'house-parties': ['house-party', 'house-parties'],
  'birthday-party': [
    'general-pack',
    'phool-proof',
    'air-we-go',
    'the-first-layer',
    'raise-the-bar',
    'just-enough-magic',
    'party-smart',
    'aarambh',
    'aura-upgrade',
    'birthday-parties',
  ],
  'birthday-parties': [
    'general-pack',
    'phool-proof',
    'air-we-go',
    'the-first-layer',
    'raise-the-bar',
    'just-enough-magic',
    'party-smart',
    'aarambh',
    'aura-upgrade',
    'birthday-party',
  ],
  'the-walk-to-forever': [
    'the-walk-to-forever',
    'the-walk-to-forever-2',
    'the-walk-to-forever-3',
  ],
  'the-proposal-spotlight': [
    'the-proposal-spotlight-1',
    'the-proposal-spotlight-2',
    'the-proposal-spotlight-3',
  ],
  'our-story': ['our-story'],
  'our-private-corner': ['our-private-corner-2', 'our-private-corner-3'],
}

function isGeneralPackThemeSlug(themeSlug = '') {
  const normalized = normalizeThemeSlug(themeSlug)
  if (!normalized) return false

  if (
    normalized === 'birthday-party' ||
    normalized === 'birthday-parties' ||
    normalized === 'general-pack'
  ) {
    return true
  }

  const aliased = DECOR_THEME_ALLOWLIST_ALIASES[normalized]
  return aliased ? isGeneralPackThemeSlug(aliased) : false
}

function resolvePackageThemeFilterSlug(themeSlug = '') {
  const normalized = normalizeThemeSlug(themeSlug)
  const aliased = DECOR_THEME_ALLOWLIST_ALIASES[normalized]
  return aliased ? normalizeThemeSlug(aliased) : normalized
}

/** Expand a theme filter slug to every slug that should count as a match. */
export function expandThemeFilterSlugs(themeSlug = '') {
  const normalized = normalizeThemeSlug(resolvePackageThemeFilterSlug(themeSlug))
  if (!normalized) return new Set()

  const expanded = new Set([normalized])
  const aliased = DECOR_THEME_ALLOWLIST_ALIASES[normalized]
  if (aliased) expanded.add(normalizeThemeSlug(aliased))

  for (const [alias, canonical] of Object.entries(DECOR_THEME_ALLOWLIST_ALIASES)) {
    if (normalizeThemeSlug(canonical) === normalized) expanded.add(normalizeThemeSlug(alias))
  }

  for (const key of [...expanded]) {
    for (const child of THEME_PARENT_CHILD_SLUGS[key] ?? []) {
      const childSlug = normalizeThemeSlug(child)
      if (childSlug) expanded.add(childSlug)
    }
  }

  for (const key of [...expanded]) {
    const aliasedKey = DECOR_THEME_ALLOWLIST_ALIASES[key]
    if (aliasedKey) expanded.add(normalizeThemeSlug(aliasedKey))

    for (const [alias, canonical] of Object.entries(DECOR_THEME_ALLOWLIST_ALIASES)) {
      if (normalizeThemeSlug(canonical) === key) expanded.add(normalizeThemeSlug(alias))
    }
  }

  return expanded
}

/** True when package theme_slugs match the selected theme (including parent->child). */
export function packageThemeSlugsMatchFilter(packageThemeSlugs, themeSlug = '') {
  const filterSlugs = expandThemeFilterSlugs(themeSlug)
  if (!filterSlugs.size) return true

  const packageSlugs = (Array.isArray(packageThemeSlugs) ? packageThemeSlugs : [])
    .map(value => normalizeThemeSlug(value))
    .filter(Boolean)

  if (!packageSlugs.length) return false

  return packageSlugs.some(packageSlug => {
    if (filterSlugs.has(packageSlug)) return true

    for (const filterSlug of filterSlugs) {
      if (packageSlug.startsWith(`${filterSlug}-`)) {
        return true
      }
    }

    return false
  })
}

function packageBelongsToGeneralPackCatalog(pkg) {
  const themeSlugs = Array.isArray(pkg?.theme_slugs) ? pkg.theme_slugs : []
  if (!themeSlugs.length) return false
  return packageThemeSlugsMatchFilter(themeSlugs, 'birthday-party')
}

function themeIsGeneralPackCatalog(theme) {
  const generalPackSlugs = expandThemeFilterSlugs('birthday-party')
  return getThemeSlugVariants(theme).some(variant => generalPackSlugs.has(slugifyThemeValue(variant)))
}

function themeIsHouseParty(theme) {
  return getThemeSlugVariants(theme).some(variant => {
    const normalized = slugifyThemeValue(variant)
    return normalized === 'house-party' || normalized === 'house-parties'
  })
}

function applyEventThemePickerRules(themes, eventSlug = '') {
  return dedupeThemesBySlug(themes).filter(theme => {
    if (eventBlocksGeneralPackCatalog(eventSlug) && themeIsGeneralPackCatalog(theme)) {
      return false
    }
    if (eventUsesGeneralPackThemeOnly(eventSlug) && themeIsHouseParty(theme)) {
      return false
    }
    return true
  })
}

/** Social decor theme pickers — themes from Strapi packages for this event. */
export function filterDecorThemesBySocialEvent(themes, eventSlug = '', packages = []) {
  const allThemes = applyEventThemePickerRules(themes, eventSlug)
  const packageList = Array.isArray(packages) ? packages : []
  if (!eventSlug || !packageList.length) return allThemes

  const matchingPackages = filterPackages(packageList, {
    categorySlug: '',
    eventSlug,
    eventId: '',
    serviceSlug: 'decor',
    serviceId: '',
    themeSlug: '',
    levelSlug: '',
    levelId: '',
  })

  const usedThemeSlugs = collectThemeSlugsFromPackages(matchingPackages)
  if (!usedThemeSlugs.size) return allThemes

  const fromPackages = allThemes.filter(theme => themeMatchesSlugSet(theme, usedThemeSlugs))
  return fromPackages.length > 0 ? fromPackages : allThemes
}

/** Prefer themes linked on packages for this event. */
export function filterThemesByEventPackages(themes, packages, filters = {}) {
  const allThemes = applyEventThemePickerRules(themes, filters.eventSlug ?? '')

  const matchingPackages = filterPackages(packages, {
    categorySlug: filters.categorySlug ?? '',
    eventSlug: filters.eventSlug ?? '',
    eventId: filters.eventId ?? '',
    serviceSlug: filters.serviceSlug ?? 'decor',
    serviceId: filters.serviceId ?? '',
    themeSlug: '',
    levelSlug: '',
    levelId: '',
  })

  const usedThemeSlugs = collectThemeSlugsFromPackages(matchingPackages)

  if (eventUsesGeneralPackThemeOnly(filters.eventSlug ?? '')) {
    const generalThemes = allThemes.filter(theme => themeIsGeneralPackCatalog(theme))
    return generalThemes.length > 0 ? generalThemes : allThemes
  }

  if (!usedThemeSlugs.size) return allThemes

  const fromPackages = allThemes.filter(theme => themeMatchesSlugSet(theme, usedThemeSlugs))
  return fromPackages.length > 0 ? fromPackages : allThemes
}

export function filterPackages(packages, filters = {}) {
  const {
    categorySlug = '',
    eventSlug = '',
    eventId = '',
    serviceSlug = '',
    serviceId = '',
    themeSlug = '',
    levelSlug = '',
    levelId = '',
  } = filters

  const normalizedServiceSlug = normalizeServiceSlug(serviceSlug)
  const canonicalEventSlug = canonicalizeEventSlug(eventSlug)

  return (Array.isArray(packages) ? packages : []).filter(pkg => {
    if (
      normalizedServiceSlug === 'decor' &&
      eventBlocksGeneralPackCatalog(canonicalEventSlug) &&
      packageBelongsToGeneralPackCatalog(pkg)
    ) {
      return false
    }

    if (
      normalizedServiceSlug === 'decor' &&
      eventUsesGeneralPackThemeOnly(canonicalEventSlug) &&
      packageBelongsToGeneralPackCatalog(pkg) &&
      !isGeneralPackThemeSlug(themeSlug)
    ) {
      return false
    }

    if (
      normalizedServiceSlug === 'decor' &&
      canonicalEventSlug === 'proposal' &&
      packageBelongsToGeneralPackCatalog(pkg)
    ) {
      return false
    }

    const categoryMatched = includesNormalized(pkg.category_slugs, categorySlug)
    const eventMatched =
      !eventSlug && !eventId
        ? true
        : (eventId ? includesNormalized(pkg.event_ids, eventId) : false) ||
          (eventSlug ? includesEventSlug(pkg.event_slugs, eventSlug) : false)

    if (!categoryMatched || !eventMatched) {
      if (normalizedServiceSlug === 'decor') {
        return false
      }
      if (!servicePassesOccasionFilters(pkg, { categorySlug, eventSlug, eventId })) {
        return false
      }
    }

    if (normalizedServiceSlug && !packageHasServiceSlug(pkg, normalizedServiceSlug)) {
      return false
    }

    const packageServiceIds = Array.isArray(pkg.service_ids) ? pkg.service_ids.filter(Boolean) : []
    if (serviceId && packageServiceIds.length && !includesNormalized(packageServiceIds, serviceId)) {
      const serviceLaneMatched =
        Boolean(normalizedServiceSlug) &&
        (Array.isArray(pkg?.service_slugs) ? pkg.service_slugs : []).some(
          value => normalizeServiceSlug(value) === normalizedServiceSlug
        )
      if (!serviceLaneMatched) return false
    }

    if (normalizedServiceSlug === 'catering') {
      const cmsLevel = getCateringCmsLevel(pkg)
      if (levelSlug) {
        if (!cmsLevel || normalizeLevelSlug(levelSlug) !== cmsLevel) return false
      }
      return true
    }

    if (normalizedServiceSlug === 'decor' && packageHasServiceSlug(pkg, 'rental-furniture')) {
      return false
    }

    const packageThemeSlugs = Array.isArray(pkg.theme_slugs) ? pkg.theme_slugs : []
    if (themeSlug && !packageThemeSlugsMatchFilter(packageThemeSlugs, themeSlug)) {
      return false
    }

    const skipLevelFilter =
      normalizedServiceSlug === 'bartending' || normalizedServiceSlug === 'sheesha'
    if (
      !skipLevelFilter &&
      !packageMatchesLevelFilter(pkg, { levelSlug, levelId, serviceSlug: normalizedServiceSlug })
    ) {
      return false
    }
    return true
  })
}

/** True when at least one package matches this event under the supplied lane filters. */
export function eventHasPackages(packages, event, filters = {}) {
  const eventSlug = String(event?.slug ?? event?.value ?? '').trim()
  const eventId = event?.id != null ? String(event.id) : ''

  if (!eventSlug && !eventId) return false

  return (
    filterPackages(packages, {
      categorySlug: filters.categorySlug ?? '',
      serviceSlug: filters.serviceSlug ?? '',
      serviceId: filters.serviceId ?? '',
      themeSlug: filters.themeSlug ?? '',
      levelSlug: filters.levelSlug ?? '',
      levelId: filters.levelId ?? '',
      eventSlug,
      eventId,
    }).length > 0
  )
}

/** Drop events that would produce an empty package listing for the current lane filters. */
export function filterEventsWithPackages(events, packages, filters = {}) {
  return (Array.isArray(events) ? events : []).filter(event =>
    eventHasPackages(packages, event, filters)
  )
}
