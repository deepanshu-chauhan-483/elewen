import { useMemo, useState } from 'react'
import PackageCard from './PackageCard'
import PackageListLayout from './PackageListLayout'
import PackageResultsHero from './PackageResultsHero'
import { usePackages } from '../../hooks/usePackages'
import pkgImg1 from '../../assets/images/IMG_3903.jpg'
import pkgImg2 from '../../assets/images/IMG_7768.jpg'
import pkgImg3 from '../../assets/images/IMG_0749.jpg'
import pkgImg4 from '../../assets/images/IMG_0658.jpg'
import pkgImg5 from '../../assets/images/IMG_3148.jpg'
import pkgImg6 from '../../assets/images/IMG_7025.jpg'
import pkgImg7 from '../../assets/images/IMG_8625.png'
import pkgImg8 from '../../assets/images/IMG_9814.jpg'
import pkgImg9 from '../../assets/images/6f6af066.jpg'

const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg2, pkgImg3],
  [pkgImg4, pkgImg5, pkgImg6],
  [pkgImg7, pkgImg8, pkgImg9],
  [pkgImg2, pkgImg4, pkgImg7],
  [pkgImg5, pkgImg1, pkgImg8],
]

const PAGE_SIZE = 9

export default function ServicePackagesPageContent({
  ctaTitle = 'Not sure which package is right for you?',
  showHero = true,
}) {
  const { data: packages = [] } = usePackages()
  const [sortValue, setSortValue] = useState('price-desc')
  const [page, setPage] = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(sortedPackages.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visiblePackages = sortedPackages.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <PackageListLayout
      totalCount={sortedPackages.length}
      sortValue={sortValue}
      onSortChange={e => {
        setSortValue(e.target.value)
        setPage(1)
      }}
      heroContent={showHero ? <PackageResultsHero /> : null}
      page={safePage}
      totalPages={totalPages}
      onPrevPage={() => setPage(current => Math.max(1, current - 1))}
      onNextPage={() => setPage(current => Math.min(totalPages, current + 1))}
      onPageSelect={setPage}
      ctaTitle={ctaTitle}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePackages.map(pkg => (
          <PackageCard key={pkg.id ?? pkg.documentId ?? pkg.title} pkg={pkg} />
        ))}
      </div>
    </PackageListLayout>
  )
}
