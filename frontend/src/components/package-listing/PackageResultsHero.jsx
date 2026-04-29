import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useBudgetLevelOptions,
  useDecorThemeOptions,
  useEventCategoryOptions,
  useFilteredServiceOptions,
} from '../../hooks/useEventTypes'
import { normalizeServiceSlug } from '../../lib/packageFilters'
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
    <div className={`relative w-full sm:w-auto ${widthClass}`}>
      <select
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="h-[34px] w-full appearance-none rounded-full bg-[#F7F0E6] pl-4 pr-9 text-[14px] leading-none text-[#7A2B08] outline-none disabled:cursor-default disabled:opacity-100"
      >
        <option value="" disabled hidden>
          {label}
        </option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <svg
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#7A2B08]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="m2.5 4.5 3.5 3 3.5-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
  category: 'sm:w-[118px]',
  service: 'sm:w-[132px]',
  theme: 'sm:w-[110px]',
  level: 'sm:w-[106px]',
}

const CATEGORY_ORDER = ['social', 'corporate', 'religious']
const SERVICE_ORDER = ['catering', 'decor', 'bar-tending', 'sheesha-services', 'furniture']
const LEVEL_ORDER = ['level-1', 'level-2', 'level-3']

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
      LEVEL_ORDER.map(slug =>
        (Array.isArray(allLevels) ? allLevels : []).find(level => level.slug === slug)
      )
        .filter(Boolean)
        .map(level => ({
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
    [categorySlug, eventId, eventSlug, flow, navigate, searchParams, services, setSearchParams]
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
        label: 'Services',
        value: serviceSlug,
        widthClass: DEFAULT_WIDTHS.service,
        options: services.map(service => ({
          value: normalizeServiceSlug(service.slug),
          label: service.name === 'Rental Furniture' ? 'Furniture' : service.name,
        })),
        onChange: event => handleFilterChange('service', event.target.value),
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
    levelSlug,
    levels,
    serviceSlug,
    services,
    themeSlug,
    themes,
  ])

  const displayFilters = filters.length > 0 ? filters : autoFilters

  return (
    <section
      className={`relative mt-0 max-h-[244px] w-full overflow-hidden bg-[#591902] py-8 sm:py-10 ${className}`}
    >
      <div className="mx-15 flex w-full max-w-[1220px] flex-col justify-center">
        <div className="flex w-full flex-col gap-3 text-white lg:flex-row lg:items-center lg:gap-8">
          <span className="shrink-0 text-[14px] leading-none text-white/90">{title}</span>

          <div className="flex w-full max-w-[553px] flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
          </div>
        </div>
      </div>
    </section>
  )
}
