/** Fallback when CMS size is empty — matches seeded hookah catalog. */
const SHEESHA_SIZE_BY_SLUG = {
  'basic-indian-hookah': 'small',
  'premium-indian-hookah': 'large',
  'basic-turkish-hookah': 'large',
  'premium-turkish-hookah': 'large',
}

export function formatSheeshaSizeLabel(size = '') {
  const normalized = String(size ?? '')
    .trim()
    .toLowerCase()
  if (!normalized) return ''
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function readSizeFromSections(sections = []) {
  for (const section of Array.isArray(sections) ? sections : []) {
    if (section?.__component !== 'package.sheeshapackage') continue
    const label = formatSheeshaSizeLabel(section?.size)
    if (label) return label
  }
  return ''
}

/** Resolve display size from mapped package or raw Strapi package shape. */
export function resolveSheeshaSizeLabel(pkg) {
  if (!pkg) return ''

  const fromMapped = formatSheeshaSizeLabel(pkg.sheesha_size ?? pkg.size)
  if (fromMapped) return fromMapped

  if (typeof pkg.sheesha_size_label === 'string' && pkg.sheesha_size_label.trim()) {
    return pkg.sheesha_size_label.trim()
  }

  const fromSections = readSizeFromSections(pkg.detail_sections ?? pkg.packages)
  if (fromSections) return fromSections

  const slug = String(pkg.slug ?? '')
    .trim()
    .toLowerCase()
  const fallback = SHEESHA_SIZE_BY_SLUG[slug]
  return fallback ? formatSheeshaSizeLabel(fallback) : ''
}
