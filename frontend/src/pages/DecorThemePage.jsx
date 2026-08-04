import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useDecorThemeOptions, useFilteredServiceOptions } from '../hooks/useEventTypes'
import { usePackages } from '../hooks/usePackages'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import CmsPageLoader from '../components/common/CmsPageLoader'
import BrandedImage from '../components/common/BrandedImage'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import { filterDecorThemesBySocialEvent, filterThemesByEventPackages } from '../lib/packageFilters'
import { HOUSE_PARTY_THEME_PREVIEW } from '../lib/housePartyPackageMedia'
import {
  buildServiceSelectionBackTo,
  DECOR_THEME_CATEGORY_SLUG,
  DEFAULT_EVENT_CATEGORY_SLUG,
  isConsultationOnlyEvent,
  isFallbackOnlyEvent,
  resolveServiceLaneId,
  SERVICES_FLOW_KEY,
} from '../lib/serviceFlow'

import themeImg2 from '../assets/images/IMG_7768.jpg'
import themeImg3 from '../assets/images/IMG_0749.jpg'
import themeImg4 from '../assets/images/IMG_0658.jpg'

const EVENT_FLOW_STEPS = [
  { id: 1, label: 'Event' },
  { id: 2, label: 'Service' },
  { id: 3, label: 'Theme' },
  { id: 4, label: 'Package' },
]

const SERVICES_FLOW_STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Category' },
  { id: 3, label: 'Theme' },
  { id: 4, label: 'Package' },
]

const OFFLINE_THEME_PREVIEW_BY_SLUG = {
  disco: themeImg3,
  floral: themeImg2,
  retro: themeImg4,
  'house-party': HOUSE_PARTY_THEME_PREVIEW,
  'house-parties': HOUSE_PARTY_THEME_PREVIEW,
}
const DESKTOP_CARDS_PER_PAGE = 4
const MOBILE_CARDS_PER_PAGE = 1

function themeSlugKey(theme) {
  return String(theme?.slug ?? theme?.label ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function enrichThemesWithPackageImages(themes, packages) {
  const previewBySlug = new Map()

  for (const pkg of packages) {
    const cover = pkg.images?.[0]
    if (!cover) continue

    for (const rawSlug of pkg.theme_slugs ?? []) {
      const key = themeSlugKey({ slug: rawSlug })
      if (key && !previewBySlug.has(key)) previewBySlug.set(key, cover)
    }
  }

  return themes.map(theme => {
    if (theme.preview_image) return theme

    const slug = themeSlugKey(theme)
    const packageImage = slug ? previewBySlug.get(slug) : null
    return packageImage ? { ...theme, preview_image: packageImage } : theme
  })
}

function resolveThemePreviewImage(theme) {
  if (theme?.preview_image) return theme.preview_image

  const slug = themeSlugKey(theme)
  if (slug && OFFLINE_THEME_PREVIEW_BY_SLUG[slug]) return OFFLINE_THEME_PREVIEW_BY_SLUG[slug]

  return null
}

function ThemeArrow({ direction = 'left' }) {
  const rotationClass = direction === 'right' ? '' : 'rotate-180'

  return (
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

function ThemeCard({
  categoryId,
  eventId,
  eventNumericId,
  serviceSlug,
  serviceId,
  flow,
  theme,
  image,
}) {
  const params = new URLSearchParams()
  params.set('category', categoryId)
  if (eventId) params.set('event', eventId)
  if (eventNumericId) params.set('eventId', eventNumericId)
  params.set('service', serviceSlug)
  if (serviceId) params.set('serviceId', serviceId)
  if (flow) params.set('flow', flow)
  if (theme?.slug) params.set('theme', theme.slug)

  return (
    <Link
      to={`/packages/decor-levels?${params.toString()}`}
      className="group flex h-full max-h-[424px] w-full max-w-[298px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-[424px]"
    >
      <div className="relative mb-2 min-h-0 flex-1 overflow-hidden rounded-[12px] bg-[#F4EEE6]">
        {image ? (
          <BrandedImage
            src={image}
            alt={theme.label}
            className="h-full w-full"
            imgClassName="object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#E8DDD1] px-4 text-center text-[13px] text-[#7C7065] md:text-[14px]">
            {theme.label}
          </div>
        )}
      </div>
      <div className="flex h-[44px] shrink-0 items-center rounded-[10px] bg-[#7E8061] px-3 text-white md:h-[48px] md:px-3.5">
        <h2
          className="text-[14px] font-medium leading-[1.2] md:text-[15px]"
          style={{ fontFamily: "'Poppins'" }}
        >
          {theme.label}
        </h2>
      </div>
    </Link>
  )
}

export default function DecorThemePage() {
  const [searchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearchValue = useDebouncedValue(searchValue)
  const [touchStartX, setTouchStartX] = useState(null)
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 768
  })

  const categoryId = searchParams.get('category')?.toLowerCase() ?? ''
  const eventId = searchParams.get('event')?.toLowerCase() ?? ''
  const eventNumericId = searchParams.get('eventId') ?? ''
  const serviceSlug = searchParams.get('service')?.toLowerCase() ?? 'decor'
  const serviceIdParam = searchParams.get('serviceId') ?? ''
  const flow = searchParams.get('flow') ?? ''

  const { data: serviceOptions = [] } = useFilteredServiceOptions(['decor'])
  const resolvedServiceId = useMemo(() => {
    return resolveServiceLaneId({
      serviceSlug: serviceSlug || 'decor',
      serviceId: serviceIdParam,
      serviceOptions,
    })
  }, [serviceIdParam, serviceOptions, serviceSlug])

  const themesQuery = useDecorThemeOptions(resolvedServiceId)
  const packagesQuery = usePackages()
  const { data: themes = [] } = themesQuery
  const { data: packages = [] } = packagesQuery
  const isStrapiLoading = useStrapiPageLoading(themesQuery, packagesQuery)

  const themesWithImages = useMemo(
    () => enrichThemesWithPackageImages(themes, packages),
    [themes, packages]
  )

  const eventScopedThemes = useMemo(() => {
    const byEvent = filterDecorThemesBySocialEvent(themesWithImages, eventId)

    return filterThemesByEventPackages(byEvent, packages, {
      categorySlug: categoryId || DEFAULT_EVENT_CATEGORY_SLUG,
      eventSlug: eventId,
      eventId: eventNumericId,
      serviceSlug: 'decor',
      serviceId: resolvedServiceId,
    })
  }, [categoryId, eventId, eventNumericId, packages, resolvedServiceId, themesWithImages])

  const paginationKey = `${categoryId}:${eventId}:${serviceSlug}:${debouncedSearchValue.trim().toLowerCase()}`
  const [paginationState, setPaginationState] = useState({
    key: paginationKey,
    pageIndex: 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const handleViewportChange = event => {
      setIsDesktopViewport(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange)
      return () => mediaQuery.removeEventListener('change', handleViewportChange)
    }

    mediaQuery.addListener(handleViewportChange)
    return () => mediaQuery.removeListener(handleViewportChange)
  }, [])

  const filteredThemes = useMemo(() => {
    const query = debouncedSearchValue.trim().toLowerCase()
    if (!query) return eventScopedThemes
    return eventScopedThemes.filter(theme => (theme.label ?? '').toLowerCase().includes(query))
  }, [debouncedSearchValue, eventScopedThemes])
  const cardsPerPage = isDesktopViewport ? DESKTOP_CARDS_PER_PAGE : MOBILE_CARDS_PER_PAGE
  const totalPages = Math.max(1, Math.ceil(filteredThemes.length / cardsPerPage))
  const activePageIndex = paginationState.key === paginationKey ? paginationState.pageIndex : 0
  const safePageIndex = Math.min(activePageIndex, totalPages - 1)
  const visibleThemes = filteredThemes.slice(
    safePageIndex * cardsPerPage,
    safePageIndex * cardsPerPage + cardsPerPage
  )

  useScrollToTop(`${paginationKey}:${safePageIndex}`)

  const backTo = useMemo(() => {
    return buildServiceSelectionBackTo({
      categorySlug: categoryId,
      eventSlug: eventId,
      eventId: eventNumericId,
      serviceSlug,
      serviceId: resolvedServiceId,
      flow,
    })
  }, [categoryId, eventId, eventNumericId, flow, resolvedServiceId, serviceSlug])

  const skipToPackages = useMemo(() => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (eventId) params.set('event', eventId)
    if (eventNumericId) params.set('eventId', eventNumericId)
    params.set('service', serviceSlug)
    if (resolvedServiceId) params.set('serviceId', resolvedServiceId)
    if (flow) params.set('flow', flow)
    params.set('skipTheme', '1')
    return `/packages/decor-levels?${params.toString()}`
  }, [categoryId, eventId, eventNumericId, flow, resolvedServiceId, serviceSlug])

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

  if (!categoryId || (flow !== SERVICES_FLOW_KEY && !eventId)) {
    return (
      <Navigate
        to={
          flow === SERVICES_FLOW_KEY ? '/event-flow/service?flow=services' : '/event-flow/category'
        }
        replace
      />
    )
  }

  if (flow !== SERVICES_FLOW_KEY && isConsultationOnlyEvent(eventId)) {
    return <Navigate to="/book-consultation" replace />
  }

  if (flow !== SERVICES_FLOW_KEY && isFallbackOnlyEvent(eventId)) {
    return <Navigate to="/fallback-screen" replace />
  }

  if (categoryId !== DECOR_THEME_CATEGORY_SLUG || serviceSlug !== 'decor') {
    return <Navigate to={skipToPackages} replace />
  }

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  if (eventScopedThemes.length === 0) {
    return <Navigate to={skipToPackages} replace />
  }

  return (
    <EventFlowLayout
      title="Choose a theme"
      subtitle="Pick a visual theme that sets the mood for your event"
      currentStep={3}
      steps={flow === SERVICES_FLOW_KEY ? SERVICES_FLOW_STEPS : EVENT_FLOW_STEPS}
      showSearch
      searchPlaceholder="Search Theme Name"
      searchValue={searchValue}
      onSearchChange={e => {
        setSearchValue(e.target.value)
        setPaginationState({
          key: `${categoryId}:${eventId}:${serviceSlug}:${e.target.value.trim().toLowerCase()}`,
          pageIndex: 0,
        })
      }}
      showBackButton
      backTo={backTo}
      showPagination
      paginationCount={totalPages}
      activePaginationIndex={safePageIndex}
      mobilePaginationWindow={5}
      afterPagination={
        <Link
          to={skipToPackages}
          className="my-5 flex items-center gap-3 rounded-full bg-[#CDB17E] px-5 py-2.5 text-[11px] font-medium text-white transition-colors hover:bg-[#c9ad7f] md:text-[12px]"
        >
          <span>Skip to Package Listing</span>
          <ThemeArrow direction="right" />
        </Link>
      }
    >
      <div className="flex h-full w-full flex-col justify-between gap-3 overflow-visible">
        <div
          className="relative flex flex-1 items-center overflow-visible"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto flex w-full flex-col">
            <div className="flex w-full flex-col gap-3 md:gap-4">
              <div className="grid w-full grid-cols-1 justify-items-center gap-3 py-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
                {visibleThemes.map((theme, index) => (
                  <ThemeCard
                    key={theme.id ?? theme.slug ?? `${safePageIndex}-${index}`}
                    categoryId={categoryId}
                    eventId={eventId}
                    eventNumericId={eventNumericId}
                    serviceSlug={serviceSlug}
                    serviceId={resolvedServiceId}
                    flow={flow}
                    theme={theme}
                    image={resolveThemePreviewImage(theme)}
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
              className="pointer-events-auto absolute left-0 top-1/2 z-20 flex h-[80px] w-[40px] md:h-[104px] md:w-[52px] -translate-y-1/2 items-center justify-center rounded-r-full bg-[#E6DDD3] pl-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5]"
              aria-label="Previous themes"
            >
              <ThemeArrow direction="left" />
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={safePageIndex >= totalPages - 1}
              className="pointer-events-auto absolute right-0 top-1/2 z-20 flex h-[80px] w-[40px] md:h-[104px] md:w-[52px] -translate-y-1/2 items-center justify-center rounded-l-full bg-[#E6DDD3] pr-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5]"
              aria-label="Next themes"
            >
              <ThemeArrow direction="right" />
            </button>
          </div>
        </div>
      </div>
    </EventFlowLayout>
  )
}
