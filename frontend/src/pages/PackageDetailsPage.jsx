import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/common/useToast'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { getServiceProductDetails } from '../data/serviceProductDetails'
import { useCancellationPolicy } from '../hooks/useCancellationPolicy'
import { useCart } from '../hooks/useCart'
import { useCartToastMessage } from '../hooks/useMessagingContent'
import { usePackageReviews } from '../hooks/usePackageReviews'
import { usePackageById, usePackages } from '../hooks/usePackages'
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

function packageMatchesService(pkg, serviceSlug) {
  const normalizedService = normalizeServiceSlug(serviceSlug)
  return pkg?.service_slugs?.some(slug => normalizeServiceSlug(slug) === normalizedService)
}

function buildDefaultSelectedOptions(groups = []) {
  return Object.fromEntries(
    groups
      .map(group => [group.label, group.options?.[0] ?? ''])
      .filter(([, value]) => Boolean(value))
  )
}

function normalizeSelectedOptions(selectedOptions = {}) {
  return Object.fromEntries(
    Object.entries(selectedOptions)
      .map(([key, value]) => [String(key ?? '').trim(), String(value ?? '').trim()])
      .filter(([key, value]) => key && value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  )
}

function getSelectedOptionsFromSearchParams(searchParams, groups = []) {
  const rawValue = searchParams.get('selectedOptions')
  if (!rawValue) return {}

  try {
    const parsed = JSON.parse(rawValue)
    const normalized = normalizeSelectedOptions(parsed)
    const validOptionsByGroup = new Map(
      groups.map(group => [group.label, new Set(group.options ?? [])])
    )

    return Object.fromEntries(
      Object.entries(normalized).filter(([groupLabel, option]) =>
        validOptionsByGroup.get(groupLabel)?.has(option)
      )
    )
  } catch {
    return {}
  }
}

function mergeAccordionSections(baseSections, cancellationPolicy, fallbackCancellationSection) {
  const sections = Array.isArray(baseSections) ? [...baseSections] : []
  const fallbackCancellation =
    sections.find(section => section?.title === 'Cancellation Policy') ??
    fallbackCancellationSection ??
    null
  const withoutCancellation = sections.filter(section => section?.title !== 'Cancellation Policy')

  if (cancellationPolicy?.body) {
    withoutCancellation.push(cancellationPolicy)
  } else if (fallbackCancellation) {
    withoutCancellation.push(fallbackCancellation)
  }

  return withoutCancellation
}

function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return ''
  return `₹${amount.toLocaleString('en-IN')}`
}

function PackageCmsDetails({ pkg, groups }) {
  const primarySection = Array.isArray(pkg?.detail_sections)
    ? (pkg.detail_sections[0] ?? null)
    : null
  const inclusions = Array.isArray(pkg?.detail_inclusions) ? pkg.detail_inclusions : []
  const exclusions = Array.isArray(pkg?.detail_exclusions) ? pkg.detail_exclusions : []
  const addons = Array.isArray(pkg?.detail_addons) ? pkg.detail_addons : []
  const priceBreakdown = Array.isArray(pkg?.detail_price_breakdown)
    ? pkg.detail_price_breakdown
    : []
  const hasCmsContent =
    Boolean(primarySection) ||
    inclusions.length > 0 ||
    exclusions.length > 0 ||
    addons.length > 0 ||
    priceBreakdown.length > 0

  const infoItems = [
    primarySection?.bartender_type
      ? { label: 'Bartender type', value: primarySection.bartender_type }
      : null,
    primarySection?.hours_range ? { label: 'Hours', value: primarySection.hours_range } : null,
    primarySection?.price_per_extra_hour
      ? {
          label: 'Extra hour',
          value: `${formatCurrency(primarySection.price_per_extra_hour)} / hour`,
        }
      : null,
    primarySection?.ideal_for ? { label: 'Ideal for', value: primarySection.ideal_for } : null,
  ].filter(Boolean)

  if (!hasCmsContent && !groups.length) return null

  return (
    <div className="space-y-6">
      {infoItems.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {infoItems.map(item => (
            <div
              key={item.label}
              className="rounded-[10px] border border-[#CDB17E] bg-[#F8F4ED] p-3"
            >
              <p className="text-[11px] uppercase tracking-[0.12em] text-semibold text-[#8F6945]">
                {item.label}
              </p>
              <p className="mt-2 text-[13px] leading-[1.6] text-[#591902]">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {inclusions.length ? (
        <div>
          <p className="text-[13px] font-semibold leading-none text-[#2D2D2D]">
            What&apos;s included
          </p>
          <ul className="mt-3 space-y-2">
            {inclusions.map(item => (
              <li
                key={item}
                className="flex items-start gap-2 text-[13px] leading-[1.6] text-[#591902] opacity-80"
              >
                <span className="mt-[7px] h-[4px] w-[4px] rounded-full bg-[#591902]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {exclusions.length ? (
        <div>
          <p className="text-[13px] font-semibold leading-none text-[#2D2D2D]">Not included</p>
          <ul className="mt-3 space-y-2">
            {exclusions.map(item => (
              <li
                key={item}
                className="flex items-start gap-2 text-[13px] leading-[1.6] text-[#591902] opacity-80"
              >
                <span className="mt-[7px] h-[4px] w-[4px] rounded-full bg-[#591902]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {addons.length ? (
        <div>
          <p className="text-[13px] font-semibold leading-none text-[#2D2D2D]">Available add-ons</p>
          <ul className="mt-3 space-y-2">
            {addons.map(item => (
              <li
                key={item}
                className="flex items-start gap-2 text-[13px] leading-[1.6] text-[#591902] opacity-80"
              >
                <span className="mt-[7px] h-[4px] w-[4px] rounded-full bg-[#591902]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default function PackageDetailsPage() {
  // const navigate = useNavigate()
  const { service = '', packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data: packages = [] } = usePackages()
  const { data: packageDetails, isLoading: isPackageLoading } = usePackageById(packageId)
  const { data: cancellationPolicy } = useCancellationPolicy()
  const { addPackage, updateCartItemDetails } = useCart()
  const { showToast } = useToast()
  const { data: cartToastMessage = 'Package added to cart successfully.' } = useCartToastMessage()
  const cartItemId = searchParams.get('cartItemId') ?? ''
  const normalizedService = normalizeServiceSlug(service)
  const search = searchParams.toString()
  const details = getServiceProductDetails(normalizedService)
  const [selectedOptions, setSelectedOptions] = useState(() =>
    buildDefaultSelectedOptions(details.configurableGroups)
  )
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartMessage, setAddToCartMessage] = useState('')

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
      packageDetails
        ? {
            ...packageDetails,
            serviceSlug: packageDetails.service_slugs?.[0] || normalizedService,
            images: packageDetails.images?.length
              ? packageDetails.images
              : (PKG_LOCAL_IMAGES[packageDetails._index % PKG_LOCAL_IMAGES.length] ??
                PKG_LOCAL_IMAGES[0]),
          }
        : (packagesData.find(
            item =>
              buildPackageId(item) === normalisePackageId(packageId) &&
              packageMatchesService(item, normalizedService)
          ) ?? packagesData.find(item => buildPackageId(item) === normalisePackageId(packageId))),
    [normalizedService, packageDetails, packageId, packagesData]
  )

  const relatedProducts = useMemo(
    () =>
      packagesData
        .filter(
          item =>
            buildPackageId(item) !== buildPackageId(pkg ?? {}) &&
            packageMatchesService(item, normalizedService)
        )
        .slice(0, 3)
        .map(item => ({ ...item, serviceSlug: normalizedService })),
    [normalizedService, packagesData, pkg]
  )
  const { data: packageReviews = [] } = usePackageReviews({
    id: pkg?.id,
    documentId: pkg?.documentId,
    title: pkg?.title,
  })

  useEffect(() => {
    const defaultOptions = buildDefaultSelectedOptions(details.configurableGroups)
    const selectedOptionsFromSearch = getSelectedOptionsFromSearchParams(
      searchParams,
      details.configurableGroups
    )

    setSelectedOptions({
      ...defaultOptions,
      ...selectedOptionsFromSearch,
    })
    setQuantity(1)
    setAddToCartMessage('')
  }, [details.configurableGroups, packageId, searchParams])

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

  if (isPackageLoading) {
    return null
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const sourceImages = pkg.images?.length ? pkg.images : PKG_LOCAL_IMAGES[0]
  const sideImages = sourceImages
  const packageTitle = pkg.title || details.heroBadge
  const packagePrice = pkg.price || ''
  const packageIntro = pkg.description || details.intro
  const accordionSections = mergeAccordionSections(
    Array.isArray(pkg.detail_accordion_sections) && pkg.detail_accordion_sections.length
      ? pkg.detail_accordion_sections
      : details.sections,
    cancellationPolicy,
    details.sections.find(section => section.title === 'Cancellation Policy')
  )

  const handleAddToCart = async () => {
    setAddToCartMessage('')

    const numericPackageId = Number(pkg?.id)
    if (!Number.isFinite(numericPackageId)) {
      setAddToCartMessage('This package is missing its cart ID. Please refresh and try again.')
      return
    }

    setIsAddingToCart(true)

    try {
      if (cartItemId) {
        await updateCartItemDetails({
          itemId: cartItemId,
          quantity,
          selectedOptions: normalizeSelectedOptions(selectedOptions),
        })
        showToast({ message: cartToastMessage })
      } else {
        await addPackage({
          packageId: numericPackageId,
          quantity,
          selectedOptions: normalizeSelectedOptions(selectedOptions),
        })
        showToast({ message: cartToastMessage })
      }
    } catch (err) {
      console.error('[package-details] add to cart failed', err)
      setAddToCartMessage('Could not add this package to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <SingleProductPageContent
      title={packageTitle}
      price={packagePrice}
      intro={packageIntro}
      customContent={<PackageCmsDetails pkg={pkg} groups={details.configurableGroups} />}
      accordionSections={accordionSections}
      mainImage={pkg.images?.[0] ?? sideImages[0]}
      sideImages={sideImages}
      relatedProducts={relatedProducts}
      addToCartLabel={isAddingToCart ? 'Adding...' : 'Add to cart'}
      addToCartMessage={addToCartMessage}
      disableAddToCart={isAddingToCart}
      onAddToCart={handleAddToCart}
      quantity={quantity}
      onDecrement={() => {
        setAddToCartMessage('')
        setQuantity(current => Math.max(1, current - 1))
      }}
      onIncrement={() => {
        setAddToCartMessage('')
        setQuantity(current => current + 1)
      }}
      testimonials={packageReviews}
    />
  )
}
