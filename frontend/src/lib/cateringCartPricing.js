import { getCateringDetailSection, getCateringPricePerPerson } from './cateringPricing'
import {
  normalizeCateringDiscountSettings,
  parseGuestCountValue,
  resolveCateringGuestDiscount,
} from './cateringGuestDiscount'

export function isCateringCartItem(item) {
  if (item?.itemType === 'addon') return false

  const slugs = Array.isArray(item?.packageData?.service_slugs)
    ? item.packageData.service_slugs
    : []
  return slugs.some(slug => String(slug).toLowerCase().includes('catering'))
}

export function getCateringSelectionsFromCartItem(item) {
  const options = item?.selectedOptions ?? {}

  return {
    guestCount: parseGuestCountValue(options['Guest count'] ?? options['Guest Count'] ?? ''),
    vegPreference: String(options.Veg ?? options.veg ?? '').trim(),
  }
}

export function buildCateringCartLineTotal({
  packageData,
  selectedOptions = {},
  packageQuantity = 1,
  discountSettings = null,
  fallbackUnitPrice = 0,
}) {
  const pkg = packageData
  if (!pkg) return null

  const cateringSection = getCateringDetailSection(pkg)
  const { guestCount, vegPreference } = getCateringSelectionsFromCartItem({
    selectedOptions,
  })

  const guests = guestCount > 0 ? guestCount : 0
  if (!guests) return null

  const perPersonBase = getCateringPricePerPerson(
    cateringSection,
    vegPreference,
    pkg?.base_price ?? fallbackUnitPrice
  )

  if (!perPersonBase) return null

  const settings =
    discountSettings ?? normalizeCateringDiscountSettings(pkg?.catering_guest_discounts) ?? null

  const tier = resolveCateringGuestDiscount(guests, settings)
  const discountPerPerson = Number(tier?.discount_per_person ?? 0)
  const perPersonNet = Math.max(0, perPersonBase - discountPerPerson)
  const lineQty = Math.max(1, Number(packageQuantity ?? 1))
  const grossLineTotal = perPersonBase * guests * lineQty
  const totalDiscountAmount = discountPerPerson * guests * lineQty
  const lineTotal = perPersonNet * guests * lineQty

  return {
    guestCount: guests,
    perPersonBase,
    discountPerPerson,
    perPersonNet,
    packageQuantity: lineQty,
    grossLineTotal,
    totalDiscountAmount,
    lineTotal,
    tier,
  }
}

export function resolveCateringCartItemTotal(item, discountSettings = null) {
  if (!isCateringCartItem(item)) return null

  return buildCateringCartLineTotal({
    packageData: item.packageData,
    selectedOptions: item.selectedOptions ?? {},
    packageQuantity: item.quantity ?? 1,
    discountSettings,
    fallbackUnitPrice: Number(item?.unitPrice ?? 0),
  })
}
