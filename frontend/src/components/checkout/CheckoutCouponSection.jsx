import { useMemo, useState } from 'react'
import { useDashboardCoupons } from '../../hooks/useDashboardData'
import { useCouponToastMessage } from '../../hooks/useMessagingContent'

function formatCouponDiscount(coupon) {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% off`
  }
  return `₹${Number(coupon.discount_value ?? 0).toLocaleString('en-IN')} off`
}

function formatCompactCurrency(value) {
  const amount = Number(value ?? 0)
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function parseApiError(error) {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  return String(message)
}

export default function CheckoutCouponSection({
  cart,
  isLoggedIn,
  isApplyingCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onApplyingChange,
  showToast,
}) {
  const { data: accountCoupons = [], isLoading: couponsLoading } = useDashboardCoupons()
  const { data: couponToastMessage = 'Coupon applied successfully.' } = useCouponToastMessage()

  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')

  const isCouponApplied =
    Boolean(cart?.couponId || cart?.couponGrantId) || Number(cart?.discountAmount ?? 0) > 0

  const appliedCode = cart?.couponCode ?? ''

  const selectableCoupons = useMemo(
    () => accountCoupons.filter(coupon => coupon.status === 'active'),
    [accountCoupons]
  )

  const runApply = async code => {
    const normalized = String(code ?? '').trim()
    if (!normalized || isApplyingCoupon) return

    onApplyingChange(true)
    setCouponMessage('')
    try {
      await onApplyCoupon(normalized)
      setCouponCode('')
      setCouponMessage('')
      showToast?.({ message: couponToastMessage })
    } catch (err) {
      setCouponMessage(parseApiError(err))
    } finally {
      onApplyingChange(false)
    }
  }

  const handleApplySubmit = async event => {
    event.preventDefault()
    await runApply(couponCode)
  }

  const handleRemove = async () => {
    if (isApplyingCoupon) return
    onApplyingChange(true)
    setCouponMessage('')
    try {
      await onRemoveCoupon()
      setCouponMessage('Coupon removed')
    } catch (err) {
      setCouponMessage(parseApiError(err))
    } finally {
      onApplyingChange(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#95796066] bg-white">
      <div className="border-b border-[#EDE8E1] bg-[#FBF7F3] px-5 py-3">
        <h3 className="font-medium text-[#2C2C2C]" style={{ fontFamily: "'Poppins'" }}>
          Apply Coupon
        </h3>
        <p className="mt-1 text-xs text-[#7A7A7A]">Only one coupon can be applied at a time.</p>
      </div>

      <div className="space-y-4 p-5">
        {isLoggedIn && couponsLoading ? (
          <p className="text-sm text-[#7A7A7A]">Loading your available coupons…</p>
        ) : null}

        {isLoggedIn && selectableCoupons.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#8F8F8F]">
              Your available coupons
            </p>
            <div className="space-y-2">
              {selectableCoupons.map(coupon => {
                const isApplied = isCouponApplied && appliedCode === coupon.code
                const isDisabled = isApplyingCoupon || (isCouponApplied && !isApplied)

                return (
                  <div
                    key={coupon.id}
                    className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      isApplied
                        ? 'border-[#364022] bg-[#F3F6EE]'
                        : 'border-[#EDE8E1] bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#2C2C2C]">
                        {coupon.title || formatCouponDiscount(coupon)}
                      </p>
                      <p className="mt-1 font-mono text-sm tracking-wide text-[#591902]">
                        {coupon.code}
                      </p>
                      <p className="mt-1 text-xs text-[#7A7A7A]">
                        {formatCouponDiscount(coupon)}
                        {coupon.min_order_value
                          ? ` · Min order ${formatCompactCurrency(coupon.min_order_value)}`
                          : ''}
                      </p>
                    </div>

                    {isApplied ? (
                      <span className="shrink-0 rounded-full bg-[#364022] px-4 py-2 text-xs font-medium text-white">
                        Applied
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => runApply(coupon.code)}
                        className="shrink-0 rounded-full bg-[#364022] px-4 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : isLoggedIn && !couponsLoading ? (
          <p className="text-sm text-[#7A7A7A]">
            No coupons in your account right now. Enter a code below if you have one.
          </p>
        ) : null}

        {!isCouponApplied ? (
          <form onSubmit={handleApplySubmit} className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#8F8F8F]">
              Enter coupon code
            </p>
            <div className="flex items-end gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={event => setCouponCode(event.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="min-w-0 flex-1 border-b border-[#2D2D2D] bg-transparent py-2 text-[14px] text-[#2C2C2C] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isApplyingCoupon || !couponCode.trim()}
                className="shrink-0 rounded-full bg-[#364022] px-5 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApplyingCoupon ? 'Applying…' : 'Apply'}
              </button>
            </div>
          </form>
        ) : null}

        {isCouponApplied ? (
          <div className="flex items-start justify-between rounded-xl bg-[#F3F3F3] p-4">
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                Coupon applied: {appliedCode || '—'}
              </p>
              <p className="text-sm text-gray-500">
                {formatCompactCurrency(cart.discountAmount)} deducted from your total
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isApplyingCoupon}
              className="text-lg leading-none text-[#2C2C2C] disabled:opacity-50"
              aria-label="Remove coupon"
            >
              ✕
            </button>
          </div>
        ) : null}

        {couponMessage ? <p className="text-sm text-[#5A1E0E]">{couponMessage}</p> : null}
      </div>
    </div>
  )
}
