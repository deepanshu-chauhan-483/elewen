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
  return getThemeSlugVariants(theme).some(variant => usedSlugs.has(variant))
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
    if (themeSlug) {
      if (!packageThemeSlugs.length) return false

      const normalizedThemeFilter = normalizeThemeSlug(themeSlug)
      const themeMatched = packageThemeSlugs.some(
        value => normalizeThemeSlug(value) === normalizedThemeFilter
      )
      if (!themeMatched) return false
    }
    if (!packageMatchesLevelFilter(pkg, { levelSlug, levelId })) return false
    return true
  })
}
