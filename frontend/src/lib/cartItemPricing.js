import { resolveCateringAddonCartItemTotal } from './cateringAddonPricing'
import { resolveCateringCartItemTotal } from './cateringCartPricing'
import {
  applyDeliveryChargesToBreakdown,
  isLabourTransportLabel,
} from './deliveryChargePricing'

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

function getPackageBreakdownRows(pkg) {
  return (Array.isArray(pkg?.detail_price_breakdown) ? pkg.detail_price_breakdown : [])
    .map(entry => {
      const label = String(getBreakdownLabel(entry) ?? '').trim()
      const amount = getBreakdownAmount(entry)
      return label && amount > 0 ? { label, amount } : null
    })
    .filter(Boolean)
}

function isPackagePriceRollupLabel(label = '') {
  return /package\s*price/i.test(String(label))
}

function isPlatformFeeLabel(label = '') {
  const normalized = String(label).toLowerCase()
  return normalized.includes('platform') || /\bfee\b/.test(normalized)
}

/**
 * When seed lists component lines AND a "Package Price" rollup, summing all rows
 * double-counts. Prefer rollup + transport + platform for display.
 */
export function selectDisplayBreakdownRows(rows = []) {
  const list = Array.isArray(rows) ? rows : []
  const hasPackagePrice = list.some(row => isPackagePriceRollupLabel(row?.label))
  if (!hasPackagePrice) return list

  return list.filter(row => {
    if (isPackagePriceRollupLabel(row?.label)) return true
    if (isLabourTransportLabel(row?.label, row?.amount ?? row?.baseAmount)) return true
    if (isPlatformFeeLabel(row?.label)) return true
    return false
  })
}

export function aggregateAppliedGuestDiscounts(itemSummaries = []) {
  const tierMap = new Map()

  for (const { item, summary } of itemSummaries) {
    const pricing = summary?.cateringPricing
    const discountAmount = Number(pricing?.totalDiscountAmount ?? 0)

    if (!discountAmount || !pricing?.tier) continue

    const tierLabel =
      pricing.tier.label?.trim() || `${pricing.tier.min_pax}–${pricing.tier.max_pax} guests`
    const tierKey = `${pricing.tier.min_pax}-${pricing.tier.max_pax}-${pricing.discountPerPerson}`
    const packageTitle = item?.displayTitle || item?.packageData?.title || 'Catering package'

    const existing = tierMap.get(tierKey) ?? {
      tierKey,
      tierLabel,
      discountPerPerson: pricing.discountPerPerson,
      packageCount: 0,
      totalAmount: 0,
      packages: [],
    }

    tierMap.set(tierKey, {
      ...existing,
      packageCount: existing.packageCount + 1,
      totalAmount: existing.totalAmount + discountAmount,
      packages: [
        ...existing.packages,
        {
          id: item?.id,
          title: packageTitle,
          guestCount: pricing.guestCount,
          amount: discountAmount,
        },
      ],
    })
  }

  const discounts = Array.from(tierMap.values()).sort((left, right) =>
    left.tierLabel.localeCompare(right.tierLabel)
  )

  const totalGuestDiscount = discounts.reduce((sum, entry) => sum + entry.totalAmount, 0)
  const grossSubtotal = itemSummaries.reduce((sum, { summary }) => {
    const gross = Number(summary?.cateringPricing?.grossLineTotal ?? summary?.total ?? 0)
    return sum + gross
  }, 0)

  return {
    discounts,
    totalGuestDiscount,
    discountCount: discounts.reduce((sum, entry) => sum + entry.packageCount, 0),
    grossSubtotalBeforeGuestDiscounts: grossSubtotal,
  }
}

export function aggregateTransportAddonTotal(itemSummaries = []) {
  return itemSummaries.reduce(
    (sum, { summary }) => sum + Number(summary?.transportAddonTotal ?? 0),
    0
  )
}

export function getCartItemSummary(
  item,
  { cateringDiscountSettings = null, cartItems = [], deliveryCharge = null } = {}
) {
  if (item?.itemType === 'addon') {
    const cateringAddonPricing = resolveCateringAddonCartItemTotal(item, cartItems)
    if (cateringAddonPricing) {
      return {
        rows: [],
        total: cateringAddonPricing.lineTotal,
        cateringAddonPricing,
      }
    }

    return {
      rows: [],
      total: Number(item?.totalPrice ?? 0),
    }
  }

  const cateringPricing = resolveCateringCartItemTotal(item, cateringDiscountSettings)
  if (cateringPricing) {
    return {
      rows: [],
      total: cateringPricing.lineTotal,
      cateringPricing,
    }
  }

  const quantity = Math.max(1, Number(item?.quantity ?? 1))
  const cartTotal = Number(item?.totalPrice ?? 0)
  const breakdownRows = getPackageBreakdownRows(item?.packageData)
  const displaySourceRows = selectDisplayBreakdownRows(breakdownRows)

  if (!displaySourceRows.length) {
    return {
      rows: [],
      total: cartTotal,
    }
  }

  if (deliveryCharge) {
    const adjusted = applyDeliveryChargesToBreakdown(displaySourceRows, deliveryCharge, quantity)
    const transportAddonTotal = Number(adjusted.transportAddonTotal ?? 0)
    // Cart line already includes package base (sale + surcharges + included transport).
    // Only add the pincode transport-tier delta — never re-sum breakdown components.
    return {
      rows: adjusted.rows,
      total: cartTotal + transportAddonTotal,
      transportAddonTotal,
    }
  }

  const baseRows = displaySourceRows.map(row => ({
    ...row,
    total: row.amount * quantity,
  }))

  return {
    rows: baseRows,
    total: cartTotal,
  }
}

// ponytail: Raise the Bar–style seed must not inflate cart total via component+rollup sum
if (import.meta.env?.DEV) {
  const sampleItem = {
    quantity: 1,
    totalPrice: 30200,
    packageData: {
      detail_price_breakdown: [
        { label: 'Fancy Bar (cart)', amount: 7000 },
        { label: '20 fancy chairs', amount: 10000 },
        { label: 'Package Price', amount: 26500 },
        { label: 'Transport and Labour', amount: 3200 },
        { label: 'Platform fee', amount: 500 },
      ],
    },
  }
  const summary = getCartItemSummary(sampleItem)
  console.assert(summary.total === 30200, 'cart summary must use cart totalPrice, not breakdown sum')
  console.assert(
    summary.rows.length === 3,
    'display rows should drop component lines when Package Price exists'
  )
}
