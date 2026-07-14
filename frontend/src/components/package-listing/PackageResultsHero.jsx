import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CustomSelect from '../common/CustomSelect'
import {
  useBudgetLevelOptions,
  useDecorThemeOptions,
  useEventCategoryOptions,
  useEventsByCategory,
  useFilteredServiceOptions,
} from '../../hooks/useEventTypes'
import { eventSlugsMatch, normalizeServiceSlug } from '../../lib/packageFilters'
import { buildServiceDestination } from '../../lib/serviceFlow'

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

  const { data: allCategories = [] } = useEventCategoryOptions()
  const { data: allServices = [] } = useFilteredServiceOptions(SERVICE_ORDER)
  const { data: allEvents = [] } = useEventsByCategory(categorySlug)

  const categories = useMemo(
    () =>
      CATEGORY_ORDER.map(slug => allCategories.find(category => category.slug === slug)).filter(
        Boolean
      ),
    [allCategories]
  )

  const services = useMemo(
    () =>
      SERVICE_ORDER.map(slug => allServices.find(service => service.slug === slug)).filter(Boolean),
    [allServices]
  )

  const events = useMemo(
    () =>
      (Array.isArray(allEvents) ? allEvents : []).map(event => ({
        value: event.slug,
        label: event.title ?? titleizeSlug(event.slug),
        id: event.id != null ? String(event.id) : '',
      })),
    [allEvents]
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

  const selectedService = useMemo(
    () => services.find(service => normalizeServiceSlug(service.slug) === serviceSlug) ?? null,
    [services, serviceSlug]
  )

  const resolvedServiceId =
    serviceIdParam || (selectedService?.id != null ? String(selectedService.id) : '')

  const isDecorService = serviceSlug === 'decor'

  const { data: allThemes = [] } = useDecorThemeOptions(isDecorService ? resolvedServiceId : '')

  const { data: allLevels = [] } = useBudgetLevelOptions(resolvedServiceId)

  const themes = useMemo(() => {
    if (!isDecorService) return []

    return (Array.isArray(allThemes) ? allThemes : []).map(theme => ({
      value: theme.slug,
      label: theme.label ?? titleizeSlug(theme.slug),
    }))
  }, [allThemes, isDecorService])

  const levels = useMemo(
    () =>
      sortLevelsForHero(allLevels).map(level => ({
        value: level.slug,
        label: level.label ?? titleizeSlug(level.slug),
      })),
    [allLevels]
  )

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
        nextParams.set('category', value)
        nextParams.delete('event')
        nextParams.delete('eventId')

        setSearchParams(nextParams)
        return
      }

      if (key === 'event') {
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

      nextParams.set(key, value)
      setSearchParams(nextParams)
    },
    [
      categorySlug,
      eventId,
      eventSlug,
      events,
      flow,
      navigate,
      searchParams,
      services,
      setSearchParams,
    ]
  )

  const autoFilters = useMemo(() => {
    return [
      {
        label: 'Category',
        value: categorySlug,
        widthClass: DEFAULT_WIDTHS.category,
        options: categories.map(toSelectOption),
        onChange: event => handleFilterChange('category', event.target.value),
      },
      {
        label: 'Event',
        value: selectedEventValue,
        widthClass: DEFAULT_WIDTHS.event,
        options: events.map(({ value, label }) => ({ value, label })),
        onChange: event => handleFilterChange('event', event.target.value),
      },
      {
        label: 'Level',
        value: levelSlug,
        widthClass: DEFAULT_WIDTHS.level,
        options: levels,
        onChange: event => handleFilterChange('level', event.target.value),
      },
      isDecorService
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
    isDecorService,
    selectedEventValue,
    events,
    levelSlug,
    levels,
    themeSlug,
    themes,
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
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
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
