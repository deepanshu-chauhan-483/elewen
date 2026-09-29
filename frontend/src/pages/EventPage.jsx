import { useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useEventCategoryOptions, useEventsByCategory } from '../hooks/useEventTypes'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
  buildEventSelectionDestination,
  isFallbackOnlyEvent,
} from '../lib/serviceFlow'
import { isCatalogUnavailableEvent } from '../lib/decorEventThemeCatalog'

const FLOW_STEPS = [
  { id: 1, label: 'Category' },
  { id: 2, label: 'Event' },
  { id: 3, label: 'Service' },
  { id: 4, label: ' ' },
]

const DESKTOP_CARDS_PER_PAGE = 4

function EventCarouselArrow({ direction = 'left' }) {
  const rotationClass = direction === 'right' ? '' : 'rotate-180'

  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 md:h-9 md:w-9 ${rotationClass}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EventCard({ categorySlug, event }) {
  const destination = buildEventSelectionDestination({
    categorySlug,
    eventSlug: event.slug,
    eventId: event.id != null ? String(event.id) : '',
    cmsDecorFlow: event.decor_flow ?? '',
  })

  return (
    <Link
      to={destination}
      aria-label={event.title}
      className="group flex h-full max-h-[424px] w-full max-w-[298px] min-w-0 flex-col justify-end overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-[424px]"
    >
      <div className="relative mb-2 min-h-0 flex-1 overflow-hidden rounded-[12px] bg-[#F4EEE6]">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
            style={{ transform: 'none' }}
          />
        ) : (
          <div className="h-full w-full bg-[#E7DDCF]" aria-hidden="true" />
        )}
      </div>
      <div className="flex min-h-[96px] flex-col justify-start rounded-[10px] bg-[#7E8061] px-3 py-2.5 text-white md:min-h-[104px] md:px-3.5 md:py-3">
        <h3
          className="mb-1.5 line-clamp-2 text-[14px] font-medium leading-[1.3] tracking-wide text-white md:text-[15px] md:font-semibold"
          style={{ fontFamily: "'Poppins'" }}
        >
          {event.title}
        </h3>
        <p className="min-h-0 flex-1 overflow-y-auto pr-1 text-[12px] leading-[1.38] text-white/75 [scrollbar-width:none] line-clamp-2 md:text-[13px] [&::-webkit-scrollbar]:hidden">
          {event.description}
        </p>
      </div>
    </Link>
  )
}

export default function EventPage() {
  const [searchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearchValue = useDebouncedValue(searchValue)
  const [touchStartX, setTouchStartX] = useState(null)
  const categorySlug = searchParams.get('category')?.toLowerCase() ?? ''

  const categoriesQuery = useEventCategoryOptions()
  const eventsQuery = useEventsByCategory(categorySlug)
  const { data: categories = [] } = categoriesQuery
  const { data: events = [] } = eventsQuery
  const isStrapiLoading = useStrapiPageLoading(categoriesQuery, eventsQuery)

  const activeCategory = useMemo(
    () => categories.find(category => category.slug === categorySlug) ?? null,
    [categories, categorySlug]
  )

  const paginationKey = `${categorySlug}:${debouncedSearchValue.trim().toLowerCase()}`
  const [paginationState, setPaginationState] = useState({
    key: paginationKey,
    pageIndex: 0,
  })

  const filteredEvents = useMemo(() => {
    const query = debouncedSearchValue.trim().toLowerCase()

    // Hide unavailable events (Wedding / Engagement). Do not delete in Strapi —
    // unpublish or set is_active=false; decor_flow=unavailable also hides here.
    const visibleEvents = (Array.isArray(events) ? events : []).filter(event => {
      const cmsFlow = event?.decor_flow ?? ''
      if (isCatalogUnavailableEvent(event?.slug, cmsFlow)) return false
      if (isFallbackOnlyEvent(event?.slug, cmsFlow)) return false
      return true
    })

    if (!query) return visibleEvents

    return visibleEvents.filter(
      event =>
        event.title.toLowerCase().includes(query) || event.description.toLowerCase().includes(query)
    )
  }, [debouncedSearchValue, events])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / DESKTOP_CARDS_PER_PAGE))
  const activePageIndex = paginationState.key === paginationKey ? paginationState.pageIndex : 0
  const safePageIndex = Math.min(activePageIndex, totalPages - 1)
  const visibleEvents = filteredEvents.slice(
    safePageIndex * DESKTOP_CARDS_PER_PAGE,
    safePageIndex * DESKTOP_CARDS_PER_PAGE + DESKTOP_CARDS_PER_PAGE
  )

  useScrollToTop(`${paginationKey}:${safePageIndex}`)

  const goPrev = () =>
    setPaginationState(current => {
      const currentPageIndex = current.key === paginationKey ? current.pageIndex : 0
      return { key: paginationKey, pageIndex: Math.max(0, currentPageIndex - 1) }
    })

  const goNext = () =>
    setPaginationState(current => {
      const currentPageIndex = current.key === paginationKey ? current.pageIndex : 0
      return { key: paginationKey, pageIndex: Math.min(totalPages - 1, currentPageIndex + 1) }
    })

  const handleTouchStart = e => {
    setTouchStartX(e.changedTouches[0]?.clientX ?? null)
  }

  const handleTouchEnd = e => {
    if (touchStartX == null) return

    const endX = e.changedTouches[0]?.clientX ?? touchStartX
    const deltaX = endX - touchStartX
    const swipeThreshold = 40

    if (deltaX > swipeThreshold) goPrev()
    if (deltaX < -swipeThreshold) goNext()

    setTouchStartX(null)
  }

  if (!categorySlug || !activeCategory) {
    return <Navigate to="/event-flow/category" replace />
  }

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  return (
    <EventFlowLayout
      title="Select your event"
      subtitle="Choose the type of event you're planning"
      currentStep={2}
      steps={FLOW_STEPS}
      showSearch
      searchPlaceholder="Search Event Name"
      searchValue={searchValue}
      onSearchChange={e => setSearchValue(e.target.value)}
      showBackButton
      backTo="/event-flow/category"
      showPagination
      paginationCount={totalPages}
      activePaginationIndex={safePageIndex}
    >
      <div className="flex h-full w-full flex-col justify-between gap-3 overflow-visible">
        <div
          className="relative left-1/2 flex w-screen -translate-x-1/2 flex-1 items-center overflow-visible"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={safePageIndex === 0}
            className="absolute left-0 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-end rounded-full bg-[#ECE7DC] px-2 text-[#CDB17E] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45 md:h-[104px] md:w-[52px] md:translate-x-0 md:justify-center md:rounded-r-full md:bg-[#E6DDD3] md:pl-2 md:pr-0 md:text-[#7C7065]"
            aria-label="Previous cards"
          >
            <EventCarouselArrow direction="left" />
          </button>

          <div className="mx-auto flex w-full max-w-[1280px] flex-col">
            <div className="flex w-full flex-col gap-3 md:gap-4">
              <div className="grid w-full grid-cols-1 justify-items-center gap-3 py-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
                {visibleEvents.map(event => (
                  <EventCard
                    key={event.id ?? event.slug}
                    categorySlug={categorySlug}
                    event={event}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={safePageIndex >= totalPages - 1}
            className="absolute right-0 top-1/2 z-20 flex h-16 w-16 translate-x-1/2 -translate-y-1/2 items-center justify-start rounded-full bg-[#ECE7DC] px-2 text-[#CDB17E] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45 md:h-[104px] md:w-[52px] md:translate-x-0 md:justify-center md:rounded-l-full md:bg-[#E6DDD3] md:pl-0 md:pr-2 md:text-[#7C7065]"
            aria-label="Next cards"
          >
            <EventCarouselArrow direction="right" />
          </button>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="flex min-h-[220px] w-full items-center justify-center rounded-[24px] border border-dashed border-[#D9CABB] bg-white/70 p-8 text-center text-[16px] leading-[1.6] text-[#857A70]">
            No events match your search. Try a different keyword.
          </div>
        ) : null}
      </div>
    </EventFlowLayout>
  )
}
