export const LABOUR_TRANSPORT_BASES = [600, 1200, 3200]

export function normalizePincode(value = '') {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
}

export function isLabourTransportLabel(label = '', amount = null) {
  const normalized = String(label).toLowerCase().replace(/\s+/g, ' ')
  const hasTransport = normalized.includes('transport')
  const hasLabour = normalized.includes('labour') || normalized.includes('labor')

  if (hasLabour && hasTransport) return true

  // ponytail: proposal sheets often label the tier row "Transport" with base 600/1200/3200
  if (hasTransport && resolveLabourTransportBase(amount) != null) return true

  return false
}

export function resolveLabourTransportBase(amount) {
  const value = Number(amount)
  return LABOUR_TRANSPORT_BASES.includes(value) ? value : null
}

export function normalizeDeliveryCharge(row = {}) {
  const pincode = normalizePincode(row?.pincode)
  if (!pincode) return null

  return {
    pincode,
    location: String(row?.location ?? '').trim(),
    addon600: Number(row?.addon_600 ?? row?.addon600 ?? 0) || 0,
    addon1200: Number(row?.addon_1200 ?? row?.addon1200 ?? 0) || 0,
    addon3200: Number(row?.addon_3200 ?? row?.addon3200 ?? 0) || 0,
    isActive: row?.is_active !== false,
  }
}

export function getDeliveryAddonForBase(deliveryCharge, base) {
  if (!deliveryCharge || !base) return 0

  if (base === 600) return deliveryCharge.addon600
  if (base === 1200) return deliveryCharge.addon1200
  if (base === 3200) return deliveryCharge.addon3200

  return 0
}

export function applyDeliveryChargesToBreakdown(
  breakdownRows = [],
  deliveryCharge = null,
  quantity = 1
) {
  const safeQuantity = Math.max(1, Number(quantity ?? 1))
  let transportAddonPerUnit = 0

  const rows = (Array.isArray(breakdownRows) ? breakdownRows : []).map(row => {
    if (!isLabourTransportLabel(row?.label, row?.amount)) {
      return {
        ...row,
        total: Number(row?.amount ?? 0) * safeQuantity,
      }
    }

    const base = resolveLabourTransportBase(row?.amount)
    if (!base) {
      return {
        ...row,
        total: Number(row?.amount ?? 0) * safeQuantity,
      }
    }

    const transportAddon = getDeliveryAddonForBase(deliveryCharge, base)
    transportAddonPerUnit = transportAddon
    const amount = base + transportAddon

    return {
      ...row,
      amount,
      baseAmount: base,
      transportAddon,
      total: amount * safeQuantity,
    }
  })

  const total = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0)

  return {
    rows,
    transportAddonPerUnit,
    transportAddonTotal: transportAddonPerUnit * safeQuantity,
    total,
  }
}

// ponytail: one runnable check — fails if tier mapping for 110015 regresses
if (import.meta.env?.DEV) {
  const sample = normalizeDeliveryCharge({
    pincode: '110015',
    addon_600: 300,
    addon_1200: 300,
    addon_3200: 200,
  })
  const at600 = applyDeliveryChargesToBreakdown(
    [{ label: 'Labour & Transport', amount: 600 }],
    sample,
    1
  )
  const at3200 = applyDeliveryChargesToBreakdown(
    [{ label: 'Labour & Transport', amount: 3200 }],
    sample,
    1
  )
  const transportOnly = applyDeliveryChargesToBreakdown(
    [{ label: 'Transport', amount: 3200 }],
    sample,
    1
  )
  console.assert(at600.total === 900, '110015 @600 base should total 900')
  console.assert(at3200.total === 3400, '110015 @3200 base should total 3400')
  console.assert(transportOnly.total === 3400, '110015 Transport@3200 should total 3400')
}
