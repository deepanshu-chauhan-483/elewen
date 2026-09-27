import { canonicalizeEventSlug, normalizeServiceSlug } from './packageFilters'
import {
  isCatalogSkipThemeEvent,
  isLegacyDecorThemeCatalog,
  isWordDocDecorThemeCatalog,
  resolveDecorEventFlow,
} from './decorEventThemeCatalog'

/** Events that show the coming-soon fallback instead of package listings. */
const FALLBACK_ONLY_EVENT_SLUGS = new Set(['corporate-get-together', 'house-warming', 'diwali-party'])

/**
 * Legacy consultation set — restored when VITE_DECOR_THEME_CATALOG=legacy.
 * Word-doc mode uses decorEventThemeCatalog instead (adds mehendi; wedding/engagement → unavailable).
 */
const CONSULTATION_ONLY_EVENT_SLUGS = new Set([
  'engagement',
  'sufi-night',
  'haldi',
  'wedding',
])

export const BOOK_CONSULTATION_PATH = '/book-consultation'

/** Build /book-consultation URL with optional package interest query params. */
export function buildBookConsultationPath({
  packageId,
  packageTitle,
  packageSlug,
  source,
} = {}) {
  const params = new URLSearchParams()
  if (packageId != null && String(packageId).trim()) {
    params.set('packageId', String(packageId).trim())
  }
  if (packageSlug != null && String(packageSlug).trim()) {
    params.set('packageSlug', String(packageSlug).trim())
  }
  if (packageTitle != null && String(packageTitle).trim()) {
    params.set('packageTitle', String(packageTitle).trim())
  }
  if (source != null && String(source).trim()) {
    params.set('source', String(source).trim())
  }
  const query = params.toString()
  return query ? `${BOOK_CONSULTATION_PATH}?${query}` : BOOK_CONSULTATION_PATH
}

export function isCorporateCategory(categorySlug = '') {
  return String(categorySlug ?? '')
    .trim()
    .toLowerCase() === 'corporate'
}

/** True when this package is a Corporate event package (not Sheesha/Catering/etc. by service). */
export function isCorporatePackage(pkg = {}) {
  const serviceSlugs = [
    pkg?.serviceSlug,
    ...(Array.isArray(pkg?.service_slugs) ? pkg.service_slugs : []),
  ]
  if (serviceSlugs.some(slug => serviceAlwaysShowsPackagePrice(slug))) return false

  if (isCorporateCategory(pkg?.category)) return true
  if (isCorporateCategory(pkg?.category_slug)) return true

  const slugs = [
    ...(Array.isArray(pkg?.category_slugs) ? pkg.category_slugs : []),
  ]
    .map(value => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)

  return slugs.some(slug => slug === 'corporate')
}

/** Services that should always show listing prices, even under corporate event category. */
export function serviceAlwaysShowsPackagePrice(serviceSlug = '') {
  const normalized = normalizeServiceSlug(serviceSlug)
  return (
    normalized === 'sheesha' ||
    normalized === 'catering' ||
    normalized === 'bartending' ||
    normalized === 'rental-furniture'
  )
}

export function isFallbackOnlyEvent(eventSlug = '') {
  // Diwali stays on this legacy fallback path until the client adds packages.
  if (FALLBACK_ONLY_EVENT_SLUGS.has(canonicalizeEventSlug(eventSlug))) return true

  if (isWordDocDecorThemeCatalog()) {
    return resolveDecorEventFlow(eventSlug) === 'unavailable'
  }

  return false
}

export function isConsultationOnlyEvent(eventSlug = '') {
  if (isLegacyDecorThemeCatalog()) {
    return CONSULTATION_ONLY_EVENT_SLUGS.has(canonicalizeEventSlug(eventSlug))
  }

  return resolveDecorEventFlow(eventSlug) === 'consultation'
}

export const SERVICE_ROUTE_MAP = {
  decor: '/event-flow/decor-theme',
  'rental-furniture': '/packages/rental-furniture',
  catering: '/event-flow/catering-levels',
  bartending: '/packages/bartending',
  'bar-tending': '/packages/bartending',
  sheesha: '/packages/sheesha',
}

export const SERVICE_PAGE_ALLOWED_SLUGS = [
  'decor',
  'catering',
  'bartending',
  'bar-tending',
  'sheesha',
  'sheesha-services',
]

/** Alcohol / hookah services are not offered for religious occasions. */
const RELIGIOUS_EXCLUDED_SERVICE_SLUGS = new Set(['bartending', 'sheesha'])

export function isServiceAllowedForCategory(serviceSlug = '', categorySlug = '') {
  const category = String(categorySlug ?? '')
    .trim()
    .toLowerCase()
  if (category !== 'religious') return true

  const service = normalizeServiceSlug(serviceSlug)
  return Boolean(service) && !RELIGIOUS_EXCLUDED_SERVICE_SLUGS.has(service)
}

export function getServicePageAllowedSlugs(categorySlug = '') {
  const category = String(categorySlug ?? '')
    .trim()
    .toLowerCase()

  if (category !== 'religious') return SERVICE_PAGE_ALLOWED_SLUGS

  return SERVICE_PAGE_ALLOWED_SLUGS.filter(slug => isServiceAllowedForCategory(slug, category))
}

export const SERVICES_FLOW_KEY = 'services'

export const DEFAULT_EVENT_CATEGORY_SLUG = 'social'

export const DECOR_THEME_CATEGORY_SLUG = 'social'

/** Decor theme picker is social-only; other categories skip straight to package levels. */
export function resolveDecorDestination(categorySlug = '') {
  const normalizedCategory = String(categorySlug ?? '')
    .trim()
    .toLowerCase()

  if (normalizedCategory === DECOR_THEME_CATEGORY_SLUG) {
    return '/event-flow/decor-theme'
  }

  return '/packages/decor-levels'
}

export function buildServiceFlowParams({
  categorySlug = '',
  eventSlug = '',
  eventId = '',
  serviceSlug = '',
  serviceId = '',
  flow = '',
}) {
  const params = new URLSearchParams()

  if (categorySlug) params.set('category', categorySlug)
  if (eventSlug) params.set('event', eventSlug)
  if (eventId) params.set('eventId', eventId)

  const normalizedServiceSlug = normalizeServiceSlug(serviceSlug)
  if (normalizedServiceSlug) params.set('service', normalizedServiceSlug)
  if (serviceId) params.set('serviceId', serviceId)
  if (flow) params.set('flow', flow)

  return params
}

export function buildServiceDestination({
  categorySlug = '',
  eventSlug = '',
  eventId = '',
  serviceSlug = '',
  serviceId = '',
  flow = '',
}) {
  if (isFallbackOnlyEvent(eventSlug)) {
    return '/fallback-screen'
  }

  if (isConsultationOnlyEvent(eventSlug)) {
    return BOOK_CONSULTATION_PATH
  }

  const normalizedServiceSlug = normalizeServiceSlug(serviceSlug)
  const params = buildServiceFlowParams({
    categorySlug,
    eventSlug,
    eventId,
    serviceSlug: normalizedServiceSlug,
    serviceId,
    flow,
  })

  let baseRoute =
    SERVICE_ROUTE_MAP[serviceSlug] ?? SERVICE_ROUTE_MAP[normalizedServiceSlug] ?? '/package-listing'

  if (normalizedServiceSlug === 'decor') {
    if (isWordDocDecorThemeCatalog() && isCatalogSkipThemeEvent(eventSlug)) {
      baseRoute = '/packages/decor-levels'
      params.set('skipTheme', '1')
    } else {
      baseRoute = resolveDecorDestination(categorySlug)
    }
  }

  return `${baseRoute}?${params.toString()}`
}

export function buildServicesFlowDestination({ serviceSlug = '', serviceId = '' }) {
  const normalizedServiceSlug = normalizeServiceSlug(serviceSlug)
  const params = buildServiceFlowParams({
    categorySlug: DEFAULT_EVENT_CATEGORY_SLUG,
    serviceSlug: normalizedServiceSlug,
    serviceId,
    flow: SERVICES_FLOW_KEY,
  })

  if (normalizedServiceSlug === 'decor') {
    return `/event-flow/category?${params.toString()}`
  }

  const baseRoute = SERVICE_ROUTE_MAP[normalizedServiceSlug]
  if (baseRoute) {
    return `${baseRoute}?${params.toString()}`
  }

  return `/event-flow/category?${params.toString()}`
}

export function buildServiceSelectionBackTo({
  categorySlug = '',
  eventSlug = '',
  eventId = '',
  serviceSlug = '',
  serviceId = '',
  flow = '',
}) {
  const params = buildServiceFlowParams({
    categorySlug,
    eventSlug,
    eventId,
    serviceSlug,
    serviceId,
    flow,
  })

  if (flow === SERVICES_FLOW_KEY) {
    if (!categorySlug || !eventSlug) {
      return `/event-flow/service?${buildServiceFlowParams({ flow: SERVICES_FLOW_KEY }).toString()}`
    }

    return `/event-flow/category?${params.toString()}`
  }

  return `/event-flow/service?${params.toString()}`
}

/** Social events enter the event flow (service → theme → packages); others keep package listing. */
export function buildEventSelectionDestination({
  categorySlug = '',
  eventSlug = '',
  eventId = '',
}) {
  if (isFallbackOnlyEvent(eventSlug)) {
    return '/fallback-screen'
  }

  if (isConsultationOnlyEvent(eventSlug)) {
    return BOOK_CONSULTATION_PATH
  }

  const resolvedCategory = String(categorySlug ?? DEFAULT_EVENT_CATEGORY_SLUG)
    .trim()
    .toLowerCase()
  const params = buildServiceFlowParams({
    categorySlug: resolvedCategory,
    eventSlug,
    eventId,
  })

  if (resolvedCategory === DECOR_THEME_CATEGORY_SLUG) {
    return `/event-flow/service?${params.toString()}`
  }

  return `/package-listing?${params.toString()}`
}

export function buildServicesCategoryDestination({
  categorySlug = '',
  serviceSlug = '',
  serviceId = '',
}) {
  const params = buildServiceFlowParams({
    categorySlug,
    serviceSlug,
    serviceId,
    flow: SERVICES_FLOW_KEY,
  })

  const normalizedServiceSlug = normalizeServiceSlug(serviceSlug)
  const baseRoute =
    normalizedServiceSlug === 'decor'
      ? resolveDecorDestination(categorySlug)
      : '/package-listing'

  return `${baseRoute}?${params.toString()}`
}

/** Prefer top-level decor lane id when URL carries a featured subcategory id (e.g. decoration → decor). */
export function resolveServiceLaneId({
  serviceSlug = '',
  serviceId = '',
  serviceOptions = [],
}) {
  const normalizedTarget = normalizeServiceSlug(serviceSlug || '')
  const laneMatch = (Array.isArray(serviceOptions) ? serviceOptions : []).find(
    service => normalizeServiceSlug(service?.slug) === normalizedTarget
  )

  if (laneMatch?.id != null) return String(laneMatch.id)

  return serviceId != null ? String(serviceId) : ''
}
