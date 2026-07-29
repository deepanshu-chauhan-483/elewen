import { randomBytes } from 'crypto'
import prisma from './prisma.js'
import { strapiGet } from './strapi.js'

const ACTIVE_BOOKING_STATUSES = [
  'confirmed',
  'info_collection',
  'planning',
  'pre_event',
  'execution',
  'post_event',
  'completed',
]

export function normalizeStrapiCoupon(raw) {
  if (!raw) return null
  const c = raw.attributes ?? raw
  return {
    id: String(raw.id ?? c.id ?? ''),
    code: String(c.code ?? '').toUpperCase(),
    title: c.title ?? '',
    coupon_kind: c.coupon_kind ?? 'public',
    discount_type: c.discount_type ?? 'flat',
    discount_value: Number(c.discount_value ?? 0),
    min_order_value: Number(c.min_order_value ?? 0),
    max_order_value: c.max_order_value != null ? Number(c.max_order_value) : null,
    max_discount_amount:
      c.max_discount_amount != null ? Number(c.max_discount_amount) : null,
    first_order_only: Boolean(c.first_order_only),
    service_filter: c.service_filter ?? 'all',
    terms_customer: c.terms_customer ?? '',
    is_active: Boolean(c.is_active),
    max_uses: c.max_uses ?? null,
    used_count: Number(c.used_count ?? 0),
    valid_from: c.valid_from ?? null,
    valid_to: c.valid_to ?? null,
    is_user_specific: Boolean(c.is_user_specific),
    is_shareable: c.is_shareable !== false,
    source: 'strapi',
  }
}

export function mapGrantRecord(grant) {
  if (!grant) return null
  return {
    id: grant.id,
    code: String(grant.code ?? '').toUpperCase(),
    title: grant.title ?? '',
    coupon_kind: grant.templateKey ?? 'referral',
    discount_type: grant.discount_type ?? 'flat',
    discount_value: Number(grant.discount_value ?? 0),
    min_order_value: Number(grant.min_order_value ?? 0),
    max_order_value: grant.max_order_value != null ? Number(grant.max_order_value) : null,
    max_discount_amount:
      grant.max_discount_amount != null ? Number(grant.max_discount_amount) : null,
    first_order_only: Boolean(grant.first_order_only),
    service_filter: grant.service_filter ?? 'all',
    terms_customer: grant.terms_customer ?? '',
    is_active: grant.status === 'active',
    valid_from: grant.valid_from,
    valid_to: grant.valid_to,
    is_user_specific: true,
    is_shareable: Boolean(grant.is_shareable),
    ownerUserId: grant.userId,
    status: grant.status,
    source: 'grant',
    grantId: grant.id,
  }
}

export function computeDiscountAmount(coupon, subtotal) {
  const amount = Number(subtotal ?? 0)
  if (!coupon || amount <= 0) return 0

  let discount = 0
  if (coupon.discount_type === 'percentage') {
    discount = (amount * Number(coupon.discount_value)) / 100
    if (coupon.max_discount_amount != null) {
      discount = Math.min(discount, Number(coupon.max_discount_amount))
    }
  } else {
    discount = Number(coupon.discount_value)
  }

  return Math.min(Math.max(0, discount), amount)
}

export async function userHasPriorBooking(userId) {
  if (!userId) return false
  const count = await prisma.booking.count({
    where: {
      userId: String(userId),
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
  })
  return count > 0
}

export async function findGrantByCode(code) {
  const normalized = String(code ?? '')
    .trim()
    .toUpperCase()
  if (!normalized) return null

  const grant = await prisma.userCouponGrant.findUnique({
    where: { code: normalized },
  })
  return grant ? mapGrantRecord(grant) : null
}

export async function findStrapiCouponByCode(code) {
  const normalized = String(code ?? '')
    .trim()
    .toUpperCase()
  if (!normalized) return null

  const { data: coupons } = await strapiGet('/coupons', {
    'filters[code][$eq]': normalized,
    'filters[is_active][$eq]': true,
  })
  return normalizeStrapiCoupon(coupons?.[0])
}

export async function findStrapiCouponById(couponId) {
  if (!couponId) return null
  const { data: coupons } = await strapiGet('/coupons', {
    'filters[id][$eq]': couponId,
  })
  const coupon = normalizeStrapiCoupon(coupons?.[0])
  return coupon?.is_active ? coupon : null
}

export async function findGrantById(grantId) {
  if (!grantId) return null
  const grant = await prisma.userCouponGrant.findUnique({ where: { id: grantId } })
  return grant ? mapGrantRecord(grant) : null
}

function validateDateWindow(coupon, now = new Date()) {
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, error: 'This coupon is not yet active.' }
  }
  if (coupon.valid_to && new Date(coupon.valid_to) < now) {
    return { valid: false, error: 'This coupon has expired.' }
  }
  return { valid: true }
}

function validateOrderBounds(coupon, subtotal) {
  const amount = Number(subtotal ?? 0)
  if (coupon.min_order_value > 0 && amount < coupon.min_order_value) {
    return {
      valid: false,
      error: `Minimum order of Rs${coupon.min_order_value.toLocaleString('en-IN')} required for this coupon.`,
    }
  }
  if (coupon.max_order_value != null && amount > coupon.max_order_value) {
    return {
      valid: false,
      error: `This coupon is valid on orders up to Rs${coupon.max_order_value.toLocaleString('en-IN')} only.`,
    }
  }
  return { valid: true }
}

export async function validateGrantForUser({ grant, userId, subtotal }) {
  if (!grant) {
    return { valid: false, error: 'Invalid or inactive coupon code' }
  }

  if (grant.status === 'used') {
    return { valid: false, error: 'You have already used this coupon.' }
  }

  if (grant.status !== 'active') {
    return { valid: false, error: 'Invalid or inactive coupon code' }
  }

  const dateCheck = validateDateWindow(grant)
  if (!dateCheck.valid) return dateCheck

  const orderCheck = validateOrderBounds(grant, subtotal)
  if (!orderCheck.valid) return orderCheck

  if (grant.first_order_only && (await userHasPriorBooking(userId))) {
    return { valid: false, error: 'This coupon is valid on first order only.' }
  }

  // Personal grants are always owner-only — even if someone else knows the code.
  if (String(grant.ownerUserId) !== String(userId)) {
    return { valid: false, error: 'This coupon is not assigned to your account.' }
  }

  return { valid: true, coupon: grant }
}

export async function validateStrapiCouponForUser({ coupon, userId, subtotal }) {
  if (!coupon?.is_active) {
    return { valid: false, error: 'Invalid or inactive coupon code' }
  }

  const dateCheck = validateDateWindow(coupon)
  if (!dateCheck.valid) return dateCheck

  if (coupon.max_uses !== null && Number(coupon.used_count ?? 0) >= Number(coupon.max_uses)) {
    return { valid: false, error: 'This coupon has reached its usage limit' }
  }

  const orderCheck = validateOrderBounds(coupon, subtotal)
  if (!orderCheck.valid) return orderCheck

  if (coupon.first_order_only && (await userHasPriorBooking(userId))) {
    return { valid: false, error: 'This coupon is valid on first order only.' }
  }

  if (userId) {
    const existingUsage = await prisma.couponUsage.findFirst({
      where: {
        couponId: String(coupon.id),
        userId: String(userId),
      },
      select: { id: true },
    })
    if (existingUsage) {
      return { valid: false, error: 'You have already used this coupon' }
    }
  }

  return { valid: true, coupon }
}

export async function resolveCouponByCode(code, { userId, subtotal }) {
  const grant = await findGrantByCode(code)
  if (grant) {
    const result = await validateGrantForUser({ grant, userId, subtotal })
    if (!result.valid) return result
    return {
      valid: true,
      coupon: result.coupon,
      couponId: null,
      couponGrantId: grant.grantId,
      discount: computeDiscountAmount(result.coupon, subtotal),
    }
  }

  const strapiCoupon = await findStrapiCouponByCode(code)
  if (!strapiCoupon) {
    return { valid: false, error: 'Invalid or inactive coupon code' }
  }

  const result = await validateStrapiCouponForUser({ coupon: strapiCoupon, userId, subtotal })
  if (!result.valid) return result

  return {
    valid: true,
    coupon: result.coupon,
    couponId: String(strapiCoupon.id),
    couponGrantId: null,
    discount: computeDiscountAmount(result.coupon, subtotal),
  }
}

export async function resolveAppliedCoupon({ couponId, couponGrantId, userId, subtotal }) {
  if (couponGrantId) {
    const grant = await findGrantById(couponGrantId)
    const result = await validateGrantForUser({ grant, userId, subtotal })
    if (!result.valid) return { valid: false, discount: 0, couponId: null, couponGrantId: null }
    return {
      valid: true,
      discount: computeDiscountAmount(result.coupon, subtotal),
      couponId: null,
      couponGrantId,
      coupon: result.coupon,
    }
  }

  if (couponId) {
    const coupon = await findStrapiCouponById(couponId)
    const result = await validateStrapiCouponForUser({ coupon, userId, subtotal })
    if (!result.valid) return { valid: false, discount: 0, couponId: null, couponGrantId: null }
    return {
      valid: true,
      discount: computeDiscountAmount(result.coupon, subtotal),
      couponId: String(coupon.id),
      couponGrantId: null,
      coupon: result.coupon,
    }
  }

  return { valid: false, discount: 0, couponId: null, couponGrantId: null }
}

export function generateCouponCode(prefix = 'REF') {
  const token = randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${token}`
}

export async function buildUniqueGrantCode(prefix = 'ELE') {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateCouponCode(prefix)
    const existingGrant = await prisma.userCouponGrant.findUnique({ where: { code } })
    if (!existingGrant) return code
  }
  throw new Error('Could not generate a unique coupon code')
}

export function mapGrantForCustomer(grant) {
  return {
    id: grant.id,
    code: grant.code,
    title: grant.title,
    discount_type: grant.discount_type,
    discount_value: Number(grant.discount_value),
    min_order_value: Number(grant.min_order_value ?? 0),
    terms_customer: grant.terms_customer ?? '',
    valid_from: grant.valid_from,
    valid_to: grant.valid_to,
    status: grant.status,
    sent_at: grant.sent_at,
    is_shareable: grant.is_shareable,
  }
}
