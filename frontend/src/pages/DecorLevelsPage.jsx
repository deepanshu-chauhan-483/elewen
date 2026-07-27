import { Link, Navigate, useNavigationType, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import PackageCard from '../components/package-listing/PackageCard'
import PackageListLayout from '../components/package-listing/PackageListLayout'
import { usePackages } from '../hooks/usePackages'
import { useBudgetLevelOptions, useFilteredServiceOptions } from '../hooks/useEventTypes'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import {
  DECOR_THEME_CATEGORY_SLUG,
  DEFAULT_EVENT_CATEGORY_SLUG,
  isConsultationOnlyEvent,
  resolveServiceLaneId,
  SERVICES_FLOW_KEY,
} from '../lib/serviceFlow'
import { assignDistinctCoverIndices, filterPackages, filterPackagesByBudgetLevel, requiresDecorThemeSelection } from '../lib/packageFilters'
import { enrichPackagesWithHousePartyImages } from '../lib/housePartyPackageMedia'
import { filterPackagesBySearch } from '../lib/packageSearch'
import { getLocationScrollKey, readLocationScroll, scrollPageTo } from '../hooks/useScrollToTop'
import { useLenis } from '../useLenis'

import pkgImg1 from '../assets/images/IMG_3903.jpg'
import pkgImg2 from '../assets/images/IMG_7768.jpg'
import pkgImg3 from '../assets/images/IMG_0749.jpg'
import pkgImg4 from '../assets/images/IMG_0658.jpg'
import pkgImg5 from '../assets/images/IMG_3148.jpg'
import pkgImg6 from '../assets/images/IMG_7025.jpg'
import pkgImg7 from '../assets/images/IMG_8625.png'
import pkgImg8 from '../assets/images/IMG_9814.jpg'
import pkgImg9 from '../assets/images/6f6af066.jpg'
import PackageResultsHero from '../components/package-listing/PackageResultsHero'

const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg2, pkgImg3],
  [pkgImg4, pkgImg5, pkgImg6],
  [pkgImg7, pkgImg8, pkgImg9],
  [pkgImg2, pkgImg4, pkgImg7],
  [pkgImg5, pkgImg1, pkgImg8],
]

const DESKTOP_CARDS_PER_ROW = 3
const MOBILE_CARDS_PER_ROW = 1
const DEFAULT_LEVEL_PAGINATION = { level1: 0, level2: 0, level3: 0, level4: 0 }
const LEVEL_PAGINATION_STORAGE_PREFIX = 'elewen:decor-levels-pagination:'

function readStoredLevelPagination(filterKey) {
  if (typeof window === 'undefined' || !filterKey) return null
  try {
    const raw = sessionStorage.getItem(`${LEVEL_PAGINATION_STORAGE_PREFIX}${filterKey}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return { ...DEFAULT_LEVEL_PAGINATION, ...parsed }
  } catch {
    return null
  }
}

function writeStoredLevelPagination(filterKey, pagination) {
  if (typeof window === 'undefined' || !filterKey) return
  try {
    sessionStorage.setItem(`${LEVEL_PAGINATION_STORAGE_PREFIX}${filterKey}`, JSON.stringify(pagination))
  } catch {
    // Ignore quota / private-mode failures
  }
}

function isNumericId(value) {
  return /^\d+$/.test(String(value ?? '').trim())
}

function RowArrow({ direction = 'left' }) {
  const rotationClass = direction === 'right' ? '' : 'rotate-180'

  return (
    <svg
      className={`h-6 w-6 md:h-9 md:w-9 ${rotationClass}`}
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

const rowNavBtnBase =
  'pointer-events-auto absolute top-1/2 z-20 flex h-[80px] w-[40px] -translate-y-1/2 items-center justify-center bg-[#E6DDD3] text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45 md:h-[104px] md:w-[52px]'

function DynamicDots({ totalPages, currentPage }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      {Array.from({ length: totalPages }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 rounded-full transition-all duration-200 ${
            index === currentPage ? 'w-5 bg-[#D4BA8E]' : 'w-1.5 bg-[#8C8C8C]'
          }`}
        />
      ))}
    </div>
  )
}

function ViewAllArrow() {
  return (
    <svg viewBox="0 0 8 4" className="h-4 w-3" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 0.5L4 2L1 3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DecorLevelsPage() {
  const packagesQuery = usePackages()
  const { data: packages = [] } = packagesQuery
  const [sortValue, setSortValue] = useState('price-asc')
  const [searchParams, setSearchParams] = useSearchParams()
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 768
  })

  const themeParam = searchParams.get('theme')?.toLowerCase() ?? ''

  const categorySlug = searchParams.get('category')?.toLowerCase() ?? ''

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

  const eventSlug = searchParams.get('event')?.toLowerCase() ?? ''
  const eventId = searchParams.get('eventId') ?? ''
  const levelParam = searchParams.get('level')?.toLowerCase() ?? ''
  const serviceIdParam = searchParams.get('serviceId') ?? ''
  const flow = searchParams.get('flow') ?? ''
  const searchQuery = searchParams.get('search')?.trim() ?? ''
  const { data: serviceOptions = [] } = useFilteredServiceOptions(['decor'])
  const resolvedServiceId = useMemo(
    () =>
      resolveServiceLaneId({
        serviceSlug: 'decor',
        serviceId: serviceIdParam,
        serviceOptions,
      }),
    [serviceIdParam, serviceOptions]
  )
  const levelsQuery = useBudgetLevelOptions(resolvedServiceId)
  const { data: levels = [] } = levelsQuery
  const isStrapiLoading = useStrapiPageLoading(packagesQuery, levelsQuery)

  const cardsPerRow = isDesktopViewport ? DESKTOP_CARDS_PER_ROW : MOBILE_CARDS_PER_ROW

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

  // Independent pagination state for each level (persisted so Back keeps the same carousel page)
  const [pagination, setPagination] = useState(DEFAULT_LEVEL_PAGINATION)
  const packagesData = useMemo(
    () =>
      enrichPackagesWithHousePartyImages(packages).map((pkg, i) => ({
        ...pkg,
        images: pkg.images?.length
          ? pkg.images
          : (PKG_LOCAL_IMAGES[i % PKG_LOCAL_IMAGES.length] ?? []),
      })),
    [packages]
  )

  const filteredPackages = useMemo(() => {
    const scoped = filterPackages(packagesData, {
      categorySlug: categorySlug || DEFAULT_EVENT_CATEGORY_SLUG,
      eventSlug,
      eventId,
      serviceSlug: 'decor',
      serviceId: serviceIdParam,
      themeSlug: themeParam,
    })

    if (!searchQuery) return scoped
    return filterPackagesBySearch(scoped, searchQuery)
  }, [
    packagesData,
    categorySlug,
    eventSlug,
    eventId,
    serviceIdParam,
    themeParam,
    searchQuery,
  ])

  const sortedPackages = useMemo(() => {
    const items = [...filteredPackages]
    if (sortValue === 'price-asc')
      return items.sort((a, b) => (a.base_price ?? 0) - (b.base_price ?? 0))
    if (sortValue === 'price-desc')
      return items.sort((a, b) => (b.base_price ?? 0) - (a.base_price ?? 0))
    return items.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  }, [filteredPackages, sortValue])

  const filterKey = `${categorySlug || DEFAULT_EVENT_CATEGORY_SLUG}:${eventSlug}:${eventId}:${serviceIdParam}:${themeParam}:${searchQuery}:${sortValue}`
  const skipPaginationWriteRef = useRef(false)
  const navigationType = useNavigationType()

  useEffect(() => {
    skipPaginationWriteRef.current = true
    if (navigationType === 'POP') {
      setPagination(readStoredLevelPagination(filterKey) ?? DEFAULT_LEVEL_PAGINATION)
      return
    }
    setPagination(DEFAULT_LEVEL_PAGINATION)
  }, [filterKey, navigationType])

  useEffect(() => {
    if (skipPaginationWriteRef.current) {
      skipPaginationWriteRef.current = false
      return
    }
    writeStoredLevelPagination(filterKey, pagination)
  }, [filterKey, pagination])

  const getPaginatedPackages = (items, page) => {
    const start = page * cardsPerRow
    return items.slice(start, start + cardsPerRow)
  }

  const levelSections = useMemo(() => {
    const sections = levels.map((level, index) => ({
      ...level,
      key: `level${index + 1}`,
      packages: filterPackagesByBudgetLevel(sortedPackages, {
        levelSlug: level.slug,
        levelId: isNumericId(level?.id) ? String(level.id) : '',
      }),
    }))

    // If packages have no budget-level link, still show them under Level 1
    // so the levels page is never an empty wall of headings.
    const assignedIds = new Set(
      sections.flatMap(section =>
        section.packages.map(pkg => String(pkg.documentId ?? pkg.id ?? ''))
      )
    )
    const unassigned = sortedPackages.filter(
      pkg => !assignedIds.has(String(pkg.documentId ?? pkg.id ?? ''))
    )

    if (unassigned.length > 0 && sections.length > 0) {
      sections[0] = {
        ...sections[0],
        packages: [...sections[0].packages, ...unassigned],
      }
    }

    return sections
  }, [levels, sortedPackages])

  const getTotalPages = items => Math.max(1, Math.ceil(items.length / cardsPerRow))

  const updatePage = (levelKey, totalPages, newPage) => {
    setPagination(prev => ({
      ...prev,
      [levelKey]: Math.max(0, Math.min(newPage, totalPages - 1)),
    }))
  }

  const lenisRef = useLenis()
  const locationScrollKey = getLocationScrollKey(
    '/packages/decor-levels',
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  )

  // After CMS content mounts, re-apply saved scroll so Back does not land on the hero
  useEffect(() => {
    if (isStrapiLoading || navigationType !== 'POP') return undefined

    const savedY = readLocationScroll(locationScrollKey)
    if (savedY == null || savedY <= 0) return undefined

    const lenis = lenisRef?.current
    const restore = () => scrollPageTo(savedY, lenis)
    restore()
    const timers = [50, 200].map(delay => window.setTimeout(restore, delay))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [isStrapiLoading, locationScrollKey, lenisRef, navigationType])

  const buildViewAllLink = level => {
    const params = new URLSearchParams()
    params.set('category', categorySlug || DEFAULT_EVENT_CATEGORY_SLUG)
    if (eventSlug) params.set('event', eventSlug)
    if (eventId) params.set('eventId', eventId)
    params.set('service', 'decor')
    if (resolvedServiceId) params.set('serviceId', resolvedServiceId)
    if (flow) params.set('flow', flow)
    if (themeParam) params.set('theme', themeParam)
    if (level?.slug) params.set('level', level.slug)
    return `/packages/decor?${params.toString()}`
  }

  if (isConsultationOnlyEvent(eventSlug)) {
    return <Navigate to="/book-consultation" replace />
  }

  const isSocialDecor =
    (categorySlug || DEFAULT_EVENT_CATEGORY_SLUG) === DECOR_THEME_CATEGORY_SLUG

  if (isSocialDecor && !eventSlug && !eventId && flow !== SERVICES_FLOW_KEY) {
    const params = new URLSearchParams(searchParams)
    return <Navigate to={`/event-flow/event?${params.toString()}`} replace />
  }

  if (requiresDecorThemeSelection(eventSlug) && !themeParam) {
    const params = new URLSearchParams(searchParams)
    return <Navigate to={`/event-flow/decor-theme?${params.toString()}`} replace />
  }

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  if (levelParam) {
    const nextParams = new URLSearchParams(searchParams)
    return <Navigate to={`/packages/decor?${nextParams.toString()}`} replace />
  }

  return (
    <PackageListLayout
      totalCount={sortedPackages.length}
      sortValue={sortValue}
      onSortChange={e => setSortValue(e.target.value)}
      page={1}
      totalPages={1}
      onPrevPage={() => {}}
      onNextPage={() => {}}
      onPageSelect={() => {}}
      ctaTitle="Not sure which decor package is right for you?"
      showPagination={false} // ← This hides the bottom number + arrow pagination
      heroContent={<PackageResultsHero showThemeFilter />}
    >
      <div className="flex flex-col gap-12">
        <p className="max-w-[540px] text-[12px] leading-[1.5] text-black/35">
          <span className="text-[16px] text-[#1C1C1C] font-medium">
            Each level represents the scale and detail of your setup.
          </span>
          <br /> Choose the level that matches your event mood, guest count, and decor complexity.
        </p>

        {levelSections
          .filter(level => level.packages.length > 0)
          .map(level => {
          const levelKey = level.key
          const totalPages = getTotalPages(level.packages)
          const currentPage = Math.min(pagination[levelKey] || 0, totalPages - 1)
          const visiblePackages = assignDistinctCoverIndices(
            getPaginatedPackages(level.packages, currentPage),
            { columns: 3 }
          )

          const handlePrev = () => updatePage(levelKey, totalPages, currentPage - 1)
          const handleNext = () => updatePage(levelKey, totalPages, currentPage + 1)

          const isPrevDisabled = currentPage === 0
          const isNextDisabled = currentPage >= totalPages - 1

          return (
            <section key={level.id} className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between ">
                <span className="text-[21px] text-black font-medium">{level.label}</span>
                <Link
                  to={buildViewAllLink(level)}
                  className="flex items-center gap-1 text-[16px] text-[#727355]"
                >
                  <span>View all</span>
                  <span className="shrink-0">
                    <ViewAllArrow />
                  </span>
                </Link>
              </div>

              <div className="relative overflow-visible">
                {visiblePackages.length > 0 ? (
                  <div className="mx-auto grid w-[min(322px,calc(100vw-5.5rem))] grid-cols-1 items-stretch justify-items-center gap-4 md:w-full sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
                    {visiblePackages.map((pkg, index) => (
                      <div
                        key={`${level.id}-${pkg.id ?? pkg.title}-${index}`}
                        className="flex h-full w-full max-w-[322px] md:max-w-none"
                      >
                        <PackageCard
                          pkg={pkg}
                          className="h-full w-full"
                          compactMode={!isDesktopViewport}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mx-auto w-[min(322px,calc(100vw-5.5rem))] rounded-[18px] border border-[#DDD7CE] px-6 py-8 text-[#1C1C1C] md:w-full">
                    <p
                      className="text-[16px] leading-[1.5]"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      No packages are available for {level.label} with the selected filters.
                    </p>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={isPrevDisabled || visiblePackages.length === 0}
                    className={`${rowNavBtnBase} left-0 rounded-r-full pl-2`}
                    aria-label="Previous packages"
                  >
                    <RowArrow direction="left" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled || visiblePackages.length === 0}
                    className={`${rowNavBtnBase} right-0 rounded-l-full pr-2`}
                    aria-label="Next packages"
                  >
                    <RowArrow direction="right" />
                  </button>
                </div>
              </div>

              <DynamicDots totalPages={totalPages} currentPage={currentPage} />
            </section>
          )
        })}
      </div>
    </PackageListLayout>
  )
}
