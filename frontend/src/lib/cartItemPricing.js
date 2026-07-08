import { resolveCateringAddonCartItemTotal } from './cateringAddonPricing'
import { resolveCateringCartItemTotal } from './cateringCartPricing'
import { applyDeliveryChargesToBreakdown } from './deliveryChargePricing'

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
  const breakdownRows = getPackageBreakdownRows(item?.packageData)

  if (!breakdownRows.length) {
    return {
      rows: [],
      total: Number(item?.totalPrice ?? 0),
    }
  }

  const baseRows = breakdownRows.map(row => ({
    ...row,
    total: row.amount * quantity,
  }))

  if (deliveryCharge) {
    const adjusted = applyDeliveryChargesToBreakdown(breakdownRows, deliveryCharge, quantity)
    return {
      rows: adjusted.rows,
      total: adjusted.total,
      transportAddonTotal: adjusted.transportAddonTotal,
    }
  }

  const cartTotal = Number(item?.totalPrice ?? 0)
  const breakdownTotal = baseRows.reduce((sum, row) => sum + row.total, 0)

  return {
    rows: baseRows,
    total: cartTotal > 0 ? cartTotal : breakdownTotal,
  }
}
