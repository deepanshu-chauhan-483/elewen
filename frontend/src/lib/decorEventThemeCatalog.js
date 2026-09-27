/**
 * Word-doc baseline for decor event → flow / themes (docs/event with theme.docx).
 *
 * Hybrid:
 * - Hardcoded map is the live baseline for known events.
 * - CMS Event.themes (and optional decor_flow) can add extras or override flow.
 * - Diwali is intentionally absent (client packages later).
 *
 * Rollback: set VITE_DECOR_THEME_CATALOG=legacy to restore pre-catalog Sets/fallback.
 */

/** @typedef {'theme_step' | 'skip_to_packages' | 'consultation' | 'unavailable'} DecorEventFlow */

/** Local aliases so this module never imports packageFilters (avoids circular deps). */
const EVENT_SLUG_ALIASES = {
  anniversary: 'anniversary',
  anniversaries: 'anniversary',
  'anniversary-celebrations': 'anniversary',
  mehndi: 'mehendi',
  proposals: 'proposal',
  'birthday-celebrations': 'birthday-parties',
  birthday: 'birthday-parties',
  'birthday-party': 'birthday-parties',
  'house-party': 'house-parties',
  'baby-showers': 'baby-shower',
  'bridal-showers': 'bridal-shower',
  'diwali-parties': 'diwali-party',
  weddings: 'wedding',
}

function canonicalizeEventSlug(slug = '') {
  const normalized = String(slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!normalized) return ''
  return EVENT_SLUG_ALIASES[normalized] ?? normalized
}

export const DECOR_THEME_CATALOG_MODE = String(
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_DECOR_THEME_CATALOG) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_DECOR_THEME_CATALOG) ||
    'word-doc'
)
  .trim()
  .toLowerCase()

export function isLegacyDecorThemeCatalog() {
  return DECOR_THEME_CATALOG_MODE === 'legacy'
}

export function isWordDocDecorThemeCatalog() {
  return !isLegacyDecorThemeCatalog()
}

/** Canonical theme slugs used in URLs / package filters. General Pack → birthday-party. */
export const WORD_DOC_THEME_SLUGS = {
  generalPack: 'birthday-party',
  houseParty: 'house-party',
  stillUs: 'still-us',
  bubblesAndBlackTie: 'bubbles-and-black-tie',
  bohemian: 'bohemian',
  pastel: 'pastel',
  aLittleHoney: 'a-little-honey',
  ohBaby: 'oh-baby',
}

/**
 * Word-doc event map. Keys are canonical event slugs (see canonicalizeEventSlug).
 * Diwali is omitted on purpose.
 */
export const WORD_DOC_EVENT_DECOR_MAP = {
  'birthday-parties': {
    flow: 'theme_step',
    themeSlugs: [
      WORD_DOC_THEME_SLUGS.generalPack,
      WORD_DOC_THEME_SLUGS.bubblesAndBlackTie,
      WORD_DOC_THEME_SLUGS.bohemian,
      WORD_DOC_THEME_SLUGS.pastel,
    ],
  },
  'house-parties': {
    flow: 'theme_step',
    themeSlugs: [WORD_DOC_THEME_SLUGS.generalPack, WORD_DOC_THEME_SLUGS.houseParty],
  },
  anniversary: {
    flow: 'theme_step',
    themeSlugs: [
      WORD_DOC_THEME_SLUGS.generalPack,
      WORD_DOC_THEME_SLUGS.stillUs,
      WORD_DOC_THEME_SLUGS.bubblesAndBlackTie,
    ],
  },
  'baby-shower': {
    flow: 'theme_step',
    themeSlugs: [
      WORD_DOC_THEME_SLUGS.generalPack,
      WORD_DOC_THEME_SLUGS.aLittleHoney,
      WORD_DOC_THEME_SLUGS.ohBaby,
    ],
  },
  'bridal-shower': {
    flow: 'skip_to_packages',
    themeSlugs: [],
  },
  proposal: {
    flow: 'skip_to_packages',
    themeSlugs: [],
  },
  mehendi: {
    flow: 'consultation',
    themeSlugs: [],
  },
  'sufi-night': {
    flow: 'consultation',
    themeSlugs: [],
  },
  haldi: {
    flow: 'consultation',
    themeSlugs: [],
  },
  wedding: {
    flow: 'unavailable',
    themeSlugs: [],
  },
  engagement: {
    flow: 'unavailable',
    themeSlugs: [],
  },
}

const CMS_FLOW_VALUES = new Set([
  'theme_step',
  'skip_to_packages',
  'consultation',
  'unavailable',
])

function normalizeThemeSlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function themeSlugAliases(slug) {
  const normalized = normalizeThemeSlug(slug)
  if (!normalized) return []
  if (normalized === 'general-pack') return ['birthday-party', 'general-pack']
  if (normalized === 'birthday-party') return ['birthday-party', 'general-pack']
  if (normalized === 'bubbles-black-tie') return ['bubbles-and-black-tie']
  if (normalized === 'little-honey') return ['a-little-honey']
  return [normalized]
}

function collectCmsThemeSlugs(cmsThemes = []) {
  const slugs = []
  for (const theme of Array.isArray(cmsThemes) ? cmsThemes : []) {
    for (const key of [theme?.slug, theme?.label, theme?.name]) {
      for (const alias of themeSlugAliases(key)) {
        if (alias && !slugs.includes(alias)) slugs.push(alias)
      }
    }
  }
  return slugs
}

/** Word-doc entry for an event, or null if not in the doc map (e.g. Diwali). */
export function getWordDocDecorEntry(eventSlug = '') {
  const canonical = canonicalizeEventSlug(eventSlug)
  if (!canonical) return null
  return WORD_DOC_EVENT_DECOR_MAP[canonical] ?? null
}

/**
 * Resolve decor flow for an event.
 * CMS decor_flow wins when set; else Word-doc; else null (caller keeps legacy).
 */
export function resolveDecorEventFlow(eventSlug = '', cmsDecorFlow = '') {
  if (isLegacyDecorThemeCatalog()) return null

  const cmsFlow = String(cmsDecorFlow ?? '')
    .trim()
    .toLowerCase()
  if (CMS_FLOW_VALUES.has(cmsFlow)) return cmsFlow

  return getWordDocDecorEntry(eventSlug)?.flow ?? null
}

export function isCatalogConsultationEvent(eventSlug = '', cmsDecorFlow = '') {
  const flow = resolveDecorEventFlow(eventSlug, cmsDecorFlow)
  return flow === 'consultation' || flow === 'unavailable'
}

export function isCatalogSkipThemeEvent(eventSlug = '', cmsDecorFlow = '') {
  return resolveDecorEventFlow(eventSlug, cmsDecorFlow) === 'skip_to_packages'
}

export function isCatalogThemeStepEvent(eventSlug = '', cmsDecorFlow = '') {
  return resolveDecorEventFlow(eventSlug, cmsDecorFlow) === 'theme_step'
}

/**
 * Allowed theme slugs for the picker: Word-doc baseline ∪ CMS Event.themes extras.
 * Returns null when catalog mode is off or event is not in the Word-doc map and CMS has no themes
 * (caller should keep package-derived filtering).
 */
export function resolveDecorThemeSlugAllowlist(eventSlug = '', cmsThemes = []) {
  if (isLegacyDecorThemeCatalog()) return null

  const entry = getWordDocDecorEntry(eventSlug)
  const cmsSlugs = collectCmsThemeSlugs(cmsThemes)

  if (!entry && cmsSlugs.length === 0) return null

  const baseline = entry?.themeSlugs ?? []
  const merged = []
  for (const slug of [...baseline, ...cmsSlugs]) {
    for (const alias of themeSlugAliases(slug)) {
      if (alias && !merged.includes(alias)) merged.push(alias)
    }
  }
  return merged
}

/** Keep theme options whose slug/label matches the allowlist (or all aliases). */
export function filterThemesByCatalogAllowlist(themes, allowlist) {
  if (!Array.isArray(allowlist)) return Array.isArray(themes) ? themes : []
  if (allowlist.length === 0) return []

  const allowed = new Set()
  for (const slug of allowlist) {
    for (const alias of themeSlugAliases(slug)) allowed.add(alias)
  }

  return (Array.isArray(themes) ? themes : []).filter(theme => {
    const candidates = [theme?.slug, theme?.label, theme?.name]
      .flatMap(value => themeSlugAliases(value))
      .filter(Boolean)
    return candidates.some(candidate => allowed.has(candidate))
  })
}
