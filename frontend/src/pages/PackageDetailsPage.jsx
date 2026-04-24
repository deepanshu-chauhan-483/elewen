import { useMemo } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { usePackages } from '../hooks/usePackages'
import { getServiceProductDetails } from '../data/serviceProductDetails'
import useCustomization from '../hooks/useCustomization'
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

function normalizeServiceSlug(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')
}

function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
}

function createInitialCustomizationData(groups = []) {
  return {
    selectedOptions: Object.fromEntries(
      groups
        .map(group => [group.label, group.options?.[0] ?? ''])
        .filter(([, value]) => Boolean(value))
    ),
  }
}

function PackageOptions({ groups = [], selectedOptions = {}, onSelect }) {
  if (!groups.length) return null

  return (
    <div className="space-y-6">
      <div className="border-b border-[#36402280] py-4">
        <p className="text-[12px] text-[#2D2D2D]" style={{ fontWeight: 600 }}>
          Customize your package
        </p>
        <p className="mt-3 text-[13px] leading-[1.7] text-[#591902] opacity-50">
          Choose the setup options that best match the event format and guest experience you want.
        </p>
      </div>

      {groups.map(group => (
        <div key={group.label}>
          <p
            className="text-[13px] font-semibold leading-none text-[#2D2D2D]"
            style={{ fontWeight: 600 }}
          >
            {group.label}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(group.options ?? []).map(option => {
              const isSelected = selectedOptions[group.label] === option

              return (
                <button
                  key={`${group.label}-${option}`}
                  type="button"
                  onClick={() => onSelect(group.label, option)}
                  className={`min-w-[150px] flex-1 rounded-[6px] border px-3 py-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#977545] bg-[#F8F4ED] text-[#591902]'
                      : 'border-[#CDB17E] bg-[#F8F4ED] text-[#CDB17E] opacity-60'
                  }`}
                >
                  <p className="text-[12px] leading-[1.2]" style={{ fontWeight: 600 }}>
                    {option}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PackageDetailsPage() {
  const { service = '', packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data: packages = [] } = usePackages()
  const normalizedService = normalizeServiceSlug(service)
  const search = searchParams.toString()
  const details = getServiceProductDetails(normalizedService)
  const {
    customizations,
    activeCustomization,
    handleAddToCart,
    handleIncrease,
    handleDecrease,
    setCustomizations,
  } = useCustomization({
    createInitialData: () => createInitialCustomizationData(details.configurableGroups),
  })

  const packagesData = useMemo(
    () =>
      packages.map((pkg, index) => ({
        ...pkg,
        serviceSlug: pkg.service_slugs?.[0] || normalizedService,
        images: pkg.images?.length
          ? pkg.images
          : (PKG_LOCAL_IMAGES[index % PKG_LOCAL_IMAGES.length] ?? []),
      })),
    [normalizedService, packages]
  )

  const backHref = useMemo(() => {
    const next = new URLSearchParams(searchParams)
    return `/packages/${normalizedService}${next.toString() ? `?${next.toString()}` : ''}`
  }, [normalizedService, searchParams])

  const pkg = useMemo(
    () =>
      packagesData.find(
        item =>
          buildPackageId(item) === normalisePackageId(packageId) &&
          item.service_slugs?.some(slug => normalizeServiceSlug(slug) === normalizedService)
      ) ?? packagesData.find(item => buildPackageId(item) === normalisePackageId(packageId)),
    [normalizedService, packageId, packagesData]
  )

  const selectedOptions = activeCustomization?.data?.selectedOptions ?? {}

  const relatedProducts = useMemo(
    () =>
      packagesData
        .filter(
          item =>
            buildPackageId(item) !== buildPackageId(pkg ?? {}) &&
            item.service_slugs?.some(slug => normalizeServiceSlug(slug) === normalizedService)
        )
        .slice(0, 3)
        .map(item => ({ ...item, serviceSlug: normalizedService })),
    [normalizedService, packagesData, pkg]
  )

  if (normalizedService === 'decor' || normalizedService === 'decor-single') {
    return (
      <Navigate to={`/packages/decor-single/${packageId}${search ? `?${search}` : ''}`} replace />
    )
  }

  if (normalizedService === 'sheesha' || normalizedService === 'sheesha-single') {
    return (
      <Navigate to={`/packages/sheesha-single/${packageId}${search ? `?${search}` : ''}`} replace />
    )
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const sourceImages = pkg.images?.length ? pkg.images : PKG_LOCAL_IMAGES[0]
  const sideImages = Array.from({ length: 5 }).map(
    (_, index) => sourceImages[index % sourceImages.length]
  )
  const packageTitle = pkg.title || details.heroBadge
  const packagePrice = pkg.price || ''
  const packageIntro = pkg.description || details.intro

  const handleSelect = (groupLabel, option) => {
    setCustomizations(current =>
      current.map((item, index) => {
        if (index !== 0) return item

        return {
          ...item,
          data: {
            ...item.data,
            selectedOptions: {
              ...(item.data?.selectedOptions ?? {}),
              [groupLabel]: option,
            },
          },
          isAddedToCart: false,
        }
      })
    )
  }

  return (
    <SingleProductPageContent
      title={packageTitle}
      price={packagePrice}
      intro={packageIntro}
      customContent={
        <PackageOptions
          groups={details.configurableGroups}
          selectedOptions={selectedOptions}
          onSelect={handleSelect}
        />
      }
      accordionSections={details.sections}
      mainImage={pkg.images?.[0] ?? sideImages[0]}
      sideImages={sideImages}
      relatedProducts={relatedProducts}
      onAddToCart={handleAddToCart}
      quantity={customizations.length}
      onDecrement={handleDecrease}
      onIncrement={handleIncrease}
    />
  )
}
