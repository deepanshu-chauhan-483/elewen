import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import {
  EVENT_CATEGORIES_FALLBACK,
  EVENT_CARDS_FALLBACK,
  SERVICE_CARDS_FALLBACK,
} from '../data/eventTypes'

const STRAPI_BASE = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'

const CATEGORY_FALLBACK_OPTIONS = [
  {
    id: 'social',
    documentId: null,
    name: 'Social',
    slug: 'social',
    description: 'Birthdays, parties & more',
    badge: 'S',
  },
  {
    id: 'religious',
    documentId: null,
    name: 'Religious',
    slug: 'religious',
    description: 'Puja, ceremonies & rituals',
    badge: 'R',
  },
  {
    id: 'corporate',
    documentId: null,
    name: 'Corporate',
    slug: 'corporate',
    description: 'Conferences, launches & more',
    badge: 'C',
  },
]

const SERVICE_OPTIONS_FALLBACK = [
  {
    id: 'decor',
    documentId: null,
    name: 'Decor',
    slug: 'decor',
    description: 'Thoughtful visual styling designed around your event mood and format.',
    category: 'Decor',
    image: null,
  },
  {
    id: 'rental-furniture',
    documentId: null,
    name: 'Rental Furniture',
    slug: 'rental-furniture',
    description: 'Flexible seating, tables, lounges, and setup pieces for smooth hosting.',
    category: 'Rental Furniture',
    image: null,
  },
  {
    id: 'catering',
    documentId: null,
    name: 'Catering',
    slug: 'catering',
    description: 'Curated food formats and service planning for gatherings of every scale.',
    category: 'Food & Beverage',
    image: null,
  },
  {
    id: 'bartending',
    documentId: null,
    name: 'Bartending',
    slug: 'bartending',
    description: 'Bar setup, staff, and beverage service designed for seamless guest flow.',
    category: 'Food & Beverage',
    image: null,
  },
  {
    id: 'sheesha',
    documentId: null,
    name: 'Sheesha',
    slug: 'sheesha',
    description: 'Relaxed lounge experiences with managed setup and guest-ready presentation.',
    category: 'Sheesha',
    image: null,
  },
]

const DECOR_THEME_FALLBACK = [
  { id: 'retro', label: 'Retro', slug: 'retro', preview_image: null },
  { id: 'disco', label: 'Disco', slug: 'disco', preview_image: null },
  { id: 'floral', label: 'Floral', slug: 'floral', preview_image: null },
  { id: 'bollywood', label: 'Bollywood', slug: 'bollywood', preview_image: null },
]

const LEVELS_FALLBACK = [
  {
    id: 'level-1',
    label: 'Level 1',
    slug: 'level-1',
    description: 'Thoughtfully put together essentials for smaller guest counts.',
    price: 'Starting 15,000',
  },
  {
    id: 'level-2',
    label: 'Level 2',
    slug: 'level-2',
    description: 'A more detailed setup with a stronger visual and service experience.',
    price: 'Starting 35,000',
  },
  {
    id: 'level-3',
    label: 'Level 3',
    slug: 'level-3',
    description: 'Premium styling and service depth for larger or more layered celebrations.',
    price: 'Starting 70,000',
  },
  {
    id: 'level-4',
    label: 'Level 4',
    slug: 'level-4',
    description: 'High-touch package planning for bigger-format guest experiences.',
    price: 'Starting 70,000',
  },
]

const blocksToText = blocks => {
  if (!blocks || !Array.isArray(blocks)) return ''
  return blocks
    .map(block => (block.children ?? []).map(child => child.text ?? '').join(''))
    .filter(Boolean)
    .join(' ')
}

const toAbsoluteStrapiUrl = url => {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${STRAPI_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

const slugify = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const badgeFromName = name => (name?.trim()?.charAt(0) ?? '').toUpperCase()

const mapEventCategory = event => ({
  id: event.id,
  documentId: event.documentId,
  name: event.name?.trim() ?? '',
  slug: event.slug?.trim() || slugify(event.name),
  description: event.tagline?.trim() || blocksToText(event.description),
  badge: badgeFromName(event.name),
})

const mapEventCard = event => ({
  id: event.id,
  documentId: event.documentId,
  slug: event.slug?.trim() || slugify(event.name),
  title: event.name?.trim() ?? '',
  tagline: event.tagline?.trim() ?? '',
  description: blocksToText(event.description) || event.tagline?.trim() || '',
  category: (event.parent_event?.name ?? '').trim(),
  categorySlug: event.parent_event?.slug?.trim() || slugify(event.parent_event?.name),
  image: toAbsoluteStrapiUrl(event.icon?.url),
})

const mapServiceCategory = service => ({
  id: service.id,
  documentId: service.documentId,
  name: service.name?.trim() ?? '',
  slug: service.slug?.trim() || slugify(service.name),
  description: Array.isArray(service.description)
    ? blocksToText(service.description)
    : (service.description ?? ''),
  category: (service.parent_category?.name ?? service.name ?? '').trim(),
  image: toAbsoluteStrapiUrl(service.icon?.url),
  wizardSteps: Array.isArray(service.wizard_steps) ? service.wizard_steps : [],
})

const findStepBySource = (steps, sourceName) =>
  (Array.isArray(steps) ? steps : []).find(step => step?.source === sourceName) ?? null

const getFallbackEventsByCategory = categorySlug =>
  EVENT_CARDS_FALLBACK.filter(event => slugify(event.category) === slugify(categorySlug)).map(
    (event, index) => ({
      id: event.id ?? index,
      documentId: event.documentId,
      slug: slugify(event.title),
      title: event.title,
      description: event.description || event.tagline || '',
      category: event.category,
      categorySlug: slugify(event.category),
      image: event.image ?? null,
    })
  )

const parseQueryStringParams = value => {
  const params = {}
  const source = String(value ?? '')
    .trim()
    .replace(/^&+/, '')
  if (!source) return params

  const searchParams = new URLSearchParams(source)
  for (const [key, rawValue] of searchParams.entries()) {
    params[key] = rawValue
  }
  return params
}

const mapWizardOption = (item, index) => ({
  id: item?.id ?? index,
  label: item?.name ?? item?.label ?? item?.title ?? `Option ${index + 1}`,
  slug:
    item?.slug?.trim() || slugify(item?.name ?? item?.label ?? item?.title ?? item?.id ?? index),
  preview_image: toAbsoluteStrapiUrl(item?.preview_image?.url ?? item?.preview_image),
  description:
    typeof item?.description === 'string' ? item.description : blocksToText(item?.description),
  starting_price: item?.starting_price ?? item?.base_price ?? null,
})

const mapLevelOption = (level, index) => ({
  id: level.id ?? index,
  label: level.label ?? `Level ${index + 1}`,
  slug: level.slug ?? slugify(level.label ?? `level-${index + 1}`),
  description: level.description ?? 'Choose the package level that matches your event scale.',
  price: level.starting_price
    ? `Starting ${Number(level.starting_price).toLocaleString('en-IN')}`
    : '',
})

const resolveWizardStepsFromStrapi = async serviceCategoryId => {
  if (!serviceCategoryId) return { steps: [] }

  const { data: categories } = await strapiGet('/service-categories', {
    'filters[id][$eq]': serviceCategoryId,
  })

  const category = categories?.[0]
  const steps = Array.isArray(category?.wizard_steps) ? category.wizard_steps : []

  const resolvedSteps = await Promise.all(
    steps.map(async step => {
      if (!step?.source) return step

      try {
        const params = {
          'filters[is_active][$eq]': 'true',
          ...parseQueryStringParams(step.source_filter),
        }

        if (step.source === 'themes') {
          params['populate[0]'] = 'preview_image'
        }

        const { data: items } = await strapiGet(`/${step.source}`, params)
        return {
          ...step,
          options: (items ?? []).map(mapWizardOption),
        }
      } catch {
        return {
          ...step,
          options: [],
        }
      }
    })
  )

  return {
    serviceCategoryId: String(serviceCategoryId),
    categoryName: category?.name ?? '',
    steps: resolvedSteps,
  }
}

export function useEventCategoryOptions() {
  return useQuery({
    queryKey: ['event-category-options'],
    queryFn: async () => {
      if (USE_FALLBACK) return CATEGORY_FALLBACK_OPTIONS
      try {
        const { data } = await strapiGet('/events', {
          'filters[parent_event][id][$null]': 'true',
          'filters[is_active][$eq]': 'true',
          sort: 'name:asc',
        })
        return data.map(mapEventCategory)
      } catch {
        return CATEGORY_FALLBACK_OPTIONS
      }
    },
    placeholderData: CATEGORY_FALLBACK_OPTIONS,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

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
        return data.map(event => event.name.trim())
      } catch {
        return EVENT_CATEGORIES_FALLBACK
      }
    },
    placeholderData: EVENT_CATEGORIES_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

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
        return data.map(mapEventCard).map(event => ({
          ...event,
          title: event.title.toUpperCase(),
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

export function useEventsByCategory(categorySlug) {
  return useQuery({
    queryKey: ['event-flow-events', categorySlug],
    queryFn: async () => {
      const fallback = getFallbackEventsByCategory(categorySlug)

      if (!categorySlug) return fallback
      if (USE_FALLBACK) return fallback

      try {
        const { data } = await strapiGet('/events', {
          'filters[parent_event][slug][$eq]': categorySlug,
          'filters[is_active][$eq]': 'true',
          'populate[0]': 'parent_event',
          'populate[1]': 'icon',
          sort: 'name:asc',
        })
        return data.map(mapEventCard)
      } catch {
        return fallback
      }
    },
    placeholderData: getFallbackEventsByCategory(categorySlug),
    staleTime: 10 * 60 * 1000,
    retry: 1,
    enabled: Boolean(categorySlug),
  })
}

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
        return data.map(service => ({
          id: service.id,
          documentId: service.documentId,
          title: service.name ?? '',
          slug: service.slug?.trim() || slugify(service.name),
          description: Array.isArray(service.description)
            ? blocksToText(service.description)
            : (service.description ?? ''),
          category: (service.parent_category?.name ?? service.name ?? '').trim(),
          image: toAbsoluteStrapiUrl(service.icon?.url),
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

export function useServiceOptions() {
  return useFilteredServiceOptions()
}

export function useFilteredServiceOptions(allowedSlugs = []) {
  return useQuery({
    queryKey: ['service-options', [...allowedSlugs].sort()],
    queryFn: async () => {
      const normalizedAllowedSlugs = [...new Set((allowedSlugs ?? []).map(slugify).filter(Boolean))]
      const filterByAllowedSlugs = items => {
        if (!normalizedAllowedSlugs.length) return items
        return items.filter(item => normalizedAllowedSlugs.includes(slugify(item?.slug)))
      }

      if (USE_FALLBACK) return filterByAllowedSlugs(SERVICE_OPTIONS_FALLBACK)
      try {
        const { data } = await strapiGet('/service-categories', {
          'filters[is_active][$eq]': 'true',
          'populate[0]': 'parent_category',
          'populate[1]': 'icon',
          sort: 'name:asc',
        })
        return filterByAllowedSlugs(data.map(mapServiceCategory))
      } catch {
        return filterByAllowedSlugs(SERVICE_OPTIONS_FALLBACK)
      }
    },
    placeholderData: () => {
      const normalizedAllowedSlugs = [...new Set((allowedSlugs ?? []).map(slugify).filter(Boolean))]
      if (!normalizedAllowedSlugs.length) return SERVICE_OPTIONS_FALLBACK
      return SERVICE_OPTIONS_FALLBACK.filter(item =>
        normalizedAllowedSlugs.includes(slugify(item?.slug))
      )
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

export function usePackageWizardSteps(serviceCategoryId) {
  return useQuery({
    queryKey: ['package-wizard-steps', serviceCategoryId],
    queryFn: async () => {
      if (!serviceCategoryId) return { steps: [] }
      try {
        return await resolveWizardStepsFromStrapi(serviceCategoryId)
      } catch {
        return { steps: [] }
      }
    },
    placeholderData: { steps: [] },
    staleTime: 10 * 60 * 1000,
    retry: 1,
    enabled: Boolean(serviceCategoryId),
  })
}

export function useDecorThemeOptions(serviceCategoryId) {
  const query = usePackageWizardSteps(serviceCategoryId)
  const step = findStepBySource(query.data?.steps, 'themes')
  return {
    ...query,
    data: step?.options?.length ? step.options : DECOR_THEME_FALLBACK,
  }
}

export function useBudgetLevelOptions(serviceCategoryId) {
  const wizardQuery = usePackageWizardSteps(serviceCategoryId)
  const step = findStepBySource(wizardQuery.data?.steps, 'budget-levels')
  const budgetLevelsQuery = useQuery({
    queryKey: ['budget-level-options'],
    queryFn: async () => {
      if (USE_FALLBACK) return LEVELS_FALLBACK
      try {
        const { data } = await strapiGet('/budget-levels', {
          'filters[is_active][$eq]': 'true',
          sort: 'display_order:asc',
        })
        return data.map(mapLevelOption)
      } catch {
        return LEVELS_FALLBACK
      }
    },
    placeholderData: LEVELS_FALLBACK,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  return {
    ...wizardQuery,
    data: step?.options?.length ? step.options.map(mapLevelOption) : budgetLevelsQuery.data,
  }
}
