import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'

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
        to="/services"
        className="mx-auto mt-6 flex w-fit items-center rounded-full bg-[#D4BA8E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C6AB7F]"
      >
        Browse Packages
      </Link>
    </div>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const {
    cart,
    loading,
    error,
    isLoggedIn,
    updateItemQuantity,
    removeItem,
    updateCartDetails,
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

  const items = cart?.items ?? []
  const hasItems = items.length > 0
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0),
    [items]
  )

  const cartDateValue = cart?.eventDate ? String(cart.eventDate).slice(0, 10) : ''
  const eventDateValue = detailsForm.eventDate || cartDateValue
  const eventCityValue = detailsForm.eventCity || cart?.eventCity || ''
  const guestCountValue =
    detailsForm.guestCount || (cart?.guestCount != null ? String(cart.guestCount) : '')

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

  const handleBlurCartDetails = async () => {
    if (!hasItems) return

    const payload = {
      eventDate: eventDateValue || null,
      eventCity: eventCityValue.trim(),
      guestCount: guestCountValue ? Number(guestCountValue) : null,
    }

    try {
      await updateCartDetails(payload)
    } catch (err) {
      console.error('[cart-page] update details failed', err)
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
            <form onSubmit={handleApplyCoupon} className="rounded-xl border border-[#95796066] p-5">
              <h2 className="text-lg font-medium text-[#2C2C2C]">Apply Coupon</h2>
              <p className="mb-4 mt-1 text-sm text-gray-500">
                Have a code? Apply it here to unlock savings.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={couponCode}
                  onChange={event => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="Enter Coupon Code"
                  className="w-full border-b border-[#2D2D2D] bg-transparent py-2 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="rounded-full bg-[#D4BA8E] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C6AB7F] disabled:cursor-not-allowed disabled:bg-[#CFCBC5]"
                >
                  {isApplyingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </div>

              {cart?.couponId ? (
                <div className="mt-4 flex items-start justify-between rounded-xl bg-[#F3F3F3] p-4">
                  <div>
                    <p className="text-sm font-medium text-[#2C2C2C]">Coupon applied</p>
                    <p className="text-sm text-gray-500">
                      Discount: {formatCurrency(cart.discountAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-sm font-medium text-[#5A1E0E]"
                  >
                    Remove
                  </button>
                </div>
              ) : null}

              {couponMessage ? (
                <p className="mt-3 text-sm text-[#5A1E0E]">{couponMessage}</p>
              ) : null}
            </form>

            <div className="rounded-xl border border-[#95796066] p-5">
              <h2 className="text-lg font-medium text-[#2C2C2C]">Event Details</h2>
              <p className="mb-4 mt-1 text-sm text-gray-500">
                These values are stored on the cart and used during booking.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <input
                  type="date"
                  value={eventDateValue}
                  onChange={event =>
                    setDetailsForm(prev => ({ ...prev, eventDate: event.target.value }))
                  }
                  onBlur={handleBlurCartDetails}
                  className="rounded-xl border border-[#95796066] px-4 py-3 focus:outline-none"
                />
                <input
                  type="text"
                  value={eventCityValue}
                  onChange={event =>
                    setDetailsForm(prev => ({ ...prev, eventCity: event.target.value }))
                  }
                  onBlur={handleBlurCartDetails}
                  placeholder="Event city"
                  className="rounded-xl border border-[#95796066] px-4 py-3 focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={guestCountValue}
                  onChange={event =>
                    setDetailsForm(prev => ({ ...prev, guestCount: event.target.value }))
                  }
                  onBlur={handleBlurCartDetails}
                  placeholder="Guest count"
                  className="rounded-xl border border-[#95796066] px-4 py-3 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#95796066] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#95796033] bg-[#F8F4ED] px-4 py-3">
                <h2 className="font-medium text-[#2C2C2C]">Selected Packages</h2>
                <span className="text-sm text-gray-500">{itemCount} items</span>
              </div>

              <div className="space-y-4 p-4">
                {items.map(item => {
                  const quantity = Number(item.quantity ?? 0)
                  const isPending = pendingItemId === item.id

                  return (
                    <div
                      key={item.id}
                      className="relative flex gap-4 rounded-lg border border-[#94949433] bg-white p-4"
                    >
                      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg bg-[#957960]" />

                      <div className="flex-1 pl-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-medium text-[#2C2C2C]">{item.title}</h3>
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
                          <div className="inline-flex items-center overflow-hidden rounded-[4px] border border-[#B08B5A] bg-[#FFF7EA]">
                            <button
                              type="button"
                              disabled={isPending || quantity <= 1}
                              onClick={() => handleQuantityChange(item.id, quantity - 1)}
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
                              onClick={() => handleQuantityChange(item.id, quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center text-[18px] leading-none text-[#75431F] transition-colors hover:bg-[#F6E5C7] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isPending}
                            className="rounded-full bg-[#5A1E0E] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4A180B] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isPending ? 'Updating...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {error ? (
              <p className="text-sm text-[#8F2D1F]">{parseApiError({ message: error })}</p>
            ) : null}
          </div>

          <div className="flex-1">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-[#95796066]">
                <div className="flex justify-between bg-[#222815] px-4 py-3 text-white">
                  <h2 className="font-medium">Price Summary</h2>
                  <span className="text-sm opacity-80">{itemCount} items</span>
                </div>

                <div className="bg-white px-5 py-4 text-sm">
                  <div className="space-y-2 text-[#4B5563]">
                    {items.map(item => (
                      <SummaryRow
                        key={item.id}
                        label={`${item.title} x ${item.quantity}`}
                        value={formatCurrency(item.totalPrice)}
                      />
                    ))}
                  </div>

                  <hr className="my-4 border-[#0000001A]" />

                  <div className="space-y-2 text-[#4B5563]">
                    <SummaryRow label="Subtotal" value={formatCurrency(cart?.subtotal)} />
                    <SummaryRow
                      label="Discount"
                      value={`-${formatCurrency(cart?.discountAmount)}`}
                    />
                  </div>

                  <hr className="my-4 border-[#0000001A]" />

                  <div className="flex items-center justify-between rounded-xl bg-[#F8F4ED] px-4 py-3 font-medium text-[#2C2C2C]">
                    <span>Total Amount</span>
                    <span>{formatCurrency(cart?.total)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#95796066] p-4">
                <div className="rounded-lg bg-[#EEFFE2] py-3 text-center font-medium text-[#2C2C2C]">
                  Secure & Verified Platform
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="group mt-8 flex w-full items-center justify-between rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5 transition-colors hover:bg-[#C6AB7F]"
                >
                  <span className="mr-5 text-[15px] font-medium text-white">
                    Proceed to Checkout
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                    <svg
                      className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 17L17 7M17 7H9M17 7v8"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
