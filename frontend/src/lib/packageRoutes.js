export function getPackageHref(serviceSlug, packageId) {
  const normalizedService = String(serviceSlug ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')

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
  return String(pkg?.serviceSlug ?? pkg?.service_slugs?.[0] ?? pkg?.service ?? '')
    .trim()
    .toLowerCase()
}

export function getPackageHrefFromRecord(pkg) {
  const packageId = pkg?.documentId ?? pkg?.id
  return getPackageHref(getPackageServiceSlug(pkg), packageId)
}
