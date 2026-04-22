import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

// 🎯 Hardcoded fallback flavours (used when Strapi unavailable)
const FALLBACK_FLAVORS = [
  { id: 1, title: 'Double Apple', description: '' },
  { id: 2, title: 'Mint', description: '' },
  { id: 3, title: 'Blueberry', description: '' },
  { id: 4, title: 'Watermelon', description: '' },
  { id: 5, title: 'Ice Mint', description: 'Intense icy mint for extreme cooling' },
  { id: 6, title: 'Mango', description: '' },
  { id: 7, title: 'Strawberry', description: '' },
  { id: 8, title: 'Grape', description: '' },
]

// ✅ Normalize each flavor item
function normalizeFlavor(item) {
  if (!item) return null

  return {
    id: item.id ?? item.documentId,
    title: item.Name ?? item.name ?? '',
    description: item.description ?? '',
  }
}

// ✅ Fetch + transform data
async function fetchFlavors() {
  const response = await strapiGet('/flavors', {
    sort: 'Name:asc',
  })

  const items = Array.isArray(response?.data) ? response.data : []

  // normalize + remove nulls
  return items.map(normalizeFlavor).filter(Boolean)
}

// ✅ React Query hook
export function useFlavors() {
  return useQuery({
    queryKey: ['flavors'],
    queryFn: async () => {
      if (USE_FALLBACK) {
        return FALLBACK_FLAVORS
      }

      try {
        const flavors = await fetchFlavors()
        if (!flavors || flavors.length === 0) {
          return FALLBACK_FLAVORS
        }
        return flavors
      } catch (error) {
        return FALLBACK_FLAVORS
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
