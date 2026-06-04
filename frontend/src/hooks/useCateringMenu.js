import { useQuery } from '@tanstack/react-query'
import { normalizeCateringMenuLibrary } from '../lib/cateringMenuSelection'
import { CATERING_MENU_FALLBACK } from '../lib/cateringMenuFallback'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

async function fetchCateringMenuLibrary() {
  const response = await strapiGet('/catering-menu', {
    'populate[categories][populate][dishes]': 'true',
  })

  const data = response?.data?.attributes ?? response?.data ?? null
  return normalizeCateringMenuLibrary(data)
}

export function useCateringMenu(options = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: ['catering-menu', 'library'],
    enabled,
    queryFn: async () => {
      if (USE_FALLBACK) return CATERING_MENU_FALLBACK

      try {
        return await fetchCateringMenuLibrary()
      } catch {
        return CATERING_MENU_FALLBACK
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}
