import { useMemo, useState, useEffect } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/common/useToast'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { usePackageById, usePackages } from '../hooks/usePackages'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import { useCancellationPolicy } from '../hooks/useCancellationPolicy'
import { useCartToastMessage } from '../hooks/useMessagingContent'
import { usePackageReviews } from '../hooks/usePackageReviews'
import RepeatCustomizationPrompt from '../components/common/RepeatCustomizationPrompt'
import useCustomization from '../hooks/useCustomization'
import { useCart } from '../hooks/useCart'
import { useFlavors } from '../hooks/useFlavors'
import { getRelatedPackages } from '../lib/packageFilters'

// images (reuse same pattern)
import pkgImg1 from '../assets/images/IMG_3903.jpg'
import pkgImg2 from '../assets/images/IMG_7768.jpg'

const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg1, pkgImg1, pkgImg1, pkgImg1],
  [pkgImg2, pkgImg2, pkgImg2, pkgImg2, pkgImg2],
]

const SHEESHA_OPERATOR_POLICY_LINE =
  'This package includes a complete hookah setup with a dedicated hookah operator for approximately 3-4 hours of service.'

const SHEESHA_DEFAULT_POLICIES_BODY =
  'All the material used is on rent and shall be picked up after the event. The cost given above is for one event only.'

const SHEESHA_PRICE_COVERS_BODY =
  '✔ Hookah\t✔ Hookah Operator\t✔ Coal\t✔ Flavor\tPremium hookah base\tStem & tray\tHose / pipe\tMouth tips (disposable)\tTongs\nNo hidden service fees.'

const SHEESHA_SETUP_NEEDS_BODY =
  'A small area for our team to work, access to water and electricity and gas.'

const SHEESHA_CONTENT = {
  title: 'Basic Indian Hookah',
  price: '₹1850.00',
  intro:
    'A classic Indian hookah experience with premium flavors and full service setup for your event.',
  accordionSections: [
    {
      title: 'The price you see covers it all',
      body: SHEESHA_PRICE_COVERS_BODY,
    },
    {
      title: 'Setup needs',
      body: SHEESHA_SETUP_NEEDS_BODY,
    },
    {
      title: 'Policies',
      body: `${SHEESHA_OPERATOR_POLICY_LINE}\n\n${SHEESHA_DEFAULT_POLICIES_BODY}`,
    },
    {
      title: 'Cancellation Policy',
      body: 'Cancellation terms apply based on timing.',
    },
  ],
}

const SHEESHA_FLAVOR_DESCRIPTION_FALLBACKS = {
  commissioner: 'Bold classic blend with a smooth finish.',
  seabridge: 'Cool ocean freshness with subtle sweetness.',
  'dubai special': 'Rich Middle Eastern mix, sweet and smooth.',
  'pan kiwi mint': 'Tangy kiwi layered with paan mint.',
  'paan mint cigar': 'Strong paan flavor with cool mint.',
  'brain freezer': 'Intense icy mint for extreme cooling.',
  apple: 'Crisp sweet apple with smooth smoke.',
  watermelon: 'Juicy watermelon with light refreshing sweetness.',
  'love 66':
    'Our house blend of honeydew melon, watermelon, passionfruit, and mint.',
  'lady killer': 'A refreshing mix of melon, mango, berries, and mint.',
  'blue melon': 'A sweet combo of blueberry and melon.',
  'mango tango icy': 'Intense mango with an icy menthol blast.',
  'berlin nights': 'A popular peach-based blend.',
  'hurrem sultan': 'A unique, aromatic blend.',
  'double apple': 'A classic apple flavor with warm spice notes.',
  'turkish mastic': 'A sweet and earthy resin flavor.',
  mint: 'Cooling and refreshing.',
}

function ensureSheeshaPoliciesSection(sections) {
  return (Array.isArray(sections) ? sections : []).map(section => {
    if (section?.title !== 'Policies') return section

    const body = String(section.body ?? '').trim()
    if (body.includes('dedicated hookah operator')) return section

    return {
      ...section,
      body: body
        ? `${SHEESHA_OPERATOR_POLICY_LINE}\n\n${body}`
        : `${SHEESHA_OPERATOR_POLICY_LINE}\n\n${SHEESHA_DEFAULT_POLICIES_BODY}`,
    }
  })
}

function buildSheeshaAccordionSections(pkg) {
  const sections =
    Array.isArray(pkg?.detail_accordion_sections) && pkg.detail_accordion_sections.length
      ? pkg.detail_accordion_sections
      : SHEESHA_CONTENT.accordionSections

  return ensureSheeshaPoliciesSection(sections)
}

function mergeAccordionSections(baseSections, cancellationPolicy, fallbackCancellationSection) {
  const sections = ensureSheeshaPoliciesSection(Array.isArray(baseSections) ? [...baseSections] : [])
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

function buildSheeshaSelectedOptions(customization, { fallbackFlavor = '' } = {}) {
  const selectedFlavor = String(customization?.data?.selectedFlavor ?? fallbackFlavor ?? '').trim()
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

function getSheeshaFlavorDescription(flavor) {
  const strapiDescription = String(flavor?.description ?? '').trim()
  if (strapiDescription) return strapiDescription

  const normalizedTitle = String(flavor?.title ?? '')
    .trim()
    .toLowerCase()
  return SHEESHA_FLAVOR_DESCRIPTION_FALLBACKS[normalizedTitle] ?? ''
}

function SheeshaCustomContent({ selectedFlavor, onSelectFlavor, flavors, inclusions }) {
  const [hiddenTooltipFlavor, setHiddenTooltipFlavor] = useState('')

  useEffect(() => {
    if (!selectedFlavor) return undefined

    const timeoutId = window.setTimeout(() => {
      setHiddenTooltipFlavor(selectedFlavor)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [selectedFlavor])

  const visibleTooltipFlavor =
    selectedFlavor && hiddenTooltipFlavor !== selectedFlavor ? selectedFlavor : ''

  if (!flavors || flavors.length === 0) {
    return (
      <div>
        <p className="text-[16px] font-semibold text-[#2D2D2D]">Flavors</p>
        <p className="mt-4 text-[13px] text-[#591902]">No flavors available</p>
      </div>
    )
  }

  const midpoint = Math.ceil(flavors.length / 2)
  const leftFlavors = flavors.slice(0, midpoint)
  const rightFlavors = flavors.slice(midpoint)

  return (
    <div>
      {/* Flavors */}
      <div>
        <p className="text-[16px] font-semibold text-[#2D2D2D]">Flavors</p>

        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 overflow-visible md:grid-cols-2 md:items-start">
          <div className="space-y-4 overflow-visible">
            {leftFlavors.map((flavor, index) => (
              <label
                key={`${flavor.title}-${index}`}
                className="relative flex w-full items-start gap-3 cursor-pointer md:w-fit"
              >
                <input
                  type="radio"
                  name="flavor"
                  checked={selectedFlavor === flavor.title}
                  onChange={() => onSelectFlavor(flavor.title)}
                  className="mt-1 accent-[#591902]"
                />

                <div>
                  <p className="text-[13px] text-[#591902]">{flavor.title}</p>
                </div>

                {visibleTooltipFlavor === flavor.title && getSheeshaFlavorDescription(flavor) ? (
                  <div className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 w-[142px] -translate-y-[100%]">
                    <div className="relative rounded-[12px] bg-black px-4 py-2">
                      <p className="max-w-[110px] text-center text-[9px] font-medium leading-[1.3] text-white">
                        {getSheeshaFlavorDescription(flavor)}
                      </p>
                      <div
                        className="absolute bottom-[-1.5px] right-33 h-[9px] w-[10px] bg-black"
                        style={{
                          clipPath: 'polygon(0% 100%, 35% 0%, 100% 70.23%)',
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </label>
            ))}
          </div>

          <div className="space-y-4 overflow-visible max-md:justify-self-start md:justify-self-end">
            {rightFlavors.map((flavor, index) => (
              <label
                key={`${flavor.title}-${index + midpoint}`}
                className="relative flex w-full items-start gap-3 cursor-pointer md:w-fit"
              >
                <input
                  type="radio"
                  name="flavor"
                  checked={selectedFlavor === flavor.title}
                  onChange={() => onSelectFlavor(flavor.title)}
                  className="mt-1 accent-[#591902]"
                />

                <div>
                  <p className="text-[13px] text-[#591902]">{flavor.title}</p>
                </div>

                {visibleTooltipFlavor === flavor.title && getSheeshaFlavorDescription(flavor) ? (
                  <div className="pointer-events-none absolute right-full top-1/2 z-20 mr-2 w-[142px] -translate-y-[100%]">
                    <div className="relative rounded-[12px] bg-black px-4 py-2">
                      <p className="max-w-[110px] text-center text-[9px] font-medium leading-[1.3] text-white">
                        {getSheeshaFlavorDescription(flavor)}
                      </p>
                      <div
                        className="absolute bottom-[-1px] left-33.5 h-[9px] w-[10px] bg-black"
                        style={{
                          clipPath: 'polygon(100% 100%, 65% 0%, 0% 70.23%)',
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </label>
            ))}
          </div>
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
  const packagesQuery = usePackages()
  const packageQuery = usePackageById(packageId)
  const cancellationQuery = useCancellationPolicy()
  const isStrapiLoading = useStrapiPageLoading(packagesQuery, packageQuery, cancellationQuery)

  const { data: packages = [] } = packagesQuery
  const { data: packageFlavors = [] } = useFlavors()
  const { data: packageDetails } = packageQuery
  const { data: cancellationPolicy } = cancellationQuery
  const { addPackage, updateCartItemDetails } = useCart()
  const { showToast } = useToast()
  const { data: cartToastMessage = 'Package added to cart successfully.' } = useCartToastMessage()
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

  const relatedProducts = useMemo(
    () => (pkg ? getRelatedPackages(packagesData, pkg, { serviceSlug: 'sheesha' }) : []),
    [packagesData, pkg]
  )

  const { data: packageReviews = [] } = usePackageReviews({
    id: pkg?.id,
    documentId: pkg?.documentId,
    title: pkg?.title,
  })

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const source = pkg.images?.length ? pkg.images : PKG_LOCAL_IMAGES[0]
  const sideImages = Array.from({ length: 5 }).map((_, i) => source[i % source.length])

  const selectedFlavor = activeCustomization?.data?.selectedFlavor ?? null
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

    if (!cartItemId && activeCustomization?.isAddedToCart) {
      handleIncrease()
      return
    }

    setIsAddingToCart(true)

    try {
      const selectedOptions = buildSheeshaSelectedOptions(activeCustomization, {
        fallbackFlavor: flavors[0]?.title ?? '',
      })

      if (cartItemId) {
        await updateCartItemDetails({
          itemId: cartItemId,
          quantity,
          selectedOptions,
        })
        showToast({ message: cartToastMessage })
      } else {
        const updatedCart = await addPackage({
          packageId: Number(pkg.id),
          quantity: 1,
          selectedOptions,
        })
        handleAddToCart()
        void updatedCart
        showToast({ message: cartToastMessage })
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
      disableAddToCart={isAddingToCart}
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
