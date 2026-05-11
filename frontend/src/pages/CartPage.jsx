import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { usePackages } from '../hooks/usePackages'
import { useServiceAreas } from '../hooks/useServiceAreas'
import { normalizeServiceSlug } from '../lib/packageFilters'

const CART_META_SEPARATOR = '||__ELEWEN_META__||'
const TEMP_BYPASS_PINCODE_VALIDATION = true

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `Rs${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function getMinEventDate() {
  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 6) // Disable next 5 days + today = 6 days minimum

  const year = minDate.getFullYear()
  const month = String(minDate.getMonth() + 1).padStart(2, '0')
  const day = String(minDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizePincode(value = '') {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
}

function getServiceAreaByPincode(value = '', serviceAreas = []) {
  const pincode = normalizePincode(value)

  if (pincode.length !== 6) return ''

  const numericPincode = Number(pincode)
  const matchingArea = (Array.isArray(serviceAreas) ? serviceAreas : []).find(area => {
    const start = Number(area?.pincodeStart)
    const end = Number(area?.pincodeEnd)
    const extraPincodes = Array.isArray(area?.extraPincodes) ? area.extraPincodes : []
    const inRange =
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      numericPincode >= start &&
      numericPincode <= end

    return inRange || extraPincodes.includes(pincode)
  })

  return matchingArea?.name ?? ''
}

function getPincodeValidationState(value = '', serviceAreas = [], isLoadingServiceAreas = false) {
  if (TEMP_BYPASS_PINCODE_VALIDATION) {
    return {
      isChecking: false,
      isValid: true,
      message: '',
    }
  }

  const normalizedPincode = normalizePincode(value)

  if (!normalizedPincode) {
    return {
      isChecking: false,
      isValid: false,
      message: '',
    }
  }

  if (normalizedPincode.length !== 6) {
    return {
      isChecking: false,
      isValid: false,
      message: 'Please enter a valid 6-digit pincode.',
    }
  }

  if (isLoadingServiceAreas) {
    return {
      isChecking: true,
      isValid: false,
      message: 'Checking availability...',
    }
  }

  const area = getServiceAreaByPincode(normalizedPincode, serviceAreas)

  if (area) {
    return {
      isChecking: false,
      isValid: true,
      message: `Service available in ${area}.`,
    }
  }

  return {
    isChecking: false,
    isValid: false,
    message: serviceAreas.length
      ? 'Service not available in your area.'
      : 'We could not verify service availability right now.',
  }
}

function parseApiError(error) {
  const message = error?.message ?? 'Something went wrong'
  const match = message.match(/\{"error":"([^"]+)"\}/)
  return match?.[1] ?? message
}

function parseBreakdownAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const normalized = value.replace(/[^0-9.-]+/g, '')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function getBreakdownLabel(entry) {
  if (!entry || typeof entry !== 'object') return ''

  return (
    entry.label ?? entry.title ?? entry.name ?? entry.text ?? entry.description ?? entry.item ?? ''
  )
}

function getBreakdownAmount(entry) {
  if (!entry || typeof entry !== 'object') return 0

  const directAmount =
    entry.amount ??
    entry.price ??
    entry.value ??
    entry.cost ??
    entry.total ??
    entry.rate ??
    entry.base_price

  if (directAmount != null) {
    return parseBreakdownAmount(directAmount)
  }

  for (const [key, value] of Object.entries(entry)) {
    if (
      ['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt'].includes(key) ||
      typeof value === 'object'
    ) {
      continue
    }

    const amount = parseBreakdownAmount(value)
    if (amount > 0) return amount
  }

  return 0
}

function getPackageBreakdownRows(pkg) {
  return (Array.isArray(pkg?.detail_price_breakdown) ? pkg.detail_price_breakdown : [])
    .map(entry => {
      const label = String(getBreakdownLabel(entry) ?? '').trim()
      const amount = getBreakdownAmount(entry)
      return label && amount > 0 ? { label, amount } : null
    })
    .filter(Boolean)
}

function getCartItemSummary(item) {
  const quantity = Math.max(1, Number(item?.quantity ?? 1))
  const breakdownRows = getPackageBreakdownRows(item?.packageData)

  if (!breakdownRows.length) {
    return {
      rows: [],
      total: Number(item?.totalPrice ?? 0),
    }
  }

  const rows = breakdownRows.map(row => ({
    ...row,
    total: row.amount * quantity,
  }))

  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.total, 0),
  }
}

function getCartItemQuantity(item) {
  return Math.max(1, Number(item?.quantity ?? 1))
}

function getPriceSummaryCategoryLabel(item) {
  return getPackageSubtitle(item?.packageData)
}

function EmptyCart() {
  return (
    <div className="rounded-2xl border border-[#95796066] bg-white p-8 text-center">
      <p className="text-[24px] font-semibold text-[#1C1C1C]">Your cart is empty</p>
      <p className="mt-2 text-gray-500">
        Add a package from the product pages and it will appear here.
      </p>
      <Link
        to="/package-listing"
        className="mx-auto mt-6 flex w-fit items-center rounded-full bg-[#D4BA8E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C6AB7F]"
      >
        Browse Packages
      </Link>
    </div>
  )
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

const SAMPLE_TASTE_SERVICE_SLUGS = new Set(['catering', 'bartending'])

function getPackageSubtitle(pkg) {
  const service = pkg?.service_slugs?.[0]
  if (!service) return 'Selected package'
  return String(service)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function parseCartItemTitle(value = '') {
  const rawTitle = String(value ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: {},
    }
  }

  try {
    const parsed = JSON.parse(metaPart)
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions:
        parsed?.selectedOptions && typeof parsed.selectedOptions === 'object'
          ? parsed.selectedOptions
          : {},
    }
  } catch {
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: {},
    }
  }
}

function getSelectedElements(item) {
  console.log('[CartPage] getSelectedElements - item:', item)
  console.log('[CartPage] getSelectedElements - customization:', item?.customization)
  console.log('[CartPage] getSelectedElements - selectedOptions:', item?.selectedOptions)

  // First, check if item has selectedOptions (from decorSelectedOptions)
  const selectedOptions = item?.selectedOptions ?? {}
  if (Object.keys(selectedOptions).length > 0) {
    console.log('[CartPage] Using selectedOptions:', selectedOptions)
    const selected = Object.entries(selectedOptions)
      .map(([label, value]) => ({
        label: label.replace(/_\d+$/, ''), // Remove index suffix for display
        value,
      }))
      .filter(element => element.label && element.value)

    if (selected.length) {
      console.log('[CartPage] Final selected elements from selectedOptions:', selected)
      return selected
    }
  }

  // Fallback to customization.sections (Decor package format)
  if (item?.customization?.sections && Array.isArray(item.customization.sections)) {
    console.log('[CartPage] Found sections:', item.customization.sections)
    const selected = []

    item.customization.sections.forEach((section, idx) => {
      console.log(`[CartPage] Processing section ${idx}:`, section)

      if (section.type === 'choice-row' && Array.isArray(section.items)) {
        console.log(`[CartPage] Choice-row section "${section.title}":`, section.items)
        // For choice-row, get the selected item's title
        const selectedItem = section.items.find(item => typeof item !== 'string' && item.selected)
        console.log(`[CartPage] Selected item in "${section.title}":`, selectedItem)

        if (selectedItem && selectedItem.title) {
          selected.push({
            label: section.title,
            value: selectedItem.title,
          })
        }
      } else if (section.type === 'text-row' && Array.isArray(section.items)) {
        console.log(`[CartPage] Text-row section "${section.title}":`, section.items)
        // For text-row, add all items
        section.items.forEach(item => {
          if (typeof item === 'string' && item) {
            selected.push({
              label: section.title,
              value: item,
            })
          }
        })
      }
    })

    console.log('[CartPage] Final selected elements from sections:', selected)
    if (selected.length) return selected
  }

  return (item?.packageData?.detail_inclusions ?? []).slice(0, 4).map(highlight => ({
    label: 'Included with this package',
    value: highlight,
  }))
}

function getPrimaryServiceSlug(pkg) {
  return normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')
}

function getSuggestedPackages(packages, cartItems) {
  const packageIdsInCart = new Set(cartItems.map(item => String(item.packageId)))
  const matchingServiceSlugs = [
    ...new Set(cartItems.map(item => getPrimaryServiceSlug(item.packageData)).filter(Boolean)),
  ]

  return packages
    .filter(pkg => !packageIdsInCart.has(String(pkg.id)))
    .filter(pkg => {
      if (!matchingServiceSlugs.length) return true
      return matchingServiceSlugs.includes(getPrimaryServiceSlug(pkg))
    })
    .slice(0, 4)
    .map(pkg => ({
      id: pkg.id,
      title: pkg.title,
      price: formatCurrency(pkg.base_price),
      subtitle: getPackageSubtitle(pkg),
      serviceSlug: getPrimaryServiceSlug(pkg),
    }))
}

function PincodeCard({ pincode, message, isChecking, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-[#95796066] p-5">
      {/* TITLE */}
      <h2 className="text-lg font-medium text-[#2C2C2C]" style={{ fontFamily: "'Poppins'" }}>
        Enter Pincode
      </h2>

      <p className="mb-4 mt-1 text-sm text-gray-500">
        Enter your pincode to check service availability and charges.
      </p>

      {/* INPUT */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={pincode}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter pincode"
          className="w-full border-b border-[#2D2D2D] bg-transparent py-2 text-[14px] text-[#2C2C2C] focus:outline-none"
        />

        {/* hidden submit (same pattern) */}
        <button type="submit" disabled={isChecking || !pincode.trim()} className="hidden">
          {isChecking ? 'Checking...' : 'Check'}
        </button>
      </div>

      {/* NOTE */}
      <p className="mt-2 text-xs text-gray-500">Service availability depends on your location</p>

      {/* MESSAGE */}
      {message && <p className="mt-2 text-sm text-[#5A1E0E]">{message}</p>}
    </form>
  )
}
function CouponCard({
  couponCode,
  couponMessage,
  cart,
  isApplyingCoupon,
  onCouponChange,
  onApplyCoupon,
  onRemoveCoupon,
}) {
  return (
    <form onSubmit={onApplyCoupon} className="rounded-xl border border-[#95796066] p-5">
      <h2 className="text-lg font-medium text-[#2C2C2C]" style={{ fontFamily: "'Poppins'" }}>
        Apply Coupon
      </h2>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Have a code? Apply it here to unlock savings.
      </p>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={couponCode}
          onChange={event => onCouponChange(event.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="w-full border-b border-[#2D2D2D] bg-transparent py-2 text-[14px] text-[#2C2C2C] focus:outline-none"
        />
        <button type="submit" disabled={isApplyingCoupon || !couponCode.trim()} className="hidden">
          {isApplyingCoupon ? 'Applying...' : 'Apply'}
        </button>
      </div>

      {cart?.couponId ? (
        <div className="mt-4 flex items-start justify-between rounded-xl bg-[#F3F3F3] p-4">
          <div>
            <p className="text-sm font-medium text-[#2C2C2C]">
              Coupon Applied: {cart?.couponCode ?? couponCode ?? 'SAVE2000'}
            </p>
            <p className="text-sm text-gray-500">
              {formatCurrency(cart.discountAmount)} has been deducted from your total
            </p>
          </div>
          <button
            type="button"
            onClick={onRemoveCoupon}
            className="text-lg leading-none text-[#2C2C2C]"
            aria-label="Remove coupon"
          >
            ✕
          </button>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-gray-500">Only one coupon can be applied at a time</p>
      {couponMessage ? <p className="mt-2 text-sm text-[#5A1E0E]">{couponMessage}</p> : null}
    </form>
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

function SinglePackageCard({
  item,
  pendingItemId,
  onRemoveItem,
  detailsForm,
  onEditDate,
  onEditCity,
  editingField,
  onDetailsChange,
  onSaveDetails,
  onCancelEdit,
  isSavingDetails,
  detailsError,
}) {
  const isPending = pendingItemId === item.id
  const packageHref = getCartPackageHref(item.packageData, item.selectedOptions, item.id)
  const packageImage = item.packageData?.images?.[0] ?? ''
  const packageTitle = item.packageData?.title || item.displayTitle
  const packageQuantity = getCartItemQuantity(item)
  const selectedElements = getSelectedElements(item)
  const packageSubtitle = getPackageSubtitle(item.packageData)
  const eventLocation = detailsForm.eventCity?.trim() || 'Add city / area'
  const eventDate = detailsForm.eventDate ? formatDisplayDate(detailsForm.eventDate) : 'Select date'

  return (
    <div className="space-y-6">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-[#95796066] p-4">
        <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl bg-[#957960]" />
        <div className="ml-2 h-20 w-20 shrink-0 self-center overflow-hidden rounded-lg bg-gray-200">
          {packageImage ? (
            <img src={packageImage} alt={packageTitle} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1 items-start">
          <p className="text-[10px] md:text-[12px] text-[#A5A39E]">{packageSubtitle}</p>
          <div className="flex items-center gap-2">
            <h3
              className="font-medium text-[12px] md:text-[14px] text-[#1C1C1C]"
              style={{ fontFamily: "'Poppins'" }}
            >
              {packageTitle}
            </h3>
            {packageQuantity > 1 ? (
              <span className="rounded-full bg-[#D9D9D9] px-2 py-1 text-[10px] font-medium leading-none text-[#1C1C1C]">
                x{packageQuantity}
              </span>
            ) : null}
          </div>
          <p className="text-[10px] md:text-[12px] text-[#6A6864]">
            {eventLocation} · {eventDate}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {/* EDIT */}
        {packageHref ? (
          <Link
            to={packageHref}
            className="flex items-center justify-center gap-2 w-full h-[40px] rounded-full bg-[#2E3A1F] text-[13px] font-medium text-white"
          >
            <EditIcon />
            Edit Package
          </Link>
        ) : (
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full h-[40px] rounded-full bg-[#2E3A1F] text-[13px] font-medium text-white"
          >
            <EditIcon />
            Edit Package
          </button>
        )}

        {/* DELETE */}
        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          disabled={isPending}
          className="flex items-center justify-center gap-2 w-full h-[40px] rounded-full bg-[#6B1D0C] text-[13px] font-medium text-white disabled:opacity-60"
        >
          <DeleteIcon />
          {isPending ? 'Updating...' : 'Delete Package'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#95796066]">
        <div className="flex justify-between bg-[#F8F4ED] px-4 py-3">
          <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
            Selected Elements
          </h3>
          <span className="text-sm text-gray-500">{selectedElements.length} elements</span>
        </div>

        <div className="space-y-4 p-4">
          {selectedElements.length ? (
            selectedElements.map(element => (
              <div
                key={`${element.label}-${element.value}`}
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
                  <p className="font-medium text-[#2C2C2C]">{element.value}</p>
                  <p className="text-sm text-gray-500">{element.label}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-[#8B8B8B]">Package details will appear here.</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#95796066]">
        <div className="bg-[#F8F4ED] px-4 py-3">
          <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
            Event Details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <div className="flex items-start justify-between rounded-lg bg-[#F5F5F5] p-4">
            {editingField === 'city' ? (
              <div className="w-full space-y-3">
                <div>
                  <p className="text-sm text-gray-500">City / Area</p>

                  <input
                    type="text"
                    value={detailsForm.eventCity}
                    onChange={event => onDetailsChange('eventCity', event.target.value)}
                    placeholder="Enter city / area"
                    className="mt-2 w-full border-b border-[#2D2D2D] bg-transparent pb-2 text-[15px] text-[#2C2C2C] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="rounded-full border border-[#95796066] px-4 py-2 text-xs font-medium text-[#2C2C2C]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => onSaveDetails('city')}
                    disabled={isSavingDetails || !detailsForm.eventCity.trim()}
                    className="rounded-full bg-[#2E3A1F] px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {isSavingDetails ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm text-gray-500">City / Area</p>

                  <p className="font-medium break-words">{eventLocation}</p>
                </div>

                <button
                  type="button"
                  onClick={onEditCity}
                  className="shrink-0 text-sm text-[#727355]"
                >
                  Edit
                </button>
              </>
            )}
          </div>

          <div className="flex items-start justify-between rounded-lg bg-[#F3F3F3] p-4">
            {editingField === 'date' ? (
              <div className="w-full space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>

                  <input
                    type="date"
                    min={getMinEventDate()}
                    value={detailsForm.eventDate}
                    onChange={event => onDetailsChange('eventDate', event.target.value)}
                    className="mt-2 w-full border-b border-[#2D2D2D] bg-transparent pb-2 text-[15px] text-[#2C2C2C] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="rounded-full border border-[#95796066] px-4 py-2 text-xs font-medium text-[#2C2C2C]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => onSaveDetails('date')}
                    disabled={isSavingDetails || !detailsForm.eventDate}
                    className="rounded-full bg-[#2E3A1F] px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {isSavingDetails ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm text-gray-500">Event Date</p>

                  <p className="font-medium">{eventDate}</p>
                </div>

                <button
                  type="button"
                  onClick={onEditDate}
                  className="shrink-0 text-sm text-[#727355]"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {detailsError ? <p className="px-4 pb-4 text-sm text-[#8F2D1F]">{detailsError}</p> : null}
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.03125 6.17394C0.989582 6.06168 0.989582 5.93819 1.03125 5.82594C1.4371 4.84186 2.12601 4.00046 3.01064 3.40839C3.89527 2.81631 4.93577 2.50024 6.00025 2.50024C7.06473 2.50024 8.10524 2.81631 8.98987 3.40839C9.87449 4.00046 10.5634 4.84186 10.9693 5.82594C11.0109 5.93819 11.0109 6.06168 10.9693 6.17394C10.5634 7.15801 9.87449 7.99942 8.98987 8.59149C8.10524 9.18356 7.06473 9.49963 6.00025 9.49963C4.93577 9.49963 3.89527 9.18356 3.01064 8.59149C2.12601 7.99942 1.4371 7.15801 1.03125 6.17394Z"
        stroke="#1C1C1C"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.00025 7.49994C6.82868 7.49994 7.50025 6.82836 7.50025 5.99994C7.50025 5.17151 6.82868 4.49994 6.00025 4.49994C5.17183 4.49994 4.50025 5.17151 4.50025 5.99994C4.50025 6.82836 5.17183 7.49994 6.00025 7.49994Z"
        stroke="#1C1C1C"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.5 3V10C9.5 10.2652 9.39464 10.5196 9.20711 10.7071C9.01957 10.8946 8.76522 11 8.5 11H3.5C3.23478 11 2.98043 10.8946 2.79289 10.7071C2.60536 10.5196 2.5 10.2652 2.5 10V3M1.5 3H10.5M4 3V2C4 1.73478 4.10536 1.48043 4.29289 1.29289C4.48043 1.10536 4.73478 1 5 1H7C7.26522 1 7.51957 1.10536 7.70711 1.29289C7.89464 1.48043 8 1.73478 8 2V3"
        stroke="#FAFAFA"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const CATEGORY_ICONS = {
  Decor: '🌸',
  Catering: '🍽',
  Sheesha: '💨',
  Bartending: '🍸',
  Furniture: '🪑',
}

function MultiPackageList({ cartItems, pendingItemId, onRemoveItem }) {
  const groupedItems = cartItems.reduce((groups, item) => {
    const category = getPackageSubtitle(item.packageData)
    const existingGroup = groups.find(group => group.category === category)

    if (existingGroup) {
      existingGroup.packages.push(item)
      return groups
    }

    const icon = CATEGORY_ICONS[category] || ''

    groups.push({
      category,
      icon,
      border: 'border-[#95796066]',
      bg: 'bg-[#F8F4ED]',
      packages: [item],
    })

    return groups
  }, [])

  return (
    <div className="space-y-4">
      {groupedItems.map(group => (
        <div
          key={group.category}
          className={`rounded-lg border ${group.border} ${group.bg} overflow-hidden`}
        >
          <div className="flex justify-between border-b border-[#95796033] px-4 py-3">
            <h2 className="font-medium text-[#2C2C2C]" style={{ fontFamily: "'Poppins'" }}>
              {group.icon ? `${group.icon} ` : ''}
              {group.category}
            </h2>
            <span className="text-sm text-gray-500">
              {group.packages.reduce((sum, item) => sum + getCartItemQuantity(item), 0)} packages
            </span>
          </div>

          <div className="space-y-4 p-4 bg-[#FFFFFF]">
            {group.packages.map(item => {
              const isPending = pendingItemId === item.id
              const packageQuantity = getCartItemQuantity(item)
              const packageHref = getCartPackageHref(
                item.packageData,
                item.selectedOptions,
                item.id
              )
              const packageTitle = item.packageData?.title || item.displayTitle
              const selectedElements = getSelectedElements(item)
              const tags = selectedElements
                .map(element => element.value)
                .filter(Boolean)
                .slice(0, 4)

              return (
                <div
                  key={item.id}
                  className="relative flex gap-4 rounded-lg border border-[#94949433] bg-[#FFFFFF] p-4"
                >
                  <div className="flex-1 pl-2">
                    <div className="flex justify-between gap-4">
                      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl bg-[#957960]" />
                      <div className="flex min-w-0 items-center gap-2">
                        {packageHref ? (
                          <Link
                            to={packageHref}
                            className="font-medium text-[#2C2C2C] transition-colors hover:text-[#5A1E0E]"
                          >
                            {packageTitle}
                          </Link>
                        ) : (
                          <h3
                            className="font-medium text-[#2C2C2C]"
                            style={{ fontFamily: "'Poppins'" }}
                          >
                            {packageTitle}
                          </h3>
                        )}
                        {packageQuantity > 1 ? (
                          <span className="rounded-full bg-[#EFE7DC] px-2 py-1 text-xs font-medium text-[#591902]">
                            x{packageQuantity}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-[#2C2C2C]">
                          {formatCurrency(item.totalPrice)}
                        </p>
                        <p className="text-xs text-gray-500">per event</p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span
                          key={`${item.id}-${tag}`}
                          className="rounded-full bg-[#EFE7DC] px-2 py-1 text-xs text-[#591902]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        to={`/single-package-cart?itemId=${encodeURIComponent(item.id)}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                        aria-label="View package"
                        title="View package"
                      >
                        <EyeIcon />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        disabled={isPending}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5A1E0E] text-white disabled:opacity-60"
                        aria-label="Delete package"
                        title="Delete package"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function SuggestedPackages({ packages = [] }) {
  if (!packages.length) return null

  return (
    <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-5">
      {/* HEADER */}
      <div className="mb-5">
        <h2
          className="text-[20px] font-semibold text-[#2C2C2C]"
          style={{ fontFamily: "'Poppins'" }}
        >
          Suggested Add-ons
        </h2>
        <p className="text-sm text-gray-500">Enhance your event with these popular extras</p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {packages.map(pkg => (
          <div
            key={pkg.id}
            className="flex items-center justify-between rounded-[16px] bg-[#F5F5F5] px-3 py-4 gap-3"
          >
            {/* LEFT CONTENT */}
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-medium text-[#2C2C2C] truncate">{pkg.title}</p>

              <p className="text-sm text-gray-500 truncate">
                {pkg.subtitle || 'Pro set + napkins'}
              </p>

              <p className="mt-2 text-[16px] font-semibold text-[#957960]">{pkg.price}</p>
            </div>

            {/* BUTTON */}
            <Link
              to={getCartPackageHref({
                id: pkg.id,
                documentId: pkg.id,
                service_slugs: [pkg.serviceSlug],
              })}
              className="shrink-0 rounded-full bg-[#957960] px-5 py-2 text-sm font-medium text-white whitespace-nowrap"
            >
              + Add
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
function PriceSummaryCard({
  cartItems,
  cart,
  singleItem = false,
  onCheckout,
  onSampleTasteBooking,
  showSampleTasteBooking = false,
  pincodeCard = null,
  isCheckoutDisabled = false,
}) {
  const itemSummaries = cartItems.map(item => ({
    item,
    summary: getCartItemSummary(item),
  }))
  const singleCartEntry = singleItem ? (itemSummaries[0] ?? null) : null
  const singleItemElements = singleCartEntry ? getSelectedElements(singleCartEntry.item) : []
  const categorySummaries = itemSummaries.reduce((groups, entry) => {
    const category = getPriceSummaryCategoryLabel(entry.item)
    const existingGroup = groups.find(group => group.category === category)

    if (existingGroup) {
      existingGroup.total += Number(entry.summary.total ?? 0)
      existingGroup.count += getCartItemQuantity(entry.item)
      return groups
    }

    groups.push({
      category,
      total: Number(entry.summary.total ?? 0),
      count: getCartItemQuantity(entry.item),
    })

    return groups
  }, [])
  const totalPackageCount = cartItems.reduce((sum, item) => sum + getCartItemQuantity(item), 0)
  const computedSubtotal = itemSummaries.reduce(
    (sum, entry) => sum + Number(entry.summary.total ?? 0),
    0
  )
  const discountAmount = Number(cart?.discountAmount ?? 0)
  const computedTotal = Math.max(0, computedSubtotal - discountAmount)
  const advancePayable = computedTotal * 0.3
  const balanceDue = Math.max(0, computedTotal - advancePayable)

  return (
    <div className="space-y-4">
      {pincodeCard}

      <div className="rounded-[16px] overflow-hidden border border-[#E5E5E5] bg-white">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-[#1F2A14] px-5 py-4 text-white">
          <h2 className="text-[16px] font-medium" style={{ fontFamily: "'Poppins'" }}>
            Price Summary
          </h2>
          <span className="text-sm">{totalPackageCount} packages</span>
        </div>

        <div className="p-5 space-y-4">
          {singleItem ? (
            <>
              {singleCartEntry ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span className="text-[#1C1C1C]">
                      Base Package -{' '}
                      {singleCartEntry.item.packageData?.title || singleCartEntry.item.displayTitle}
                    </span>
                    <span className="text-[#1C1C1C]">
                      {formatCurrency(
                        singleCartEntry.item.unitPrice ?? singleCartEntry.summary.total
                      )}
                    </span>
                  </div>

                  <hr className="my-4 border-[#0000001A]" />

                  {singleItemElements.map(element => (
                    <div
                      key={`${element.label}-${element.value}`}
                      className="flex justify-between text-gray-600"
                    >
                      <span>{element.value}</span>
                      <span>Included</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <hr className="my-4 border-[#0000001A]" />
            </>
          ) : (
            <>
              {/* PACKAGES */}
              <div className="space-y-2">
                {categorySummaries.map(group => (
                  <div key={group.category} className="flex justify-between text-sm">
                    <span className="text-[#767676]">{group.category}</span>
                    <span className="font-medium text-[#1C1C1C]">
                      {formatCurrency(group.total)}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="my-4 border-[#0000001A]" />

              {/* CALCULATIONS */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#787575]">Subtotal (before GST)</span>
                  <span className="text-[#1C1C1C]">{formatCurrency(computedSubtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#6B1D0C]">
                    <span className="text-[#787575]">Discount coupon applied</span>
                    <span className="text-[#787575]">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              <hr className="my-4 border-[#0000001A]" />
            </>
          )}

          {/* TOTAL */}
          <div className="flex justify-between items-center bg-[#F3F0EA] rounded-[12px] px-4 py-3">
            <span className="font-medium text-[#1C1C1C]">Total Amount</span>
            <span className="text-lg font-medium text-[#1C1C1C]">
              {formatCurrency(computedTotal)}
            </span>
          </div>

          {/* ADVANCE */}
          <div className="flex justify-between items-center bg-[#EFEFEF] rounded-[12px] px-4 py-3">
            <span className="font-medium text-[#1C1C1C]">Advance Payable (30%)</span>
            <span className="text-lg font-medium text-[#1C1C1C]">
              {formatCurrency(advancePayable)}
            </span>
          </div>

          {/* BALANCE */}
          <p className="text-xs text-[#767676]">
            Balance: {formatCurrency(balanceDue)} due on event day
          </p>
        </div>
      </div>

      {/* CHECKOUT BUTTON (unchanged)
      <div className="rounded-[14px] border border-[#E6D9C8] bg-white p-4">
        <button
          type="button"
          onClick={onCheckout}
          className="w-full rounded-full bg-[#D4BA8E] py-3 text-white font-medium"
        >
          Proceed to Checkout →
        </button>
      </div> */}
      <div className="rounded-xl border border-[#95796066] p-5">
        <div className="mb-4 rounded-lg bg-[#E6F2E1] py-3 text-center text-sm">
          🔒 Secure payment · Instant confirmation · Easy cancellation
        </div>

        {showSampleTasteBooking ? (
          <button
            type="button"
            onClick={onSampleTasteBooking}
            className="mx-auto mb-4 flex w-full items-center justify-between rounded-full bg-[#F3F0EA] py-1.5 pl-6 pr-1.5 text-[#6B5B4D] transition-colors hover:bg-[#EBE4D9]"
          >
            <span className="mr-5 text-[15px] font-medium">Book Sample Test Booking</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
              <svg
                className="h-[18px] w-[18px] text-[#957960]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
              </svg>
            </div>
          </button>
        ) : null}

        {/* {formError ? <p className="mb-4 text-sm text-[#B42318]">{formError}</p> : null} */}

        <button
          type="button"
          onClick={onCheckout}
          disabled={isCheckoutDisabled}
          className="mx-auto mt-4 flex w-full items-center justify-between rounded-full bg-[#D4BA8E] py-1.5 pl-6 pr-1.5 transition-colors hover:bg-[#C6AB7F] group disabled:cursor-not-allowed disabled:bg-[#CFCBC5]"
        >
          <span className="mr-5 text-[15px] font-medium text-white">Proceed to Checkout</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <svg
              className="h-[20px] w-[20px] text-[#D4BA8E] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.82812 5.83398H14.1615M14.1615 5.83398V14.1673M14.1615 5.83398L5.82812 14.1673"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
        {isCheckoutDisabled ? (
          <p className="mt-3 text-sm text-[#8B8B8B]">Enter your pincode to enable checkout.</p>
        ) : null}
      </div>
    </div>
  )
}

function isSampleTasteEligibleItem(item) {
  const serviceSlugs = Array.isArray(item?.packageData?.service_slugs)
    ? item.packageData.service_slugs
    : []

  return serviceSlugs.some(serviceSlug =>
    SAMPLE_TASTE_SERVICE_SLUGS.has(normalizeServiceSlug(serviceSlug))
  )
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

  const basePath = `/packages/${serviceSlug}/${packageId}`
  return queryString ? `${basePath}?${queryString}` : basePath
}
const TrustBadges = () => {
  const items = [
    {
      icon: '✅',
      text: 'Verified Vendors',
    },
    {
      icon: '💰',
      text: 'Best Price Guarantee',
    },
    {
      icon: '🔄',
      text: 'Easy Rescheduling',
    },
  ]

  return (
    <div className="mt-4 rounded-xl border border-[#95796066] bg-[#FFFFFF] px-4 py-3">
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1 text-[12px] text-[#333]">
            <span className="text-[12px]">{item.icon}</span>
            <span className="font-medium">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
export default function CartPage() {
  const navigate = useNavigate()
  const { data: packages = [] } = usePackages()
  const { data: serviceAreas = [], isLoading: isLoadingServiceAreas } = useServiceAreas()
  const {
    cart,
    loading,
    error,
    isLoggedIn,
    removeItem,
    applyCoupon,
    clearCoupon,
    updateCartDetails,
  } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [pincode, setPincode] = useState('')
  const [pincodeMessage, setPincodeMessage] = useState('')
  const [isCheckingPincode, setIsCheckingPincode] = useState(false)
  const [isPincodeValid, setIsPincodeValid] = useState(false)
  const [pendingItemId, setPendingItemId] = useState('')
  const [editingField, setEditingField] = useState('')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsForm, setDetailsForm] = useState({
    eventDate: '',
    eventCity: '',
    guestCount: '',
  })

  const items = useMemo(() => cart?.items ?? [], [cart?.items])
  const packageLookup = useMemo(
    () => new Map(packages.map(pkg => [String(pkg.id), pkg])),
    [packages]
  )
  const cartItems = useMemo(
    () =>
      items.map(item => {
        const parsedTitle = parseCartItemTitle(item.title)

        return {
          ...item,
          displayTitle: parsedTitle.displayTitle,
          selectedOptions: parsedTitle.selectedOptions,
          packageData: packageLookup.get(String(item.packageId)) ?? null,
        }
      }),
    [items, packageLookup]
  )
  const hasItems = cartItems.length > 0
  const hasSingleItem = cartItems.length === 1
  const isCheckoutDisabled = TEMP_BYPASS_PINCODE_VALIDATION ? false : !isPincodeValid
  const showSampleTasteBooking = useMemo(
    () => cartItems.some(isSampleTasteEligibleItem),
    [cartItems]
  )
  const suggestedPackages = useMemo(
    () => getSuggestedPackages(packages, cartItems),
    [packages, cartItems]
  )

  useEffect(() => {
    setDetailsForm({
      eventDate: cart?.eventDate ? String(cart.eventDate).slice(0, 10) : '',
      eventCity: cart?.eventCity ?? '',
      guestCount: cart?.guestCount != null ? String(cart.guestCount) : '',
    })
  }, [cart?.eventDate, cart?.eventCity, cart?.guestCount])

  useEffect(() => {
    const nextState = getPincodeValidationState(pincode, serviceAreas, isLoadingServiceAreas)
    setIsCheckingPincode(nextState.isChecking)
    setIsPincodeValid(nextState.isValid)
    setPincodeMessage(nextState.message)
  }, [pincode, isLoadingServiceAreas, serviceAreas])

  const handleDetailChange = (field, value) => {
    setDetailsError('')
    setDetailsForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditField = field => {
    setDetailsError('')
    setEditingField(field)
  }

  const handleCancelEdit = () => {
    setDetailsError('')
    setEditingField('')
    setDetailsForm({
      eventDate: cart?.eventDate ? String(cart.eventDate).slice(0, 10) : '',
      eventCity: cart?.eventCity ?? '',
      guestCount: cart?.guestCount != null ? String(cart.guestCount) : '',
    })
  }

  const handleSaveDetails = async field => {
    if (isSavingDetails) return

    const nextCity = detailsForm.eventCity.trim()
    const nextDate = detailsForm.eventDate

    if (field === 'city' && !nextCity) {
      setDetailsError('Please enter city / area.')
      return
    }

    if (field === 'date' && !nextDate) {
      setDetailsError('Please select an event date.')
      return
    }

    setIsSavingDetails(true)
    setDetailsError('')

    try {
      await updateCartDetails({
        eventCity: nextCity,
        eventDate: nextDate,
        guestCount: detailsForm.guestCount ? Number(detailsForm.guestCount) : undefined,
      })
      setEditingField('')
    } catch (err) {
      setDetailsError(parseApiError(err))
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleRemoveItem = async itemId => {
    if (pendingItemId) return
    setPendingItemId(itemId)
    try {
      await removeItem(itemId)
    } catch (err) {
      console.error('[cart-page] remove item failed', err)
    } finally {
      setPendingItemId('')
    }
  }

  const handleApplyCoupon = async event => {
    event.preventDefault()
    if (!couponCode.trim() || isApplyingCoupon) return

    setIsApplyingCoupon(true)
    setCouponMessage('')
    try {
      const response = await applyCoupon(couponCode.trim())
      setCouponCode('')
      setCouponMessage(`Coupon applied: ${response?.coupon?.code ?? ''}`.trim())
    } catch (err) {
      setCouponMessage(parseApiError(err))
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = async () => {
    if (isApplyingCoupon) return
    setIsApplyingCoupon(true)
    setCouponMessage('')
    try {
      await clearCoupon()
      setCouponMessage('Coupon removed')
    } catch (err) {
      setCouponMessage(parseApiError(err))
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const validatePincode = value => {
    const nextState = getPincodeValidationState(value, serviceAreas, isLoadingServiceAreas)
    setIsCheckingPincode(nextState.isChecking)
    setIsPincodeValid(nextState.isValid)
    setPincodeMessage(nextState.message)
  }

  const handlePincodeChange = value => {
    const normalizedPincode = normalizePincode(value)

    setPincode(normalizedPincode)
    setIsPincodeValid(false)

    if (!normalizedPincode) {
      setIsCheckingPincode(false)
      setPincodeMessage('')
      return
    }

    if (normalizedPincode.length < 6) {
      setIsCheckingPincode(false)
      setPincodeMessage('')
      return
    }

    setIsCheckingPincode(true)
    setPincodeMessage('Checking availability...')
    validatePincode(normalizedPincode)
  }

  const handlePincodeSubmit = event => {
    event.preventDefault()
    setIsCheckingPincode(true)
    setPincodeMessage('Checking availability...')
    validatePincode(pincode)
  }

  const handleSampleTasteBooking = () => {
    navigate('/sample-test-booking', {
      state: {
        sampleTasteItems: cartItems.filter(isSampleTasteEligibleItem),
      },
    })
  }

  return (
    <div className="min-h-screen bg-white px-5 pb-10 pt-24 md:px-8 lg:px-16">
      <div className="mb-6">
        <h2 className="text-[24px] text-[#1C1C1C] md:text-[36px]">Review Your Event</h2>
        <p className="text-gray-500">Check your selections and confirm details before checkout.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#95796066] bg-white p-8 text-center text-gray-500">
          Loading your cart...
        </div>
      ) : !hasItems ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col items-start gap-[clamp(24px,5vw,100px)] lg:flex-row">
          <div className="flex-1 space-y-6">
            {!hasSingleItem ? (
              <CouponCard
                couponCode={couponCode}
                couponMessage={couponMessage}
                cart={cart}
                isApplyingCoupon={isApplyingCoupon}
                onCouponChange={setCouponCode}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
              />
            ) : null}

            {hasSingleItem ? (
              <SinglePackageCard
                item={cartItems[0]}
                pendingItemId={pendingItemId}
                onRemoveItem={handleRemoveItem}
                detailsForm={detailsForm}
                onEditDate={() => handleEditField('date')}
                onEditCity={() => handleEditField('city')}
                editingField={editingField}
                onDetailsChange={handleDetailChange}
                onSaveDetails={handleSaveDetails}
                onCancelEdit={handleCancelEdit}
                isSavingDetails={isSavingDetails}
                detailsError={detailsError}
              />
            ) : (
              <MultiPackageList
                cartItems={cartItems}
                pendingItemId={pendingItemId}
                onRemoveItem={handleRemoveItem}
              />
            )}
            {/* 
            <div className="rounded-[14px] border border-[#E6D9C8] bg-white p-4">
              <div className="mb-4">
                <h2 className="text-[16px] font-medium text-[#2C2C2C]">Event Details</h2>
                <p className="mt-1 text-[12px] text-[#8B8B8B]">
                  These values are stored on the cart and used during booking.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(!hasSingleItem || showDateEditor) && (
                  <DetailField
                    label="Event Date"
                    type="date"
                    min={getMinEventDate()}
                    value={detailsForm.eventDate}
                    onChange={event =>
                      setDetailsForm(prev => ({ ...prev, eventDate: event.target.value }))
                    }
                    onBlur={handleBlurCartDetails}
                  />
                )}
                {(!hasSingleItem || showCityEditor) && (
                  <DetailField
                    label="City / Area"
                    value={detailsForm.eventCity}
                    onChange={event =>
                      setDetailsForm(prev => ({ ...prev, eventCity: event.target.value }))
                    }
                    onBlur={handleBlurCartDetails}
                    placeholder="Enter city"
                  />
                )}
                <DetailField
                  label="Guest Count"
                  type="number"
                  min="1"
                  value={detailsForm.guestCount}
                  onChange={event =>
                    setDetailsForm(prev => ({ ...prev, guestCount: event.target.value }))
                  }
                  onBlur={handleBlurCartDetails}
                  placeholder="Number of guests"
                />
              </div>

              <div className="mt-4 rounded-[10px] border border-dashed border-[#E6D9C8] bg-[#FCFAF7] px-4 py-3 text-[12px] text-[#8B8B8B]">
                {detailsForm.eventDate || detailsForm.eventCity || detailsForm.guestCount
                  ? `${detailsForm.eventCity || 'Event city'}, ${formatDisplayDate(
                      detailsForm.eventDate
                    )}, ${detailsForm.guestCount || '0'} guests`
                  : 'Add your event date, city, and guest count to help us prepare checkout.'}
              </div>
            </div> */}

            <SuggestedPackages packages={suggestedPackages} />

            {error ? (
              <p className="text-sm text-[#8F2D1F]">{parseApiError({ message: error })}</p>
            ) : null}
          </div>

          <div className="flex-1">
            <PriceSummaryCard
              cartItems={cartItems}
              cart={cart}
              singleItem={hasSingleItem}
              onCheckout={() => (isLoggedIn ? navigate('/checkout') : navigate('/login'))}
              onSampleTasteBooking={handleSampleTasteBooking}
              showSampleTasteBooking={showSampleTasteBooking}
              isCheckoutDisabled={isCheckoutDisabled}
              pincodeCard={
                <PincodeCard
                  pincode={pincode}
                  message={pincodeMessage}
                  isChecking={isCheckingPincode}
                  onChange={handlePincodeChange}
                  onSubmit={handlePincodeSubmit}
                />
              }
            />
            <TrustBadges />
          </div>
        </div>
      )}
    </div>
  )
}
