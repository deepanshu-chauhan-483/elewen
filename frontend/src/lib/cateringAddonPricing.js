import { parseGuestCountValue } from './cateringGuestDiscount'
import { getCateringSelectionsFromCartItem, isCateringCartItem } from './cateringCartPricing'

export function isCateringPerPersonAddon(addon) {
  if (!addon) return false
  const scope = String(addon?.addon_scope ?? '').toLowerCase()
  if (scope === 'catering') return true
  const unit = String(addon?.unit ?? '').toLowerCase()
  return unit.includes('pax') || unit.includes('person')
}

export function formatCateringAddonPerPersonPrice(addon) {
  const price = Number(addon?.price ?? 0)
  const maxPrice = Number(addon?.max_price ?? addon?.price_max ?? 0)

  if (price > 0 && maxPrice > price) {
    return `(₹${price.toLocaleString('en-IN')} – ₹${maxPrice.toLocaleString('en-IN')}/person)`
  }

  if (price > 0) {
    return `(₹${price.toLocaleString('en-IN')}/person)`
  }

  return ''
}

export function resolveCateringAddonLineTotal({ addon, guestCount, quantity = 1 }) {
  const perPerson = Number(addon?.price ?? 0)
  const guests = parseGuestCountValue(guestCount)

  if (!perPerson || !guests) return null

  const lineQty = Math.max(1, Number(quantity ?? 1))

  return {
    perPerson,
    guestCount: guests,
    packageQuantity: lineQty,
    lineTotal: perPerson * guests * lineQty,
  }
}

export function getGuestCountFromCartItem(item) {
  if (!item) return 0

  if (item?.itemType === 'addon') {
    return parseGuestCountValue(
      item?.selectedOptions?.['Guest count'] ?? item?.selectedOptions?.['Guest Count'] ?? ''
    )
  }

  if (isCateringCartItem(item)) {
    return getCateringSelectionsFromCartItem(item).guestCount
  }

  const slugs = Array.isArray(item?.packageData?.service_slugs)
    ? item.packageData.service_slugs
    : []
  if (slugs.some(slug => String(slug).toLowerCase().includes('catering'))) {
    return getCateringSelectionsFromCartItem(item).guestCount
  }

  return 0
}

/** Prefer guest count from catering package lines in the cart. */
export function getGuestCountFromCartItems(items = []) {
  for (const item of items) {
    if (item?.itemType === 'addon') continue
    const guests = getGuestCountFromCartItem(item)
    if (guests > 0) return guests
  }

  for (const item of items) {
    if (item?.itemType !== 'addon') continue
    const guests = getGuestCountFromCartItem(item)
    if (guests > 0) return guests
  }

  return 0
}

export function resolveCateringAddonCartItemTotal(item, cartItems = []) {
  if (item?.itemType !== 'addon') return null

  const perPerson = Number(item?.unitPrice ?? 0)
  if (!perPerson) return null

  let guests = parseGuestCountValue(
    item?.selectedOptions?.['Guest count'] ?? item?.selectedOptions?.['Guest Count'] ?? ''
  )

  if (!guests && item?.parentPackageId) {
    const parent = cartItems.find(
      entry =>
        entry?.itemType !== 'addon' && String(entry.packageId) === String(item.parentPackageId)
    )
    guests = getGuestCountFromCartItem(parent)
  }

  if (!guests) return null

  const lineQty = Math.max(1, Number(item?.quantity ?? 1))
  const lineTotal = perPerson * guests * lineQty

  return {
    perPerson,
    guestCount: guests,
    packageQuantity: lineQty,
    lineTotal,
  }
}
