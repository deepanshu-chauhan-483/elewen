import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { BLOGS_FALLBACK, BLOG_CATEGORIES_FALLBACK } from '../data/blogs'

/**
 * Fetches published blogs from Strapi.
 *
 * Strapi endpoint:
 *   GET /api/blogs
 *     ?filters[post_status][$eq]=published
 *     &sort=post_published_at:desc
 *     &populate=cover_image
 *     &pagination[pageSize]=6
 *
 * Schema deviations (see memory/project_schema_deviations.md):
 *   post_status  (not status)
 *   post_published_at  (not published_at)
 */
export function useBlogs({ limit = 3, category } = {}) {
  return useQuery({
    queryKey: ['blogs', { limit, category }],
    queryFn: async () => {
      if (USE_FALLBACK) return BLOGS_FALLBACK
      try {
        const params = {
          'filters[post_status][$eq]': 'published',
          sort: 'post_published_at:desc',
          populate: 'cover_image',
          'pagination[pageSize]': String(limit),
        }
        if (category) params['filters[category][$eq]'] = category

        const { data } = await strapiGet('/blogs', params)

        return data.map((b, i) => ({
          id: b.id ?? i,
          documentId: b.documentId,
          title: b.title ?? '',
          slug: b.slug ?? '',
          excerpt: b.excerpt ?? '',
          category: b.category ?? '',
          cover_image: b.cover_image?.url
            ? b.cover_image.url.startsWith('http')
              ? b.cover_image.url
              : `${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}${b.cover_image.url}`
            : null,
        }))
      } catch {
        return BLOGS_FALLBACK
      }
    },
    placeholderData: BLOGS_FALLBACK,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      if (USE_FALLBACK) return BLOG_CATEGORIES_FALLBACK
      try {
        // Strapi doesn't have a separate categories collection — derive from blogs
        const { data } = await strapiGet('/blogs', {
          'filters[post_status][$eq]': 'published',
          'fields[0]': 'category',
        })
        return [...new Set(data.map(b => b.category).filter(Boolean))]
      } catch {
        return BLOG_CATEGORIES_FALLBACK
      }
    },
    placeholderData: BLOG_CATEGORIES_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}
