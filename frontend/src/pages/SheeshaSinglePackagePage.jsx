import { useMemo, useState, useEffect } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { usePackageById, usePackages } from '../hooks/usePackages'
import { useCancellationPolicy } from '../hooks/useCancellationPolicy'
import RepeatCustomizationPrompt from '../components/common/RepeatCustomizationPrompt'
import useCustomization from '../hooks/useCustomization'
import { useCart } from '../hooks/useCart'

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

// flavors
const FLAVORS = [
  { title: 'Double Apple' },
  { title: 'Mint' },
  { title: 'Blueberry' },
  { title: 'Watermelon' },
  {
    title: 'Ice Mint',
    description: 'Intense icy mint for extreme cooling',
  },
]

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
  return FLAVORS
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

// utils (same as decor)
function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
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
  const { packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: packages = [] } = usePackages()
  const { data: packageDetails, isLoading: isPackageLoading } = usePackageById(packageId)
  const { data: cancellationPolicy } = useCancellationPolicy()
  const { addPackage } = useCart()
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

  const [selectedFlavor, setSelectedFlavor] = useState(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartMessage, setAddToCartMessage] = useState('')
  const quantity = customizations.length

  // Sync selectedFlavor with active customization when activeIndex changes
  useEffect(() => {
    setSelectedFlavor(activeCustomization?.data?.selectedFlavor ?? null)
  }, [activeIndex, activeCustomization])

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

  if (isPackageLoading) {
    return null
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const source = pkg.images?.length ? pkg.images : PKG_LOCAL_IMAGES[0]
  const sideImages = Array.from({ length: 5 }).map((_, i) => source[i % source.length])

  const relatedProducts = packagesData
    .filter(item => buildPackageId(item) !== buildPackageId(pkg))
    .slice(0, 3)
    .map(item => ({ ...item, serviceSlug: 'sheesha' }))

  const isAddToCartDisabled = !selectedFlavor
  const packageTitle = pkg.title || SHEESHA_CONTENT.title
  const packagePrice = pkg.price || SHEESHA_CONTENT.price
  const packageIntro = pkg.description || SHEESHA_CONTENT.intro
  const accordionSections = mergeAccordionSections(
    buildSheeshaAccordionSections(pkg),
    cancellationPolicy,
    SHEESHA_CONTENT.accordionSections.find(section => section.title === 'Cancellation Policy')
  )
  const flavors = buildSheeshaFlavors(pkg)
  const inclusions = buildSheeshaInclusions(pkg)

  const handleSelectFlavor = flavorTitle => {
    setAddToCartMessage('')
    setSelectedFlavor(flavorTitle)
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
    console.log('[cart-click] sheesha add to cart', {
      packageId: Number(pkg.id),
      title: pkg.title,
      selectedFlavor,
    })

    try {
      const updatedCart = await addPackage({ packageId: Number(pkg.id), quantity: 1 })
      handleAddToCart()
      console.log('[cart-click] sheesha added', {
        packageId: Number(pkg.id),
        title: pkg.title,
        itemCount: (updatedCart?.items ?? []).reduce(
          (sum, item) => sum + Number(item?.quantity ?? 0),
          0
        ),
      })
      setAddToCartMessage('Added to cart.')
    } catch (err) {
      if (err.code === 'AUTH_REQUIRED' || err.message === 'AUTH_REQUIRED') {
        navigate('/login')
        return
      }

      console.error('[cart-click] sheesha add failed', err)
      setAddToCartMessage('Could not add this package to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleCartAdd = async () => {
    if (isAddToCartDisabled || isAddingToCart) return

    setIsAddingToCart(true)
    try {
      await addPackage({ packageId: pkg.id, quantity })
      handleAddToCart()
      navigate('/cart')
    } catch (err) {
      if (err?.code === 'AUTH_REQUIRED') {
        navigate('/login')
        return
      }
      console.error('[sheesha] add to cart failed', err)
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
    />
  )
}
