import { useQuery } from '@tanstack/react-query'
import { HOW_IT_WORK_PAGE_FALLBACK } from '../data/cmsPages'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { preventWidow, stripMojibake } from '../lib/textFormat'

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'

const toAbsoluteStrapiUrl = url =>
  url ? (url.startsWith('http') ? url : `${STRAPI_URL}${url}`) : null

const cleanCopy = value => preventWidow(stripMojibake(String(value ?? '')))

const normalizeSection = (section, index) => ({
  id: section.section_id ?? index + 1,
  title: cleanCopy(section.Heading ?? section.heading ?? section.title ?? ''),
  desc: cleanCopy(section.Content ?? section.content ?? section.description ?? ''),
  image: toAbsoluteStrapiUrl(
    section.Icon?.url ?? section.icon?.url ?? section.Image?.url ?? section.image?.url ?? null
  ),
  raw: section,
})

const HOW_IT_WORKS_LANDING_FALLBACK = {
  id: null,
  documentId: null,
  title: HOW_IT_WORK_PAGE_FALLBACK?.hero?.heading ?? 'How 11 Works',
  sections: Array.isArray(HOW_IT_WORK_PAGE_FALLBACK?.idea_to_celebration?.steps)
    ? HOW_IT_WORK_PAGE_FALLBACK.idea_to_celebration.steps.map((step, index) => ({
        section_id: step?.number ?? index + 1,
        id: step?.number ?? index + 1,
        title: cleanCopy(step?.title ?? ''),
        desc: cleanCopy(step?.description ?? ''),
        image: null,
        raw: step,
      }))
    : [],
  cta: {
    heading: HOW_IT_WORK_PAGE_FALLBACK?.final_cta?.heading_line_1 ?? 'Confused?',
    body: HOW_IT_WORK_PAGE_FALLBACK?.final_cta?.description ?? 'Get help from our team.',
  },
}

export function useHowItWorksLandingPage() {
  return useQuery({
    queryKey: ['how-it-works-landing-page'],
    queryFn: fetchHowItWorksLandingPage,
    placeholderData: HOW_IT_WORKS_LANDING_FALLBACK,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    gcTime: 10 * 60 * 1000,
  })
}

export async function fetchHowItWorksLandingPage() {
  if (USE_FALLBACK) {
    console.log('[HOW IT WORKS] Using fallback data (USE_FALLBACK enabled)')
    return HOW_IT_WORKS_LANDING_FALLBACK
  }

  try {
    console.log('[HOW IT WORKS] Fetching from Strapi...')
    const { data } = await strapiGet('/how-it-works-step-landing-pages', {
      'populate[Sections][populate]': '*',
    })

    const item = Array.isArray(data) ? data[0] : data
    const rawSections = item?.Sections ?? item?.sections ?? []
    const sections = Array.isArray(rawSections) ? rawSections.map(normalizeSection) : []

    if (!item || sections.length === 0) {
      console.warn('[HOW IT WORKS] No data from Strapi, using fallback')
      return HOW_IT_WORKS_LANDING_FALLBACK
    }

    console.log('[HOW IT WORKS] Successfully fetched from Strapi', {
      itemId: item?.id,
      sectionsCount: sections.length,
    })

    return {
      id: item?.id ?? null,
      documentId: item?.documentId ?? null,
      title: cleanCopy(item?.Title ?? item?.title ?? HOW_IT_WORKS_LANDING_FALLBACK.title),
      sections,
      cta: {
        heading: cleanCopy(item?.bottom_heading ?? ''),
        body: cleanCopy(item?.Bottom_Content ?? ''),
      },
    }
  } catch (error) {
    console.error('[HOW IT WORKS] Error fetching from Strapi, using fallback:', error)
    return HOW_IT_WORKS_LANDING_FALLBACK
  }
}
