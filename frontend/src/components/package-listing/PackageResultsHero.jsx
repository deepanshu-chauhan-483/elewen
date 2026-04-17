import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useBudgetLevelOptions,
  useDecorThemeOptions,
  useEventCategoryOptions,
  useEventsByCategory,
} from '../../hooks/useEventTypes'

function FilterPill({ label, widthClass = '' }) {
  return (
    <div className={`relative w-full sm:w-auto ${widthClass}`}>
      <select
        value={label}
        disabled
        className="h-[34px] w-full appearance-none rounded-full bg-[#F7F0E6] pl-4 pr-9 text-[14px] leading-none text-[#7A2B08] outline-none disabled:cursor-default disabled:opacity-100"
      >
        <option>{label}</option>
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
  event: 'sm:w-[168px]',
  theme: 'sm:w-[110px]',
  level: 'sm:w-[106px]',
}

export default function PackageResultsHero({
  title = 'Showing results for:',
  filters = [],
  className = '',
}) {
  const [searchParams] = useSearchParams()
  const categorySlug = searchParams.get('category')?.toLowerCase() ?? ''
  const eventSlug = searchParams.get('event')?.toLowerCase() ?? ''
  const themeSlug = searchParams.get('theme')?.toLowerCase() ?? ''
  const levelSlug = searchParams.get('level')?.toLowerCase() ?? ''
  const serviceId = searchParams.get('serviceId') ?? ''

  const { data: categories = [] } = useEventCategoryOptions()
  const { data: events = [] } = useEventsByCategory(categorySlug)
  const { data: themes = [] } = useDecorThemeOptions(serviceId)
  const { data: levels = [] } = useBudgetLevelOptions(serviceId)

  const autoFilters = useMemo(() => {
    const categoryLabel =
      categories.find(category => category.slug === categorySlug)?.name ||
      titleizeSlug(categorySlug)
    const eventLabel =
      events.find(event => event.slug === eventSlug)?.title || titleizeSlug(eventSlug)
    const themeLabel =
      themes.find(theme => theme.slug === themeSlug)?.label || titleizeSlug(themeSlug)
    const levelLabel =
      levels.find(level => level.slug === levelSlug)?.label || titleizeSlug(levelSlug)

    return [
      categorySlug ? { label: categoryLabel, widthClass: DEFAULT_WIDTHS.category } : null,
      eventSlug ? { label: eventLabel, widthClass: DEFAULT_WIDTHS.event } : null,
      themeSlug ? { label: themeLabel, widthClass: DEFAULT_WIDTHS.theme } : null,
      levelSlug ? { label: levelLabel, widthClass: DEFAULT_WIDTHS.level } : null,
    ].filter(Boolean)
  }, [categories, categorySlug, events, eventSlug, themes, themeSlug, levels, levelSlug])

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
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
