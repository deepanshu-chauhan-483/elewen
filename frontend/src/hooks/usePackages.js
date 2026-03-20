import { useQuery } from '@tanstack/react-query'
import { strapiGet } from '../lib/strapi'
import { PACKAGES_FALLBACK } from '../data/packages'

/**
 * Fetches published packages from Strapi.
 *
 * Strapi endpoint:
 *   GET /api/packages?populate[elements][populate]=service&populate[addons]=*&populate[images]=*&sort=createdAt:asc
 *
 * Returns packages shaped like PACKAGES_FALLBACK until Strapi responds.
 * Never blocks the UI — initialData serves immediately.
 */
export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data } = await strapiGet('/packages', {
        'populate[elements][populate]': 'service',
        'populate[addons]': '*',
        'populate[images]': '*',
        'sort': 'createdAt:asc',
      })

      // Normalise Strapi v5 flat response → UI shape
      return data.map((pkg, i) => ({
        id: pkg.id,
        documentId: pkg.documentId,
        title: pkg.title,
        category: pkg.category ?? '',
        description: pkg.description ?? '',
        price: pkg.base_price ? `Starting from ₹${pkg.base_price.toLocaleString('en-IN')}` : '',
        base_price: pkg.base_price ?? 0,
        tags: (pkg.elements ?? [])
          .map(el => el.service?.name)
          .filter(Boolean)
          .concat('More'),
        // Strapi image URL: prepend VITE_STRAPI_URL to relative paths
        images: (pkg.images ?? []).map(img =>
          img.url?.startsWith('http')
            ? img.url
            : `${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}${img.url}`
        ),
        _index: i,
      }))
    },
    initialData: PACKAGES_FALLBACK,
    staleTime: 5 * 60 * 1000,    // 5 min — CMS content rarely changes live
    gcTime:    15 * 60 * 1000,   // 15 min cache
    retry: 1,
  })
}
