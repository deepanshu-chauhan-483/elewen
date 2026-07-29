import { normalizeServiceSlug } from './packageFilters'

export function isSheeshaServiceSlug(slug = '') {
  const normalized = normalizeServiceSlug(slug)
  return normalized === 'sheesha' || normalized === 'hookah'
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
    .filter(Boolean)
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
