import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CustomSelect from '../common/CustomSelect'
import {
  useBudgetLevelOptions,
  useDecorThemeOptions,
  useEventCategoryOptions,
  useEventsByCategory,
  useFilteredServiceOptions,
} from '../../hooks/useEventTypes'
import {
  eventSlugsMatch,
  filterDecorThemesBySocialEvent,
  filterEventsWithPackages,
  filterThemesByEventPackages,
  normalizeServiceSlug,
} from '../../lib/packageFilters'
import {
  buildServiceDestination,
  DECOR_THEME_CATEGORY_SLUG,
  DEFAULT_EVENT_CATEGORY_SLUG,
  isConsultationOnlyEvent,
  isFallbackOnlyEvent,
  isServiceAllowedForCategory,
} from '../../lib/serviceFlow'
import { usePackages } from '../../hooks/usePackages'

function FilterPill({
  label,
  widthClass = '',
  value = '',
  options = [],
  onChange,
  disabled = false,
}) {
  return (
    <div className={`relative min-w-0 ${widthClass}`}>
      <CustomSelect
        variant="filter"
        value={value}
        options={options}
        onChange={nextValue => onChange?.({ target: { value: nextValue } })}
        disabled={disabled}
        placeholder={label}
      />
    </div>
  )
}

const titleizeSlug = value =>
  String(value ?? '')
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const DEFAULT_WIDTHS = {
  category: 'sm:w-fit',
  event: 'sm:w-fit',
  theme: 'sm:w-fit',
  level: 'sm:w-fit',
}

const CATEGORY_ORDER = ['social', 'corporate', 'religious']
const SERVICE_ORDER = ['decor', 'catering', 'bartending', 'sheesha']
const LEVEL_ORDER = ['level-1', 'level-2', 'level-3', 'level-4']

// Remember the last Social decor event+theme so switching to Corporate/Religious
// and back does not restart the Social flow from the Event picker.
const SOCIAL_DECOR_MEMORY_KEY = 'elewen:social-decor:last-selection'

function readSocialDecorMemory() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(SOCIAL_DECOR_MEMORY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeSocialDecorMemory(value) {
  if (typeof window === 'undefined') return
  try {
    if (value && (value.event || value.theme)) {
      window.sessionStorage.setItem(SOCIAL_DECOR_MEMORY_KEY, JSON.stringify(value))
    } else {
      window.sessionStorage.removeItem(SOCIAL_DECOR_MEMORY_KEY)
    }
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function formatLevelFilterLabel(slug = '', fallback = '') {
  const normalized = String(slug ?? '')
    .trim()
    .toLowerCase()
  const match = normalized.match(/^level-(\d+)$/)
  if (match) return `Level ${match[1]}`
  return fallback || titleizeSlug(slug)
}

function sortLevelsForHero(levels = []) {
  const list = Array.isArray(levels) ? [...levels] : []

  list.sort((a, b) => {
    const ai = LEVEL_ORDER.indexOf(String(a?.slug ?? '').toLowerCase())
    const bi = LEVEL_ORDER.indexOf(String(b?.slug ?? '').toLowerCase())
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    return String(a?.label ?? '').localeCompare(String(b?.label ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  })

  return list
}

const toSelectOption = item => ({
  value: item.slug,
  label: item.name ?? item.label ?? titleizeSlug(item.slug),
})

export default function PackageResultsHero({
  title = 'Showing results for:',
  filters = [],
  className = '',
  showThemeFilter = true,
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const categorySlug = searchParams.get('category')?.toLowerCase() ?? ''
  const eventSlug = searchParams.get('event')?.toLowerCase() ?? ''
  const eventId = searchParams.get('eventId') ?? ''
  const serviceSlug = normalizeServiceSlug(searchParams.get('service') ?? '')
  const themeSlug = searchParams.get('theme')?.toLowerCase() ?? ''
  const levelSlug = searchParams.get('level')?.toLowerCase() ?? ''
  const serviceIdParam = searchParams.get('serviceId') ?? ''
  const flow = searchParams.get('flow') ?? ''

  useEffect(() => {
    if (categorySlug) return

    setSearchParams(
      prevParams => {
        const nextParams = new URLSearchParams(prevParams)
        nextParams.set('category', DEFAULT_EVENT_CATEGORY_SLUG)
        return nextParams
      },
      { replace: true }
    )
  }, [categorySlug, setSearchParams])

  const { data: allCategories = [] } = useEventCategoryOptions()
  const { data: allServices = [] } = useFilteredServiceOptions(SERVICE_ORDER)
  const { data: allEvents = [] } = useEventsByCategory(categorySlug || DEFAULT_EVENT_CATEGORY_SLUG)
  const { data: packages = [] } = usePackages()

  const eventPackageFilters = useMemo(
    () => ({
      categorySlug: categorySlug || DEFAULT_EVENT_CATEGORY_SLUG,
      serviceSlug,
      serviceId: serviceIdParam || '',
      themeSlug,
      // Don't shrink the Event pill by the active Level — keep Birthday Parties etc. visible
      // the same way Theme stays available on decor.
      levelSlug: serviceSlug === 'catering' ? '' : levelSlug,
    }),
    [categorySlug, levelSlug, serviceIdParam, serviceSlug, themeSlug]
  )

  const categories = useMemo(
    () =>
      CATEGORY_ORDER.map(slug => allCategories.find(category => category.slug === slug)).filter(
        Boolean
      ),
    [allCategories]
  )

  const services = useMemo(
    () =>
      SERVICE_ORDER.map(slug => allServices.find(service => service.slug === slug))
        .filter(Boolean)
        .filter(service =>
          isServiceAllowedForCategory(service.slug, categorySlug || DEFAULT_EVENT_CATEGORY_SLUG)
        ),
    [allServices, categorySlug]
  )

  useEffect(() => {
    if (!serviceSlug) return
    if (isServiceAllowedForCategory(serviceSlug, categorySlug || DEFAULT_EVENT_CATEGORY_SLUG)) {
      return
    }

    const fallbackService = services.find(service =>
      isServiceAllowedForCategory(service.slug, categorySlug || DEFAULT_EVENT_CATEGORY_SLUG)
    )
    if (!fallbackService) return

    const destination = buildServiceDestination({
      categorySlug: categorySlug || DEFAULT_EVENT_CATEGORY_SLUG,
      eventSlug,
      eventId,
      serviceSlug: fallbackService.slug,
      serviceId: fallbackService.id != null ? String(fallbackService.id) : '',
    })
    navigate(destination, { replace: true })
  }, [categorySlug, eventId, eventSlug, navigate, serviceSlug, services])

  const selectedService = useMemo(
    () => services.find(service => normalizeServiceSlug(service.slug) === serviceSlug) ?? null,
    [services, serviceSlug]
  )

  const resolvedServiceId =
    serviceIdParam || (selectedService?.id != null ? String(selectedService.id) : '')

  const eventsWithPackages = useMemo(() => {
    if (!serviceSlug) return allEvents

    // Catering / F&B: show the full category event list in the pill (Social → Birthday Parties),
    // matching decor filter UX. Package rows still filter by CMS catering_level / budget_level.
    if (serviceSlug === 'catering' || serviceSlug === 'bartending' || serviceSlug === 'sheesha') {
      return allEvents
    }

    return filterEventsWithPackages(allEvents, packages, {
      ...eventPackageFilters,
      serviceId: resolvedServiceId,
    })
  }, [allEvents, eventPackageFilters, packages, resolvedServiceId, serviceSlug])

  const events = useMemo(
    () =>
      (Array.isArray(eventsWithPackages) ? eventsWithPackages : []).map(event => ({
        value: event.slug,
        label: event.title ?? titleizeSlug(event.slug),
        id: event.id != null ? String(event.id) : '',
      })),
    [eventsWithPackages]
  )

  // Resolve CMS option value when URL uses a product alias (birthday-parties ≠ birthday-celebrations).
  const selectedEventValue = useMemo(() => {
    if (eventId) {
      const byId = events.find(event => event.id === String(eventId))
      if (byId) return byId.value
    }

    if (eventSlug) {
      const bySlug = events.find(event => eventSlugsMatch(event.value, eventSlug))
      if (bySlug) return bySlug.value
    }

    return eventSlug
  }, [eventId, eventSlug, events])

  const isDecorService = serviceSlug === 'decor'
  const showLevelFilter = serviceSlug === 'decor' || serviceSlug === 'catering'

  useEffect(() => {
    if (showLevelFilter || !levelSlug) return

    setSearchParams(
      prevParams => {
        const nextParams = new URLSearchParams(prevParams)
        nextParams.delete('level')
        return nextParams
      },
      { replace: true }
    )
  }, [levelSlug, setSearchParams, showLevelFilter])

  const { data: allThemes = [] } = useDecorThemeOptions(isDecorService ? resolvedServiceId : '')

  const { data: allLevels = [] } = useBudgetLevelOptions(resolvedServiceId)

  const themes = useMemo(() => {
    if (!isDecorService) return []

    const scopedThemes = filterDecorThemesBySocialEvent(allThemes, eventSlug, packages)
    const packageBackedThemes = filterThemesByEventPackages(scopedThemes, packages, {
      categorySlug: categorySlug || DEFAULT_EVENT_CATEGORY_SLUG,
      eventSlug,
      eventId,
      serviceSlug,
      serviceId: resolvedServiceId,
    })

    return packageBackedThemes.map(theme => ({
      value: theme.slug,
      label: theme.label ?? titleizeSlug(theme.slug),
    }))
  }, [
    allThemes,
    categorySlug,
    eventId,
    eventSlug,
    isDecorService,
    packages,
    resolvedServiceId,
    serviceSlug,
  ])

  useEffect(() => {
    if (!themeSlug || !isDecorService) return

    // Theme is a social-only decor filter. If the URL carries a theme under
    // Corporate/Religious (e.g. user switched Category, or landed on a shared
    // link), strip it so the listing does not collapse to 0 packages.
    if (categorySlug !== DECOR_THEME_CATEGORY_SLUG) {
      setSearchParams(
        prevParams => {
          const nextParams = new URLSearchParams(prevParams)
          nextParams.delete('theme')
          return nextParams
        },
        { replace: true }
      )
      return
    }

    const themeStillAllowed = themes.some(theme => {
      const themeValue = String(theme.value ?? '')
        .trim()
        .toLowerCase()
      if (themeValue === themeSlug) return true

      const themeKey = themeValue
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const filterKey = themeSlug
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      return themeKey && filterKey && (themeKey === filterKey || themeKey.startsWith(`${filterKey}-`) || filterKey.startsWith(`${themeKey}-`))
    })
    if (themeStillAllowed) return

    setSearchParams(
      prevParams => {
        const nextParams = new URLSearchParams(prevParams)
        nextParams.delete('theme')
        return nextParams
      },
      { replace: true }
    )
  }, [
    categorySlug,
    isDecorService,
    setSearchParams,
    themeSlug,
    themes,
  ])

  useEffect(() => {
    if (!eventSlug && !eventId) return
    if (!serviceSlug) return

    const selectedStillAllowed = events.some(
      event =>
        (eventId && event.id === String(eventId)) ||
        (eventSlug && eventSlugsMatch(event.value, eventSlug))
    )
    if (selectedStillAllowed) return

    setSearchParams(
      prevParams => {
        const nextParams = new URLSearchParams(prevParams)
        nextParams.delete('event')
        nextParams.delete('eventId')
        return nextParams
      },
      { replace: true }
    )
  }, [eventId, eventSlug, events, serviceSlug, setSearchParams])

  const levels = useMemo(() => {
    const fromCms = sortLevelsForHero(allLevels)
    const bySlug = new Map(
      fromCms.map(level => [String(level?.slug ?? '').trim().toLowerCase(), level])
    )

    // Decor + catering Level pill always exposes Level 1–3 like the Theme pill options.
    const source =
      serviceSlug === 'catering' || serviceSlug === 'decor'
        ? ['level-1', 'level-2', 'level-3'].map(slug => {
            const existing = bySlug.get(slug)
            return (
              existing ?? {
                slug,
                label: formatLevelFilterLabel(slug),
              }
            )
          })
        : fromCms

    return source.map(level => ({
      value: level.slug,
      label: formatLevelFilterLabel(level.slug, level.label ?? titleizeSlug(level.slug)),
    }))
  }, [allLevels, serviceSlug])

  const handleApplyFilters = useCallback(() => {
    const resultsTop =
      typeof window !== 'undefined' ? Math.max(0, Math.floor(window.innerHeight * 0.55)) : 0
    window.scrollTo({ top: resultsTop, behavior: 'smooth' })
  }, [])

  const handleFilterChange = useCallback(
    (key, value) => {
      const nextParams = new URLSearchParams(searchParams)

      if (!value) {
        nextParams.delete(key)

        if (key === 'category') {
          nextParams.delete('event')
          nextParams.delete('eventId')
        }

        if (key === 'event') {  
          nextParams.delete('eventId')
        }

        if (key === 'service') {
          nextParams.delete('serviceId')
          nextParams.delete('theme')
        }

        setSearchParams(nextParams)
        return
      }

      if (key === 'category') {
        const previousCategory = String(categorySlug || DEFAULT_EVENT_CATEGORY_SLUG)
          .trim()
          .toLowerCase()
        const nextCategory = String(value).trim().toLowerCase()

        // Leaving Social decor: remember event+theme so returning to Social
        // resumes on the levels page instead of the Event picker.
        if (
          previousCategory === DECOR_THEME_CATEGORY_SLUG &&
          nextCategory !== DECOR_THEME_CATEGORY_SLUG &&
          isDecorService
        ) {
          writeSocialDecorMemory({
            event: eventSlug,
            eventId,
            theme: themeSlug,
          })
        }

        nextParams.set('category', value)
        nextParams.delete('event')
        nextParams.delete('eventId')
        // Theme is a social-only decor filter; it never applies to Corporate/Religious.
        nextParams.delete('theme')

        // Returning to Social decor: restore the last event+theme so the user
        // does not have to redo the Event → Theme → Levels flow.
        if (
          nextCategory === DECOR_THEME_CATEGORY_SLUG &&
          previousCategory !== DECOR_THEME_CATEGORY_SLUG &&
          isDecorService
        ) {
          const memory = readSocialDecorMemory()
          if (memory?.event) {
            nextParams.set('event', memory.event)
            if (memory.eventId) nextParams.set('eventId', memory.eventId)
            if (memory.theme) nextParams.set('theme', memory.theme)
          }
        }

        setSearchParams(nextParams)
        return
      }

      if (key === 'event') {
        if (isFallbackOnlyEvent(value)) {
          navigate('/fallback-screen')
          return
        }

        if (isConsultationOnlyEvent(value)) {
          navigate('/book-consultation')
          return
        }

        const matchedEvent = events.find(event => event.value === value) ?? null

        nextParams.set('event', value)
        if (matchedEvent?.id) nextParams.set('eventId', matchedEvent.id)
        else nextParams.delete('eventId')

        setSearchParams(nextParams)
        return
      }

      if (key === 'service') {
        const normalizedValue = normalizeServiceSlug(value)

        const matchedService =
          services.find(service => normalizeServiceSlug(service.slug) === normalizedValue) ?? null

        navigate(
          buildServiceDestination({
            categorySlug,
            eventSlug,
            eventId,
            serviceSlug: normalizedValue,
            serviceId: matchedService?.id != null ? String(matchedService.id) : '',
            flow,
          })
        )

        return
      }

      if (key === 'level') {
        nextParams.set('level', value)
        setSearchParams(nextParams)
        return
      }

      nextParams.set(key, value)
      setSearchParams(nextParams)
    },
    [
      categorySlug,
      eventId,
      eventSlug,
      events,
      flow,
      isDecorService,
      navigate,
      searchParams,
      services,
      setSearchParams,
      themeSlug,
    ]
  )

  const isCateringService = serviceSlug === 'catering'
  const isBartendingService = serviceSlug === 'bartending'

  const autoFilters = useMemo(() => {
    const servicePill = isCateringService
      ? {
          label: 'Catering',
          value: 'catering',
          widthClass: DEFAULT_WIDTHS.event,
          options: [{ value: 'catering', label: 'Catering' }],
          onChange: () => {},
          disabled: true,
        }
      : isBartendingService
        ? {
            label: 'Bartending',
            value: 'bartending',
            widthClass: DEFAULT_WIDTHS.event,
            options: [{ value: 'bartending', label: 'Bartending' }],
            onChange: () => {},
            disabled: true,
          }
        : {
            label: 'Event',
            value: selectedEventValue,
            widthClass: DEFAULT_WIDTHS.event,
            options: events.map(({ value, label }) => ({ value, label })),
            onChange: event => handleFilterChange('event', event.target.value),
          }

    return [
      {
        label: 'Category',
        value: categorySlug || DEFAULT_EVENT_CATEGORY_SLUG,
        widthClass: DEFAULT_WIDTHS.category,
        options: categories.map(toSelectOption),
        onChange: event => handleFilterChange('category', event.target.value),
      },
      servicePill,
      showLevelFilter
        ? {
            label: 'Level',
            value: levelSlug,
            widthClass: DEFAULT_WIDTHS.level,
            options: levels,
            onChange: event => handleFilterChange('level', event.target.value),
          }
        : null,
      isDecorService && categorySlug === DECOR_THEME_CATEGORY_SLUG && showThemeFilter
        ? {
            label: 'Theme',
            value: themeSlug,
            widthClass: DEFAULT_WIDTHS.theme,
            options: themes,
            onChange: event => handleFilterChange('theme', event.target.value),
          }
        : null,
    ].filter(Boolean)
  }, [
    categorySlug,
    categories,
    handleFilterChange,
    isBartendingService,
    isCateringService,
    isDecorService,
    selectedEventValue,
    events,
    levelSlug,
    levels,
    showLevelFilter,
    themeSlug,
    themes,
    showThemeFilter,
  ])

  const displayFilters = filters.length > 0 ? filters : autoFilters

  return (
    <section
      className={`relative mt-0 w-full overflow-hidden bg-[#591902] py-6 sm:py-8 ${className}`}
    >
      <div className="mx-2 w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-4 text-white lg:flex-row lg:items-center lg:gap-8">
          <span className="shrink-0 text-[14px] font-medium leading-[20px] text-white/90">
            {title}
          </span>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
            {displayFilters.map(filter => (
              <FilterPill
                key={`${filter.label}-${filter.widthClass ?? ''}`}
                label={filter.label}
                widthClass={filter.widthClass}
                value={filter.value ?? filter.label}
                options={filter.options ?? []}
                onChange={filter.onChange}
                disabled={filter.disabled ?? filters.length > 0}
              />
            ))}
            <button
              type="button"
              onClick={handleApplyFilters}
              className="flex h-[38px] items-center justify-center rounded-full bg-[#CDB17E] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#C6AB7F] shrink-0"
            >
              Go
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
