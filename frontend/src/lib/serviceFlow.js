import { normalizeServiceSlug } from './packageFilters'

export const SERVICE_ROUTE_MAP = {
  decor: '/event-flow/decor-theme',
  'rental-furniture': '/packages/rental-furniture',
  catering: '/event-flow/catering-levels',
  bartending: '/event-flow/bartending-levels',
  'bar-tending': '/event-flow/bartending-levels',
  sheesha: '/packages/sheesha',
}

export const SERVICE_PAGE_ALLOWED_SLUGS = [
  'decor',
  'catering',
  'bar-tending',
  'sheesha-services',
  'furniture',
]

export const SERVICES_FLOW_KEY = 'services'

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
  const normalizedServiceSlug = normalizeServiceSlug(serviceSlug)
  const params = buildServiceFlowParams({
    categorySlug,
    eventSlug,
    eventId,
    serviceSlug: normalizedServiceSlug,
    serviceId,
    flow,
  })

  const baseRoute =
    SERVICE_ROUTE_MAP[serviceSlug] ?? SERVICE_ROUTE_MAP[normalizedServiceSlug] ?? '/package-listing'

  return `${baseRoute}?${params.toString()}`
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

  const baseRoute = flow === SERVICES_FLOW_KEY ? '/event-flow/category' : '/event-flow/service'
  return `${baseRoute}?${params.toString()}`
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
    normalizedServiceSlug === 'decor' ? '/event-flow/decor-theme' : '/package-listing'

  return `${baseRoute}?${params.toString()}`
}
