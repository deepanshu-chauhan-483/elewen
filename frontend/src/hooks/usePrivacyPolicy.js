import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { normalizeLegalDocument } from './legalDocumentNormalize'

const PRIVACY_INTRO =
  'At Elewen, your trust means everything. We’re committed to protecting your personal information while making your event planning journey simple, safe, and stress-free. This Privacy Policy explains what data we collect, how we use it, and the safeguards in place.'

async function fetchPrivacyPolicy() {
  try {
    const response = await strapiGet('/privacy-policy', {
      'populate[sections][populate][clauses]': 'true',
      'populate[tldr][populate][bullets]': 'true',
    })
    const data = response?.data?.attributes ?? response?.data ?? null
    const normalized = normalizeLegalDocument(data, {
      defaultTitle: 'Privacy Policy',
      defaultSubtitle: PRIVACY_INTRO,
      introText: PRIVACY_INTRO,
    })
    if (normalized) return normalized
  } catch {
    // CMS entry missing or not public — fall through to null
  }

  throw new Error('Failed to fetch Privacy Policy from Strapi')
}

export function usePrivacyPolicy() {
  return useQuery({
    queryKey: ['privacy-policy'],
    queryFn: async () => {
      if (USE_FALLBACK) return null

      try {
        return await fetchPrivacyPolicy()
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
