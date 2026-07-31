/**
 * Package-level sale discount (Strapi fields on Package).
 * Independent of cart coupons / Share Banner.
 */

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function parseDateOnly(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isPackageDiscountActive(pkg, now = new Date()) {
  if (pkg?.discount_active !== true) return false

  const value = toNumber(pkg.discount_value)
  if (value <= 0) return false

  const from = parseDateOnly(pkg.discount_valid_from)
  const to = parseDateOnly(pkg.discount_valid_to)
  if (from && now < from) return false
  if (to) {
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    if (now > end) return false
  }

  const type = String(pkg.discount_type ?? 'percentage').toLowerCase()
  return type === 'percentage' || type === 'flat'
}

export function computePackageDiscountAmount(baseAmount, pkg) {
  const amount = toNumber(baseAmount)
  if (amount <= 0 || !isPackageDiscountActive(pkg)) return 0

  const type = String(pkg.discount_type ?? 'percentage').toLowerCase()
  const value = toNumber(pkg.discount_value)

  if (type === 'percentage') {
    return Math.min(amount, (amount * value) / 100)
  }
  return Math.min(amount, value)
}

export function applyPackageDiscount(baseAmount, pkg) {
  const amount = toNumber(baseAmount)
  const discount = computePackageDiscountAmount(amount, pkg)
  return Math.max(0, Number((amount - discount).toFixed(2)))
}

export function formatInrAmount(amount) {
  const n = toNumber(amount)
  if (n <= 0) return ''
  return `₹${n.toLocaleString('en-IN')}`
}

export function resolvePackageDiscountBadge(pkg) {
  const custom = String(pkg?.discount_badge ?? '').trim()
  if (custom) return custom
  if (!isPackageDiscountActive(pkg)) return ''

  const value = toNumber(pkg.discount_value)
  const type = String(pkg.discount_type ?? 'percentage').toLowerCase()
  if (type === 'percentage') return `${value}% OFF`
  return `₹${value.toLocaleString('en-IN')} OFF`
}

export function resolvePackageSalePricing(pkg, baseAmount = null) {
  const base =
    baseAmount != null
      ? toNumber(baseAmount)
      : toNumber(pkg?.base_price ?? pkg?.starting_price ?? pkg?.price_from ?? 0)

  if (base <= 0) {
    return {
      basePrice: 0,
      salePrice: 0,
      hasDiscount: false,
      discountAmount: 0,
      badge: '',
      originalLabel: '',
      saleLabel: '',
    }
  }

  const discountAmount = computePackageDiscountAmount(base, pkg)
  const salePrice = Math.max(0, Number((base - discountAmount).toFixed(2)))
  const hasDiscount = discountAmount > 0 && salePrice < base

  return {
    basePrice: base,
    salePrice: hasDiscount ? salePrice : base,
    hasDiscount,
    discountAmount,
    badge: hasDiscount ? resolvePackageDiscountBadge(pkg) : '',
    originalLabel: hasDiscount ? formatInrAmount(base) : '',
    saleLabel: formatInrAmount(hasDiscount ? salePrice : base),
  }
}
