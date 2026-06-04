export function getCateringDetailSection(pkg) {
  return (
    (Array.isArray(pkg?.detail_sections) ? pkg.detail_sections : []).find(
      section => section?.__component === 'package.cateringpackage'
    ) ?? null
  )
}

export function isNonVegPreference(vegPreference = '') {
  return String(vegPreference).toLowerCase().includes('non')
}

/**
 * Per-person price from cateringpackage (veg / non-veg), with sensible fallbacks.
 */
export function getCateringPricePerPerson(
  cateringSection,
  vegPreference = '',
  fallbackBasePrice = 0
) {
  if (!cateringSection) {
    return Number(fallbackBasePrice ?? 0)
  }

  const vegPrice = Number(cateringSection.price_per_person_veg ?? 0)
  const nonVegPrice = Number(cateringSection.price_per_person_non_veg ?? 0)
  const fallback = Number(fallbackBasePrice ?? 0)

  if (isNonVegPreference(vegPreference)) {
    if (nonVegPrice > 0) return nonVegPrice
    if (fallback > 0) return fallback
    return vegPrice
  }

  if (vegPrice > 0) return vegPrice
  if (fallback > 0) return fallback
  return nonVegPrice
}

export function formatCateringPrice(amount, { suffix = '' } = {}) {
  const value = Number(amount ?? 0)
  if (!Number.isFinite(value) || value <= 0) return ''
  return `₹${value.toLocaleString('en-IN')}${suffix}`
}

export function getCateringPriceRangeLabel(cateringSection, fallbackBasePrice = 0) {
  if (!cateringSection) {
    return formatCateringPrice(fallbackBasePrice)
  }

  const vegPrice = Number(cateringSection.price_per_person_veg ?? 0)
  const nonVegPrice = Number(cateringSection.price_per_person_non_veg ?? 0)
  const prices = [vegPrice, nonVegPrice].filter(price => price > 0)

  if (!prices.length) {
    return formatCateringPrice(fallbackBasePrice)
  }

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  if (minPrice === maxPrice) {
    return formatCateringPrice(minPrice)
  }

  return `₹${minPrice.toLocaleString('en-IN')} – ₹${maxPrice.toLocaleString('en-IN')}`
}
