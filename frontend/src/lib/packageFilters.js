const normalizeValue = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()

export const normalizeServiceSlug = value => {
  const normalized = normalizeValue(value)
  if (normalized === 'bar-tending') return 'bartending'
  if (normalized === 'sheesha-services') return 'sheesha'
  if (normalized === 'decoration') return 'decor'
  if (normalized === 'furniture') return 'rental-furniture'
  if (normalized === 'decor-services') return 'decor'
  return normalized
}

const includesNormalized = (values, target) => {
  const normalizedTarget = normalizeValue(target)
  if (!normalizedTarget) return true

  return (Array.isArray(values) ? values : []).some(
    value => normalizeValue(value) === normalizedTarget
  )
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
    if (!includesNormalized(pkg.event_slugs, eventSlug)) return false
    if (!includesNormalized(pkg.event_ids, eventId)) return false
    if (
      normalizedServiceSlug &&
      !(Array.isArray(pkg.service_slugs) ? pkg.service_slugs : []).some(
        value => normalizeServiceSlug(value) === normalizedServiceSlug
      )
    ) {
      return false
    }
    const packageServiceIds = Array.isArray(pkg.service_ids) ? pkg.service_ids.filter(Boolean) : []
    if (
      serviceId &&
      packageServiceIds.length &&
      !includesNormalized(packageServiceIds, serviceId)
    ) {
      return false
    }
    if (!includesNormalized(pkg.theme_slugs, themeSlug)) return false
    if (levelSlug && normalizeValue(pkg.level_slug) !== normalizeValue(levelSlug)) return false
    if (levelId && normalizeValue(pkg.level_id) !== normalizeValue(levelId)) return false
    return true
  })
}
