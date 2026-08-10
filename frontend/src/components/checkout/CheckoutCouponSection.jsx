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

function formatCouponOptionLabel(coupon) {
  const title = coupon.title || formatCouponDiscount(coupon)
  const min = coupon.min_order_value
    ? ` · Min ${formatCompactCurrency(coupon.min_order_value)}`
    : ''
  return `${coupon.code} — ${title} (${formatCouponDiscount(coupon)}${min})`
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
  const [selectedAccountCode, setSelectedAccountCode] = useState('')
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
      setSelectedAccountCode('')
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

  const handleApplySelected = async () => {
    if (!selectedAccountCode) return
    await runApply(selectedAccountCode)
  }

  const handleRemove = async () => {
    if (isApplyingCoupon) return
    onApplyingChange(true)
    setCouponMessage('')
    try {
      await onRemoveCoupon()
      setSelectedAccountCode('')
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

        {isLoggedIn && selectableCoupons.length > 0 && !isCouponApplied ? (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#8F8F8F]">
              Your available coupons
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Select a coupon</span>
                <select
                  value={selectedAccountCode}
                  onChange={event => setSelectedAccountCode(event.target.value)}
                  disabled={isApplyingCoupon}
                  className="w-full appearance-none rounded-lg border border-[#EDE8E1] bg-[#FAFAFA] px-3 py-2.5 text-sm text-[#2C2C2C] outline-none focus:border-[#957960] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select a coupon</option>
                  {selectableCoupons.map(coupon => (
                    <option key={coupon.id} value={coupon.code}>
                      {formatCouponOptionLabel(coupon)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={isApplyingCoupon || !selectedAccountCode}
                onClick={handleApplySelected}
                className="shrink-0 rounded-full bg-[#364022] px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApplyingCoupon ? 'Applying…' : 'Apply'}
              </button>
            </div>
          </div>
        ) : isLoggedIn && !couponsLoading && !isCouponApplied ? (
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
