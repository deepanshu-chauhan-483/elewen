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

function RowArrow({ direction = 'left' }) {
  const rotationClass = direction === 'right' ? '' : 'rotate-180'

  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-9 w-9 ${rotationClass}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RowDots() {
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      <span className="h-1.5 w-5 rounded-full bg-[#D4BA8E]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#8C8C8C]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#8C8C8C]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#8C8C8C]" />
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

  const repeatedPackages = useMemo(() => {
    if (sortedPackages.length === 0) return []
    const items = []
    while (items.length < 9) {
      items.push(...sortedPackages)
    }
    return items.slice(0, 9)
  }, [sortedPackages])

  const buildViewAllLink = levelId => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (eventId) params.set('event', eventId)
    params.set('service', 'decor')
    if (themeId) params.set('theme', themeId)
    params.set('level', levelId)
    return `/packages/decor?${params.toString()}`
  }

  return (
    <PackageListLayout
      totalCount={repeatedPackages.length}
      sortValue={sortValue}
      onSortChange={e => setSortValue(e.target.value)}
      page={1}
      totalPages={1}
      onPrevPage={() => {}}
      onNextPage={() => {}}
      onPageSelect={() => {}}
      ctaTitle="Not sure which decor package is right for you?"
    >
      <div className="flex flex-col gap-12">
        <p className="max-w-[540px] text-[12px] leading-[1.5] text-black/35">
          Each level represents the scale and detail of your setup. Choose the level that matches
          your event mood, guest count, and decor complexity.
        </p>

        {DECOR_LEVELS.map((level, levelIndex) => {
          const rowPackages = repeatedPackages.slice(levelIndex * 3, levelIndex * 3 + 3)

          return (
            <section key={level.id} className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-black/55">{level.label}</span>
                <Link
                  to={buildViewAllLink(level.id)}
                  className="flex items-center gap-1 text-[12px] text-[#D4BA8E]"
                >
                  <span>View all</span>
                  <span className="shrink-0">
                    <ViewAllArrow />
                  </span>
                </Link>
              </div>

              <div className="relative overflow-visible">
                <button
                  type="button"
                  className="absolute left-0 top-1/2 z-20 hidden h-[104px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-r-full bg-white pl-2 text-black md:flex"
                  aria-label={`Previous ${level.label}`}
                >
                  <RowArrow direction="left" />
                </button>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rowPackages.map((pkg, index) => (
                    <PackageCard key={`${level.id}-${pkg.id ?? pkg.title}-${index}`} pkg={pkg} />
                  ))}
                </div>

                <button
                  type="button"
                  className="absolute right-0 top-1/2 z-20 hidden h-[104px] w-[52px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-l-full bg-white pr-2 text-black md:flex"
                  aria-label={`Next ${level.label}`}
                >
                  <RowArrow direction="right" />
                </button>
              </div>

              <RowDots />
            </section>
          )
        })}
      </div>
    </PackageListLayout>
  )
}
