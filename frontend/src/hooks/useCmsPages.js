import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import {
  LANDING_PAGE_FALLBACK,
  ABOUT_PAGE_FALLBACK,
  INHOUSE_PLANNER_PAGE_FALLBACK,
  HOW_IT_WORK_PAGE_FALLBACK,
} from '../data/cmsPages'

function mergeSectionData(fallbackValue, cmsValue) {
  if (cmsValue === undefined || cmsValue === null) return fallbackValue

  if (Array.isArray(fallbackValue) || Array.isArray(cmsValue)) {
    return Array.isArray(cmsValue) && cmsValue.length > 0 ? cmsValue : fallbackValue
  }

  if (
    fallbackValue &&
    cmsValue &&
    typeof fallbackValue === 'object' &&
    typeof cmsValue === 'object'
  ) {
    const merged = { ...fallbackValue }
    Object.keys(cmsValue).forEach(key => {
      merged[key] = mergeSectionData(fallbackValue?.[key], cmsValue[key])
    })
    return merged
  }

  return cmsValue
}

function mergePageSections(fallbackSections, cmsSections) {
  const merged = { ...fallbackSections }

  Object.keys(cmsSections).forEach(key => {
    merged[key] = mergeSectionData(fallbackSections?.[key], cmsSections[key])
  })

  return merged
}

function normalizeSectionImages(images) {
  if (Array.isArray(images)) return images
  if (Array.isArray(images?.data)) return images.data
  if (images?.data) return [images.data]
  return []
}

function sanitizeCmsText(value) {
  if (typeof value !== 'string') return value

  return value
    .replace(/d\?\?cor/gi, match => (match[0] === 'D' ? 'Décor' : 'décor'))
    .replace(/dÃ©cor/gi, match => (match[0] === 'D' ? 'Décor' : 'décor'))
}

function sanitizeCmsTextSafe(value) {
  if (typeof value !== 'string') return value

  let result = sanitizeCmsText(value)
  result = result.replace(/d\?\?cor/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
  result = result.replace(/dÃ©cor/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
  result = result.replace(/dÃƒÂ©cor/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
  result = result.replace(/décor/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
  result = result.replace(/decore/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
  // UTF-8 mojibake for dashes / quotes (shows as â€… in the UI).
  result = result.replace(/â€[œ]/g, '"')
  result = result.replace(/â€[˜™]/g, "'")
  result = result.replace(/â€"|â€“|â€”/g, ' - ')
  result = result.replace(/â€¦/g, '...')
  result = result.replace(/â€/g, '')
  return result
}

function sanitizeCmsValue(value) {
  if (typeof value === 'string') return sanitizeCmsTextSafe(value)
  if (Array.isArray(value)) return value.map(sanitizeCmsValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeCmsValue(item)])
    )
  }
  return value
}

function normalizeCmsArray(value) {
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  if (!value || typeof value !== 'object') return []

  if (Array.isArray(value.data)) return value.data
  if (Array.isArray(value.items)) return value.items
  if (Array.isArray(value.value)) return value.value
  if (Array.isArray(value.attributes?.data)) return value.attributes.data

  const numericKeys = Object.keys(value)
    .filter(key => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))

  if (numericKeys.length > 0) {
    return numericKeys.map(key => value[key])
  }

  return []
}

function normalizeNestedCmsArray(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return []

  if (typeof value === 'string') {
    try {
      return normalizeNestedCmsArray(JSON.parse(value), seen)
    } catch {
      return []
    }
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => {
      if (item === null || item === undefined) return []

      if (typeof item === 'string') {
        try {
          return normalizeNestedCmsArray(JSON.parse(item), seen)
        } catch {
          return [item]
        }
      }

      if (Array.isArray(item)) return normalizeNestedCmsArray(item, seen)

      if (typeof item === 'object') {
        const nested = normalizeCmsArray(item)
        if (nested.length > 0) return normalizeNestedCmsArray(nested, seen)
      }

      return [item]
    })
  }

  if (typeof value !== 'object') return []
  if (seen.has(value)) return []
  seen.add(value)

  const nested = normalizeCmsArray(value)
  if (nested.length > 0) return normalizeNestedCmsArray(nested, seen)

  if (
    'label' in value ||
    'title' in value ||
    'heading' in value ||
    'name' in value ||
    'description' in value ||
    'body' in value ||
    'text' in value
  ) {
    return [value]
  }

  return []
}

function normalizeCmsEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry

  return entry.attributes && typeof entry.attributes === 'object'
    ? { ...entry.attributes, id: entry.id ?? entry.attributes.id }
    : entry
}

function normalizeSectionKey(sectionKey) {
  const raw = String(sectionKey ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const aliases = {
    hero_section: 'hero',
    idea_to_celebration: 'idea_to_celebration',
    dashboard_section: 'dashboard',
    middle_banner: 'banner',
    faq_section: 'faq',
    final_cta_section: 'final_cta',
  }

  return aliases[raw] ?? raw
}

function normalizeHeroCard(card = {}) {
  const normalizedCard = normalizeCmsEntry(card) ?? {}

  return {
    ...normalizedCard,
    label:
      normalizedCard.label ??
      normalizedCard.title ??
      normalizedCard.heading ??
      normalizedCard.name ??
      '',
    description: normalizedCard.description ?? normalizedCard.body ?? '',
    tagline:
      normalizedCard.tagline ??
      normalizedCard.description ??
      normalizedCard.desc ??
      normalizedCard.body ??
      '',
  }
}

function normalizeLandingPageSections(sections = {}) {
  const normalized = sanitizeCmsValue({ ...sections })

  if (normalized.hero && typeof normalized.hero === 'object') {
    const hero = normalized.hero
    const heroSectionImages = normalizeSectionImages(hero._sectionImages)
    const heroVideo =
      hero.video ??
      hero.hero_video ??
      hero.background_video ??
      heroSectionImages.find(item =>
        String(item?.mime ?? item?.data?.attributes?.mime ?? '').startsWith('video/')
      ) ??
      null

    normalized.hero = {
      ...hero,
      video: heroVideo,
      eyebrow: hero.eyebrow ?? hero.pre_heading ?? hero.kicker ?? hero.heading_1 ?? hero.title_1,
      heading: hero.heading ?? hero.heading_2 ?? hero.title ?? hero.title_2,
      search_line_1:
        hero.search_line_1 ?? hero.cta_line_1 ?? hero.description_line_1 ?? hero.body_line_1,
      search_line_2:
        hero.search_line_2 ?? hero.cta_line_2 ?? hero.description_line_2 ?? hero.body_line_2,
      left_taglines: normalizeNestedCmsArray(
        hero.left_taglines ?? hero.taglines ?? hero.left_lines ?? hero.feature_lines ?? []
      ).map(item => {
        const normalizedItem = normalizeCmsEntry(item)
        return typeof normalizedItem === 'string'
          ? normalizedItem
          : (normalizedItem?.label ?? normalizedItem?.title ?? normalizedItem?.text ?? '')
      }),
      right_cards: normalizeNestedCmsArray(
        hero.right_cards ?? hero.cards ?? hero.hero_cards ?? hero.featured_cards ?? []
      ).map(normalizeHeroCard),
    }
  }

  if (normalized.plan_event_intro && typeof normalized.plan_event_intro === 'object') {
    const section = normalized.plan_event_intro
    normalized.plan_event_intro = {
      ...section,
      heading:
        section.heading ??
        [section.heading_1, section.heading_2].filter(Boolean).join('\n') ??
        undefined,
    }
  }

  if (normalized.better_way && typeof normalized.better_way === 'object') {
    const section = normalized.better_way
    normalized.better_way = {
      ...section,
      heading:
        section.heading ??
        [section.heading_1, section.heading_2].filter(Boolean).join('\n') ??
        undefined,
      left_body: section.left_body ?? section.left_description,
      right_body: section.right_body ?? section.right_description,
      center_body: section.center_body ?? section.center_description,
    }
  }

  return normalized
}

/**
 * Converts a Strapi sections array into a keyed map for easy lookup.
 *
 * Input:  [ { section_key: 'hero', content_json: {...}, display_order: 1 }, ... ]
 * Output: { hero: {...}, checklist: {...}, ... }
 */
function parseSections(sections = []) {
  const result = sections.reduce((acc, s) => {
    if (s?.section_key && s?.content_json) {
      const normalizedKey = normalizeSectionKey(s.section_key)
      const content =
        s.content_json && typeof s.content_json === 'object'
          ? {
              ...s.content_json,
              _sectionImages: normalizeSectionImages(s.images),
            }
          : s.content_json

      acc[normalizedKey] = content
    }
    return acc
  }, {})

  return result
}

async function fetchGrandCelebrationsIntro() {
  const { data } = await strapiGet('/grand-celebrations-intros', {
    'pagination[pageSize]': 1,
    sort: 'updatedAt:desc',
    'populate[category_item][populate]': '*',
  })

  const entry = Array.isArray(data) ? data[0] : null
  if (!entry) return null

  const categoryItems = Array.isArray(entry.category_item) ? entry.category_item : []
  const sectionImages = categoryItems.flatMap(item =>
    Array.isArray(item?.image) ? item.image : item?.image ? [item.image] : []
  )

  return {
    heading_1: entry.heading_1 ?? '',
    note: entry.note ?? '',
    category_item: categoryItems,
    categories: categoryItems,
    _sectionImages: sectionImages,
  }
}

async function fetchCelebrationEveryDay() {
  const { data } = await strapiGet('/celebration-every-days', {
    'pagination[pageSize]': 1,
    sort: 'updatedAt:desc',
    'populate[categories][populate]': '*',
  })

  const entry = Array.isArray(data) ? data[0] : null
  if (!entry) return null

  const categories = Array.isArray(entry.categories) ? entry.categories : []
  const sectionImages = categories.flatMap(item =>
    Array.isArray(item?.images) ? item.images : item?.images ? [item.images] : []
  )

  return {
    heading: entry.heading ?? '',
    description: entry.subheading ?? '',
    subheading: entry.subheading ?? '',
    categories: categories.map(item => ({
      ...item,
      tab_label: item.tab_label ?? item.label ?? '',
      description: item.description ?? '',
      images: Array.isArray(item.images) ? item.images : item.images ? [item.images] : [],
    })),
    _sectionImages: sectionImages,
  }
}

export async function fetchInHousePlannerPageData() {
  if (USE_FALLBACK) {
    return INHOUSE_PLANNER_PAGE_FALLBACK
  }

  try {
    const [{ data }, grandCelebrationsIntro, celebrationEveryDay] = await Promise.all([
      strapiGet('/inhouse-planner-page', {
        'populate[sections][populate]': '*',
      }),
      fetchGrandCelebrationsIntro().catch(() => null),
      fetchCelebrationEveryDay().catch(() => null),
    ])

    const parsedSections = parseSections(data?.sections ?? [])
    if (grandCelebrationsIntro) {
      parsedSections.grand_celebrations_intro = grandCelebrationsIntro
    }
    if (celebrationEveryDay) {
      parsedSections.celebrations_every_day = celebrationEveryDay
    }
    return mergePageSections(INHOUSE_PLANNER_PAGE_FALLBACK, parsedSections)
  } catch {
    return INHOUSE_PLANNER_PAGE_FALLBACK
  }
}

export async function fetchLandingPageData() {
  if (USE_FALLBACK) return LANDING_PAGE_FALLBACK
  try {
    const { data } = await strapiGet('/landing-page', {
      'populate[sections][populate]': 'images',
    })
    return mergePageSections(
      LANDING_PAGE_FALLBACK,
      normalizeLandingPageSections(parseSections(data?.sections ?? []))
    )
  } catch {
    return LANDING_PAGE_FALLBACK
  }
}

/**
 * useLandingPage
 * Fetches Landing Page Single Type from Strapi.
 * Returns a keyed map: { hero, plan_event_intro, checklist, ... }
 */
export function useLandingPage() {
  return useQuery({
    queryKey: ['cms-page', 'landing'],
    queryFn: fetchLandingPageData,
    placeholderData: LANDING_PAGE_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * useAboutPage
 * Fetches About Page Single Type from Strapi.
 * Returns a keyed map: { story_opening, founders, why_choose, ... }
 */
export function useAboutPage() {
  return useQuery({
    queryKey: ['cms-page', 'about'],
    queryFn: async () => {
      if (USE_FALLBACK) return ABOUT_PAGE_FALLBACK
      try {
        const { data } = await strapiGet('/about-page', {
          'populate[sections][populate]': '*',
        })
        return mergePageSections(ABOUT_PAGE_FALLBACK, parseSections(data?.sections ?? []))
      } catch {
        return ABOUT_PAGE_FALLBACK
      }
    },
    placeholderData: ABOUT_PAGE_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * useInHousePlannerPage
 * Fetches In-House Planner Page Single Type from Strapi.
 * Returns a keyed map: { hero, what_we_do, moksha_bio, ... }
 */
export function useInHousePlannerPage() {
  return useQuery({
    queryKey: ['cms-page', 'in-house-planner'],
    queryFn: fetchInHousePlannerPageData,
    placeholderData: INHOUSE_PLANNER_PAGE_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * useHowItWorkPage
 * Fetches How It Work Page Single Type from Strapi.
 * Returns a keyed map: { hero, idea_to_celebration, dashboard, faq, final_cta, ... }
 */
export function useHowItWorkPage() {
  return useQuery({
    queryKey: ['cms-page', 'how-it-work'],
    queryFn: async () => {
      if (USE_FALLBACK) return HOW_IT_WORK_PAGE_FALLBACK
      try {
        const { data } = await strapiGet('/how-it-works', {
          'populate[sections][populate]': '*',
        })
        return mergePageSections(HOW_IT_WORK_PAGE_FALLBACK, parseSections(data?.sections ?? []))
      } catch {
        return HOW_IT_WORK_PAGE_FALLBACK
      }
    },
    placeholderData: HOW_IT_WORK_PAGE_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * useGlobalSettings
 * Fetches site-wide config: phone, email, advance_payment_percentage etc.
 */
export function useGlobalSettings() {
  return useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      if (USE_FALLBACK) return null
      try {
        const { data } = await strapiGet('/global-setting')
        return data ?? null
      } catch {
        return null
      }
    },
    placeholderData: null,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })
}
