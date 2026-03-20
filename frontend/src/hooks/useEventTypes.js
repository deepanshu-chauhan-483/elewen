import { useQuery } from '@tanstack/react-query'
import { strapiGet } from '../lib/strapi'
import {
  EVENT_CATEGORIES_FALLBACK,
  EVENT_CARDS_FALLBACK,
  SERVICE_CARDS_FALLBACK,
} from '../data/eventTypes'

/**
 * Top-level event categories (Social, Corporate, Religious).
 * Strapi: GET /api/events?filters[parent][id][$null]=true&sort=name:asc
 */
export function useEventCategories() {
  return useQuery({
    queryKey: ['event-categories'],
    queryFn: async () => {
      const { data } = await strapiGet('/events', {
        'filters[parent][id][$null]': 'true',
        sort: 'name:asc',
      })
      return data.map(e => e.name)
    },
    initialData: EVENT_CATEGORIES_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Featured event sub-types for the Plan Your Event cards.
 * Strapi: GET /api/events?filters[parent][id][$null]=false&filters[is_featured][$eq]=true&populate=parent
 */
export function useEventCards() {
  return useQuery({
    queryKey: ['event-cards'],
    queryFn: async () => {
      const { data } = await strapiGet('/events', {
        'filters[parent][id][$null]': 'false',
        'filters[is_featured][$eq]': 'true',
        populate: 'parent',
        sort: 'name:asc',
      })
      return data.map(e => ({
        id: e.id,
        documentId: e.documentId,
        title: e.name?.toUpperCase() ?? '',
        description: e.description ?? '',
        category: e.parent?.name ?? '',
      }))
    },
    initialData: EVENT_CARDS_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Featured service categories for the What To Plan section.
 * Strapi: GET /api/service-categories?filters[is_featured][$eq]=true&sort=name:asc
 */
export function useServiceCards() {
  return useQuery({
    queryKey: ['service-cards'],
    queryFn: async () => {
      const { data } = await strapiGet('/service-categories', {
        'filters[is_featured][$eq]': 'true',
        sort: 'name:asc',
      })
      return data.map(s => ({
        id: s.id,
        documentId: s.documentId,
        title: s.name ?? '',
        description: s.description ?? '',
        category: s.category ?? '',
      }))
    },
    initialData: SERVICE_CARDS_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}
