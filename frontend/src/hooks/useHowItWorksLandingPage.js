import { useQuery } from '@tanstack/react-query'
import { HOW_IT_WORK_PAGE_FALLBACK } from '../data/cmsPages'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'

const toAbsoluteStrapiUrl = url =>
  url ? (url.startsWith('http') ? url : `${STRAPI_URL}${url}`) : null

const normalizeSection = (section, index) => ({
  id: section.section_id ?? index + 1,
  title: section.Heading ?? section.heading ?? section.title ?? '',
  desc: section.Content ?? section.content ?? section.description ?? '',
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
        id: step?.number ?? index + 1,
        title: step?.title ?? '',
        desc: step?.description ?? '',
        image: null,
        raw: step,
      }))
    : [],
  cta: {
    heading: '',
    body: '',
  },
}

export function useHowItWorksLandingPage() {
  return useQuery({
    queryKey: ['how-it-works-landing-page'],
    queryFn: fetchHowItWorksLandingPage,
    placeholderData: HOW_IT_WORKS_LANDING_FALLBACK,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export async function fetchHowItWorksLandingPage() {
  if (USE_FALLBACK) return HOW_IT_WORKS_LANDING_FALLBACK

  try {
    const { data } = await strapiGet('/how-it-works-step-landing-pages', {
      'populate[Sections][populate]': '*',
    })

    const item = Array.isArray(data) ? data[0] : data
    const rawSections = item?.Sections ?? item?.sections ?? []
    const sections = Array.isArray(rawSections) ? rawSections.map(normalizeSection) : []

    if (!item || sections.length === 0) {
      return HOW_IT_WORKS_LANDING_FALLBACK
    }

    return {
      id: item?.id ?? null,
      documentId: item?.documentId ?? null,
      title: item?.Title ?? item?.title ?? HOW_IT_WORKS_LANDING_FALLBACK.title,
      sections,
      cta: {
        heading: item?.bottom_heading ?? '',
        body: item?.Bottom_Content ?? '',
      },
    }
  } catch {
    return HOW_IT_WORKS_LANDING_FALLBACK
  }
}
