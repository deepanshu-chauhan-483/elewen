import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import {
  EVENT_CATEGORIES_FALLBACK,
  EVENT_CARDS_FALLBACK,
  SERVICE_CARDS_FALLBACK,
  SOCIAL_EVENT_ORDER,
  LIVE_SERVICE_IMAGES,
  LIVE_EVENT_IMAGES,
} from '../data/eventTypes'
import { liveThemeImage, resolveLiveImage } from '../data/liveMedia'

const STRAPI_BASE = import.meta.env.VITE_STRAPI_URL ?? '/cms'

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
    image: LIVE_SERVICE_IMAGES.decor,
  },
  {
    id: 'catering',
    documentId: null,
    name: 'Catering',
    slug: 'catering',
    description: 'Curated food formats and service planning for gatherings of every scale.',
    category: 'Catering',
    image: LIVE_SERVICE_IMAGES.catering,
  },
  {
    id: 'bartending',
    documentId: null,
    name: 'Bartending',
    slug: 'bartending',
    description: 'Bar setup, staff, and beverage service designed for seamless guest flow.',
    category: 'Bartending',
    image: LIVE_SERVICE_IMAGES.bartending,
  },
  {
    id: 'sheesha',
    documentId: null,
    name: 'Sheesha / Hookah',
    slug: 'sheesha',
    description: 'Relaxed lounge experiences with managed setup and guest-ready presentation.',
    category: 'Sheesha / Hookah',
    image: LIVE_SERVICE_IMAGES.sheesha,
  },
]

const EXCLUDED_SERVICE_SLUGS = new Set([
  'light',
  'lighting',
  'sound',
  'light-and-sound',
  'lighting-ambience',
  'lighting-and-ambience',
  'sound-setup',
  'sound-and-setup',
  'tenting',
])

const SERVICE_DISPLAY_ORDER = ['decor', 'catering', 'bartending', 'sheesha']

const SERVICE_CARD_ORDER = [
  'decoration',
  'furniture',
  'technical-showrunning',
  'catering',
  'bartending',
  'bar-tending',
  'sheesha',
]

const canonicalizeServiceSlug = value => {
  const slug = slugify(value)
  if (slug === 'bar-tending') return 'bartending'
  if (slug === 'sheesha-services') return 'sheesha'
  if (slug === 'furniture') return 'rental-furniture'
  return slug
}

const DECOR_THEME_FALLBACK = [
  {
    id: 'retro',
    label: 'Retro',
    slug: 'retro',
    preview_image: liveThemeImage('retro'),
  },
  {
    id: 'disco',
    label: 'Disco',
    slug: 'disco',
    preview_image: liveThemeImage('disco'),
  },
  {
    id: 'floral',
    label: 'Floral',
    slug: 'floral',
    preview_image: liveThemeImage('floral'),
  },
  {
    id: 'bollywood',
    label: 'Bollywood',
    slug: 'bollywood',
    preview_image: liveThemeImage('bollywood'),
  },
  {
    id: 'still-us',
    label: 'Still Us',
    slug: 'still-us',
    preview_image: liveThemeImage('still-us'),
  },
  {
    id: 'a-little-honey',
    label: 'A little honey',
    slug: 'a-little-honey',
    preview_image: liveThemeImage('a-little-honey'),
  },
  {
    id: 'oh-baby',
    label: 'Oh Baby',
    slug: 'oh-baby',
    preview_image: liveThemeImage('oh-baby'),
  },
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

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost'
  const normalizedBase =
    STRAPI_BASE.startsWith('http://') || STRAPI_BASE.startsWith('https://')
      ? STRAPI_BASE
      : `${origin}${STRAPI_BASE.startsWith('/') ? '' : '/'}${STRAPI_BASE}`

  return `${normalizedBase}${url.startsWith('/') ? '' : '/'}${url}`
}

const slugify = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getBudgetLevelSlug = level => {
  const label = String(level?.label ?? level?.name ?? '').trim()

  if (/^level\s+\d+$/i.test(label)) {
    return slugify(label)
  }

  return String(level?.slug ?? '').trim() || slugify(label)
}

const badgeFromName = name => (name?.trim()?.charAt(0) ?? '').toUpperCase()

// Fix mojibake / encoding-broken "Decor" in CMS taglines (e.g. "D??cor").
const sanitizeEventText = value => {
  if (typeof value !== 'string') return value

  return value
    .replace(/d\?\?cor/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
    .replace(/dÃ©cor/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
    .replace(/dÃƒÂ©cor/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
    .replace(/décor/gi, match => (match[0] === 'D' ? 'Decor' : 'decor'))
    .replace(/â€[œ]/g, '"')
    .replace(/â€[˜™]/g, "'")
    .replace(/â€"/g, ' - ')
    .replace(/â€“/g, ' - ')
    .replace(/â€”/g, ' - ')
    .replace(/â€¦/g, '...')
    .replace(/â€\?/g, ' - ')
    .replace(/â€/g, '')
}

const socialEventOrderIndex = title => {
  const normalized = slugify(title)
  const exact = SOCIAL_EVENT_ORDER.findIndex(name => slugify(name) === normalized)
  if (exact !== -1) return exact

  // Match CMS variants like "Birthday Celebrations" → "Birthday Parties".
  const firstToken = normalized.split('-')[0]
  const fuzzy = SOCIAL_EVENT_ORDER.findIndex(name => slugify(name).startsWith(firstToken))
  return fuzzy === -1 ? 999 : fuzzy
}

const orderEventsForCategory = (events, categorySlug) => {
  const list = Array.isArray(events) ? [...events] : []

  if (slugify(categorySlug) !== 'social') return list

  return list.sort((a, b) => {
    const orderDiff = socialEventOrderIndex(a.title) - socialEventOrderIndex(b.title)
    if (orderDiff !== 0) return orderDiff
    return String(a.title ?? '').localeCompare(String(b.title ?? ''), undefined, {
      sensitivity: 'base',
    })
  })
}

const mapEventCategory = event => ({
  id: event.id,
  documentId: event.documentId,
  name: event.name?.trim() ?? '',
  slug: event.slug?.trim() || slugify(event.name),
  description: sanitizeEventText(event.tagline?.trim() || blocksToText(event.description)),
  badge: badgeFromName(event.name),
  icon: toAbsoluteStrapiUrl(event.icon?.url),
})

const mapEventCard = event => {
  const tagline = sanitizeEventText(event.tagline?.trim() ?? '')
  const description = sanitizeEventText(
    blocksToText(event.description) || event.tagline?.trim() || ''
  )

  return {
    id: event.id,
    documentId: event.documentId,
    slug: event.slug?.trim() || slugify(event.name),
    title: event.name?.trim() ?? '',
    tagline,
    description,
    category: (event.parent_event?.name ?? '').trim(),
    categorySlug: event.parent_event?.slug?.trim() || slugify(event.parent_event?.name),
    image: resolveLiveImage(
      toAbsoluteStrapiUrl(event.icon?.url),
      LIVE_EVENT_IMAGES[event.slug?.trim()] ?? LIVE_EVENT_IMAGES[slugify(event.name)] ?? null
    ),
  }
}

const resolveServiceCategory = (service, displayName, name) => {
  const parentName = String(service.parent_category?.name ?? '').trim()
  const isFoodBeverageParent = /food\s*&\s*beverage/i.test(parentName)

  if (isFoodBeverageParent) return displayName || name
  if (parentName) return parentName

  return displayName || name
}

const mapServiceCategory = service => {
  const slug = service.slug?.trim() || slugify(service.name)
  const name = service.name?.trim() ?? ''
  const displayName =
    slugify(slug) === 'sheesha' || slugify(name) === 'sheesha' ? 'Sheesha / Hookah' : name

  return {
    id: service.id,
    documentId: service.documentId,
    name: displayName,
    slug,
    description: Array.isArray(service.description)
      ? blocksToText(service.description)
      : (service.description ?? ''),
    category: resolveServiceCategory(service, displayName, name),
    image: resolveLiveImage(
      toAbsoluteStrapiUrl(service.icon?.url),
      LIVE_SERVICE_IMAGES[slugify(slug)] ??
        LIVE_SERVICE_IMAGES[canonicalizeServiceSlug(slug)] ??
        null
    ),
    wizardSteps: Array.isArray(service.wizard_steps) ? service.wizard_steps : [],
  }
}

const isExcludedService = item => {
  const slug = canonicalizeServiceSlug(item?.slug ?? item?.title ?? item?.name)
  const label = String(item?.title ?? item?.name ?? item?.label ?? '')
    .trim()
    .toLowerCase()

  if (EXCLUDED_SERVICE_SLUGS.has(slug)) return true
  if (slug.includes('light') && slug.includes('sound')) return true
  if (label.includes('lighting') || label.includes('light and sound')) return true
  if (label.includes('sound') && label.includes('setup')) return true
  return false
}

const orderServices = items => {
  const list = (Array.isArray(items) ? items : []).filter(item => !isExcludedService(item))

  return list.sort((a, b) => {
    const aSlug = canonicalizeServiceSlug(a.slug ?? a.title ?? a.name)
    const bSlug = canonicalizeServiceSlug(b.slug ?? b.title ?? b.name)
    const ai = SERVICE_CARD_ORDER.indexOf(aSlug)
    const bi = SERVICE_CARD_ORDER.indexOf(bSlug)

    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    }

    const ac = SERVICE_DISPLAY_ORDER.indexOf(aSlug)
    const bc = SERVICE_DISPLAY_ORDER.indexOf(bSlug)
    return (ac === -1 ? 999 : ac) - (bc === -1 ? 999 : bc)
  })
}

const filterDecorThemes = themes =>
  (Array.isArray(themes) ? themes : []).filter(theme => {
    const label = String(theme?.label ?? theme?.name ?? '')
      .trim()
      .toLowerCase()
    const slug = slugify(theme?.slug ?? label)
    return label !== 'other' && slug !== 'other'
  })

const findStepBySource = (steps, sourceName) =>
  (Array.isArray(steps) ? steps : []).find(step => step?.source === sourceName) ?? null

const getFallbackEventsByCategory = categorySlug =>
  orderEventsForCategory(
    EVENT_CARDS_FALLBACK.filter(event => slugify(event.category) === slugify(categorySlug)).map(
      (event, index) => ({
        id: event.id ?? index,
        documentId: event.documentId,
        slug: slugify(event.title),
        title: event.title,
        description: sanitizeEventText(event.description || event.tagline || ''),
        category: event.category,
        categorySlug: slugify(event.category),
        image: event.image ?? null,
      })
    ),
    categorySlug
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

const mapWizardOption = (item, index) => {
  const slug =
    item?.slug?.trim() || slugify(item?.name ?? item?.label ?? item?.title ?? item?.id ?? index)
  const fromCms = toAbsoluteStrapiUrl(item?.preview_image?.url ?? item?.preview_image)

  return {
    id: item?.id ?? index,
    label: item?.name ?? item?.label ?? item?.title ?? `Option ${index + 1}`,
    slug,
    // CMS theme.preview_image is often empty — keep placeholder/fallback parity with live CDN.
    preview_image: fromCms || liveThemeImage(slug),
    description:
      typeof item?.description === 'string' ? item.description : blocksToText(item?.description),
    starting_price: item?.starting_price ?? item?.base_price ?? null,
    display_order: item?.display_order ?? null,
  }
}

const mapLevelOption = (level, index) => ({
  id: level.id ?? index,
  label: level.label ?? `Level ${index + 1}`,
  slug: getBudgetLevelSlug(level) || slugify(level.label ?? `level-${index + 1}`),
  description: level.description ?? 'Choose the package level that matches your event scale.',
  price: level.starting_price
    ? `Starting ${Number(level.starting_price).toLocaleString('en-IN')}`
    : '',
  display_order: level.display_order ?? null,
})

const sortByDisplayOrder = items =>
  [...(Array.isArray(items) ? items : [])].sort((a, b) => {
    const aOrder = Number.isFinite(Number(a?.display_order)) ? Number(a.display_order) : Infinity
    const bOrder = Number.isFinite(Number(b?.display_order)) ? Number(b.display_order) : Infinity

    if (aOrder !== bOrder) return aOrder - bOrder

    return String(a?.label ?? '').localeCompare(String(b?.label ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
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
          'populate[0]': 'icon',
          sort: 'name:asc',
        })
        const CATEGORY_ORDER = ['social', 'religious', 'corporate']
        const mapped = data.map(mapEventCategory)
        mapped.sort((a, b) => {
          const ai = CATEGORY_ORDER.indexOf(a.slug)
          const bi = CATEGORY_ORDER.indexOf(b.slug)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        })
        return mapped
      } catch {
        return CATEGORY_FALLBACK_OPTIONS
      }
    },
    placeholderData: CATEGORY_FALLBACK_OPTIONS,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

// Landing sidebar: Social → Religious → Corporate (Cashfree / product default).
// Unknown categories keep API order after the preferred ones.
const orderEventCategories = names => {
  const CATEGORY_ORDER = ['social', 'religious', 'corporate']
  const remaining = [...(Array.isArray(names) ? names : [])].filter(Boolean)
  const ordered = []

  for (const preferred of CATEGORY_ORDER) {
    const idx = remaining.findIndex(n => slugify(n) === preferred)
    if (idx !== -1) ordered.push(remaining.splice(idx, 1)[0])
  }

  return ordered.concat(remaining)
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
          sort: 'display_order:asc',
        })
        return orderEventCategories(data.map(event => event.name.trim()))
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
        const mapped = data.map(mapEventCard).map(event => ({
          ...event,
          title: event.title.toUpperCase(),
        }))
        const CATEGORY_ORDER = ['social', 'religious', 'corporate']

        return mapped.sort((a, b) => {
          const aCat = CATEGORY_ORDER.indexOf(slugify(a.category))
          const bCat = CATEGORY_ORDER.indexOf(slugify(b.category))
          const categoryDiff = (aCat === -1 ? 999 : aCat) - (bCat === -1 ? 999 : bCat)
          if (categoryDiff !== 0) return categoryDiff

          if (slugify(a.category) === 'social') {
            return socialEventOrderIndex(a.title) - socialEventOrderIndex(b.title)
          }

          return String(a.title ?? '').localeCompare(String(b.title ?? ''), undefined, {
            sensitivity: 'base',
          })
        })
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
        return orderEventsForCategory(data.map(mapEventCard), categorySlug)
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
      if (USE_FALLBACK) return orderServices(SERVICE_CARDS_FALLBACK)
      try {
        const { data } = await strapiGet('/service-categories', {
          'filters[is_featured][$eq]': 'true',
          'filters[is_active][$eq]': 'true',
          'populate[0]': 'parent_category',
          'populate[1]': 'icon',
          sort: 'name:asc',
        })
        const mapped = data.map(service => {
          const mappedService = mapServiceCategory(service)
          return {
            id: mappedService.id,
            documentId: mappedService.documentId,
            title: mappedService.name,
            slug: mappedService.slug,
            description: mappedService.description,
            category: mappedService.category,
            image: mappedService.image,
          }
        })
        return orderServices(mapped)
      } catch {
        return orderServices(SERVICE_CARDS_FALLBACK)
      }
    },
    placeholderData: orderServices(SERVICE_CARDS_FALLBACK),
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
        const ordered = orderServices(items)
        if (!normalizedAllowedSlugs.length) return ordered
        const allowed = new Set(normalizedAllowedSlugs.map(canonicalizeServiceSlug))
        return ordered.filter(item => allowed.has(canonicalizeServiceSlug(item?.slug)))
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
      const ordered = orderServices(SERVICE_OPTIONS_FALLBACK)
      if (!normalizedAllowedSlugs.length) return ordered
      const allowed = new Set(normalizedAllowedSlugs.map(canonicalizeServiceSlug))
      return ordered.filter(item => allowed.has(canonicalizeServiceSlug(item?.slug)))
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
  const themes = step?.options?.length ? step.options : DECOR_THEME_FALLBACK
  return {
    ...query,
    data: filterDecorThemes(themes),
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
        return sortByDisplayOrder(data.map(mapLevelOption))
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
    data: step?.options?.length
      ? sortByDisplayOrder(step.options.map(mapLevelOption))
      : budgetLevelsQuery.data,
  }
}
