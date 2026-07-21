import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { normalizeLegalDocument } from './legalDocumentNormalize'

async function fetchTermsAndConditions() {
  try {
    const response = await strapiGet('/terms-and-conditions', {
      'populate[sections][populate][clauses]': 'true',
      'populate[tldr][populate][bullets]': 'true',
    })
    const data = response?.data?.attributes ?? response?.data ?? null
    const normalized = normalizeLegalDocument(data, {
      defaultTitle: 'Terms & Conditions',
      defaultSubtitle:
        'Welcome to Elewen. By using our platform and services, you agree to these Terms & Conditions.',
    })
    if (normalized) return normalized
  } catch {
    // CMS entry missing or not public — fall through to null
  }

  throw new Error('Failed to fetch Terms & Conditions from Strapi')
}

export function useTermsAndConditions() {
  return useQuery({
    queryKey: ['terms-and-conditions'],
    queryFn: async () => {
      if (USE_FALLBACK) return null

      try {
        return await fetchTermsAndConditions()
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
