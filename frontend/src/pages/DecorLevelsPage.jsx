import { Link, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PackageCard from '../components/package-listing/PackageCard'
import PackageListLayout from '../components/package-listing/PackageListLayout'
import { usePackages } from '../hooks/usePackages'

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

const DECOR_LEVELS = [
  { id: 'level-1', label: 'Level 1' },
  { id: 'level-2', label: 'Level 2' },
  { id: 'level-3', label: 'Level 3' },
]
const CARDS_PER_ROW = 3

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

  const categoryId = searchParams.get('category')?.toLowerCase() ?? ''
  const eventId = searchParams.get('event')?.toLowerCase() ?? ''
  const themeId = searchParams.get('theme')?.toLowerCase() ?? ''
  const serviceId = searchParams.get('serviceId') ?? ''
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

  const sortedPackages = useMemo(() => {
    const items = [...packagesData]
    if (sortValue === 'price-asc')
      return items.sort((a, b) => (a.base_price ?? 0) - (b.base_price ?? 0))
    if (sortValue === 'price-desc')
      return items.sort((a, b) => (b.base_price ?? 0) - (a.base_price ?? 0))
    return items.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  }, [packagesData, sortValue])

  const getPaginatedPackages = page => {
    const start = page * CARDS_PER_ROW
    return sortedPackages.slice(start, start + CARDS_PER_ROW)
  }

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(sortedPackages.length / CARDS_PER_ROW))
  }

  const updatePage = (levelKey, newPage) => {
    const totalPages = getTotalPages()
    setPagination(prev => ({
      ...prev,
      [levelKey]: Math.max(0, Math.min(newPage, totalPages - 1)),
    }))
  }

  const buildViewAllLink = levelId => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (eventId) params.set('event', eventId)
    params.set('service', 'decor')
    if (serviceId) params.set('serviceId', serviceId)
    if (themeId) params.set('theme', themeId)
    params.set('level', levelId)
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

        {DECOR_LEVELS.map((level, levelIndex) => {
          const levelKey = `level${levelIndex + 1}`
          const currentPage = pagination[levelKey] || 0
          const totalPages = getTotalPages()
          const visiblePackages = getPaginatedPackages(currentPage)

          const handlePrev = () => updatePage(levelKey, currentPage - 1)
          const handleNext = () => updatePage(levelKey, currentPage + 1)

          const isPrevDisabled = currentPage === 0
          const isNextDisabled = currentPage >= totalPages - 1

          return (
            <section key={level.id} className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between ">
                <span className="text-[21px] text-black font-medium">{level.label}</span>
                <Link
                  to={buildViewAllLink(level.id)}
                  className="flex items-center gap-1 text-[16px] text-[#727355] "
                >
                  <span>View all</span>
                  <span className="shrink-0">
                    <ViewAllArrow />
                  </span>
                </Link>
              </div>

              <div className="relative overflow-visible">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visiblePackages.map((pkg, index) => (
                    <PackageCard key={`${level.id}-${pkg.id ?? pkg.title}-${index}`} pkg={pkg} />
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-screen -translate-x-1/2 md:block">
                  {/* LEFT ARROW */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={isPrevDisabled}
                    className={`pointer-events-auto absolute left-0 top-1/2 z-20 flex h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-r-full bg-[#E7E0DA] pl-2 text-black transition-all ${
                      isPrevDisabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[#D9D0C4]'
                    }`}
                  >
                    <RowArrow direction="left" />
                  </button>

                  {/* RIGHT ARROW */}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled}
                    className={`pointer-events-auto absolute right-0 top-1/2 z-20 flex h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-l-full bg-[#E7E0DA] pr-2 text-black transition-all ${
                      isNextDisabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[#D9D0C4]'
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
