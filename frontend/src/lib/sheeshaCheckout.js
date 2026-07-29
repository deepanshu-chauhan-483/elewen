import { normalizeServiceSlug } from './packageFilters'

/** Shown when Hookah is mixed with other services in the same cart. */
export const MIXED_HOOKAH_CART_MESSAGE =
  'Hookah needs a separate booking — it can’t be combined with other services in the same cart.'

/** Only real bookable service lanes — ignore parent/category CMS noise. */
const PRODUCT_SERVICE_SLUGS = new Set([
  'sheesha',
  'hookah',
  'decor',
  'catering',
  'bartending',
  'rental-furniture',
])

const NON_SHEESHA_PRODUCT_SLUGS = new Set([
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

function textLooksLikeSheesha(...values) {
  return values.some(value => {
    const text = String(value ?? '')
      .trim()
      .toLowerCase()
    return text.includes('sheesha') || text.includes('hookah')
  })
}

/** True when this cart line is a Hookah/Sheesha package (or its add-on). */
export function isSheeshaCartItem(item) {
  const pkg = item?.packageData
  const slugs = getPackageServiceSlugs(pkg)
  if (slugs.some(isSheeshaServiceSlug)) return true

  return textLooksLikeSheesha(
    pkg?.category,
    pkg?.title,
    pkg?.slug,
    item?.displayTitle,
    item?.title,
    item?.addonTitle
  )
}

/** True when this cart line is a non-Hookah product service. */
export function isNonSheeshaProductCartItem(item) {
  if (isSheeshaCartItem(item)) return false

  const slugs = getPackageServiceSlugs(item?.packageData)
  if (slugs.some(slug => NON_SHEESHA_PRODUCT_SLUGS.has(slug))) return true

  const pkg = item?.packageData
  const haystack = [pkg?.category, pkg?.title, pkg?.slug, item?.displayTitle, item?.title]
    .map(value => String(value ?? '').toLowerCase())
    .join(' ')

  return (
    haystack.includes('decor') ||
    haystack.includes('catering') ||
    haystack.includes('bartend') ||
    haystack.includes('furniture') ||
    haystack.includes('rental')
  )
}

export function classifyCartPackages(cartItems = []) {
  const items = Array.isArray(cartItems) ? cartItems : []
  const slugs = new Set()

  items.forEach(item => {
    getPackageServiceSlugs(item?.packageData).forEach(slug => slugs.add(slug))
  })

  const hasSheesha = items.some(isSheeshaCartItem)
  const hasNonSheesha = items.some(isNonSheeshaProductCartItem)
  const serviceSlugs = [...slugs]

  return {
    serviceSlugs,
    hasSheesha,
    hasNonSheesha,
    isSheeshaOnly: hasSheesha && !hasNonSheesha && items.length > 0,
    isMixedSheeshaCart: hasSheesha && hasNonSheesha,
  }
}
