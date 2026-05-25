import { useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useEventCategoryOptions, useEventsByCategory } from '../hooks/useEventTypes'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

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
      className={`h-9 w-9 ${rotationClass}`}
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
  const params = new URLSearchParams()
  params.set('category', categorySlug)
  params.set('event', event.slug)
  if (event.id != null) params.set('eventId', String(event.id))

  return (
    <Link
      to={`/event-flow/service?${params.toString()}`}
      className="group flex h-full max-h-[424px] w-full max-w-[298px] min-w-0 flex-col justify-end overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-[424px]"
    >
      <div className="flex h-[76px] flex-col rounded-[10px] bg-[#7E8061] px-3 py-2.5 text-white md:h-[84px] md:px-3.5 md:py-3">
        <h2 className="text-[15px] font-semibold uppercase leading-[1.2] tracking-[0.01em] md:text-[16px]">
          {event.title}
        </h2>
        <p className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1 text-[12px] leading-[1.38] text-white/75 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:text-[13px]">
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

  const { data: categories = [] } = useEventCategoryOptions()
  const { data: events = [] } = useEventsByCategory(categorySlug)

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
    if (!query) return events

    return events.filter(
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
            className="absolute left-0 top-1/2 z-20 hidden h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-r-full bg-[#E6DDD3] pl-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45 md:flex"
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
            className="absolute right-0 top-1/2 z-20 hidden h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-l-full bg-[#E6DDD3] pr-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45 md:flex"
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
