import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export function useDiscountBanners() {
  return useQuery({
    queryKey: ['discount-banners'],
    queryFn: async () => {
      const data = await apiGet('/coupons/banners')
      return Array.isArray(data?.banners) ? data.banners : []
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
