import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useCartPackagePricingLookup, usePackages } from '../hooks/usePackages'
import CmsPageLoader from '../components/common/CmsPageLoader'
import BrandedImage from '../components/common/BrandedImage'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'

const CART_META_SEPARATOR = '||__ELEWEN_META__||'
const CART_ADDITIONAL_INFO_KEY = '__additional_info__'

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDisplayDate(value) {
  if (!value) return 'Select date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Select date'

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function normalizeServiceSlug(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')
}

function parseCartItemTitle(value = '') {
  const rawTitle = String(value ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: {},
      itemType: 'package',
      addonTitle: '',
      parentPackageId: '',
      additionalInfo: '',
    }
  }

  try {
    const parsed = JSON.parse(metaPart)
    const parsedSelectedOptions =
      parsed?.selectedOptions && typeof parsed.selectedOptions === 'object'
        ? parsed.selectedOptions
        : {}

    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: parsedSelectedOptions,
      itemType: parsed?.itemType ?? 'package',
      addonTitle: parsed?.addonTitle ?? '',
      parentPackageId: parsed?.parentPackageId ?? '',
      additionalInfo: String(
        parsed?.additionalInfo ?? parsedSelectedOptions?.[CART_ADDITIONAL_INFO_KEY] ?? ''
      ).trim(),
    }
  } catch {
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: {},
      itemType: 'package',
      addonTitle: '',
      parentPackageId: '',
      additionalInfo: '',
    }
  }
}

function isAdditionalInfoOptionLabel(label = '') {
  return (
    String(label ?? '')
      .trim()
      .toLowerCase() === CART_ADDITIONAL_INFO_KEY
  )
}

function getSelectedElements(item) {
  const selectedOptions = Object.fromEntries(
    Object.entries(item?.selectedOptions ?? {}).filter(
      ([label, value]) => !isAdditionalInfoOptionLabel(label) && Boolean(value)
    )
  )
  const selectedElements = Object.entries(selectedOptions)
    .map(([label, value]) => ({
      title: value,
      desc: label,
    }))
    .filter(element => element.title && element.desc)

  if (selectedElements.length) return selectedElements

  return (item?.packageData?.detail_inclusions ?? []).slice(0, 4).map(highlight => ({
    title: highlight,
    desc: 'Included with this package',
  }))
}

function getCartItemQuantity(item) {
  return Math.max(1, Number(item?.quantity ?? 1))
}

function getPackageSubtitle(pkg) {
  const service = pkg?.service_slugs?.[0]
  if (!service) return 'Selected package'

  return String(service)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function buildAddonDedupeKey(addon = {}) {
  const normalizedTitle = String(addon?.name ?? addon?.title ?? '')
    .trim()
    .toLowerCase()
  const normalizedPrice = String(Number(addon?.price ?? 0))

  return `${normalizedTitle}::${normalizedPrice}`
}

function getSuggestedAddonsWithPricing(item) {
  const packageData = item?.packageData
  if (!packageData) return []

  const seen = new Set()
  const packageSubtitle = getPackageSubtitle(packageData)
  const packageTitle = packageData?.title || item?.displayTitle || 'Selected package'
  const addons = Array.isArray(packageData?.detail_addons) ? packageData.detail_addons : []

  return addons
    .filter(addon => addon && addon.visibility !== false)
    .map(addon => {
      const addonTitle = String(addon?.name ?? addon?.title ?? '').trim()
      const addonId = String(addon?.id ?? addonTitle)

      return {
        id: `${item.id}-${addonId}`,
        packageId: packageData?.id,
        addon,
        title: addonTitle,
        subtitle: `${packageSubtitle} / ${packageTitle}`,
        price: formatCurrency(Number(addon?.price ?? 0)),
        dedupeKey: buildAddonDedupeKey(addon),
      }
    })
    .filter(addon => {
      if (!addon.title || seen.has(addon.dedupeKey)) return false
      seen.add(addon.dedupeKey)
      return true
    })
    .slice(0, 4)
}

function getPackageRelationIds(item) {
  const ids = [
    item?.packageId,
    item?.packageData?.id,
    item?.packageData?.documentId,
    item?.parentPackageId,
  ]

  return new Set(ids.map(value => String(value ?? '').trim()).filter(Boolean))
}

function getCartPackageHref(pkg, selectedOptions = {}, cartItemId = '') {
  const packageId = pkg?.documentId ?? pkg?.id
  const serviceSlug = normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')
  const params = new URLSearchParams()

  if (selectedOptions && Object.keys(selectedOptions).length) {
    params.set(
      'selectedOptions',
      JSON.stringify(
        Object.fromEntries(Object.entries(selectedOptions).filter(([, value]) => Boolean(value)))
      )
    )
  }

  if (cartItemId) {
    params.set('cartItemId', String(cartItemId))
  }

  const queryString = params.toString()

  if (!packageId || !serviceSlug) return ''

  if (serviceSlug === 'decor') {
    const basePath = `/packages/decor-single/${packageId}`
    return queryString ? `${basePath}?${queryString}` : basePath
  }

  if (serviceSlug === 'sheesha') {
    const basePath = `/packages/sheesha-single/${packageId}`
    return queryString ? `${basePath}?${queryString}` : basePath
  }

  if (serviceSlug === 'catering') {
    const basePath = `/packages/catering-single/${packageId}`
    return queryString ? `${basePath}?${queryString}` : basePath
  }

  const basePath = `/packages/${serviceSlug}/${packageId}`
  return queryString ? `${basePath}?${queryString}` : basePath
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.9974 15.8334L4.16406 10M4.16406 10L9.9974 4.16669M4.16406 10H15.8307"
        stroke="#6B6B6B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2.50001H4.16667C3.72464 2.50001 3.30072 2.6756 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H15.8333C16.2754 17.5 16.6993 17.3244 17.0118 17.0118C17.3244 16.6993 17.5 16.2754 17.5 15.8333V10M15.3125 2.18751C15.644 1.85599 16.0937 1.66974 16.5625 1.66974C17.0313 1.66974 17.481 1.85599 17.8125 2.18751C18.144 2.51903 18.3303 2.96866 18.3303 3.43751C18.3303 3.90635 18.144 4.35598 17.8125 4.68751L10.3017 12.1992C10.1038 12.3969 9.85934 12.5416 9.59083 12.62L7.19667 13.32C7.12496 13.3409 7.04895 13.3422 6.97659 13.3236C6.90423 13.3051 6.83819 13.2675 6.78537 13.2146C6.73255 13.1618 6.69491 13.0958 6.67637 13.0234C6.65783 12.9511 6.65909 12.875 6.68 12.8033L7.38 10.4092C7.45877 10.1409 7.60378 9.89672 7.80167 9.69917L15.3125 2.18751Z"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.8333 5.00002V16.6667C15.8333 17.1087 15.6577 17.5326 15.3452 17.8452C15.0326 18.1578 14.6087 18.3334 14.1667 18.3334H5.83333C5.39131 18.3334 4.96738 18.1578 4.65482 17.8452C4.34226 17.5326 4.16667 17.1087 4.16667 16.6667V5.00002M2.5 5.00002H17.5M6.66667 5.00002V3.33335C6.66667 2.89133 6.84226 2.4674 7.15482 2.15484C7.46738 1.84228 7.89131 1.66669 8.33333 1.66669H11.6667C12.1087 1.66669 12.5326 1.84228 12.8452 2.15484C13.1577 2.4674 13.3333 2.89133 13.3333 3.33335V5.00002"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SuggestedPackages({ packages = [], onAdd, addingAddonId = '' }) {
  if (!packages.length) return null

  return (
    <div className="mt-6 rounded-[16px] border border-[#E5E5E5] bg-white p-5">
      <div className="mb-5">
        <h2
          className="text-[20px] font-semibold text-[#2C2C2C]"
          style={{ fontFamily: "'Poppins'" }}
        >
          Suggested Add-ons
        </h2>
        <p className="text-sm text-gray-500">Enhance your event with these popular extras</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {packages.map(pkg => {
          const isAdding = addingAddonId === pkg.id

          return (
            <div
              key={pkg.id}
              className="flex items-center justify-between gap-3 rounded-[16px] bg-[#F5F5F5] px-3 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-snug text-[#2C2C2C] sm:text-[15px]">
                  {pkg.title}
                </p>
                <p className="text-sm leading-snug text-gray-500">
                  {pkg.subtitle || 'Perfect add-on for your package'}
                </p>
                <p className="mt-2 text-[16px] font-semibold text-[#957960]">{pkg.price}</p>
              </div>

              <button
                type="button"
                onClick={() => onAdd(pkg)}
                disabled={isAdding || !pkg.packageId}
                className="shrink-0 whitespace-nowrap rounded-full bg-[#957960] px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAdding ? 'Adding...' : '+ Add'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SinglePackageCheckout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { cart, loading, addPackage } = useCart()
  const packagesQuery = usePackages()
  const { data: packages = [] } = packagesQuery
  const isStrapiLoading = useStrapiPageLoading(packagesQuery)

  const [addingAddonId, setAddingAddonId] = useState('')
  const itemId = searchParams.get('itemId') ?? ''

  const { resolvePackageData } = useCartPackagePricingLookup(cart?.items ?? [], packages)

  const item = useMemo(() => {
    const cartItem = (cart?.items ?? []).find(entry => entry.id === itemId)
    if (!cartItem) return null

    const parsedTitle = parseCartItemTitle(cartItem.title)
    const selectedOptions =
      cartItem?.selectedOptions && Object.keys(cartItem.selectedOptions).length
        ? cartItem.selectedOptions
        : parsedTitle.selectedOptions

    return {
      ...cartItem,
      displayTitle: parsedTitle.displayTitle,
      selectedOptions,
      itemType: parsedTitle.itemType,
      addonTitle: parsedTitle.addonTitle,
      parentPackageId: parsedTitle.parentPackageId,
      additionalInfo: parsedTitle.additionalInfo,
      packageData: resolvePackageData(cartItem.packageId),
    }
  }, [cart?.items, itemId, resolvePackageData])

  const relatedAddonItems = useMemo(() => {
    const relatedPackageIds = getPackageRelationIds(item)

    return (cart?.items ?? [])
      .map(entry => {
        const parsedTitle = parseCartItemTitle(entry.title)
        const selectedOptions =
          entry?.selectedOptions && Object.keys(entry.selectedOptions).length
            ? entry.selectedOptions
            : parsedTitle.selectedOptions

        return {
          ...entry,
          displayTitle: parsedTitle.addonTitle || parsedTitle.displayTitle,
          selectedOptions,
          itemType: parsedTitle.itemType,
          addonTitle: parsedTitle.addonTitle,
          parentPackageId: parsedTitle.parentPackageId,
          additionalInfo: parsedTitle.additionalInfo,
        }
      })
      .filter(entry => {
        if (entry.itemType !== 'addon') return false

        const entryRelationIds = getPackageRelationIds(entry)
        return Array.from(entryRelationIds).some(id => relatedPackageIds.has(id))
      })
  }, [cart?.items, item])

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  if (!loading && !item) return <Navigate to="/cart" replace />
  if (!item) return null

  const elements = getSelectedElements(item)
  const packageTitle = item.packageData?.title || item.displayTitle || 'Package'
  const packageImage = item.packageData?.images?.[0] ?? ''
  const packageSubtitle = item.packageData?.service_slugs?.[0]
    ? item.packageData.service_slugs[0].replace(/-/g, ' ')
    : 'Selected package'
  const eventLocation = cart?.eventCity || 'Add city / area'
  const eventDate = formatDisplayDate(cart?.eventDate)
  const packageHref = getCartPackageHref(item.packageData, item.selectedOptions, item.id)
  const suggestedPackages = getSuggestedAddonsWithPricing(item)
  const packageQuantity = getCartItemQuantity(item)
  const additionalInfo = String(item?.additionalInfo ?? '').trim()
  const addonTotal = relatedAddonItems.reduce(
    (sum, addonItem) => sum + Number(addonItem.totalPrice ?? 0),
    0
  )
  const totalAmount = Number(item.totalPrice ?? 0) + addonTotal
  const advancePayable = totalAmount * 0.3
  const balanceDue = totalAmount - advancePayable

  const handleAddSuggestedAddon = async pkg => {
    if (!pkg?.packageId || addingAddonId) return

    setAddingAddonId(pkg.id)
    try {
      await addPackage({
        packageId: Number(pkg.packageId),
        quantity: 1,
        addon: pkg.addon,
      })
    } catch (err) {
      console.error('[single-package-checkout] addon add failed', err)
    } finally {
      setAddingAddonId('')
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 md:px-8 md:pt-24 lg:px-16">
      <div className="mb-8">
        <h2 className="text-[24px] text-[#1C1C1C] md:text-[36px]">Package Details</h2>
        <p className="mt-1 text-[12px] text-gray-500 md:text-[16px]">
          Review what&apos;s included in your selected package.
        </p>
      </div>

      <div className="flex flex-col gap-[clamp(24px,5vw,100px)] lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="relative flex gap-4 overflow-hidden rounded-xl border border-[#95796066] p-4">
            <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl bg-[#957960]" />
            <div className="ml-2 h-20 w-20 overflow-hidden rounded-lg bg-gray-200">
              {packageImage ? (
                <BrandedImage
                  src={packageImage}
                  alt={packageTitle}
                  className="h-full w-full"
                  imgClassName="object-cover"
                />
              ) : null}
            </div>

            <div className="items-start">
              <p className="text-[10px] md:text-[12px] text-[#A5A39E]">{packageSubtitle}</p>
              <div className="flex min-w-0 items-center gap-2">
                <h3
                  className="min-w-0 font-medium text-[12px] leading-snug md:text-[14px] text-[#1C1C1C]"
                  style={{ fontFamily: "'Poppins'" }}
                >
                  {packageTitle}
                </h3>
                {packageQuantity > 1 ? (
                  <span className="rounded-full bg-[#EFE7DC] px-2 py-1 text-[10px] md:text-[12px] font-medium text-[#591902]">
                    x{packageQuantity}
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] md:text-[12px] text-[#6A6864]">
                {eventLocation} · {eventDate}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#95796066]">
            <div className="flex justify-between bg-[#F8F4ED] px-4 py-3">
              <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
                Selected Elements
              </h3>
              <span className="text-sm text-gray-500">{elements.length} elements</span>
            </div>

            <div className="space-y-4 p-4">
              {elements.map(element => (
                <div
                  key={`${element.desc}-${element.title}`}
                  className="flex border-b border-[#00000033] pb-3 last:border-none last:pb-0"
                >
                  <div className="p-2">
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="3" cy="3" r="3" fill="#D5D5D5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C2C2C]">{element.title}</p>
                    {/* <p className="text-sm text-gray-500">{element.desc}</p> */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#95796066]">
            <div className="bg-[#F8F4ED] px-4 py-3">
              <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
                Event Details
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
              <div className="flex justify-between rounded-lg bg-[#F5F5F5] p-4">
                <div>
                  <p className="text-sm text-gray-500">City / Area</p>
                  <p className="font-medium">{eventLocation}</p>
                </div>
                <span className="text-sm text-[#957960]">Saved on cart</span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#F3F3F3] p-4">
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="font-medium">{eventDate}</p>
                </div>
                <span className="text-sm text-[#957960]">Saved on cart</span>
              </div>
            </div>
          </div>

          {additionalInfo ? (
            <div className="overflow-hidden rounded-xl border border-[#95796066]">
              <div className="bg-[#F8F4ED] px-4 py-3">
                <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
                  Additional Info
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm leading-[1.6] text-[#2C2C2C] whitespace-pre-wrap">
                  {additionalInfo}
                </p>
              </div>
            </div>
          ) : null}
          <SuggestedPackages
            packages={suggestedPackages}
            onAdd={handleAddSuggestedAddon}
            addingAddonId={addingAddonId}
          />
        </div>

        <div className="flex-1">
          <div className="overflow-hidden rounded-xl border border-[#95796066]">
            <div className="bg-[#222815] px-4 py-3 text-white">
              <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
                Price Summary
              </h3>
            </div>

            <div className="space-y-3 p-4 text-sm">
              <div className="flex justify-between font-medium">
                <span>
                  Base Package — {packageTitle}
                  {packageQuantity > 1 ? ` x${packageQuantity}` : ''}
                </span>
                <span>{formatCurrency(item.totalPrice)}</span>
              </div>

              <hr className="my-4 border-[#0000001A]" />

              {elements.map(element => (
                <div key={element.title} className="flex justify-between text-[#767676]">
                  <span>{element.title}</span>
                  <span className="text-[#1C1C1C]">Included</span>
                </div>
              ))}

              {relatedAddonItems.length ? <hr className="my-4 border-[#0000001A]" /> : null}

              {relatedAddonItems.map(addonItem => (
                <div key={addonItem.id} className="flex justify-between text-gray-600">
                  <span>
                    Add-on — {addonItem.addonTitle || addonItem.displayTitle}
                    {Number(addonItem.quantity ?? 1) > 1
                      ? ` x${Number(addonItem.quantity ?? 1)}`
                      : ''}
                  </span>
                  <span>{formatCurrency(addonItem.totalPrice)}</span>
                </div>
              ))}

              <hr className="my-4 border-[#0000001A]" />

              <div className="flex justify-between rounded-lg bg-[#F8F4ED] px-4 py-3 font-medium">
                <span>Total Amount</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#F1F1F1] px-4 py-3 font-medium">
                <span>Advance Payable (30%)</span>
                <span>{formatCurrency(advancePayable)}</span>
              </div>

              <p className="text-xs text-gray-500">
                Balance: {formatCurrency(balanceDue)} due on event day
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {/* BACK */}
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center justify-center gap-2 h-[40px] rounded-full bg-[#E5E5E5] text-[#6B7280]"
            >
              <BackIcon />
              Go Back
            </button>

            {/* EDIT */}
            {packageHref && (
              <Link
                to={packageHref}
                className="flex items-center justify-center gap-2 h-[40px] rounded-full bg-[#2E3A1F] text-white"
              >
                <EditIcon />
                Edit Package
              </Link>
            )}

            {/* DELETE */}
            <button className="flex items-center justify-center gap-2 h-[40px] rounded-full bg-[#7A1E0E] text-white">
              <DeleteIcon />
              Delete Package
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
