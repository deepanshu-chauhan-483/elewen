export function normalizeCateringDiscountSettings(raw) {
  if (!raw || raw.is_active === false) return null

  const tiers = (
    Array.isArray(raw.tiers)
      ? raw.tiers
      : Array.isArray(raw.guest_discount_tiers)
        ? raw.guest_discount_tiers
        : []
  )
    .map(tier => ({
      label: String(tier?.label ?? '').trim(),
      min_pax: Number(tier?.min_pax ?? 0),
      max_pax: Number(tier?.max_pax ?? 0),
      discount_per_person: Number(tier?.discount_per_person ?? 0),
    }))
    .filter(
      tier => tier.min_pax > 0 && tier.max_pax >= tier.min_pax && tier.discount_per_person > 0
    )
    .sort((left, right) => left.min_pax - right.min_pax)

  if (!tiers.length) return null

  return {
    is_active: true,
    discount_title: String(raw.discount_title ?? 'Guest count discounts').trim(),
    discount_note: String(raw.discount_note ?? '').trim(),
    tiers,
  }
}

export function parseGuestCountValue(value) {
  const count = Number.parseInt(String(value ?? '').replace(/[^\d]/g, ''), 10)
  return Number.isFinite(count) && count > 0 ? count : 0
}

/**
 * When multiple tiers match (e.g. 100 guests), apply the highest per-person discount.
 */
export function resolveCateringGuestDiscount(guestCount, settings) {
  const normalized = normalizeCateringDiscountSettings(settings)
  if (!normalized) return null

  const count = parseGuestCountValue(guestCount)
  if (!count) return null

  const matching = normalized.tiers.filter(tier => count >= tier.min_pax && count <= tier.max_pax)

  if (!matching.length) return null

  return matching.reduce((best, tier) =>
    tier.discount_per_person > best.discount_per_person ? tier : best
  )
}

export function formatGuestDiscountLabel(tier) {
  if (!tier) return ''

  const amount = Number(tier.discount_per_person ?? 0)
  if (!amount) return ''

  const rangeLabel =
    tier.label?.trim() ||
    (tier.min_pax && tier.max_pax ? `${tier.min_pax}–${tier.max_pax} guests` : '')

  return rangeLabel
    ? `₹${amount.toLocaleString('en-IN')} off (${rangeLabel})`
    : `₹${amount.toLocaleString('en-IN')} off`
}
