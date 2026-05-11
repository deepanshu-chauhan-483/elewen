import { useMemo, useState, useEffect } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { usePackageById, usePackages } from '../hooks/usePackages'
import { useCancellationPolicy } from '../hooks/useCancellationPolicy'
import { usePackageReviews } from '../hooks/usePackageReviews'
import RepeatCustomizationPrompt from '../components/common/RepeatCustomizationPrompt'
import useCustomization from '../hooks/useCustomization'
import { useCart } from '../hooks/useCart'
import { useFlavors } from '../hooks/useFlavors'

// images (reuse same pattern)
import pkgImg1 from '../assets/images/IMG_3903.jpg'
import pkgImg2 from '../assets/images/IMG_7768.jpg'

const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg1, pkgImg1, pkgImg1, pkgImg1],
  [pkgImg2, pkgImg2, pkgImg2, pkgImg2, pkgImg2],
]

const SHEESHA_CONTENT = {
  title: 'Basic Indian Hookah',
  price: '₹1850.00',
  intro:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  accordionSections: [
    {
      title: 'The price you see covers it all',
      body: 'Everything shown is included in this package.',
    },
    {
      title: 'Setup needs',
      body: 'Basic setup space and ventilation required.',
    },
    {
      title: 'Policies',
      body: 'Standard service policies apply.',
    },
    {
      title: 'Cancellation Policy',
      body: 'Cancellation terms apply based on timing.',
    },
  ],
}

function buildSheeshaAccordionSections(pkg) {
  return Array.isArray(pkg?.detail_accordion_sections) && pkg.detail_accordion_sections.length
    ? pkg.detail_accordion_sections
    : SHEESHA_CONTENT.accordionSections
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

function buildSheeshaFlavors(pkg) {
  if (Array.isArray(pkg?.flavor_options) && pkg.flavor_options.length) return pkg.flavor_options
  return []
}

function buildSheeshaInclusions(pkg) {
  return Array.isArray(pkg?.detail_inclusions) && pkg.detail_inclusions.length
    ? pkg.detail_inclusions
    : [
        '1 staff/Hookah operator',
        'One Hookah Pot',
        'Unlimited Flavour Change of chosen flavor',
        'Unlimited Coal Change',
        'Full Hookah Equipment kit',
      ]
}

function normalizeSelectedOptions(selectedOptions = {}) {
  return Object.fromEntries(
    Object.entries(selectedOptions)
      .map(([key, value]) => [String(key ?? '').trim(), String(value ?? '').trim()])
      .filter(([key, value]) => key && value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  )
}

function buildSheeshaSelectedOptions(customization) {
  const selectedFlavor = String(customization?.data?.selectedFlavor ?? '').trim()
  return normalizeSelectedOptions(
    selectedFlavor
      ? {
          Flavor: selectedFlavor,
        }
      : {}
  )
}

function getSelectedOptionsFromSearchParams(searchParams) {
  const rawValue = searchParams.get('selectedOptions')
  if (!rawValue) return {}

  try {
    return normalizeSelectedOptions(JSON.parse(rawValue))
  } catch {
    return {}
  }
}

// utils (same as decor)
function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
}

function isSheeshaPackage(pkg) {
  return Array.isArray(pkg?.service_slugs) && pkg.service_slugs.includes('sheesha')
}

function SheeshaCustomContent({ selectedFlavor, onSelectFlavor, flavors, inclusions }) {
  if (!flavors || flavors.length === 0) {
    return (
      <div>
        <p className="text-[16px] font-semibold text-[#2D2D2D]">Flavors</p>
        <p className="mt-4 text-[13px] text-[#591902]">No flavors available</p>
      </div>
    )
  }

  return (
    <div>
      {/* Flavors */}
      <div>
        <p className="text-[16px] font-semibold text-[#2D2D2D]">Flavors</p>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 max-h-none">
          {flavors.map((flavor, index) => (
            <label key={index} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="flavor"
                checked={selectedFlavor === flavor.title}
                onChange={() => onSelectFlavor(flavor.title)}
                className="mt-1 accent-[#591902]"
              />

              <div>
                <p className="text-[13px] text-[#591902]">{flavor.title}</p>

                {flavor.description && (
                  <p className="text-[11px] text-[#591902] opacity-50">{flavor.description}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mt-6 border-t border-[#36402280]" />

      {/* What's Included */}
      <div className="mt-6">
        <p className="text-[16px] font-semibold text-[#2D2D2D]">What&apos;s Included:</p>

        <ul className="mt-4 space-y-2">
          {inclusions.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-[13px] text-[#591902] opacity-70"
            >
              <span className="mt-[6px] h-[4px] w-[4px] rounded-full bg-[#591902]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function SheeshaSinglePackagePage() {
  // const navigate = useNavigate()
  const { packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data: packages = [] } = usePackages()
  const { data: packageFlavors = [] } = useFlavors()
  const { data: packageDetails, isLoading: isPackageLoading } = usePackageById(packageId)
  const { data: cancellationPolicy } = useCancellationPolicy()
  const { addPackage, updateCartItemDetails } = useCart()
  const cartItemId = searchParams.get('cartItemId') ?? ''
  const {
    customizations,
    activeCustomization,
    activeIndex,
    showRepeatPrompt,
    handleAddToCart,
    handleIncrease,
    handleRepeat,
    handleNew,
    handleDecrease,
    setCustomizations,
  } = useCustomization({
    createInitialData: () => ({ selectedFlavor: null }),
  })

  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartMessage, setAddToCartMessage] = useState('')
  const quantity = customizations.length

  useEffect(() => {
    const selectedOptionsFromSearch = getSelectedOptionsFromSearchParams(searchParams)
    const selectedFlavorFromSearch = selectedOptionsFromSearch.Flavor ?? null

    setCustomizations([
      {
        id: 1,
        data: { selectedFlavor: selectedFlavorFromSearch },
        isAddedToCart: false,
      },
    ])
  }, [packageId, searchParams, setCustomizations])

  const packagesData = useMemo(
    () =>
      packages.map((pkg, index) => ({
        ...pkg,
        images: pkg.images?.length
          ? pkg.images
          : (PKG_LOCAL_IMAGES[index % PKG_LOCAL_IMAGES.length] ?? []),
      })),
    [packages]
  )

  const backHref = useMemo(() => {
    const next = new URLSearchParams(searchParams)
    return `/packages/sheesha${next.toString() ? `?${next.toString()}` : ''}`
  }, [searchParams])

  const pkg = useMemo(
    () =>
      packageDetails
        ? {
            ...packageDetails,
            images: packageDetails.images?.length
              ? packageDetails.images
              : (PKG_LOCAL_IMAGES[packageDetails._index % PKG_LOCAL_IMAGES.length] ??
                PKG_LOCAL_IMAGES[0]),
          }
        : packagesData.find(item => buildPackageId(item) === normalisePackageId(packageId)),
    [packageDetails, packageId, packagesData]
  )
  const { data: packageReviews = [] } = usePackageReviews({
    id: pkg?.id,
    documentId: pkg?.documentId,
    title: pkg?.title,
  })

  if (isPackageLoading) {
    return null
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const source = pkg.images?.length ? pkg.images : PKG_LOCAL_IMAGES[0]
  const sideImages = Array.from({ length: 5 }).map((_, i) => source[i % source.length])

  const relatedProducts = packagesData
    .filter(item => isSheeshaPackage(item) && buildPackageId(item) !== buildPackageId(pkg))
    .slice(0, 3)
    .map(item => ({ ...item, serviceSlug: 'sheesha' }))

  const selectedFlavor = activeCustomization?.data?.selectedFlavor ?? null
  const isAddToCartDisabled = !selectedFlavor
  const packageTitle = pkg.title || SHEESHA_CONTENT.title
  const packagePrice = pkg.price || SHEESHA_CONTENT.price
  const packageIntro = pkg.description || SHEESHA_CONTENT.intro
  const accordionSections = mergeAccordionSections(
    buildSheeshaAccordionSections(pkg),
    cancellationPolicy,
    SHEESHA_CONTENT.accordionSections.find(section => section.title === 'Cancellation Policy')
  )
  const packageFlavorsList = buildSheeshaFlavors(pkg)
  const flavors = packageFlavorsList.length ? packageFlavorsList : packageFlavors
  const inclusions = buildSheeshaInclusions(pkg)

  const handleSelectFlavor = flavorTitle => {
    setAddToCartMessage('')
    setCustomizations(prev =>
      prev.map((c, i) =>
        i === activeIndex
          ? { ...c, data: { selectedFlavor: flavorTitle }, isAddedToCart: false }
          : c
      )
    )
  }

  const handlePackageAddToCart = async () => {
    setAddToCartMessage('')

    if (!pkg?.id) {
      setAddToCartMessage('This package is missing its cart ID. Please refresh and try again.')
      return
    }

    setIsAddingToCart(true)

    try {
      const selectedOptions = buildSheeshaSelectedOptions(activeCustomization)

      if (cartItemId) {
        await updateCartItemDetails({
          itemId: cartItemId,
          quantity,
          selectedOptions,
        })
        setAddToCartMessage('Package updated.')
      } else {
        const updatedCart = await addPackage({
          packageId: Number(pkg.id),
          quantity: 1,
          selectedOptions,
        })
        handleAddToCart()
        void updatedCart
        setAddToCartMessage('Added to cart.')
      }
    } catch (err) {
      console.error('[cart-click] sheesha add failed', err)
      setAddToCartMessage('Could not add this package to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <SingleProductPageContent
      backHref={backHref}
      title={packageTitle}
      price={packagePrice}
      intro={packageIntro}
      accordionSections={accordionSections}
      mainImage={pkg.images?.[0] ?? sideImages[0]}
      sideImages={sideImages}
      relatedProducts={relatedProducts}
      addToCartLabel={isAddingToCart ? 'Adding...' : 'Add to cart'}
      addToCartMessage={addToCartMessage}
      disableAddToCart={isAddToCartDisabled || isAddingToCart}
      onAddToCart={handlePackageAddToCart}
      quantity={quantity}
      onDecrement={handleDecrease}
      onIncrement={handleIncrease}
      promptContent={
        showRepeatPrompt && (
          <RepeatCustomizationPrompt onRepeat={handleRepeat} onCreateNew={handleNew} />
        )
      }
      customContent={
        <SheeshaCustomContent
          flavors={flavors}
          inclusions={inclusions}
          selectedFlavor={selectedFlavor}
          onSelectFlavor={handleSelectFlavor}
        />
      }
      testimonials={packageReviews}
    />
  )
}
