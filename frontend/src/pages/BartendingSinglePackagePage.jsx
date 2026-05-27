import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import RepeatCustomizationPrompt from '../components/common/RepeatCustomizationPrompt'
import { useToast } from '../components/common/useToast'
import SingleProductPageContent from '../components/package-details/SingleProductPageContent'
import { useCancellationPolicy } from '../hooks/useCancellationPolicy'
import { useCart } from '../hooks/useCart'
import useCustomization from '../hooks/useCustomization'
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

function normalisePackageId(value = '') {
  return String(value).trim().toLowerCase()
}

function buildPackageId(pkg) {
  return normalisePackageId(pkg.documentId ?? pkg.id ?? pkg.title)
}

function isBartendingPackage(pkg) {
  return Array.isArray(pkg?.service_slugs) && pkg.service_slugs.includes('bartending')
}

function normalizeSelectedOptions(selectedOptions = {}) {
  return Object.fromEntries(
    Object.entries(selectedOptions)
      .map(([key, value]) => [String(key ?? '').trim(), String(value ?? '').trim()])
      .filter(([key, value]) => key && value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
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

function formatCurrency(value, { showDecimals = false } = {}) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return ''

  if (showDecimals) {
    return `₹${amount.toFixed(2)}`
  }

  return `₹${amount.toLocaleString('en-IN')}`
}

function formatHoursLabel(value = '') {
  const normalized = String(value ?? '').trim()
  if (!normalized) return ''
  if (/hr/i.test(normalized)) return normalized
  if (/^\d+\s*-\s*\d+$/.test(normalized)) return `${normalized} hrs`
  if (/^\d+$/.test(normalized)) return `${normalized} hrs`
  return normalized
}

function getPricingRuleLabel(rule) {
  return rule?.value ?? rule?.title ?? rule?.name ?? rule?.label ?? rule?.hours_range ?? ''
}

function getPricingRuleModifierAmount(rule) {
  const modifierType = String(rule?.modifier_type ?? '').toLowerCase()
  const modifierValue = Number(rule?.modifier_value ?? 0)

  if (!Number.isFinite(modifierValue)) return 0
  if (!modifierType || modifierType === 'flat_amount') return modifierValue

  return 0
}

function mergeAccordionSections(baseSections, cancellationPolicy) {
  const sections = Array.isArray(baseSections) ? [...baseSections] : []
  const withoutCancellation = sections.filter(section => section?.title !== 'Cancellation Policy')
  const existingCancellation = sections.find(section => section?.title === 'Cancellation Policy')

  if (cancellationPolicy?.body) {
    withoutCancellation.push(cancellationPolicy)
  } else if (existingCancellation) {
    withoutCancellation.push(existingCancellation)
  }

  return withoutCancellation
}

function buildHoursOptions(pkg) {
  const pricingRules = Array.isArray(pkg?.detail_pricing_rules) ? pkg.detail_pricing_rules : []
  const primarySection = Array.isArray(pkg?.detail_sections)
    ? (pkg.detail_sections[0] ?? null)
    : null
  const ruleOptions = pricingRules
    .filter(rule => {
      const ruleType = String(rule?.rule_type ?? '').toLowerCase()
      return !ruleType || ruleType === 'hours'
    })
    .map((rule, index) => ({
      id: String(rule?.id ?? `${getPricingRuleLabel(rule)}-${index}`),
      label: formatHoursLabel(getPricingRuleLabel(rule)),
      priceModifier: getPricingRuleModifierAmount(rule),
    }))
    .filter(option => option.label)

  if (ruleOptions.length) return ruleOptions

  if (primarySection?.hours_range) {
    return [
      {
        id: 'default-hours',
        label: formatHoursLabel(primarySection.hours_range),
        priceModifier: 0,
      },
    ]
  }

  return []
}

function getSelectedAddonIdsFromSearchParams(searchParams, addons = []) {
  const selectedOptions = getSelectedOptionsFromSearchParams(searchParams)
  const rawValue =
    selectedOptions['Add-ons'] ??
    selectedOptions['Add on services'] ??
    selectedOptions['Addon services'] ??
    ''

  if (!rawValue) return []

  const selectedNames = String(rawValue)
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)

  if (!selectedNames.length) return []

  return addons
    .filter(addon =>
      selectedNames.includes(
        String(addon?.name ?? '')
          .trim()
          .toLowerCase()
      )
    )
    .map(addon => String(addon.id ?? addon.name))
}

function buildBartendingSelectedOptions(customization) {
  const selectedHours = String(customization?.data?.selectedHours ?? '').trim()
  const selectedAddons = Array.isArray(customization?.data?.selectedAddons)
    ? customization.data.selectedAddons
    : []

  return normalizeSelectedOptions({
    ...(selectedHours ? { Hours: selectedHours } : {}),
    ...(selectedAddons.length ? { 'Add-ons': selectedAddons.join(', ') } : {}),
  })
}

function buildSelectedAddonItems(addons, selectedAddonIds = []) {
  const selectedIdSet = new Set(selectedAddonIds.map(value => String(value)))

  return addons.filter(addon => selectedIdSet.has(String(addon.id ?? addon.name)))
}

function splitIntroText(value = '') {
  const normalized = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return []

  const sentenceMatch = normalized.match(/^(.+?\.)\s*(.+)$/)
  if (!sentenceMatch) return [normalized]

  return [sentenceMatch[1], sentenceMatch[2]].filter(Boolean)
}

function getSectionInclusionTexts(section) {
  return (Array.isArray(section?.inclusions) ? section.inclusions : [])
    .map(item => String(item?.text ?? item?.title ?? '').trim())
    .filter(Boolean)
}

function getSectionExclusionTexts(section) {
  return (Array.isArray(section?.exclusions) ? section.exclusions : [])
    .map(item => String(item?.text ?? item?.title ?? '').trim())
    .filter(Boolean)
}

function AddonEyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8C2.55 5.67 4.86 4 8 4s5.45 1.67 6.5 4c-1.05 2.33-3.36 4-6.5 4S2.55 10.33 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function AddonIllustration({ name = '' }) {
  const normalized = String(name).toLowerCase()

  if (normalized.includes('wine')) {
    return (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M15 5h12v6a6 6 0 1 1-12 0V5Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M21 17v11M17 33h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('cocktail') || normalized.includes('mocktail')) {
    return (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M11 10h20l-10 10-10-10Z" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M21 20v10M16 33h10"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path d="m27 8 4-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('whiskey') || normalized.includes('glass')) {
    return (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M12 10h18l-2 18H14l-2-18Z" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    )
  }

  if (normalized.includes('ingredient') || normalized.includes('bill')) {
    return (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M16 8h10l4 6v16H12V8h4Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M26 8v6h6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M17 21h8M17 25h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('bar')) {
    return (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M9 16h24v8H9v-8Z" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M12 24v8M30 24v8M16 12v4M21 10v6M26 12v4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path
        d="M16 6h10l4 8v14a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V14l4-8Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M16 14h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function BartendingAddonCard({ addon, isSelected = false, onToggle, onViewDetails }) {
  return (
    <article
      onClick={() => onToggle?.(addon)}
      className={`flex h-[231px] w-full min-w-0 flex-col justify-between rounded-[6px] border p-3 transition-all ${
        isSelected
          ? 'border-[#B08E66] bg-[#957960]'
          : 'border-[#F0E5D8] bg-white hover:border-[#D4B173]'
      }`}
    >
      <div className="flex h-[49px] w-[72px] mx-auto items-center justify-center gap-1 rounded-[6px] bg-[#F7F4EF] p-2 text-[#2D2D2D]">
        <AddonIllustration name={addon.name} />
      </div>

      <div className="flex h-[90px] w-[72px] flex-col gap-2 mx-auto">
        <p
          className={`text-[12px] font-semibold ${isSelected ? 'text-white' : 'text-[#7B330B]'}`}
        >
          {formatCurrency(addon.price)}
        </p>
        <p
          className={`line-clamp-4 text-[11px] leading-[1.45] ${isSelected ? 'text-white' : 'text-[#9D7B58]'}`}
        >
          {addon.name}
        </p>
      </div>

      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onViewDetails?.(addon)
        }}
        className={`flex h-8 w-full items-center justify-center rounded-full text-white transition-colors ${
          isSelected ? 'bg-[#591902] hover:bg-[#4B1501]' : 'bg-[#D4B173] hover:bg-[#C5A365]'
        }`}
        aria-label={`View ${addon.name} details`}
      >
        <AddonEyeIcon />
      </button>
    </article>
  )
}

function BartendingBeforePriceContent({ intro, pkg, selectedHours, onSelectHours, hourOptions }) {
  const primarySection = Array.isArray(pkg?.detail_sections)
    ? (pkg.detail_sections[0] ?? null)
    : null
  const introParagraphs = splitIntroText(intro)
  const inclusions = getSectionInclusionTexts(primarySection)
  const exclusions = getSectionExclusionTexts(primarySection)

  return (
    <>
      <div className="space-y-4">
        {introParagraphs.map(paragraph => (
          <p key={paragraph} className="text-[14px] leading-[1.45] text-[#B28A7D] md:text-[16px]">
            {paragraph}
          </p>
        ))}
      </div>

      {inclusions.length ? (
        <div className="mt-6">
          <p className="text-[16px] font-semibold leading-[1.5] text-[#2D2D2D]">
            What&apos;s included:
          </p>
          <ul className="mt-4 space-y-1.5">
            {inclusions.map(item => (
              <li
                key={item}
                className="flex items-start font-semibold gap-2 text-[12px] leading-[1.5] text-[#2D2D2D]"
              >
                <span className="mt-[7px] h-[4px] w-[4px] rounded-full bg-[#2D2D2D]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {exclusions.length ? (
        <div className="mt-6 border-t border-[#36402280] pt-6">
          <p className="text-[16px] font-semibold text-[#2D2D2D] leading-[1.5]">Exclusions</p>
          <ul className="mt-4 space-y-1.5">
            {exclusions.map(item => (
              <li
                key={item}
                className="flex items-start gap-2 text-[12px] font-semibold leading-[1.5] text-[#2D2D2D]"
              >
                <span className="mt-[7px] h-[4px] w-[4px] rounded-full bg-[#2D2D2D]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hourOptions.length ? (
        <div className="mt-6 border-t border-[#36402280] pt-6">
          <p className="text-[16px] font-semibold text-[#2D2D2D]">Choose number of hours</p>
          <div className="mt-4 rounded-[8px] border border-[#591902] bg-[#F8F4ED] p-4">
            <div className="space-y-2">
              {hourOptions.map(option => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center justify-between gap-3 text-[12px] text-[#591902]"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="bartending-hours"
                      checked={selectedHours === option.label}
                      onChange={() => onSelectHours(option.label)}
                      className="accent-[#591902]"
                    />
                    <span>{option.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function BartendingCustomContent({ pkg, selectedAddonIds, onToggleAddon, onViewAddon }) {
  const primarySection = Array.isArray(pkg?.detail_sections)
    ? (pkg.detail_sections[0] ?? null)
    : null
  const addons = Array.isArray(pkg?.detail_addons) ? pkg.detail_addons : []

  return (
    <>
      {primarySection?.ideal_for ? (
        <div>
          <p className="text-[13px] font-semibold text-[#2D2D2D]">Ideal For</p>
          <p className="mt-3 text-[12px] leading-[1.6] text-[#591902]">
            {primarySection.ideal_for}
          </p>
        </div>
      ) : null}

      {addons.length ? (
        <div className={primarySection?.ideal_for ? 'mt-8 border-t border-[#36402280] pt-6' : ''}>
          <p className="text-[16px] font-semibold text-[#2D2D2D]">Add on services</p>
          <div className="mt-4 rounded-[10px] border border-[#591902] bg-[#F8F4ED] p-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {addons.map(addon => (
                <BartendingAddonCard
                  key={addon.id || addon.name}
                  addon={addon}
                  isSelected={selectedAddonIds.includes(String(addon.id ?? addon.name))}
                  onToggle={onToggleAddon}
                  onViewDetails={onViewAddon}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default function BartendingSinglePackagePage() {
  const { packageId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: packages = [] } = usePackages()
  const { data: packageDetails, isLoading: isPackageLoading } = usePackageById(packageId)
  const { data: cancellationPolicy } = useCancellationPolicy()
  const { addPackage, updateCartItemDetails } = useCart()
  const { showToast } = useToast()
  const { data: cartToastMessage = 'Package added to cart successfully.' } = useCartToastMessage()
  const cartItemId = searchParams.get('cartItemId') ?? ''
  const {
    customizations,
    activeCustomization,
    activeIndex,
    showRepeatPrompt,
    handleAddToCart: markCustomizationAdded,
    handleIncrease,
    handleRepeat,
    handleNew,
    handleDecrease,
    setCustomizations,
  } = useCustomization({
    createInitialData: () => ({
      selectedHours: '',
      selectedAddons: [],
    }),
  })
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [addToCartMessage, setAddToCartMessage] = useState('')

  const packagesData = useMemo(
    () =>
      packages.map((pkg, index) => ({
        ...pkg,
        serviceSlug: 'bartending',
        images: pkg.images?.length
          ? pkg.images
          : (PKG_LOCAL_IMAGES[index % PKG_LOCAL_IMAGES.length] ?? []),
      })),
    [packages]
  )

  const backHref = useMemo(() => {
    const next = new URLSearchParams(searchParams)
    return `/packages/bartending${next.toString() ? `?${next.toString()}` : ''}`
  }, [searchParams])

  const pkg = useMemo(
    () =>
      packageDetails
        ? {
            ...packageDetails,
            serviceSlug: 'bartending',
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

  const hourOptions = useMemo(() => buildHoursOptions(pkg), [pkg])
  const addons = useMemo(
    () => (Array.isArray(pkg?.detail_addons) ? pkg.detail_addons.filter(Boolean) : []),
    [pkg]
  )

  useEffect(() => {
    const selectedOptionsFromSearch = getSelectedOptionsFromSearchParams(searchParams)
    const firstHourOption = hourOptions[0]?.label ?? ''
    const selectedAddonIds = getSelectedAddonIdsFromSearchParams(searchParams, addons)

    setCustomizations([
      {
        id: 1,
        data: {
          selectedHours: selectedOptionsFromSearch.Hours || firstHourOption,
          selectedAddons: buildSelectedAddonItems(addons, selectedAddonIds).map(
            addon => addon.name
          ),
        },
        isAddedToCart: false,
      },
    ])
    setAddToCartMessage('')
  }, [addons, hourOptions, packageId, searchParams, setCustomizations])

  const quantity = customizations.length
  const selectedHours = String(activeCustomization?.data?.selectedHours ?? '').trim()
  const selectedAddonNames = Array.isArray(activeCustomization?.data?.selectedAddons)
    ? activeCustomization.data.selectedAddons
    : []
  const selectedAddonIds = addons
    .filter(addon => selectedAddonNames.includes(addon.name))
    .map(addon => String(addon.id ?? addon.name))

  useEffect(() => {
    const defaultHours = hourOptions[0]?.label ?? ''
    if (!defaultHours || selectedHours) return

    setCustomizations(prev =>
      prev.map((customization, customizationIndex) =>
        customizationIndex === activeIndex
          ? {
              ...customization,
              data: {
                ...(customization?.data ?? {}),
                selectedHours: defaultHours,
              },
              isAddedToCart: false,
            }
          : customization
      )
    )
  }, [activeIndex, hourOptions, selectedHours, setCustomizations])

  if (isPackageLoading) {
    return null
  }

  if (!pkg) {
    return <Navigate to={backHref} replace />
  }

  const relatedProducts = packagesData
    .filter(item => isBartendingPackage(item) && buildPackageId(item) !== buildPackageId(pkg))
    .slice(0, 3)
    .map(item => ({ ...item, serviceSlug: 'bartending' }))
  const sourceImages = pkg.images?.length ? pkg.images : PKG_LOCAL_IMAGES[0]
  const sideImages = Array.from({ length: Math.max(5, sourceImages.length || 1) }).map(
    (_, index) => sourceImages[index % sourceImages.length]
  )
  const accordionSections = mergeAccordionSections(
    pkg.detail_accordion_sections,
    cancellationPolicy
  )
  const selectedHourModifier =
    hourOptions.find(option => option.label === selectedHours)?.priceModifier ?? 0
  const packageBasePrice = Number(pkg?.base_price ?? 0)
  const displayPrice =
    packageBasePrice > 0
      ? formatCurrency(packageBasePrice + selectedHourModifier, { showDecimals: true })
      : pkg.price || (pkg.base_price ? formatCurrency(pkg.base_price) : '')

  const updateActiveCustomization = updater => {
    setCustomizations(prev =>
      prev.map((customization, customizationIndex) =>
        customizationIndex === activeIndex
          ? {
              ...customization,
              data: updater(customization?.data ?? {}),
              isAddedToCart: false,
            }
          : customization
      )
    )
  }

  const handleSelectHours = value => {
    setAddToCartMessage('')
    updateActiveCustomization(data => ({
      ...data,
      selectedHours: value,
    }))
  }

  const handleToggleAddon = addon => {
    const addonName = String(addon?.name ?? '').trim()
    if (!addonName) return

    setAddToCartMessage('')
    updateActiveCustomization(data => {
      const currentAddons = Array.isArray(data?.selectedAddons) ? data.selectedAddons : []
      const hasAddon = currentAddons.includes(addonName)

      return {
        ...data,
        selectedAddons: hasAddon
          ? currentAddons.filter(item => item !== addonName)
          : [...currentAddons, addonName],
      }
    })
  }

  const handleViewAddon = addon => {
    const pkgId = pkg.documentId ?? pkg.id
    navigate(`/packages/bartending-addon/${pkgId}/${addon.id}`)
  }

  const handleRepeatCustomization = () => {
    setAddToCartMessage('')
    handleRepeat()
  }

  const handleNewCustomization = () => {
    setAddToCartMessage('')
    handleNew()
  }

  const handleAddToCart = async () => {
    setAddToCartMessage('')

    const numericPackageId = Number(pkg?.id)
    if (!Number.isFinite(numericPackageId)) {
      setAddToCartMessage('This package is missing its cart ID. Please refresh and try again.')
      return
    }

    if (!cartItemId && activeCustomization?.isAddedToCart) {
      handleIncrease()
      return
    }

    setIsAddingToCart(true)

    try {
      const selectedOptions = buildBartendingSelectedOptions(activeCustomization)
      const selectedAddons = buildSelectedAddonItems(addons, selectedAddonIds)

      if (cartItemId) {
        await updateCartItemDetails({
          itemId: cartItemId,
          quantity,
          selectedOptions,
        })
        showToast({ message: cartToastMessage })
      } else {
        await addPackage({
          packageId: numericPackageId,
          quantity: 1,
          selectedOptions,
          unitPrice: packageBasePrice + selectedHourModifier,
        })
        await Promise.all(
          selectedAddons.map(addon =>
            addPackage({
              packageId: numericPackageId,
              quantity: 1,
              addon,
            })
          )
        )
        markCustomizationAdded()
        showToast({ message: cartToastMessage })
      }
    } catch (err) {
      console.error('[bartending-package] add to cart failed', err)
      setAddToCartMessage('Could not add this package to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <SingleProductPageContent
    title={pkg.title || 'Bartending Package'}
      price={displayPrice}
      intro=""
      hideHeaderPrice
      beforePriceContent={
        <BartendingBeforePriceContent
          intro={
            pkg.description ||
            'A polished bar setup with smooth service flow and guest-ready styling.'
          }
          pkg={pkg}
          selectedHours={selectedHours}
          onSelectHours={handleSelectHours}
          hourOptions={hourOptions}
        />
      }
      customPriceContent={
        <p className="mt-5 text-[24px] font-medium tracking-[-0.02em] text-[#591902]">
          {displayPrice}
        </p>
      }
      customContent={
        <BartendingCustomContent
          pkg={pkg}
          selectedAddonIds={selectedAddonIds}
          onToggleAddon={handleToggleAddon}
          onViewAddon={handleViewAddon}
        />
      }
      accordionSections={accordionSections}
      mainImage={sourceImages[0] ?? sideImages[0]}
      sideImages={sideImages}
      relatedProducts={relatedProducts}
      addToCartLabel={isAddingToCart ? 'Adding...' : 'Add to cart'}
      addToCartMessage={addToCartMessage}
      disableAddToCart={isAddingToCart}
      onAddToCart={handleAddToCart}
      quantity={quantity}
      onDecrement={handleDecrease}
      onIncrement={() => {
        setAddToCartMessage('')
        handleIncrease()
      }}
      promptContent={
        showRepeatPrompt && (
          <RepeatCustomizationPrompt
            onRepeat={handleRepeatCustomization}
            onCreateNew={handleNewCustomization}
          />
        )
      }
      testimonials={packageReviews}
    />
  )
}
