import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import PackageCard from '../components/package-listing/PackageCard'
import PackageListLayout from '../components/package-listing/PackageListLayout'
import { usePackages } from '../hooks/usePackages'
import { useBudgetLevelOptions } from '../hooks/useEventTypes'
import { filterPackages } from '../lib/packageFilters'

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

function isNumericId(value) {
  return /^\d+$/.test(String(value ?? '').trim())
}

function RowArrow({ direction = 'left' }) {
  const rotationClass = direction === 'right' ? '' : 'rotate-180'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      className={rotationClass}
    >
      <path
        d="M7.5 18H28.5M28.5 18L18 28.5M28.5 18L18 7.5"
        stroke="#2D2D2D"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

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
  const { data: packages = [] } = usePackages()
  const [sortValue, setSortValue] = useState('price-desc')
  const [searchParams] = useSearchParams()
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 768
  })

  const categorySlug = searchParams.get('category')?.toLowerCase() ?? ''
  const eventSlug = searchParams.get('event')?.toLowerCase() ?? ''
  const eventId = searchParams.get('eventId') ?? ''
  const themeSlug = searchParams.get('theme')?.toLowerCase() ?? ''
  const serviceId = searchParams.get('serviceId') ?? ''
  const flow = searchParams.get('flow') ?? ''
  const { data: levels = [] } = useBudgetLevelOptions(serviceId)
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

  // Independent pagination state for each level
  const [pagination, setPagination] = useState({
    level1: 0,
    level2: 0,
    level3: 0,
  })
  const packagesData = useMemo(
    () =>
      packages.map((pkg, i) => ({
        ...pkg,
        images: pkg.images?.length
          ? pkg.images
          : (PKG_LOCAL_IMAGES[i % PKG_LOCAL_IMAGES.length] ?? []),
      })),
    [packages]
  )

  const filteredPackages = useMemo(
    () =>
      filterPackages(packagesData, {
        categorySlug,
        eventSlug,
        eventId,
        serviceSlug: 'decor',
        serviceId,
        themeSlug,
      }),
    [packagesData, categorySlug, eventSlug, eventId, serviceId, themeSlug]
  )

  const sortedPackages = useMemo(() => {
    const items = [...filteredPackages]
    if (sortValue === 'price-asc')
      return items.sort((a, b) => (a.base_price ?? 0) - (b.base_price ?? 0))
    if (sortValue === 'price-desc')
      return items.sort((a, b) => (b.base_price ?? 0) - (a.base_price ?? 0))
    return items.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  }, [filteredPackages, sortValue])

  const getPaginatedPackages = (items, page) => {
    const start = page * cardsPerRow
    return items.slice(start, start + cardsPerRow)
  }

  const levelSections = useMemo(
    () =>
      levels.map((level, index) => ({
        ...level,
        key: `level${index + 1}`,
        packages: filterPackages(sortedPackages, {
          levelSlug: level.slug,
          levelId: isNumericId(level?.id) ? String(level.id) : '',
        }),
      })),
    [levels, sortedPackages]
  )

  const getTotalPages = items => Math.max(1, Math.ceil(items.length / cardsPerRow))

  const updatePage = (levelKey, totalPages, newPage) => {
    setPagination(prev => ({
      ...prev,
      [levelKey]: Math.max(0, Math.min(newPage, totalPages - 1)),
    }))
  }

  const buildViewAllLink = level => {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (eventSlug) params.set('event', eventSlug)
    if (eventId) params.set('eventId', eventId)
    params.set('service', 'decor')
    if (serviceId) params.set('serviceId', serviceId)
    if (flow) params.set('flow', flow)
    if (themeSlug) params.set('theme', themeSlug)
    if (level?.slug) params.set('level', level.slug)
    return `/packages/decor?${params.toString()}`
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
      heroContent={<PackageResultsHero />}
    >
      <div className="flex flex-col gap-12">
        {/* Your existing content with per-level arrows and dynamic dots */}
        <p className="max-w-[540px] text-[12px] leading-[1.5] text-black/35">
          <span className="text-[16px] text-[#1C1C1C] font-medium">
            Each level represents the scale and detail of your setup.
          </span>
          <br /> Choose the level that matches your event mood, guest count, and decor complexity.
        </p>

        {levelSections.map(level => {
          const levelKey = level.key
          const currentPage = pagination[levelKey] || 0
          const totalPages = getTotalPages(level.packages)
          const visiblePackages = getPaginatedPackages(level.packages, currentPage)

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
                  <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
                    {visiblePackages.map((pkg, index) => (
                      <div
                        key={`${level.id}-${pkg.id ?? pkg.title}-${index}`}
                        className="w-full max-w-[250px] md:max-w-none"
                      >
                        <PackageCard
                          pkg={pkg}
                          className="h-[475px] md:h-auto"
                          compactMode={!isDesktopViewport}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[18px] border border-[#DDD7CE] px-6 py-8 text-[#1C1C1C]">
                    <p
                      className="text-[16px] leading-[1.5]"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      No packages are available for {level.label} with the selected filters.
                    </p>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2">
                  {/* LEFT ARROW */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={isPrevDisabled || visiblePackages.length === 0}
                    className={`pointer-events-auto absolute left-0 top-1/2 z-20 flex h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-r-full bg-[#E7E0DA] pl-2 text-black transition-all ${
                      isPrevDisabled || visiblePackages.length === 0
                        ? 'cursor-not-allowed opacity-40'
                        : 'hover:bg-[#D9D0C4]'
                    }`}
                  >
                    <RowArrow direction="left" />
                  </button>

                  {/* RIGHT ARROW */}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled || visiblePackages.length === 0}
                    className={`pointer-events-auto absolute right-0 top-1/2 z-20 flex h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-l-full bg-[#E7E0DA] pr-2 text-black transition-all ${
                      isNextDisabled || visiblePackages.length === 0
                        ? 'cursor-not-allowed opacity-40'
                        : 'hover:bg-[#D9D0C4]'
                    }`}
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
