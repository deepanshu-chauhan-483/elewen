import { normalizeServiceSlug } from './packageFilters'

/** Only real bookable service lanes — ignore parent/category CMS noise. */
const PRODUCT_SERVICE_SLUGS = new Set([
  'sheesha',
  'hookah',
  'decor',
  'catering',
  'bartending',
  'rental-furniture',
])

export function isSheeshaServiceSlug(slug = '') {
  const normalized = normalizeServiceSlug(slug)
  return (
    normalized === 'sheesha' ||
    normalized === 'hookah' ||
    normalized === 'sheesha-services'
  )
}

export function isCodPayment(payment) {
  if (!payment) return false
  return (
    payment.provider === 'manual' &&
    payment.paymentMethod === 'offline' &&
    payment.providerOrderId === 'COD'
  )
}

export function isCodPendingPayment(payment) {
  return isCodPayment(payment) && payment.status === 'pending'
}

export function getPackageServiceSlugs(pkg) {
  return (Array.isArray(pkg?.service_slugs) ? pkg.service_slugs : [])
    .map(normalizeServiceSlug)
    .filter(slug => PRODUCT_SERVICE_SLUGS.has(slug))
}

export function classifyCartPackages(cartItems = []) {
  const slugs = new Set()

  ;(Array.isArray(cartItems) ? cartItems : []).forEach(item => {
    getPackageServiceSlugs(item?.packageData).forEach(slug => slugs.add(slug))
  })

  const serviceSlugs = [...slugs]
  const hasSheesha = serviceSlugs.some(isSheeshaServiceSlug)
  const hasNonSheesha = serviceSlugs.some(slug => !isSheeshaServiceSlug(slug))

  return {
    serviceSlugs,
    hasSheesha,
    hasNonSheesha,
    isSheeshaOnly: hasSheesha && !hasNonSheesha && serviceSlugs.length > 0,
    isMixedSheeshaCart: hasSheesha && hasNonSheesha,
  }
}
