import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useEventCategoryOptions, useEventsByCategory } from '../hooks/useEventTypes'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import { filterEventsWithPackages, normalizeServiceSlug } from '../lib/packageFilters'
import {
  buildServiceDestination,
  buildServiceFlowParams,
  DEFAULT_EVENT_CATEGORY_SLUG,
  isServiceAllowedForCategory,
  SERVICES_FLOW_KEY,
} from '../lib/serviceFlow'
import { usePackages } from '../hooks/usePackages'

const EVENT_FLOW_STEPS = [
  { id: 1, label: 'Event' },
  { id: 2, label: 'Service' },
  { id: 3, label: ' ' },
]

const SERVICES_FLOW_STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Category' },
  { id: 3, label: ' ' },
]

const DESKTOP_CARDS_PER_PAGE = 4
const SMALL_SCREEN_CARDS_PER_PAGE = 2
const MOBILE_CARDS_PER_PAGE = 1

function CategoryArrow({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? 'rotate-180' : ''

  return (
    // <svg
    //   viewBox="0 0 24 24"
    //   fill="none"
    //   stroke="currentColor"
    //   strokeWidth="1.8"
    //   className={`h-6 w-6 ${rotationClass}`}
    // >
    //   <path d="M5 12h14" strokeLinecap="round" />
    //   <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    // </svg>
    <svg
      className={`h-6 w-6 ${rotationClass}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12H19M12 19L19 12L12 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EventArrow({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? 'rotate-180' : ''

  return (
    // <svg
    //   viewBox="0 0 24 24"
    //   fill="none"
    //   stroke="currentColor"
    //   strokeWidth="1.8"
    //   className={`h-6 w-6 ${rotationClass}`}
    // >
    //   <path d="M5 12h14" strokeLinecap="round" />
    //   <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    // </svg>
    <svg
      className={`h-[24px] w-[24px] md:h-[36px] md:w-[36px] ${rotationClass}`}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 18H28.5M18 7.5L28.5 18L18 28.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EventCard({
  categorySlug,
  event,
  isServicesFlow = false,
  serviceSlug = '',
  serviceId = '',
}) {
  const params = new URLSearchParams()
  params.set('category', categorySlug)
  params.set('event', event.slug)
  if (event.id != null) params.set('eventId', String(event.id))

  const destination = isServicesFlow
    ? buildServiceDestination({
        categorySlug,
        eventSlug: event.slug,
        eventId: event.id != null ? String(event.id) : '',
        serviceSlug,
        serviceId,
        flow: SERVICES_FLOW_KEY,
      })
    : `/event-flow/service?${params.toString()}`

  return (
    <Link
      to={destination}
      aria-label={event.title}
      className="group flex h-[400px] w-full max-w-[250px] min-w-0 flex-col justify-end overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-auto md:max-h-[384px] md:max-w-[298px]"
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

export default function CategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearchValue = useDebouncedValue(searchValue)
  const [touchStartX, setTouchStartX] = useState(null)
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === 'undefined') return 1024
    return window.innerWidth
  })
  const requestedCategorySlug = searchParams.get('category')?.toLowerCase() ?? ''
  const effectiveCategorySlug = requestedCategorySlug || DEFAULT_EVENT_CATEGORY_SLUG
  const serviceSlug = normalizeServiceSlug(searchParams.get('service') ?? '')
  const serviceId = searchParams.get('serviceId') ?? ''
  const flow = searchParams.get('flow') ?? ''
  const isServicesFlow = flow === SERVICES_FLOW_KEY

  const categoriesQuery = useEventCategoryOptions()
  const { data: allCategories = [] } = categoriesQuery

  const categories = useMemo(() => {
    if (!isServicesFlow || !serviceSlug) return allCategories
    return allCategories.filter(category =>
      isServiceAllowedForCategory(serviceSlug, category.slug)
    )
  }, [allCategories, isServicesFlow, serviceSlug])

  const selectedCategoryId = useMemo(() => {
    if (!categories.length) {
      return isServicesFlow && serviceSlug && !isServiceAllowedForCategory(serviceSlug, effectiveCategorySlug)
        ? DEFAULT_EVENT_CATEGORY_SLUG
        : effectiveCategorySlug
    }
    return (
      categories.find(category => category.slug === requestedCategorySlug)?.slug ??
      categories.find(category => category.slug === DEFAULT_EVENT_CATEGORY_SLUG)?.slug ??
      categories[0]?.slug ??
      ''
    )
  }, [categories, effectiveCategorySlug, isServicesFlow, requestedCategorySlug, serviceSlug])

  useEffect(() => {
    if (!isServicesFlow || !serviceSlug) return
    if (isServiceAllowedForCategory(serviceSlug, requestedCategorySlug || effectiveCategorySlug)) {
      return
    }

    setSearchParams(
      prevParams => {
        const nextParams = new URLSearchParams(prevParams)
        nextParams.set('category', DEFAULT_EVENT_CATEGORY_SLUG)
        nextParams.delete('event')
        nextParams.delete('eventId')
        return nextParams
      },
      { replace: true }
    )
  }, [effectiveCategorySlug, isServicesFlow, requestedCategorySlug, serviceSlug, setSearchParams])

  const eventsQuery = useEventsByCategory(selectedCategoryId || DEFAULT_EVENT_CATEGORY_SLUG)
  const packagesQuery = usePackages()
  const { data: events = [] } = eventsQuery
  const { data: packages = [] } = packagesQuery
  const isStrapiLoading = useStrapiPageLoading(
    categoriesQuery,
    eventsQuery,
    ...(isServicesFlow && serviceSlug ? [packagesQuery] : [])
  )

  const packageBackedEvents = useMemo(() => {
    if (!isServicesFlow || !serviceSlug) return events

    return filterEventsWithPackages(events, packages, {
      categorySlug: selectedCategoryId || DEFAULT_EVENT_CATEGORY_SLUG,
      serviceSlug,
      serviceId,
    })
  }, [events, isServicesFlow, packages, selectedCategoryId, serviceId, serviceSlug])

  const paginationKey = `${selectedCategoryId}:${debouncedSearchValue.trim().toLowerCase()}`
  const [paginationState, setPaginationState] = useState({
    key: paginationKey,
    pageIndex: 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleViewportChange = () => {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleViewportChange)
    return () => window.removeEventListener('resize', handleViewportChange)
  }, [])

  useEffect(() => {
    if (requestedCategorySlug) return

    setSearchParams(
      prevParams => {
        const nextParams = new URLSearchParams(prevParams)
        nextParams.set('category', DEFAULT_EVENT_CATEGORY_SLUG)
        if (isServicesFlow) {
          if (serviceSlug) nextParams.set('service', serviceSlug)
          if (serviceId) nextParams.set('serviceId', serviceId)
          if (flow) nextParams.set('flow', flow)
        }
        return nextParams
      },
      { replace: true }
    )
  }, [
    flow,
    isServicesFlow,
    requestedCategorySlug,
    serviceId,
    serviceSlug,
    setSearchParams,
  ])

  useEffect(() => {
    if (!categories.length || !selectedCategoryId || requestedCategorySlug === selectedCategoryId)
      return

    setSearchParams(prevParams => {
      const nextParams = new URLSearchParams(prevParams)
      nextParams.set('category', selectedCategoryId)
      nextParams.delete('event')
      nextParams.delete('eventId')
      if (isServicesFlow) {
        if (serviceSlug) nextParams.set('service', serviceSlug)
        if (serviceId) nextParams.set('serviceId', serviceId)
        if (flow) nextParams.set('flow', flow)
      }
      return nextParams
    })
  }, [
    categories.length,
    flow,
    isServicesFlow,
    requestedCategorySlug,
    selectedCategoryId,
    serviceId,
    serviceSlug,
    setSearchParams,
  ])

  const filteredEvents = useMemo(() => {
    const query = debouncedSearchValue.trim().toLowerCase()
    if (!query) return packageBackedEvents

    return packageBackedEvents.filter(
      event =>
        event.title.toLowerCase().includes(query) || event.description.toLowerCase().includes(query)
    )
  }, [debouncedSearchValue, packageBackedEvents])

  const cardsPerPage =
    viewportWidth >= 768
      ? DESKTOP_CARDS_PER_PAGE
      : viewportWidth >= 640
        ? SMALL_SCREEN_CARDS_PER_PAGE
        : MOBILE_CARDS_PER_PAGE
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / cardsPerPage))
  const activePageIndex = paginationState.key === paginationKey ? paginationState.pageIndex : 0
  const safePageIndex = Math.min(activePageIndex, totalPages - 1)
  const visibleEvents = filteredEvents.slice(
    safePageIndex * cardsPerPage,
    safePageIndex * cardsPerPage + cardsPerPage
  )

  useScrollToTop(`${paginationKey}:${safePageIndex}`)

  const selectCategory = categorySlug => {
    setPaginationState({
      key: `${categorySlug}:${debouncedSearchValue.trim().toLowerCase()}`,
      pageIndex: 0,
    })
    setSearchParams(prevParams => {
      const nextParams = new URLSearchParams(prevParams)
      nextParams.set('category', categorySlug)
      nextParams.delete('event')
      nextParams.delete('eventId')
      if (isServicesFlow) {
        if (serviceSlug) nextParams.set('service', serviceSlug)
        if (serviceId) nextParams.set('serviceId', serviceId)
        if (flow) nextParams.set('flow', flow)
      }
      return nextParams
    })
  }

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

  const servicesFlowBackTo = useMemo(() => {
    const params = buildServiceFlowParams({
      serviceSlug,
      serviceId,
      flow,
    })

    return `/event-flow/service?${params.toString()}`
  }, [flow, serviceId, serviceSlug])

  if (isServicesFlow && !serviceSlug) {
    return <Navigate to="/event-flow/service?flow=services" replace />
  }

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  return (
    <EventFlowLayout
      title="What are you planning?"
      subtitle={
        isServicesFlow
          ? 'Choose your event category to continue'
          : 'Choose your event category to get started'
      }
      currentStep={isServicesFlow ? 2 : 1}
      steps={isServicesFlow ? SERVICES_FLOW_STEPS : EVENT_FLOW_STEPS}
      showSearch
      searchPlaceholder="Search Event Name"
      searchValue={searchValue}
      onSearchChange={e => {
        setSearchValue(e.target.value)
        setPaginationState({
          key: `${selectedCategoryId}:${e.target.value.trim().toLowerCase()}`,
          pageIndex: 0,
        })
      }}
      showPagination
      paginationCount={totalPages}
      activePaginationIndex={safePageIndex}
      mobilePaginationWindow={5}
      showBackButton={isServicesFlow}
      backTo={isServicesFlow ? servicesFlowBackTo : null}
    >
      <div className="flex h-full w-full flex-col justify-between gap-6 overflow-visible">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-2 my-7">
          {categories.map(category => {
            const isActive = category.slug === selectedCategoryId

            return (
              <button
                key={category.id ?? category.slug}
                type="button"
                onClick={() => selectCategory(category.slug)}
                className={`group flex items-center justify-between rounded-[24px] border px-5 py-4 text-left transition-all hover:-translate-y-0.5 sm:max-w-[325px] sm:px-6 ${
                  isActive
                    ? 'border-[#7A2B08] bg-[#591902] text-white shadow-[0_16px_38px_rgba(111,76,43,0.14)]'
                    : 'border-[#E0D0BE] bg-white text-[#2D2D2D] hover:border-[#D3B38A] hover:shadow-[0_16px_38px_rgba(111,76,43,0.08)]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[24px] ${
                      isActive ? 'bg-[#EADEC8]' : 'bg-[#EFE4D2]'
                    }`}
                  >
                    <span
                      className={`text-[16px] font-semibold ${
                        isActive ? 'text-white' : 'text-[#8C4A22]'
                      }`}
                    >
                      <img src={category.icon} alt="" loading="lazy" decoding="async" />
                    </span>
                  </span>
                  <div className="min-w-0 max-w-[203px]">
                    <h2 className="text-[16px] leading-[1.1]" style={{ fontFamily: "'Poppins'" }}>
                      {category.name}
                    </h2>
                    <p
                      className={`mt-1 text-[11px] leading-[1.45] ${isActive ? 'text-white/75' : 'text-[#8F8B86]'}`}
                    >
                      {category.description}
                    </p>
                  </div>
                </div>

                <span className="flex h-6 w-6 ml-4 shrink-0 items-center justify-center transition-transform group-hover:translate-x-1">
                  <CategoryArrow />
                </span>
              </button>
            )
          })}
        </div>

        <div
          className="relative flex flex-1 items-center overflow-visible"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto flex w-full flex-col">
            <div className="flex w-full flex-col gap-3 md:gap-4">
              <div className="grid w-full grid-cols-1 justify-items-center gap-3 py-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
                {visibleEvents.map(event => (
                  <EventCard
                    key={event.id ?? event.slug}
                    categorySlug={selectedCategoryId}
                    event={event}
                    isServicesFlow={isServicesFlow}
                    serviceSlug={serviceSlug}
                    serviceId={serviceId}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2">
            <button
              type="button"
              onClick={goPrev}
              disabled={safePageIndex === 0}
              className="pointer-events-auto absolute left-0 top-1/2 z-20 flex h-[80px] w-[40px] md:h-[104px] md:w-[52px] -translate-y-1/2 items-center justify-center rounded-r-full bg-[#E6DDD3] pl-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Previous cards"
            >
              <EventArrow direction="left" />
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={safePageIndex >= totalPages - 1}
              className="pointer-events-auto absolute right-0 top-1/2 z-20 flex h-[80px] w-[40px] md:h-[104px] md:w-[52px] -translate-y-1/2 items-center justify-center rounded-l-full bg-[#E6DDD3] pr-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Next cards"
            >
              <EventArrow direction="right" />
            </button>
          </div>
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
