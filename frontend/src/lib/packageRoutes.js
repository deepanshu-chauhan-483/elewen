export function getPackageHref(serviceSlug, packageId) {
  const normalizedService = String(serviceSlug ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')

  if (normalizedService === 'decor') return `/packages/decor-single/${packageId}`
  if (normalizedService === 'sheesha') return `/packages/sheesha-single/${packageId}`
  if (normalizedService === 'bartending') return `/packages/bartending-single/${packageId}`
  if (normalizedService === 'catering') return `/packages/catering-single/${packageId}`
  if (normalizedService) return `/packages/${normalizedService}/${packageId}`

  return `/packages/decor-single/${packageId}`
}
