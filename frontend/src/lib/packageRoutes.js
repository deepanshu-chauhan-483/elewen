import { isCorporateDecorPackage, normalizeServiceSlug } from './packageFilters'

export function getPackageHref(serviceSlug, packageId) {
  const normalizedService = normalizeServiceSlug(
    String(serviceSlug ?? '')
      .trim()
      .toLowerCase()
      .replace(/-single$/, '')
      .replace(/-services?$/, '')
  )

  if (normalizedService === 'decor') return `/packages/decor-single/${packageId}`
  // Furniture uses the same CMS inclusion / Choose-1 detail UI as Decor.
  if (normalizedService === 'rental-furniture' || normalizedService === 'furniture') {
    return `/packages/decor-single/${packageId}`
  }
  if (normalizedService === 'sheesha') return `/packages/sheesha-single/${packageId}`
  if (normalizedService === 'bartending') return `/packages/bartending-single/${packageId}`
  if (normalizedService === 'catering') return `/packages/catering-single/${packageId}`
  if (normalizedService) return `/packages/${normalizedService}/${packageId}`

  return `/packages/decor-single/${packageId}`
}

export function getPackageServiceSlug(pkg) {
  const raw = String(pkg?.serviceSlug ?? pkg?.service_slugs?.[0] ?? pkg?.service ?? '').trim()
  return normalizeServiceSlug(raw) || raw.toLowerCase()
}

function withCorporateConsultationCategory(href) {
  if (!href || href.includes('category=corporate')) return href
  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}category=corporate`
}

export function getPackageHrefFromRecord(pkg) {
  const packageId = pkg?.documentId ?? pkg?.id
  if (packageId == null || String(packageId).trim() === '') {
    return '/packages/decor'
  }

  const href = getPackageHref(getPackageServiceSlug(pkg), packageId)
  if (!isCorporateDecorPackage(pkg)) return href
  return withCorporateConsultationCategory(href)
}
