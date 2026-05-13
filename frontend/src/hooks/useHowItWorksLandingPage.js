import { useQuery } from '@tanstack/react-query'
import { strapiGet } from '../lib/strapi'

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

export function useHowItWorksLandingPage() {
  return useQuery({
    queryKey: ['how-it-works-landing-page'],
    queryFn: async () => {
      const { data } = await strapiGet('/how-it-works-step-landing-pages', {
        'populate[Sections][populate]': '*',
      })

      const item = Array.isArray(data) ? data[0] : data
      const rawSections = item?.Sections ?? item?.sections ?? []

      return {
        id: item?.id ?? null,
        documentId: item?.documentId ?? null,
        title: item?.Title ?? item?.title ?? '',
        sections: Array.isArray(rawSections) ? rawSections.map(normalizeSection) : [],

        // ✅ CTA Section fields from same collection
        cta: {
          heading: item?.bottom_heading ?? '',
          body: item?.Bottom_Content ?? '',
        },
      }
    },
    placeholderData: {
      id: null,
      documentId: null,
      title: '',
      sections: [],
      cta: {
        heading: '',
        body: '',
      },
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
