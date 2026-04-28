import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import {
  LANDING_PAGE_FALLBACK,
  ABOUT_PAGE_FALLBACK,
  INHOUSE_PLANNER_PAGE_FALLBACK,
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

/**
 * Converts a Strapi sections array into a keyed map for easy lookup.
 *
 * Input:  [ { section_key: 'hero', content_json: {...}, display_order: 1 }, ... ]
 * Output: { hero: {...}, checklist: {...}, ... }
 */
function parseSections(sections = []) {
  const result = sections.reduce((acc, s) => {
    if (s?.section_key && s?.content_json) {
      const content =
        s.content_json && typeof s.content_json === 'object'
          ? {
              ...s.content_json,
              _sectionImages: normalizeSectionImages(s.images),
            }
          : s.content_json

      acc[s.section_key] = content
      console.log(`[parseSections] Parsed section: ${s.section_key}`, content)
    } else {
      console.warn('[parseSections] Invalid section:', s)
    }
    return acc
  }, {})
  
  console.log('[parseSections] Final parsed sections:', Object.keys(result))
  return result
}

/**
 * useLandingPage
 * Fetches Landing Page Single Type from Strapi.
 * Returns a keyed map: { hero, plan_event_intro, checklist, ... }
 */
export function useLandingPage() {
  return useQuery({
    queryKey: ['cms-page', 'landing'],
    queryFn: async () => {
      if (USE_FALLBACK) return LANDING_PAGE_FALLBACK
      try {
        const { data } = await strapiGet('/landing-page', {
          'populate[sections][populate]': '*',
        })
        return mergePageSections(LANDING_PAGE_FALLBACK, parseSections(data?.sections ?? []))
      } catch {
        return LANDING_PAGE_FALLBACK
      }
    },
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
    queryFn: async () => {
      if (USE_FALLBACK) {
        console.log('[useInHousePlannerPage] Using fallback data (USE_FALLBACK=true)')
        return INHOUSE_PLANNER_PAGE_FALLBACK
      }
      try {
        console.log('[useInHousePlannerPage] Fetching from Strapi...')
        const { data } = await strapiGet('/inhouse-planner-page', {
          'populate[sections][populate]': '*',
        })
        console.log('[useInHousePlannerPage] Raw Strapi response sections:', data?.sections)
        const parsedSections = parseSections(data?.sections ?? [])
        console.log('[useInHousePlannerPage] Parsed sections:', parsedSections)
        const merged = mergePageSections(INHOUSE_PLANNER_PAGE_FALLBACK, parsedSections)
        console.log('[useInHousePlannerPage] Merged result - celebrations_every_day:', merged.celebrations_every_day)
        return merged
      } catch (err) {
        console.error('[useInHousePlannerPage] Fetch error:', err)
        return INHOUSE_PLANNER_PAGE_FALLBACK
      }
    },
    placeholderData: INHOUSE_PLANNER_PAGE_FALLBACK,
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
