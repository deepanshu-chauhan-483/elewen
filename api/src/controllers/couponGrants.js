import prisma from '../lib/prisma.js'
import { notify } from '../lib/notify.js'
import { suggestReferralTier, getReferralTierByKey } from '../lib/couponTemplates.js'
import { generateCouponCode, mapGrantForCustomer } from '../lib/coupons.js'

const REFERRAL_VALIDITY_DAYS = 60

async function buildUniqueReferralCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateCouponCode('REF')
    const existingGrant = await prisma.userCouponGrant.findUnique({ where: { code } })
    if (!existingGrant) return code
  }
  throw new Error('Could not generate a unique coupon code')
}

export async function getMyCoupons(req, res, next) {
  try {
    const userId = String(req.user.id)
    const now = new Date()

    const grants = await prisma.userCouponGrant.findMany({
      where: {
        userId,
        status: { in: ['active', 'used'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = grants.map(grant => {
      const item = mapGrantForCustomer(grant)
      if (grant.status === 'active' && grant.valid_to < now) {
        return { ...item, status: 'expired' }
      }
      return item
    })

    res.json({ coupons: mapped })
  } catch (err) {
    next(err)
  }
}

export async function getAdminBookingCouponSuggestion(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        status: true,
      },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const tier = suggestReferralTier(booking.totalPrice)
    const existingGrant = await prisma.userCouponGrant.findFirst({
      where: {
        sourceBookingId: booking.id,
        status: { in: ['active', 'used'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      bookingId: booking.id,
      userId: booking.userId,
      bookingTotal: Number(booking.totalPrice),
      suggestedTier: tier,
      existingGrant: existingGrant ? mapGrantForCustomer(existingGrant) : null,
    })
  } catch (err) {
    next(err)
  }
}

export async function sendAdminReferralCoupon(req, res, next) {
  try {
    const bookingId = req.params.id
    const adminId = String(req.user.id)
    const tierKey = String(req.body?.tierKey ?? '').trim()
    const note = String(req.body?.note ?? '').trim()

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        status: true,
      },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (!['post_event', 'completed'].includes(String(booking.status))) {
      return res.status(400).json({
        error: 'Referral coupons can only be sent after the event (post_event or completed).',
      })
    }

    const existingGrant = await prisma.userCouponGrant.findFirst({
      where: {
        sourceBookingId: booking.id,
        status: { in: ['active', 'used'] },
      },
    })

    if (existingGrant) {
      return res.status(400).json({
        error: 'A referral coupon has already been sent for this booking.',
        grant: mapGrantForCustomer(existingGrant),
      })
    }

    const suggested = suggestReferralTier(booking.totalPrice)
    const tier = tierKey ? getReferralTierByKey(tierKey) : suggested

    if (!tier) {
      return res.status(400).json({
        error: 'No referral tier matches this booking total. Choose a tier manually.',
      })
    }

    const code = await buildUniqueReferralCode()
    const validFrom = new Date()
    const validTo = new Date(validFrom)
    validTo.setDate(validTo.getDate() + (tier.validity_days ?? REFERRAL_VALIDITY_DAYS))

    const grant = await prisma.userCouponGrant.create({
      data: {
        userId: String(booking.userId),
        assignedByAdminId: adminId,
        sourceBookingId: booking.id,
        templateKey: tier.key,
        code,
        title: tier.title,
        discount_type: tier.discount_type,
        discount_value: tier.discount_value,
        min_order_value: tier.min_order_value ?? 5000,
        max_order_value: tier.max_order_value ?? null,
        max_discount_amount: tier.max_discount_amount ?? null,
        terms_customer: tier.terms_customer,
        first_order_only: false,
        service_filter: 'all',
        is_shareable: tier.is_shareable !== false,
        valid_from: validFrom,
        valid_to: validTo,
        status: 'active',
        sent_at: validFrom,
      },
    })

    const discountLabel =
      tier.discount_type === 'percentage'
        ? `${tier.discount_value}% off`
        : `Rs ${Number(tier.discount_value).toLocaleString('en-IN')} off`

    await notify(String(booking.userId), {
      type: 'system',
      title: 'You received a referral coupon',
      message: `Use code ${code} for ${discountLabel}. Valid till ${validTo.toLocaleDateString('en-IN')}.`,
      linkUrl: '/dashboard/profile#my-coupons',
      emailTemplate: 'coupon_granted',
      emailData: {
        code,
        title: tier.title,
        discountLabel,
        terms: tier.terms_customer,
        validTo: validTo.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        note,
      },
    })

    res.status(201).json({
      grant: mapGrantForCustomer(grant),
      tier,
    })
  } catch (err) {
    next(err)
  }
}