import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'

export const FAQ_ITEMS_FALLBACK = [
  {
    id: 1,
    category: 'general',
    q: 'How does Elewen work?',
    a: 'You select your event, choose services like decor or catering, and pick from curated packages. We handle the rest from coordination to execution.',
  },
  {
    id: 2,
    category: 'general',
    q: 'Can I customize a package?',
    a: '',
  },
  {
    id: 3,
    category: 'booking',
    q: 'Do I need to book everything at once?',
    a: '',
  },
  {
    id: 4,
    category: 'planner',
    q: 'What do the package levels mean?',
    a: '',
  },
  {
    id: 5,
    category: 'payment',
    q: 'Why does the final price differ from the starting price?',
    a: '',
  },
]

const FAQ_CATEGORIES_FALLBACK = [...new Set(FAQ_ITEMS_FALLBACK.map(item => item.category).filter(Boolean))]

export function useFaqItems() {
  return useQuery({
    queryKey: ['faq-items'],
    queryFn: async () => {
      if (USE_FALLBACK) return FAQ_ITEMS_FALLBACK

      try {
        const { data } = await strapiGet('/faq-items', {
          'filters[is_active][$eq]': 'true',
          sort: 'display_order:asc',
          'pagination[pageSize]': '100',
        })

        const items = Array.isArray(data)
          ? data.map((item, index) => ({
              id: item.id ?? index,
              category: item.category ?? '',
              q: item.question ?? '',
              a: item.answer ?? '',
            }))
          : []

        return items.length > 0 ? items : FAQ_ITEMS_FALLBACK
      } catch {
        return FAQ_ITEMS_FALLBACK
      }
    },
    placeholderData: FAQ_ITEMS_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

export function useFaqCategories() {
  return useQuery({
    queryKey: ['faq-categories'],
    queryFn: async () => {
      if (USE_FALLBACK) return FAQ_CATEGORIES_FALLBACK

      try {
        const { data } = await strapiGet('/faq-items', {
          'filters[is_active][$eq]': 'true',
          'fields[0]': 'category',
          'pagination[pageSize]': '100',
        })

        const categories = [...new Set((Array.isArray(data) ? data : []).map(item => item.category).filter(Boolean))]

        return categories.length > 0 ? categories : FAQ_CATEGORIES_FALLBACK
      } catch {
        return FAQ_CATEGORIES_FALLBACK
      }
    },
    placeholderData: FAQ_CATEGORIES_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}
