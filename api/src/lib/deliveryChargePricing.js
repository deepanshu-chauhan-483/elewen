import { strapiGet } from './strapi.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FALLBACK_JSON_PATH = path.resolve(
  __dirname,
  '../../../frontend/src/data/deliveryCharges.json'
)

let fallbackDeliveryChargeMap = null

function getFallbackDeliveryChargeMap() {
  if (fallbackDeliveryChargeMap) {
    return fallbackDeliveryChargeMap
  }

  try {
    const raw = fs.readFileSync(FALLBACK_JSON_PATH, 'utf8')
    const rows = JSON.parse(raw)
    fallbackDeliveryChargeMap = new Map(
      (Array.isArray(rows) ? rows : [])
        .map(row => normalizeDeliveryCharge(row))
        .filter(Boolean)
        .map(row => [row.pincode, row])
    )
  } catch {
    fallbackDeliveryChargeMap = new Map()
  }

  return fallbackDeliveryChargeMap
}
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

function normalizeSectionItems(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function getBreakdownLabel(entry) {
  return (
    entry?.label ??
    entry?.title ??
    entry?.name ??
    entry?.text ??
    entry?.description ??
    entry?.item ??
    ''
  )
}

function getBreakdownAmount(entry) {
  const amountValue =
    entry?.amount ??
    entry?.price ??
    entry?.value ??
    entry?.cost ??
    entry?.total ??
    entry?.rate ??
    entry?.base_price

  const amount = Number(String(amountValue ?? '').replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

export function getPackageBreakdownRows(pkg) {
  const sections = normalizeSectionItems(pkg?.packages)

  return sections
    .flatMap(section => (Array.isArray(section?.price_breakdown) ? section.price_breakdown : []))
    .map(entry => {
      const label = String(getBreakdownLabel(entry) ?? '').trim()
      const amount = getBreakdownAmount(entry)
      return label && amount > 0 ? { label, amount } : null
    })
    .filter(Boolean)
}

const PACKAGE_POPULATE = {
  'populate[packages][on][package.decorpackages][populate][price_breakdown]': 'true',
  'populate[packages][on][package.bartendingpackage][populate][price_breakdown]': 'true',
  'populate[packages][on][package.cateringpackage][populate][price_breakdown]': 'true',
  'populate[packages][on][package.sheeshapackage][populate][price_breakdown]': 'true',
}

async function resolvePackageById(packageId) {
  const raw = String(packageId ?? '').trim()
  if (!raw) return null

  const { data: byId } = await strapiGet('/packages', {
    'filters[id][$eq]': raw,
    ...PACKAGE_POPULATE,
  })
  if (byId?.[0]) return byId[0]

  const { data: byDocumentId } = await strapiGet('/packages', {
    'filters[documentId][$eq]': raw,
    ...PACKAGE_POPULATE,
  })
  return byDocumentId?.[0] ?? null
}

export async function fetchDeliveryChargeByPincode(pincode = '') {
  const normalizedPincode = normalizePincode(pincode)
  if (!normalizedPincode) return null

  try {
    const { data } = await strapiGet('/delivery-charges', {
      'filters[pincode][$eq]': normalizedPincode,
      'filters[is_active][$eq]': 'true',
      'pagination[pageSize]': 1,
    })

    const fromStrapi = normalizeDeliveryCharge(data?.[0])
    if (fromStrapi) {
      return fromStrapi
    }
  } catch {
    // ponytail: use bundled CSV export when Strapi is empty or unreachable
  }

  return getFallbackDeliveryChargeMap().get(normalizedPincode) ?? null
}

export async function computeCartItemsWithDeliveryCharges(items = [], pincode = '') {
  const deliveryCharge = await fetchDeliveryChargeByPincode(pincode)
  const adjustedItems = []
  let subtotal = 0

  for (const item of items) {
    if (item?.addonId) {
      const totalPrice = Number(item.totalPrice ?? 0)
      adjustedItems.push({ ...item, totalPrice })
      subtotal += totalPrice
      continue
    }

    const pkg = await resolvePackageById(item.packageId)
    const quantity = Math.max(1, Number(item.quantity ?? 1))
    const breakdownRows = getPackageBreakdownRows(pkg)

    if (!deliveryCharge || !breakdownRows.length) {
      const totalPrice = Number(item.totalPrice ?? 0)
      adjustedItems.push({ ...item, totalPrice })
      subtotal += totalPrice
      continue
    }

    const adjusted = applyDeliveryChargesToBreakdown(breakdownRows, deliveryCharge, quantity)
    const totalPrice = adjusted.total

    adjustedItems.push({
      ...item,
      totalPrice,
      transportAddonTotal: adjusted.transportAddonTotal,
    })
    subtotal += totalPrice
  }

  return {
    deliveryCharge,
    adjustedItems,
    subtotal,
  }
}
