import { strapiServerGet } from './strapi.js'

function toNumber(value) {
  if (value == null) return 0
  if (typeof value?.toNumber === 'function') return value.toNumber()

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundCurrency(value) {
  return Number(toNumber(value).toFixed(2))
}

function normalizePolicyData(data) {
  if (!data) return null

  return {
    within_16h: String(data.within_16h ?? '').trim(),
    between_16_48h: String(data.between_16_48h ?? '').trim(),
    after_48h: String(data.after_48h ?? '').trim(),
    refund_note: String(data.refund_note ?? '').trim(),
    material_policy: String(data.material_policy ?? '').trim(),
  }
}

function getElapsedHoursSinceBooking(booking) {
  const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null
  if (!createdAt || Number.isNaN(createdAt.getTime())) return 0

  const diffMs = Date.now() - createdAt.getTime()
  return Math.max(0, diffMs / (1000 * 60 * 60))
}

function getApplicablePolicyWindow(policy, elapsedHours) {
  if (elapsedHours <= 16) {
    return {
      key: 'within_16h',
      label: 'Within 16 Hours of Booking',
      text: policy?.within_16h ?? '',
      percentage: 100,
      basis: 'advance',
      defaultRuleText: '100% refund of the advance amount.',
    }
  }

  if (elapsedHours <= 48) {
    return {
      key: 'between_16_48h',
      label: 'Between 16 - 48 Hours',
      text: policy?.between_16_48h ?? '',
      percentage: 50,
      basis: 'advance',
      defaultRuleText: '50% refund of the advance amount.',
    }
  }

  return {
    key: 'after_48h',
    label: 'After 48 Hours',
    text: policy?.after_48h ?? '',
    percentage: 0,
    basis: 'none',
    defaultRuleText: 'Advance amount is non-refundable after 48 hours from booking.',
  }
}

function getSuccessfulPayments(payments = []) {
  return (Array.isArray(payments) ? payments : []).filter(payment => {
    const normalizedStatus = String(payment?.status ?? '')
      .trim()
      .toLowerCase()

    return !normalizedStatus || normalizedStatus === 'success'
  })
}

export async function getCancellationPolicyData() {
  try {
    const response = await strapiServerGet('/api/cancellation-policy?publicationState=preview')
    return normalizePolicyData(response?.data?.attributes ?? response?.data ?? null)
  } catch {
    return null
  }
}

export function calculateBookingRefundPreview(booking, policyData) {
  const normalizedPolicy = normalizePolicyData(policyData)
  const policy = normalizedPolicy ?? {
    within_16h: '',
    between_16_48h: '',
    after_48h: '',
    refund_note: '',
    material_policy: '',
  }
  const totalPaid = roundCurrency(
    getSuccessfulPayments(booking?.payments).reduce(
      (sum, payment) => sum + toNumber(payment.amount),
      0
    )
  )
  const advanceAmount = roundCurrency(booking?.advanceAmount)
  const refundableAdvanceBase = Math.min(totalPaid, advanceAmount)

  const elapsedHours = getElapsedHoursSinceBooking(booking)
  const window = getApplicablePolicyWindow(policy, elapsedHours)
  const parsedRule = {
    percentage: window.percentage,
    basis: window.basis,
    ruleText: window.defaultRuleText,
  }
  const refundableBaseAmount =
    parsedRule.basis === 'advance'
      ? refundableAdvanceBase
      : parsedRule.basis === 'paid'
        ? totalPaid
        : 0
  const refundableAmount = roundCurrency((refundableBaseAmount * parsedRule.percentage) / 100)

  return {
    policyAvailable: Boolean(normalizedPolicy),
    totalPaid,
    refundableAmount,
    refundableBaseAmount: roundCurrency(refundableBaseAmount),
    refundPercentage: parsedRule.percentage,
    refundBasis: parsedRule.basis,
    elapsedHoursSinceBooking: roundCurrency(elapsedHours),
    bookedAt: booking?.createdAt ?? null,
    windowKey: window.key,
    windowLabel: window.label,
    ruleText: parsedRule.ruleText,
    refundNote: policy.refund_note,
    materialPolicy: policy.material_policy,
    autoRefundEligible: refundableAmount > 0,
  }
}
