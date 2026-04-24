import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { usePackages } from '../hooks/usePackages'

const CART_META_SEPARATOR = '||__ELEWEN_META__||'

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function parseApiError(error) {
  const message = error?.message ?? 'Something went wrong'
  const match = message.match(/\{"error":"([^"]+)"\}/)
  return match?.[1] ?? message
}

function SummaryRow({ label, value, valueClassName = 'text-[#2C2C2C] font-medium' }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  )
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
  const selectedOptions = item?.selectedOptions ?? {}
  const selectedElements = Object.entries(selectedOptions)
    .map(([label, value]) => ({
      label,
      value,
    }))
    .filter(element => element.label && element.value)

  if (selectedElements.length) return selectedElements

  return (item?.packageData?.detail_inclusions ?? []).slice(0, 4).map(highlight => ({
    label: 'Included with this package',
    value: highlight,
  }))
}

function getPrimaryServiceSlug(pkg) {
  return normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')
}

function getSelectedOptionsSearchParam(selectedOptions = {}) {
  const entries = Object.entries(selectedOptions).filter(([, value]) => Boolean(value))
  if (!entries.length) return ''

  return encodeURIComponent(JSON.stringify(Object.fromEntries(entries)))
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

function QuickViewButton({ itemId }) {
  return (
    <Link
      to={`/single-package-checkout?itemId=${encodeURIComponent(itemId)}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#B08B5A] bg-white text-[#75431F] transition-colors hover:bg-[#FFF7EA]"
      aria-label="View package details"
      title="View package details"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </Link>
  )
}

function SuggestedPackages({ packages = [] }) {
  if (!packages.length) return null

  return (
    <div className="rounded-[14px] border border-[#E6D9C8] bg-white p-4">
      <div className="mb-4">
        <h3 className="text-[16px] font-medium text-[#2C2C2C]">You might also like</h3>
        <p className="mt-1 text-[12px] text-[#8B8B8B]">
          Similar packages from the same service category.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {packages.map(pkg => (
          <div
            key={pkg.id}
            className="rounded-[10px] border border-[#EEE1D0] bg-[#FCFAF7] px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-[#2C2C2C]">{pkg.title}</p>
                <p className="mt-1 text-[11px] text-[#8B8B8B]">{pkg.subtitle}</p>
                <p className="mt-2 text-[12px] font-medium text-[#75431F]">{pkg.price}</p>
              </div>
              <Link
                to={getCartPackageHref({
                  id: pkg.id,
                  documentId: pkg.id,
                  service_slugs: [pkg.serviceSlug],
                })}
                className="rounded-full bg-[#A98559] px-3 py-1 text-[11px] font-medium text-white"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
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
    <form onSubmit={onApplyCoupon} className="rounded-[14px] border border-[#E6D9C8] bg-white p-4">
      <h2 className="text-[16px] font-medium text-[#2C2C2C]">Apply Coupon</h2>
      <p className="mb-4 mt-1 text-[12px] text-[#8B8B8B]">
        Have a code? Apply it here to unlock savings.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={couponCode}
          onChange={event => onCouponChange(event.target.value.toUpperCase())}
          placeholder="Enter Coupon Code"
          className="w-full rounded-[10px] border border-[#E6D9C8] bg-[#FCFAF7] px-4 py-3 text-[13px] text-[#2C2C2C] focus:outline-none"
        />
        <button
          type="submit"
          disabled={isApplyingCoupon || !couponCode.trim()}
          className="rounded-full bg-[#D4BA8E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C6AB7F] disabled:cursor-not-allowed disabled:bg-[#CFCBC5]"
        >
          {isApplyingCoupon ? 'Applying...' : 'Apply'}
        </button>
      </div>

      {cart?.couponId ? (
        <div className="mt-4 flex items-start justify-between rounded-[10px] border border-[#EEE1D0] bg-[#FCFAF7] p-4">
          <div>
            <p className="text-sm font-medium text-[#2C2C2C]">Coupon applied</p>
            <p className="text-sm text-gray-500">Discount: {formatCurrency(cart.discountAmount)}</p>
          </div>
          <button
            type="button"
            onClick={onRemoveCoupon}
            className="text-sm font-medium text-[#5A1E0E]"
          >
            Remove
          </button>
        </div>
      ) : null}

      {couponMessage ? <p className="mt-3 text-sm text-[#5A1E0E]">{couponMessage}</p> : null}
    </form>
  )
}

function SinglePackageCard({
  item,
  pendingItemId,
  onQuantityChange,
  onRemoveItem,
  detailsForm,
  onEditDate,
  onEditCity,
}) {
  const isPending = pendingItemId === item.id
  const quantity = Number(item.quantity ?? 0)
  const packageHref = getCartPackageHref(item.packageData, item.selectedOptions)
  const packageImage = item.packageData?.images?.[0] ?? ''
  const packageTitle = item.packageData?.title || item.displayTitle
  const selectedElements = getSelectedElements(item)
  const packageSubtitle = getPackageSubtitle(item.packageData)
  const eventLocation = detailsForm.eventCity?.trim() || 'Add city / area'
  const eventDate = detailsForm.eventDate ? formatDisplayDate(detailsForm.eventDate) : 'Select date'

  return (
    <div className="space-y-6">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-[#95796066] p-4">
        <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl bg-[#957960]" />
        <div className="ml-2 h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
          {packageImage ? (
            <img src={packageImage} alt={packageTitle} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div>
          <p className="text-sm text-gray-500">{packageSubtitle}</p>
          {packageHref ? (
            <Link to={packageHref} className="font-medium text-lg text-[#2C2C2C]">
              {packageTitle}
            </Link>
          ) : (
            <h3 className="font-medium text-lg text-[#2C2C2C]">{packageTitle}</h3>
          )}
          <p className="text-sm text-gray-500">
            {eventLocation} · {eventDate}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {packageHref ? (
          <Link
            to={packageHref}
            className="flex items-center justify-center rounded-full bg-[#2E3A1F] px-4 py-2.5 text-[13px] font-medium text-white"
          >
            Edit Package
          </Link>
        ) : (
          <button
            type="button"
            className="rounded-full bg-[#2E3A1F] px-4 py-2.5 text-[13px] font-medium text-white"
          >
            Edit Package
          </button>
        )}
        <Link
          to={`/single-package-checkout?itemId=${encodeURIComponent(item.id)}`}
          className="flex items-center justify-center rounded-full border border-[#B08B5A] bg-white px-4 py-2.5 text-[13px] font-medium text-[#75431F]"
        >
          View Details
        </Link>
        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          disabled={isPending}
          className="rounded-full bg-[#6B1D0C] px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? 'Updating...' : 'Delete Package'}
        </button>
      </div>

      <div className="rounded-[12px] border border-[#E6D9C8] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#EEE1D0] bg-[#F8F4ED] px-4 py-3">
          <h3 className="text-[14px] font-medium text-[#2C2C2C]">Package Quantity</h3>
          <span className="text-[12px] text-[#8B8B8B]">
            line total {formatCurrency(item.totalPrice)}
          </span>
        </div>

        <div className="px-4 py-4">
          <div className="inline-flex items-center overflow-hidden rounded-[6px] border border-[#B08B5A] bg-[#FFF7EA]">
            <button
              type="button"
              disabled={isPending || quantity <= 1}
              onClick={() => onQuantityChange(item.id, quantity - 1)}
              className="flex h-9 w-9 items-center justify-center text-[18px] leading-none text-[#75431F] disabled:opacity-50"
            >
              -
            </button>
            <span className="flex h-9 min-w-[40px] items-center justify-center border-x border-[#B08B5A] px-3 text-[13px] font-medium text-[#75431F]">
              {quantity}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onQuantityChange(item.id, quantity + 1)}
              className="flex h-9 w-9 items-center justify-center text-[18px] leading-none text-[#75431F] disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#95796066]">
        <div className="flex justify-between bg-[#F8F4ED] px-4 py-3">
          <h3 className="font-medium">Selected Elements</h3>
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
          <h3 className="font-medium">Event Details</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <div className="flex justify-between rounded-lg bg-[#F5F5F5] p-4">
            <div>
              <p className="text-sm text-gray-500">City / Area</p>
              <p className="font-medium">{eventLocation}</p>
            </div>
            <button type="button" onClick={onEditCity} className="text-sm text-[#957960]">
              Edit
            </button>
          </div>

          <div className="flex justify-between rounded-lg bg-[#F3F3F3] p-4">
            <div>
              <p className="text-sm text-gray-500">Event Date</p>
              <p className="font-medium">{eventDate}</p>
            </div>
            <button type="button" onClick={onEditDate} className="text-sm text-[#957960]">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MultiPackageList({ cartItems, itemCount, pendingItemId, onQuantityChange, onRemoveItem }) {
  return (
    <div className="rounded-[14px] border border-[#E6D9C8] bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#EEE1D0] bg-[#F8F4ED] px-4 py-3">
        <h2 className="font-medium text-[#2C2C2C]">Selected Packages</h2>
        <span className="text-sm text-gray-500">{itemCount} items</span>
      </div>

      <div className="space-y-4 p-4">
        {cartItems.map(item => {
          const quantity = Number(item.quantity ?? 0)
          const isPending = pendingItemId === item.id
          const packageHref = getCartPackageHref(item.packageData, item.selectedOptions)
          const packageImage = item.packageData?.images?.[0] ?? ''
          const packageTitle = item.packageData?.title || item.displayTitle
          const selectedElements = getSelectedElements(item)

          return (
            <div
              key={item.id}
              className="relative flex gap-4 rounded-[12px] border border-[#EEE1D0] bg-[#FCFAF7] p-4"
            >
              <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-[12px] bg-[#957960]" />

              {packageImage ? (
                packageHref ? (
                  <Link
                    to={packageHref}
                    className="ml-2 h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-[#F8F4ED]"
                  >
                    <img
                      src={packageImage}
                      alt={packageTitle}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                ) : (
                  <div className="ml-2 h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-[#F8F4ED]">
                    <img
                      src={packageImage}
                      alt={packageTitle}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )
              ) : null}

              <div className="flex-1 pl-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#9A8771]">
                      {getPackageSubtitle(item.packageData)}
                    </p>
                    {packageHref ? (
                      <Link
                        to={packageHref}
                        className="mt-1 block font-medium text-[#2C2C2C] transition-colors hover:text-[#5A1E0E]"
                      >
                        {packageTitle}
                      </Link>
                    ) : (
                      <h3 className="mt-1 font-medium text-[#2C2C2C]">{packageTitle}</h3>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Unit price: {formatCurrency(item.unitPrice)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-[#2C2C2C]">
                      {formatCurrency(item.totalPrice)}
                    </p>
                    <p className="text-xs text-gray-500">line total</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <QuickViewButton itemId={item.id} />
                  <div className="inline-flex items-center overflow-hidden rounded-[4px] border border-[#B08B5A] bg-[#FFF7EA]">
                    <button
                      type="button"
                      disabled={isPending || quantity <= 1}
                      onClick={() => onQuantityChange(item.id, quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-[18px] leading-none text-[#75431F] transition-colors hover:bg-[#F6E5C7] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="flex h-8 min-w-[34px] items-center justify-center border-x border-[#B08B5A] px-2 text-[13px] font-medium text-[#75431F]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onQuantityChange(item.id, quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-[18px] leading-none text-[#75431F] transition-colors hover:bg-[#F6E5C7] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isPending}
                    className="rounded-full bg-[#5A1E0E] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4A180B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? 'Updating...' : 'Remove'}
                  </button>
                </div>

                {selectedElements.length ? (
                  <div className="mt-4 rounded-[10px] border border-[#E6D9C8] bg-white px-3 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-[12px] font-medium text-[#2C2C2C]">Selected Elements</p>
                      <span className="text-[11px] text-[#8B8B8B]">
                        {selectedElements.length}{' '}
                        {selectedElements.length === 1 ? 'element' : 'elements'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedElements.map(element => (
                        <div
                          key={`${item.id}-${element.label}-${element.value}`}
                          className="flex items-start gap-2 text-[12px]"
                        >
                          <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#D5D5D5]" />
                          <div>
                            <p className="font-medium text-[#2C2C2C]">{element.value}</p>
                            <p className="text-[#8B8B8B]">{element.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PriceSummaryCard({ cartItems, cart, singleItem = false, onCheckout, couponCard = null }) {
  const advancePayable = Number(cart?.total ?? 0) * 0.3
  const balanceDue = Math.max(0, Number(cart?.total ?? 0) - advancePayable)

  return (
    <div className="space-y-4">
      {couponCard}

      <div className="overflow-hidden rounded-[14px] border border-[#E6D9C8] bg-white">
        <div className="px-4 pb-4 pt-4">
          <h2 className="text-[14px] font-medium text-[#2C2C2C]">Price Summary</h2>
          <div className="mt-3 h-[2px] w-full bg-[#2E3A1F]" />
        </div>

        <div className="px-5 pb-5 text-sm">
          <div className="space-y-2 text-[#4B5563]">
            {cartItems.map(item => (
              <SummaryRow
                key={item.id}
                label={
                  singleItem
                    ? `Base Package - ${item.packageData?.title || item.displayTitle}`
                    : `${item.packageData?.title || item.displayTitle} x ${item.quantity}`
                }
                value={formatCurrency(item.totalPrice)}
              />
            ))}
          </div>

          <hr className="my-4 border-[#0000001A]" />

          <div className="space-y-2 text-[#4B5563]">
            <SummaryRow label="Subtotal" value={formatCurrency(cart?.subtotal)} />
            <SummaryRow label="Discount" value={`-${formatCurrency(cart?.discountAmount)}`} />
          </div>

          <hr className="my-4 border-[#0000001A]" />

          <div className="flex items-center justify-between rounded-[10px] bg-[#F8F4ED] px-4 py-3 font-medium text-[#2C2C2C]">
            <span>Total Amount</span>
            <span>{formatCurrency(cart?.total)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-[#F3EFE9] px-4 py-3 font-medium text-[#2C2C2C]">
            <span>Advance Payable (30%)</span>
            <span>{formatCurrency(advancePayable)}</span>
          </div>

          <p className="mt-3 text-[11px] text-[#8B8B8B]">
            Balance: {formatCurrency(balanceDue)} due on event day
          </p>
        </div>
      </div>

      <div className="rounded-[14px] border border-[#E6D9C8] bg-white p-4">
        <div className="rounded-[10px] bg-[#EEFFE2] py-3 text-center text-[13px] font-medium text-[#2C2C2C]">
          Secure & Verified Platform
        </div>

        <button
          type="button"
          onClick={onCheckout}
          className="group mt-6 flex w-full items-center justify-between rounded-full bg-[#D4BA8E] py-1.5 pl-6 pr-1.5 transition-colors hover:bg-[#C6AB7F]"
        >
          <span className="mr-5 text-[15px] font-medium text-white">Proceed to Checkout</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <svg
              className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}

function normalizeServiceSlug(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')
}

function getCartPackageHref(pkg, selectedOptions = {}) {
  const packageId = pkg?.documentId ?? pkg?.id
  const serviceSlug = normalizeServiceSlug(pkg?.service_slugs?.[0] ?? '')
  const selectedOptionsParam = getSelectedOptionsSearchParam(selectedOptions)

  if (!packageId || !serviceSlug) return ''
  if (serviceSlug === 'decor') {
    const basePath = `/packages/decor-single/${packageId}`
    return selectedOptionsParam ? `${basePath}?selectedOptions=${selectedOptionsParam}` : basePath
  }
  if (serviceSlug === 'sheesha') {
    const basePath = `/packages/sheesha-single/${packageId}`
    return selectedOptionsParam ? `${basePath}?selectedOptions=${selectedOptionsParam}` : basePath
  }

  const basePath = `/packages/${serviceSlug}/${packageId}`
  return selectedOptionsParam ? `${basePath}?selectedOptions=${selectedOptionsParam}` : basePath
}

export default function CartPage() {
  const navigate = useNavigate()
  const { data: packages = [] } = usePackages()
  const {
    cart,
    loading,
    error,
    isLoggedIn,
    updateItemQuantity,
    removeItem,
    applyCoupon,
    clearCoupon,
  } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [pendingItemId, setPendingItemId] = useState('')
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
  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0),
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

  const handleQuantityChange = async (itemId, nextQuantity) => {
    if (nextQuantity < 1 || pendingItemId) return
    setPendingItemId(itemId)
    try {
      await updateItemQuantity(itemId, nextQuantity)
    } catch (err) {
      console.error('[cart-page] quantity update failed', err)
    } finally {
      setPendingItemId('')
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white px-4 pt-24 md:px-8 lg:px-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#95796066] bg-white p-8 text-center">
          <p className="text-[24px] font-semibold text-[#1C1C1C]">Sign in to view your cart</p>
          <p className="mt-2 text-gray-500">
            Your cart is linked to your account in the current API flow.
          </p>
          <Link
            to="/login"
            className="mx-auto mt-6 flex w-fit items-center rounded-full bg-[#D4BA8E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C6AB7F]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 pb-10 pt-24 md:px-8 lg:px-16">
      <div className="mb-6">
        <p className="text-[24px] font-semibold text-[#1C1C1C] md:text-[36px]">Review Your Event</p>
        <p className="text-gray-500">Check your selections and confirm details before checkout.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#95796066] bg-white p-8 text-center text-gray-500">
          Loading your cart...
        </div>
      ) : !hasItems ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col gap-[clamp(24px,5vw,100px)] lg:flex-row">
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
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
                detailsForm={detailsForm}
                onEditDate={() => {}}
                onEditCity={() => {}}
              />
            ) : (
              <MultiPackageList
                cartItems={cartItems}
                itemCount={itemCount}
                pendingItemId={pendingItemId}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
              />
            )}

            {/* <div className="rounded-[14px] border border-[#E6D9C8] bg-white p-4">
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
              onCheckout={() => navigate('/checkout')}
              couponCard={
                hasSingleItem ? (
                  <CouponCard
                    couponCode={couponCode}
                    couponMessage={couponMessage}
                    cart={cart}
                    isApplyingCoupon={isApplyingCoupon}
                    onCouponChange={setCouponCode}
                    onApplyCoupon={handleApplyCoupon}
                    onRemoveCoupon={handleRemoveCoupon}
                  />
                ) : null
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
