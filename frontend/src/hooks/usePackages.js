import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import { PACKAGES_FALLBACK } from '../data/packages'

// Strapi v5 rich text (blocks) → plain string
const blocksToText = blocks => {
  if (!blocks) return ''
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map(b => (b.children ?? []).map(c => c.text ?? '').join(''))
    .filter(Boolean)
    .join(' ')
}

function normaliseMediaArray(media) {
  // Strapi responses can vary by version/plugins:
  // - v5 populated media often is an array of objects
  // - v4 style can be { data: [...] }
  // - some seeds may store strings/urls directly
  if (!media) return []
  if (Array.isArray(media)) return media
  if (Array.isArray(media?.data)) return media.data
  return []
}

function normaliseRelationArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function toAbsoluteStrapiUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * Fetches published packages from Strapi.
 * No placeholderData: static PACKAGES_FALLBACK must not appear while the real fetch runs.
 *
 * GET /api/packages?populate[elements][populate]=service&populate[addons]=*&populate[images]=*&sort=createdAt:asc
 */
export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      if (USE_FALLBACK) return PACKAGES_FALLBACK
      try {
        const { data } = await strapiGet('/packages', {
          'populate[elements][populate]': 'service',
          'populate[addons]': 'true',
          'populate[images]': 'true',
          'populate[events][populate][0]': 'parent_event',
          'populate[service_categories]': 'true',
          'populate[themes]': 'true',
          'populate[budget_level]': 'true',

          'populate[packages][populate]': '*',
          sort: 'createdAt:asc',
        })
        console.log('FULL API DATA 👉', data)
        // Normalise Strapi v5 flat response → UI shape
        return data.map((pkg, i) => ({
          id: pkg.id,
          documentId: pkg.documentId,
          title: pkg.title,
          category: pkg.category ?? '',
          description: blocksToText(pkg.description),
          // Badge line in UI is "Starting from {price}" — store amount only (matches PACKAGES_FALLBACK)
          price: pkg.base_price ? `₹${Number(pkg.base_price).toLocaleString('en-IN')}` : '',
          base_price: pkg.base_price ?? 0,
          tags: (pkg.elements ?? [])
            .map(el => el.service?.name)
            .filter(Boolean)
            .concat('More'),
          event_slugs: normaliseRelationArray(pkg.events)
            .map(event => event?.slug)
            .filter(Boolean),
          event_ids: normaliseRelationArray(pkg.events)
            .map(event => String(event?.id))
            .filter(Boolean),
          category_slugs: normaliseRelationArray(pkg.events)
            .map(event => event?.parent_event?.slug)
            .filter(Boolean),
          category_ids: normaliseRelationArray(pkg.events)
            .map(event => String(event?.parent_event?.id))
            .filter(Boolean),
          service_slugs: normaliseRelationArray(pkg.service_categories)
            .map(service => service?.slug)
            .filter(Boolean),
          service_ids: normaliseRelationArray(pkg.service_categories)
            .map(service => String(service?.id))
            .filter(Boolean),
          theme_slugs: normaliseRelationArray(pkg.themes)
            .map(theme => theme?.slug)
            .filter(Boolean),
          level_slug: pkg.budget_level?.slug ?? '',
          level_id: pkg.budget_level?.id != null ? String(pkg.budget_level.id) : '',
          // Strapi image URL: prepend VITE_STRAPI_URL to relative paths
          images: normaliseMediaArray(pkg.images)
            .map(img => {
              if (typeof img === 'string') return toAbsoluteStrapiUrl(img)
              return toAbsoluteStrapiUrl(img?.url)
            })
            .filter(Boolean),
          _index: i,
        }))
      } catch {
        return PACKAGES_FALLBACK
      }
    },
    placeholderData: PACKAGES_FALLBACK,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  })
}
