/** Referral tiers issued manually after a completed booking. */
export const REFERRAL_TIERS = [
  {
    key: 'referral_500',
    title: 'Referral — Flat ₹500 off',
    discount_type: 'flat',
    discount_value: 500,
    min_order_value: 5000,
    min_booking_total: 5000,
    max_booking_total: 14999.99,
    validity_days: 60,
    terms_customer:
      'Flat ₹500 off. Valid on orders above ₹5,000. Valid for up to 2 months. Assigned to your account only. Can be used once.',
    admin_notes:
      'Sent manually after booking is complete via email + inbox. Owner-only; not shareable.',
    is_shareable: false,
  },
  {
    key: 'referral_800',
    title: 'Referral — Flat ₹800 off',
    discount_type: 'flat',
    discount_value: 800,
    min_order_value: 5000,
    min_booking_total: 15000,
    max_booking_total: 29999.99,
    validity_days: 60,
    terms_customer:
      'Flat ₹800 off. Valid on orders above ₹5,000. Valid for up to 2 months. Assigned to your account only. Can be used once.',
    admin_notes:
      'Sent manually after booking is complete via email + inbox. Owner-only; not shareable.',
    is_shareable: false,
  },
  {
    key: 'referral_1500',
    title: 'Referral — Flat ₹1,500 off',
    discount_type: 'flat',
    discount_value: 1500,
    min_order_value: 5000,
    min_booking_total: 30000,
    max_booking_total: null,
    validity_days: 60,
    terms_customer:
      'Flat ₹1,500 off. Valid on orders above ₹5,000. Valid for up to 2 months. Assigned to your account only. Can be used once.',
    admin_notes:
      'Sent manually after booking is complete via email + inbox. Owner-only; not shareable.',
    is_shareable: false,
  },
]

/** Global coupon templates (seeded in Strapi, not user-specific). */
export const GLOBAL_COUPON_TEMPLATES = [
  {
    code: 'FIRST500',
    title: 'Flat ₹500 off — First order',
    coupon_kind: 'first_order',
    discount_type: 'flat',
    discount_value: 500,
    min_order_value: 5000,
    first_order_only: true,
    terms_customer:
      'Flat ₹500 off. Valid on orders above ₹5,000. Valid on first order. Seafood is not included in catering menus at this level.',
    admin_notes: 'First-order welcome offer.',
  },
  {
    code: 'FIRST10',
    title: 'Flat 10% off — First order',
    coupon_kind: 'first_order',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 6500,
    max_order_value: 30000,
    first_order_only: true,
    terms_customer:
      'Flat 10% off. Valid on orders above ₹6,500 and up to ₹30,000. Valid on first order.',
    admin_notes: 'First-order percentage offer with order cap.',
  },
  {
    code: 'FIRST3000',
    title: 'Flat ₹3,000 off — First order',
    coupon_kind: 'first_order',
    discount_type: 'flat',
    discount_value: 3000,
    min_order_value: 30000,
    first_order_only: true,
    terms_customer: 'Flat ₹3,000 off. Valid on orders above ₹30,000. Valid on first order.',
    admin_notes: 'High-value first-order offer.',
  },
  {
    code: 'DECOR1100',
    title: 'Flat ₹1,100 off on Decor',
    coupon_kind: 'decor_monthly',
    discount_type: 'flat',
    discount_value: 1100,
    min_order_value: 5000,
    service_filter: 'decor',
    terms_customer:
      'Flat ₹1,100 off on Decor services. Valid on orders above ₹5,000. All decor orders above ₹5,000 on the 11th of every month. For any user.',
    admin_notes: 'Decor monthly promo — activate manually on 11th.',
  },
  {
    code: 'ANY1000',
    title: 'Flat ₹1,000 off',
    coupon_kind: 'public',
    discount_type: 'flat',
    discount_value: 1000,
    min_order_value: 5000,
    terms_customer: 'Flat ₹1,000 off. Valid on orders above ₹5,000. For any user.',
    admin_notes: 'General public offer.',
  },
  {
    code: 'FESTIVE5',
    title: 'Festive sale — 5% off',
    coupon_kind: 'festive',
    discount_type: 'percentage',
    discount_value: 5,
    min_order_value: 5000,
    terms_customer: 'Festive sale — 5% off. Valid on orders above ₹5,000. For any user.',
    admin_notes: 'Festive campaign — activate dates manually.',
  },
  {
    code: 'SUMMER500',
    title: 'Summer sale — ₹500 off',
    coupon_kind: 'seasonal',
    discount_type: 'flat',
    discount_value: 500,
    min_order_value: 5000,
    terms_customer: 'Summer sale — Flat ₹500 off. Valid on orders above ₹5,000. For any user.',
    admin_notes: 'Summer campaign — activate dates manually.',
  },
  {
    code: 'DIWALI1000',
    title: 'Diwali sale — ₹1,000 off',
    coupon_kind: 'festive',
    discount_type: 'flat',
    discount_value: 1000,
    min_order_value: 5000,
    terms_customer:
      'Diwali sale — Flat ₹1,000 off. Valid on orders above ₹5,000. For any user.',
    admin_notes: 'Diwali campaign — activate dates manually.',
  },
]

export function getReferralTierByKey(key) {
  return REFERRAL_TIERS.find(tier => tier.key === key) ?? null
}

export function suggestReferralTier(bookingTotal) {
  const total = Number(bookingTotal ?? 0)
  if (!Number.isFinite(total) || total < 5000) return null

  return (
    REFERRAL_TIERS.find(tier => {
      const min = Number(tier.min_booking_total ?? 0)
      const max = tier.max_booking_total == null ? Infinity : Number(tier.max_booking_total)
      return total >= min && total <= max
    }) ?? null
  )
}
