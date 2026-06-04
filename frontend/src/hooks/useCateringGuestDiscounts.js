import { useQuery } from '@tanstack/react-query'
import { normalizeCateringDiscountSettings } from '../lib/cateringGuestDiscount'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

const FALLBACK_SETTINGS = {
  is_active: true,
  discount_title: 'Guest count discounts',
  discount_note: 'Per-person discount based on guest count.',
  tiers: [
    { label: '51 - 75 pax', min_pax: 51, max_pax: 75, discount_per_person: 100 },
    { label: '76 - 100 pax', min_pax: 76, max_pax: 100, discount_per_person: 200 },
    { label: '100 - 125 pax', min_pax: 100, max_pax: 125, discount_per_person: 250 },
  ],
}

async function fetchCateringGuestDiscounts() {
  const response = await strapiGet('/catering-setting', {
    populate: 'guest_discount_tiers',
  })

  const data = response?.data?.attributes ?? response?.data ?? null
  return normalizeCateringDiscountSettings(data)
}

export function useCateringGuestDiscounts(options = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: ['catering-setting', 'guest-discounts'],
    enabled,
    queryFn: async () => {
      if (USE_FALLBACK) return normalizeCateringDiscountSettings(FALLBACK_SETTINGS)

      try {
        const settings = await fetchCateringGuestDiscounts()
        return settings ?? normalizeCateringDiscountSettings(FALLBACK_SETTINGS)
      } catch {
        return normalizeCateringDiscountSettings(FALLBACK_SETTINGS)
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
