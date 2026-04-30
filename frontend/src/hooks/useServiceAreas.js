import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

function normalizePincode(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
}

function normalizeExtraPincodes(value) {
  if (Array.isArray(value)) {
    return value.map(normalizePincode).filter(Boolean)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(normalizePincode).filter(Boolean) : []
    } catch {
      return []
    }
  }

  return []
}

async function fetchServiceAreas() {
  const { data } = await strapiGet('/service-areas', {
    'filters[is_active][$eq]': 'true',
    sort: 'name:asc',
    'pagination[pageSize]': 100,
  })

  return (Array.isArray(data) ? data : []).map(area => ({
    id: area.id,
    documentId: area.documentId,
    name: String(area.name ?? '').trim(),
    pincodeStart:
      Number.isFinite(Number(area.pincode_start)) ? Number(area.pincode_start) : null,
    pincodeEnd: Number.isFinite(Number(area.pincode_end)) ? Number(area.pincode_end) : null,
    extraPincodes: normalizeExtraPincodes(area.extra_pincodes),
    isActive: area.is_active !== false,
  }))
}

export function useServiceAreas() {
  return useQuery({
    queryKey: ['service-areas'],
    queryFn: async () => {
      if (USE_FALLBACK) return []

      try {
        return await fetchServiceAreas()
      } catch (error) {
        console.warn('Failed to fetch Strapi service areas', error)
        return []
      }
    },
    placeholderData: [],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
