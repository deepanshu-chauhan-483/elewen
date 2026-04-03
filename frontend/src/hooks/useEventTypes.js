import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import {
  EVENT_CATEGORIES_FALLBACK,
  EVENT_CARDS_FALLBACK,
  SERVICE_CARDS_FALLBACK,
} from '../data/eventTypes'

const blocksToText = blocks => {
  if (!blocks || !Array.isArray(blocks)) return ''
  return blocks
    .map(b => (b.children ?? []).map(c => c.text ?? '').join(''))
    .filter(Boolean)
    .join(' ')
}

/**
 * Top-level event categories (Social, Corporate, Religious).
 * Strapi: GET /api/events?filters[parent_event][id][$null]=true&filters[is_active][$eq]=true&sort=name:asc
 */
export function useEventCategories() {
  return useQuery({
    queryKey: ['event-categories'],
    queryFn: async () => {
      if (USE_FALLBACK) return EVENT_CATEGORIES_FALLBACK
      try {
        const { data } = await strapiGet('/events', {
          'filters[parent_event][id][$null]': 'true',
          'filters[is_active][$eq]': 'true',
          sort: 'name:asc',
        })
        return data.map(e => e.name)
      } catch {
        return EVENT_CATEGORIES_FALLBACK
      }
    },
    placeholderData: EVENT_CATEGORIES_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Featured event sub-types for the Plan Your Event cards.
 * Strapi: GET /api/events?filters[parent_event][id][$null]=false&filters[is_featured][$eq]=true&filters[is_active][$eq]=true&populate=parent_event
 */
export function useEventCards() {
  return useQuery({
    queryKey: ['event-cards'],
    queryFn: async () => {
      if (USE_FALLBACK) return EVENT_CARDS_FALLBACK
      try {
        const { data } = await strapiGet('/events', {
          'filters[parent_event][id][$null]': 'false',
          'filters[is_featured][$eq]': 'true',
          'filters[is_active][$eq]': 'true',
          'populate[0]': 'parent_event',
          'populate[1]': 'icon',
          sort: 'name:asc',
        })
        const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
        return data.map(e => ({
          id: e.id,
          documentId: e.documentId,
          title: e.name?.toUpperCase() ?? '',
          tagline: e.tagline ?? '',
          description: blocksToText(e.description),
          category: e.parent_event?.name ?? '',
          image: e.icon?.url
            ? e.icon.url.startsWith('http')
              ? e.icon.url
              : `${base}${e.icon.url}`
            : null,
        }))
      } catch {
        return EVENT_CARDS_FALLBACK
      }
    },
    placeholderData: EVENT_CARDS_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Featured service categories for the What To Plan section.
 * Strapi: GET /api/service-categories?filters[is_featured][$eq]=true&filters[is_active][$eq]=true&populate=parent_category&sort=name:asc
 *
 * NOTE: Strapi `service-category` has no `category` string field.
 * Category is derived from `parent_category.name` (the parent service category,
 * e.g. "Decor", "Food & Beverage", "Tech").
 */
export function useServiceCards() {
  return useQuery({
    queryKey: ['service-cards'],
    queryFn: async () => {
      if (USE_FALLBACK) return SERVICE_CARDS_FALLBACK
      try {
        const { data } = await strapiGet('/service-categories', {
          'filters[is_featured][$eq]': 'true',
          'filters[is_active][$eq]': 'true',
          'populate[0]': 'parent_category',
          'populate[1]': 'icon',
          sort: 'name:asc',
        })
        const base = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
        return data.map(s => ({
          id: s.id,
          documentId: s.documentId,
          title: s.name ?? '',
          description: s.description ?? '',
          category: s.parent_category?.name ?? '',
          image: s.icon?.url
            ? s.icon.url.startsWith('http')
              ? s.icon.url
              : `${base}${s.icon.url}`
            : null,
        }))
      } catch {
        return SERVICE_CARDS_FALLBACK
      }
    },
    placeholderData: SERVICE_CARDS_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}
