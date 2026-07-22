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

function packageMatchesLevelFilter(pkg, { levelSlug = '', levelId = '' } = {}) {
  if (!levelSlug && !levelId) return true

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
  weddings: 'wedding',
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
    const key = slugifyThemeValue(theme?.slug)
    if (!key || seen.has(key)) return false
    seen.add(key)
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

/** House Party / Birthday Party — shown on every social decor event. */
const UNIVERSAL_SOCIAL_DECOR_THEME_SLUGS = [
  'house-party',
  'house-parties',
  'birthday-party',
  'birthday-parties',
]

/** Extra themes per event (plus universal themes above). */
const SOCIAL_EVENT_DECOR_THEME_SLUGS = {
  anniversary: ['still-us', 'bubbles-and-black-tie'],
  'house-parties': ['house-party', 'house-parties'],
  'birthday-parties': [
    'birthday-party',
    'birthday-parties',
    'bubbles-and-black-tie',
    'bohemian',
    'pastel',
  ],
  'baby-shower': ['a-little-honey', 'little-honey', 'oh-baby'],
  engagement: ['sufi-night', 'ishq-sufiyana'],
  proposal: [
    'the-walk-to-forever',
    'the-proposal-spotlight',
    'our-story',
    'our-private-corner',
  ],
}

/** Social decor events that use only their own theme set — no house/birthday universal themes. */
const EVENTS_EXCLUDING_UNIVERSAL_DECOR_THEMES = new Set([
  'proposal',
  'house-parties',
  'birthday-parties',
  'bachelors',
])

const DECOR_THEME_ALLOWLIST_ALIASES = {
  'bubbles-black-tie': 'bubbles-and-black-tie',
  'little-honey': 'a-little-honey',
  'ishq-sufiyana': 'sufi-night',
  'oh-baby-basics': 'oh-baby',
}

/**
 * Parent picker themes → child package theme slugs (seed / CMS often link the child only).
 * Filtering by the parent must still match those packages.
 */
const THEME_PARENT_CHILD_SLUGS = {
  'still-us': [
    'table-stories',
    'floating-moments',
    'first-date',
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
  'house-party': [
    'phool-proof',
    'air-we-go',
    'the-first-layer',
    'raise-the-bar',
    'just-enough-magic',
    'party-smart',
    'aarambh',
    'aura-upgrade',
    'house-parties',
    'birthday-party',
    'birthday-parties',
  ],
  'house-parties': [
    'phool-proof',
    'air-we-go',
    'the-first-layer',
    'raise-the-bar',
    'just-enough-magic',
    'party-smart',
    'aarambh',
    'aura-upgrade',
    'house-party',
    'birthday-party',
    'birthday-parties',
  ],
  'birthday-party': [
    'phool-proof',
    'air-we-go',
    'the-first-layer',
    'raise-the-bar',
    'just-enough-magic',
    'party-smart',
    'aarambh',
    'aura-upgrade',
    'house-party',
    'house-parties',
    'birthday-parties',
  ],
  'birthday-parties': [
    'phool-proof',
    'air-we-go',
    'the-first-layer',
    'raise-the-bar',
    'just-enough-magic',
    'party-smart',
    'aarambh',
    'aura-upgrade',
    'house-party',
    'house-parties',
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

/** Expand a theme filter slug to every slug that should count as a match. */
export function expandThemeFilterSlugs(themeSlug = '') {
  const normalized = normalizeThemeSlug(themeSlug)
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

  return expanded
}

/** True when package theme_slugs match the selected theme (including parent→child). */
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
      if (
        packageSlug.startsWith(`${filterSlug}-`) ||
        filterSlug.startsWith(`${packageSlug}-`)
      ) {
        return true
      }
    }

    return false
  })
}

function buildAllowedSocialDecorThemeSlugSet(eventSlug = '') {
  const canonicalEventSlug = canonicalizeEventSlug(eventSlug)

  const allowed = new Set()

  if (!EVENTS_EXCLUDING_UNIVERSAL_DECOR_THEMES.has(canonicalEventSlug)) {
    for (const slug of UNIVERSAL_SOCIAL_DECOR_THEME_SLUGS) {
      const normalized = slugifyThemeValue(slug)
      if (normalized) allowed.add(normalized)
    }
  }

  for (const slug of SOCIAL_EVENT_DECOR_THEME_SLUGS[canonicalEventSlug] ?? []) {
    const normalized = slugifyThemeValue(slug)
    if (normalized) allowed.add(normalized)
  }

  return allowed
}

function themeSlugMatchesAllowlist(normalizedThemeSlug, allowedSlugs) {
  if (!normalizedThemeSlug) return false
  if (allowedSlugs.has(normalizedThemeSlug)) return true

  const canonicalSlug = DECOR_THEME_ALLOWLIST_ALIASES[normalizedThemeSlug]
  if (canonicalSlug && allowedSlugs.has(canonicalSlug)) return true

  for (const allowedSlug of allowedSlugs) {
    const canonicalAllowed = DECOR_THEME_ALLOWLIST_ALIASES[allowedSlug] ?? allowedSlug
    if (
      normalizedThemeSlug === canonicalAllowed ||
      normalizedThemeSlug.startsWith(`${canonicalAllowed}-`)
    ) {
      return true
    }
  }

  return false
}

function themeMatchesAllowedSet(theme, allowedSlugs) {
  return getThemeSlugVariants(theme).some(variant =>
    themeSlugMatchesAllowlist(slugifyThemeValue(variant), allowedSlugs)
  )
}

/** Restrict social decor theme pickers to event-specific + universal general-pack themes. */
export function filterDecorThemesBySocialEvent(themes, eventSlug = '') {
  const allowedSlugs = buildAllowedSocialDecorThemeSlugSet(eventSlug)
  return dedupeThemesBySlug(themes).filter(theme => themeMatchesAllowedSet(theme, allowedSlugs))
}

/** Prefer themes linked on packages for this event; if none linked, show all CMS themes. */
export function filterThemesByEventPackages(themes, packages, filters = {}) {
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
  const allThemes = dedupeThemesBySlug(Array.isArray(themes) ? themes : [])

  // No package↔theme links for this event yet — still show the full theme list.
  if (!usedThemeSlugs.size) return allThemes

  const scoped = allThemes.filter(theme => themeMatchesSlugSet(theme, usedThemeSlugs))
  return scoped.length > 0 ? scoped : allThemes
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

  return (Array.isArray(packages) ? packages : []).filter(pkg => {
    if (!includesNormalized(pkg.category_slugs, categorySlug)) return false
    // ID and slug can disagree (CMS birthday-celebrations vs URL birthday-parties) — OR them.
    if (eventSlug || eventId) {
      const byId = eventId ? includesNormalized(pkg.event_ids, eventId) : false
      const bySlug = eventSlug ? includesEventSlug(pkg.event_slugs, eventSlug) : false
      if (!(byId || bySlug)) return false
    }
    const serviceSlugs = Array.isArray(pkg.service_slugs) ? pkg.service_slugs : []
    if (
      normalizedServiceSlug &&
      !serviceSlugs.some(value => normalizeServiceSlug(value) === normalizedServiceSlug)
    ) {
      return false
    }
    const packageServiceIds = Array.isArray(pkg.service_ids) ? pkg.service_ids.filter(Boolean) : []
    if (serviceId && packageServiceIds.length && !includesNormalized(packageServiceIds, serviceId)) {
      const serviceLaneMatched =
        Boolean(normalizedServiceSlug) &&
        serviceSlugs.some(value => normalizeServiceSlug(value) === normalizedServiceSlug)
      if (!serviceLaneMatched) return false
    }
    const packageThemeSlugs = Array.isArray(pkg.theme_slugs) ? pkg.theme_slugs : []
    if (themeSlug && !packageThemeSlugsMatchFilter(packageThemeSlugs, themeSlug)) {
      return false
    }
    if (!packageMatchesLevelFilter(pkg, { levelSlug, levelId })) return false
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
