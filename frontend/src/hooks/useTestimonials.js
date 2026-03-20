import { useQuery } from '@tanstack/react-query'
import { strapiGet } from '../lib/strapi'
import { TESTIMONIALS_FALLBACK } from '../data/testimonials'

/**
 * Fetches featured testimonials from Strapi.
 *
 * Strapi endpoint:
 *   GET /api/testimonials
 *     ?filters[is_featured][$eq]=true
 *     &sort=createdAt:desc
 *     &populate=author_image
 *
 * Field names use schema deviations:
 *   author_name, event_category, body, star_rating, is_featured
 *   (NOT author, category, text, stars)
 */
export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data } = await strapiGet('/testimonials', {
        'filters[is_featured][$eq]': 'true',
        sort: 'createdAt:desc',
        populate: 'author_image',
      })

      return data.map((t, i) => ({
        id: t.id ?? i,
        documentId: t.documentId,
        author: t.author_name ?? '',
        category: t.event_category ?? '',
        text: t.body ?? '',
        stars: t.star_rating ?? 5,
        author_image: t.author_image?.url ?? null,
      }))
    },
    initialData: TESTIMONIALS_FALLBACK.map(t => ({
      ...t,
      author: t.author_name,
      category: t.event_category,
      text: t.body,
      stars: t.star_rating,
    })),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
