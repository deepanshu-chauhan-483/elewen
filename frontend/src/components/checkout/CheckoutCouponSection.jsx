import { useMemo, useState } from 'react'
import { useDashboardCoupons } from '../../hooks/useDashboardData'
import { useDiscountBanners } from '../../hooks/useDiscountBanners'
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

function normalizeCouponCode(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}

/**
 * Cart coupon section: dropdown only (account + admin-shared banner coupons).
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
  const { data: bannerCoupons = [], isLoading: bannersLoading } = useDiscountBanners()
  const { data: couponToastMessage = 'Coupon applied successfully.' } = useCouponToastMessage()

  const [selectedAccountCode, setSelectedAccountCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')

  const isCouponApplied =
    Boolean(cart?.couponId || cart?.couponGrantId) || Number(cart?.discountAmount ?? 0) > 0

  const appliedCode = cart?.couponCode ?? ''
  const isLoadingCoupons = (isLoggedIn && couponsLoading) || bannersLoading

  const selectableCoupons = useMemo(() => {
    const byCode = new Map()

    for (const banner of bannerCoupons) {
      const code = normalizeCouponCode(banner?.code)
      if (!code) continue
      byCode.set(code, {
        id: `banner-${banner.id ?? code}`,
        code,
        title: banner.title ?? '',
        discount_type: banner.discount_type ?? 'flat',
        discount_value: Number(banner.discount_value ?? 0),
        min_order_value: Number(banner.min_order_value ?? 0),
        status: 'active',
        source: 'banner',
      })
    }

    if (isLoggedIn) {
      for (const coupon of accountCoupons) {
        if (coupon?.status !== 'active') continue
        const code = normalizeCouponCode(coupon?.code)
        if (!code) continue
        byCode.set(code, {
          ...coupon,
          code,
          source: coupon.source ?? 'account',
        })
      }
    }

    return Array.from(byCode.values())
  }, [accountCoupons, bannerCoupons, isLoggedIn])

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
    <div className="rounded-xl border border-[#95796066] bg-white p-4 md:p-5">
      <h2 className="text-base font-medium text-[#2C2C2C] md:text-lg" style={{ fontFamily: "'Poppins'" }}>
        Apply Coupon
      </h2>

      <div className="mt-3 space-y-4 md:mt-4">
        {!isCouponApplied ? (
          <label className="block">
            <span className="sr-only">Select a coupon</span>
            <select
              value={selectedAccountCode}
              onChange={handleSelectCoupon}
              disabled={isApplyingCoupon || isLoadingCoupons}
              className="w-full appearance-none rounded-lg border border-[#EDE8E1] bg-[#FAFAFA] px-3 py-2.5 text-sm text-[#2C2C2C] outline-none focus:border-[#957960] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isApplyingCoupon
                  ? 'Applying…'
                  : isLoadingCoupons
                    ? 'Loading coupons…'
                    : 'Select a coupon'}
              </option>
              {selectableCoupons.map(coupon => (
                <option key={coupon.id} value={coupon.code}>
                  {formatCouponOptionLabel(coupon)}
                </option>
              ))}
            </select>
          </label>
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
