import { useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { usePackages } from '../hooks/usePackages'
import useCustomization from '../hooks/useCustomization'

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

// utils (same as decor)
function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
}

function SheeshaCustomContent({ selectedFlavor, onSelectFlavor, flavors }) {
  return (
    <div>
      {/* Flavors */}
      <div>
        <p className="text-[16px] font-semibold text-[#2D2D2D]">Flavors</p>

        <div className="mt-4 grid grid-cols-2 gap-y-3">
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
          {[
            '1 staff/Hookah operator',
            'One Hookah Pot',
            'Unlimited Flavour Change of chosen flavor',
            'Unlimited Coal Change',
            'Full Hookah Equipment kit',
          ].map((item, index) => (
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
  const { data: packages = [] } = usePackages()
  const { customizations, handleAddToCart, handleIncrease, handleDecrease } = useCustomization()

  const [selectedFlavor, setSelectedFlavor] = useState(null)
  const quantity = customizations.length

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
    () => packagesData.find(item => buildPackageId(item) === normalisePackageId(packageId)),
    [packageId, packagesData]
  )

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

  return (
    <SingleProductPageContent
      backHref={backHref}
      title={packageTitle}
      price={packagePrice}
      intro={packageIntro}
      accordionSections={SHEESHA_CONTENT.accordionSections}
      mainImage={pkg.images?.[0] ?? sideImages[0]}
      sideImages={sideImages}
      relatedProducts={relatedProducts}
      disableAddToCart={isAddToCartDisabled}
      onAddToCart={handleAddToCart}
      quantity={quantity}
      onDecrement={handleDecrease}
      onIncrement={handleIncrease}
      customContent={
        <SheeshaCustomContent
          flavors={FLAVORS}
          selectedFlavor={selectedFlavor}
          onSelectFlavor={setSelectedFlavor}
        />
      }
    />
  )
}
