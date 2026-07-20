import { useQuery } from '@tanstack/react-query'
import { strapiGet, USE_FALLBACK } from '../lib/strapi'
import {
  DECOR_LANE_LABEL,
  DECOR_SETUPS_LABEL,
  EVENT_CATEGORIES_FALLBACK,
  EVENT_CARDS_FALLBACK,
  normalizeServiceLaneKey,
  SERVICE_CARDS_FALLBACK,
  SOCIAL_EVENT_ORDER,
} from '../data/eventTypes'
import { offlineServiceImage } from '../data/offlineMedia'
import { canonicalizeEventSlug } from '../lib/packageFilters'

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
    name: DECOR_LANE_LABEL,
    slug: 'decor',
    description: 'Thoughtful visual styling designed around your event mood and format.',
    category: DECOR_LANE_LABEL,
    image: '/offline-media/services/decor.png',
  },
  {
    id: 'catering',
    documentId: null,
    name: 'Catering',
    slug: 'catering',
    description: 'Curated food formats and service planning for gatherings of every scale.',
    category: 'Catering',
    image: '/offline-media/services/catering.png',
  },
  {
    id: 'bartending',
    documentId: null,
    name: 'Bartending',
    slug: 'bartending',
    description: 'Bar setup, staff, and beverage service designed for seamless guest flow.',
    category: 'Bartending',
    image: '/offline-media/services/bartending.png',
  },
  {
    id: 'sheesha',
    documentId: null,
    name: 'Sheesha / Hookah',
    slug: 'sheesha',
    description: 'Relaxed lounge experiences with managed setup and guest-ready presentation.',
    category: 'Sheesha / Hookah',
    image: '/offline-media/services/sheesha.png',
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
  'technical-showrunning',
  'technical',
  'other',
])

const SERVICE_DISPLAY_ORDER = ['decor', 'catering', 'bartending', 'sheesha']

const SERVICE_CARD_ORDER = [
  'decoration',
  'furniture',
  'catering',
  'bartending',
  'bar-tending',
  'sheesha',
]

const canonicalizeServiceSlug = value => {
  const slug = slugify(value)
  if (slug === 'bar-tending') return 'bartending'
  if (slug === 'sheesha-services' || slug === 'hookah') return 'sheesha'
  if (slug === 'decor-setups' || slug === 'decor-services') return 'decoration'
  if (slug === 'rental-furniture') return 'furniture'
  return slug
}

const displayServiceTitle = (slug, name) => {
  const normalized = canonicalizeServiceSlug(slug || name)
  if (normalized === 'sheesha') return 'Sheesha / Hookah'
  if (normalized === 'decoration' || normalized === 'decor') {
    if (/decor\s*setups?/i.test(name) || /decoration/i.test(name) || !name) return DECOR_SETUPS_LABEL
    if (slugify(name) === 'decor' || normalizeServiceLaneKey(name) === 'decor') return DECOR_LANE_LABEL
  }
  return name?.trim() || titleizeFromSlug(normalized)
}

const titleizeFromSlug = value =>
  String(value ?? '')
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const resolveServiceCategory = (service, displayName, name) => {
  const parentName = String(service.parent_category?.name ?? '').trim()
  const slug = canonicalizeServiceSlug(service.slug ?? name)
  const isFoodBeverageParent = /food\s*&\s*beverage/i.test(parentName)

  // Keep each service as its own top-level lane (no F&B grouping).
  if (isFoodBeverageParent) {
    if (slug === 'sheesha') return 'Sheesha / Hookah'
    return displayName || name
  }

  if (
    normalizeServiceLaneKey(parentName) === 'decor' ||
    slug === 'decoration' ||
    slug === 'furniture'
  ) {
    return DECOR_LANE_LABEL
  }
  if (slug === 'sheesha') return 'Sheesha / Hookah'
  if (parentName) return sanitizeEventText(parentName)

  return displayName || name
}

const DECOR_THEME_DISPLAY_ORDER = [
  'house-party',
  'birthday-party',
  'still-us',
  'bubbles-and-black-tie',
  'bohemian',
  'pastel',
  'a-little-honey',
  'oh-baby',
  'sufi-night',
]

const DECOR_THEME_SLUG_ALIASES = {
  'little-honey': 'a-little-honey',
  'bubbles-black-tie': 'bubbles-and-black-tie',
  'ishq-sufiyana': 'sufi-night',
}

const DECOR_THEME_FALLBACK = [
  { id: 'house-party', label: 'House Party', slug: 'house-party', preview_image: null },
  { id: 'birthday-party', label: 'Birthday Party', slug: 'birthday-party', preview_image: null },
  { id: 'still-us', label: 'Still Us', slug: 'still-us', preview_image: null },
  {
    id: 'bubbles-and-black-tie',
    label: 'Bubbles & Black Tie',
    slug: 'bubbles-and-black-tie',
    preview_image: null,
  },
  { id: 'bohemian', label: 'Bohemian', slug: 'bohemian', preview_image: null },
  { id: 'pastel', label: 'Pastel', slug: 'pastel', preview_image: null },
  { id: 'a-little-honey', label: 'A little honey', slug: 'a-little-honey', preview_image: null },
  { id: 'oh-baby', label: 'Oh Baby', slug: 'oh-baby', preview_image: null },
  { id: 'sufi-night', label: 'Sufi Night', slug: 'sufi-night', preview_image: null },
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

function resolveStrapiMediaUrl(media) {
  if (!media) return null
  if (typeof media === 'string') return toAbsoluteStrapiUrl(media)

  const nested = media?.data?.attributes ?? media?.attributes ?? media
  const directUrl =
    nested?.url ??
    nested?.formats?.large?.url ??
    nested?.formats?.medium?.url ??
    nested?.formats?.small?.url ??
    media?.url ??
    media?.formats?.large?.url ??
    media?.formats?.medium?.url ??
    media?.formats?.small?.url

  return toAbsoluteStrapiUrl(directUrl)
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

// Fix CMS mojibake / plain Decor → branded Décor in event taglines and descriptions.
const sanitizeEventText = value => {
  if (typeof value !== 'string') return value

  return value
    .replace(/d\?\?cor/gi, match => (match[0] === 'D' ? DECOR_LANE_LABEL : 'décor'))
    .replace(/dÃ©cor/gi, match => (match[0] === 'D' ? DECOR_LANE_LABEL : 'décor'))
    .replace(/dÃƒÂ©cor/gi, match => (match[0] === 'D' ? DECOR_LANE_LABEL : 'décor'))
    .replace(/décor/gi, match => (match[0] === 'D' ? DECOR_LANE_LABEL : 'décor'))
    .replace(/decore/gi, match => (match[0] === 'D' ? DECOR_LANE_LABEL : 'décor'))
    .replace(/\bdecor\b/gi, match => (match[0] === 'D' ? DECOR_LANE_LABEL : 'décor'))
    .replace(/â€[œ]/g, '"')
    .replace(/â€[˜™]/g, "'")
    .replace(/â€"|â€“|â€”/g, ' - ')
    .replace(/â€¦/g, '...')
    .replace(/â€/g, '')
}

const socialEventOrderIndex = title => {
  const normalized = canonicalizeEventSlug(slugify(title))

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
    image: toAbsoluteStrapiUrl(event.icon?.url),
  }
}

const mapServiceCategory = service => {
  const rawName = sanitizeEventText(service.name?.trim() ?? '')
  const slug = service.slug?.trim() || slugify(rawName)
  const displayName = displayServiceTitle(slug, rawName)

  return {
    id: service.id,
    documentId: service.documentId,
    name: displayName,
    slug,
    description: sanitizeEventText(
      Array.isArray(service.description)
        ? blocksToText(service.description)
        : (service.description ?? '')
    ),
    category: resolveServiceCategory(service, displayName, rawName),
    image: toAbsoluteStrapiUrl(service.icon?.url) || offlineServiceImage(slug),
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
  if (label === 'other' || label.includes('other subcategory')) return true
  if (label.includes('technical') && label.includes('showrunning')) return true
  return false
}

const normalizeServiceCard = item => ({
  ...item,
  title: displayServiceTitle(item.slug, item.title ?? item.name),
  description: sanitizeEventText(item.description ?? ''),
  category: resolveServiceCategory(
    { slug: item.slug, parent_category: { name: item.category } },
    item.title ?? item.name,
    item.title ?? item.name
  ),
})

const orderServices = items => {
  const list = (Array.isArray(items) ? items : []).filter(item => !isExcludedService(item))

  return list.sort((a, b) => {
    const aSlug = canonicalizeServiceSlug(a.slug ?? a.title ?? a.name)
    const bSlug = canonicalizeServiceSlug(b.slug ?? b.title ?? b.name)
    const ai = SERVICE_CARD_ORDER.indexOf(aSlug === 'decor' ? 'decoration' : aSlug)
    const bi = SERVICE_CARD_ORDER.indexOf(bSlug === 'decor' ? 'decoration' : bSlug)

    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    }

    const ac = SERVICE_DISPLAY_ORDER.indexOf(aSlug === 'decoration' ? 'decor' : aSlug)
    const bc = SERVICE_DISPLAY_ORDER.indexOf(bSlug === 'decoration' ? 'decor' : bSlug)
    return (ac === -1 ? 999 : ac) - (bc === -1 ? 999 : bc)
  })
}

const decorThemeCanonicalSlug = theme => {
  const slug = slugify(theme?.slug ?? theme?.label ?? theme?.name)
  return DECOR_THEME_SLUG_ALIASES[slug] ?? slug
}

const decorThemeOrderIndex = theme => {
  const index = DECOR_THEME_DISPLAY_ORDER.indexOf(decorThemeCanonicalSlug(theme))
  return index === -1 ? 999 : index
}

const orderDecorThemes = themes =>
  [...(Array.isArray(themes) ? themes : [])].sort((a, b) => {
    const orderDiff = decorThemeOrderIndex(a) - decorThemeOrderIndex(b)
    if (orderDiff !== 0) return orderDiff

    return String(a?.label ?? '').localeCompare(String(b?.label ?? ''), undefined, {
      sensitivity: 'base',
    })
  })

const mergeMissingDecorThemes = (themes, fallbackThemes) => {
  const existingSlugs = new Set(themes.map(theme => decorThemeCanonicalSlug(theme)))
  const missing = (Array.isArray(fallbackThemes) ? fallbackThemes : []).filter(
    theme => !existingSlugs.has(decorThemeCanonicalSlug(theme))
  )

  return [...themes, ...missing]
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

const mapWizardOption = (item, index) => ({
  id: item?.id ?? index,
  label: item?.name ?? item?.label ?? item?.title ?? `Option ${index + 1}`,
  slug:
    item?.slug?.trim() || slugify(item?.name ?? item?.label ?? item?.title ?? item?.id ?? index),
  preview_image: resolveStrapiMediaUrl(item?.preview_image),
  description:
    typeof item?.description === 'string' ? item.description : blocksToText(item?.description),
  starting_price: item?.starting_price ?? item?.base_price ?? null,
  display_order: item?.display_order ?? null,
})

const mapLevelOption = (level, index) => {
  const label = level.label ?? level.name ?? `Level ${index + 1}`

  return {
    id: level.id ?? index,
    label,
    slug: getBudgetLevelSlug(level) || slugify(label),
    description: level.description ?? 'Choose the package level that matches your event scale.',
    price: level.starting_price
      ? `Starting ${Number(level.starting_price).toLocaleString('en-IN')}`
      : '',
    display_order: level.display_order ?? null,
  }
}

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
          params['populate[preview_image]'] = 'true'
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
        return data.map(mapEventCard).sort((a, b) => {
          if (slugify(a.category) === 'social' && slugify(b.category) === 'social') {
            return socialEventOrderIndex(a.title) - socialEventOrderIndex(b.title)
          }
          if (slugify(a.category) === 'social') return -1
          if (slugify(b.category) === 'social') return 1
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

const mapFallbackServiceCards = items => orderServices(items.map(normalizeServiceCard))

export function useServiceCards() {
  return useQuery({
    queryKey: ['service-cards'],
    queryFn: async () => {
      if (USE_FALLBACK) return mapFallbackServiceCards(SERVICE_CARDS_FALLBACK)
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
        return mapFallbackServiceCards(SERVICE_CARDS_FALLBACK)
      }
    },
    placeholderData: mapFallbackServiceCards(SERVICE_CARDS_FALLBACK),
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
        return ordered.filter(item => {
          const rawSlug = slugify(item?.slug)
          const canonical = canonicalizeServiceSlug(rawSlug)
          // Top-level service page lanes only (Decor, not Decor Setups/Furniture cards).
          if (canonical === 'decoration' || canonical === 'furniture') {
            return allowed.has(rawSlug) || allowed.has(canonical)
          }
          return allowed.has(canonical) || allowed.has(rawSlug)
        })
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
  const themesPreviewQuery = useQuery({
    queryKey: ['decor-theme-previews'],
    queryFn: async () => {
      if (USE_FALLBACK) return []
      try {
        const { data } = await strapiGet('/themes', {
          'filters[is_active][$eq]': 'true',
          'populate[preview_image]': 'true',
          sort: 'display_order:asc',
        })
        return sortByDisplayOrder((data ?? []).map(mapWizardOption))
      } catch {
        return []
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const step = findStepBySource(query.data?.steps, 'themes')
  const wizardOptions = step?.options?.length ? step.options : DECOR_THEME_FALLBACK
  const previewBySlug = new Map(
    (themesPreviewQuery.data ?? [])
      .map(theme => [slugify(theme.slug ?? theme.label), theme.preview_image])
      .filter(([, previewImage]) => Boolean(previewImage))
  )

  const mergedOptions = wizardOptions.map(option => {
    const slugKey = slugify(option.slug ?? option.label)
    const backendPreview = option.preview_image || previewBySlug.get(slugKey) || null
    return backendPreview ? { ...option, preview_image: backendPreview } : option
  })

  const themesWithFallback = mergeMissingDecorThemes(mergedOptions, DECOR_THEME_FALLBACK)

  return {
    ...query,
    isLoading: query.isLoading || themesPreviewQuery.isLoading,
    isFetching: query.isFetching || themesPreviewQuery.isFetching,
    data: filterDecorThemes(orderDecorThemes(themesWithFallback)),
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
