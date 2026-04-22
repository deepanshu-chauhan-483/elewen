import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

function buildCancellationPolicyBody(data) {
  if (!data) return ''

  const sections = [
    data.within_16h ? `Within 16 Hours of Booking: ${data.within_16h}` : '',
    data.between_16_48h ? `Between 16 – 48 Hours: ${data.between_16_48h}` : '',
    data.after_48h ? `After 48 Hours: ${data.after_48h}` : '',
    data.refund_note ? `*${data.refund_note}` : '',
    data.material_policy ? data.material_policy : '',
  ].filter(Boolean)

  return sections.join('\n')
}

async function fetchCancellationPolicy() {
  const response = await strapiGet('/cancellation-policy')
  const data = response?.data?.attributes ?? response?.data ?? null

  if (!data) return null

  return {
    title: 'Cancellation Policy',
    body: buildCancellationPolicyBody(data),
  }
}

export function useCancellationPolicy() {
  return useQuery({
    queryKey: ['cancellation-policy'],
    queryFn: async () => {
      if (USE_FALLBACK) return null

      try {
        return await fetchCancellationPolicy()
      } catch (error) {
        console.warn('Failed to fetch Strapi cancellation policy', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
