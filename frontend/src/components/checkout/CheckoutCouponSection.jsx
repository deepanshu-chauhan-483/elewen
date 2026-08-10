import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

/**
 * Account-coupon dropdown only (no manual code entry). Used on the cart page.
 */
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
      setSelectedAccountCode('')
      setCouponMessage('')
      showToast?.({ message: couponToastMessage })
    } catch (err) {
      setCouponMessage(parseApiError(err))
      setSelectedAccountCode('')
    } finally {
      onApplyingChange(false)
    }
  }

  const handleSelectCoupon = async event => {
    const code = event.target.value
    setSelectedAccountCode(code)
    if (!code) return
    await runApply(code)
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
    <div className="rounded-xl border border-[#95796066] bg-white p-5">
      <h2 className="text-lg font-medium text-[#2C2C2C]" style={{ fontFamily: "'Poppins'" }}>
        Apply Coupon
      </h2>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Select a coupon from your account. Only one coupon can be applied at a time.
      </p>

      <div className="space-y-4">
        {!isLoggedIn ? (
          <p className="text-sm text-[#7A7A7A]">
            <Link to="/login" state={{ from: '/cart' }} className="font-medium underline underline-offset-2">
              Log in
            </Link>{' '}
            to see and apply your available coupons.
          </p>
        ) : null}

        {isLoggedIn && couponsLoading ? (
          <p className="text-sm text-[#7A7A7A]">Loading your available coupons…</p>
        ) : null}

        {isLoggedIn && selectableCoupons.length > 0 && !isCouponApplied ? (
          <label className="block">
            <span className="sr-only">Select a coupon</span>
            <select
              value={selectedAccountCode}
              onChange={handleSelectCoupon}
              disabled={isApplyingCoupon}
              className="w-full appearance-none rounded-lg border border-[#EDE8E1] bg-[#FAFAFA] px-3 py-2.5 text-sm text-[#2C2C2C] outline-none focus:border-[#957960] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{isApplyingCoupon ? 'Applying…' : 'Select a coupon'}</option>
              {selectableCoupons.map(coupon => (
                <option key={coupon.id} value={coupon.code}>
                  {formatCouponOptionLabel(coupon)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isLoggedIn && !couponsLoading && selectableCoupons.length === 0 && !isCouponApplied ? (
          <p className="text-sm text-[#7A7A7A]">No coupons in your account right now.</p>
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
