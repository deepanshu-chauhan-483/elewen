import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { BLOGS_FALLBACK, BLOG_CATEGORIES_FALLBACK } from '../data/blogs'
import { offlineBlogCover } from '../data/offlineMedia'

const toAbsoluteStrapiUrl = url =>
  url
    ? url.startsWith('http')
      ? url
      : `${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}${url}`
    : null

const filterFallbackBlogs = ({ limit, category, slug }) =>
  BLOGS_FALLBACK.filter(blog => {
    if (category && blog.category !== category) return false
    if (slug && blog.slug !== slug) return false
    return true
  }).slice(0, limit)

/**
 * Fetches published blogs from Strapi.
 *
 * Strapi endpoint:
 *   GET /api/blogs
 *     ?filters[post_status][$eq]=published
 *     &sort=post_published_at:desc
 *     &populate=*
 *     &pagination[pageSize]=6
 *
 * Schema deviations (see memory/project_schema_deviations.md):
 *   post_status  (not status)
 *   post_published_at  (not published_at)
 */
export function useBlogs({ limit = 3, category, slug } = {}) {
  return useQuery({
    queryKey: ['blogs', { limit, category, slug }],
    queryFn: async () => {
      if (USE_FALLBACK) return filterFallbackBlogs({ limit, category, slug })
      try {
        const params = {
          'filters[post_status][$eq]': 'published',
          sort: 'post_published_at:desc',
          populate: '*',
          'pagination[pageSize]': String(limit),
        }
        if (category) params['filters[category][$eq]'] = category
        if (slug) params['filters[slug][$eq]'] = slug

        const { data } = await strapiGet('/blogs', params)

        return data.map((b, i) => {
          const mappedSlug = b.slug ?? ''
          const cover =
            toAbsoluteStrapiUrl(b.cover_image?.url) ||
            toAbsoluteStrapiUrl(b.blog_images?.[0]?.url) ||
            offlineBlogCover(mappedSlug)

          return {
            id: b.id ?? i,
            documentId: b.documentId,
            title: b.title ?? '',
            slug: mappedSlug,
            excerpt: b.excerpt ?? '',
            category: b.category ?? '',
            content: b.content_blocks ?? b.content ?? '',
            author: b.author ?? '',
            post_published_at: b.post_published_at ?? null,
            cover_image: cover,
            blog_images: Array.isArray(b.blog_images)
              ? b.blog_images.map(image => ({
                  url: toAbsoluteStrapiUrl(image?.url),
                  alt: image?.alternativeText || image?.name || '',
                }))
              : [],
          }
        })
      } catch {
        return filterFallbackBlogs({ limit, category, slug })
      }
    },
    placeholderData: filterFallbackBlogs({ limit, category, slug }),
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
