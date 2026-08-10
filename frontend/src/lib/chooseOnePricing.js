function parseChoiceAmount(value) {
  if (value == null || value === '') {
    return null
  }

  const numericValue = Number(String(value).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null
}

export function getChoiceItemAmount(item) {
  if (!item || typeof item === 'string') {
    return null
  }

  return parseChoiceAmount(item.priceAmount ?? item.base_price ?? item.price)
}

export function getChoiceSurcharge(item) {
  if (!item || typeof item === 'string') {
    return null
  }

  return parseChoiceAmount(item.priceSurcharge ?? item.price_surcharge)
}

/**
 * Prefer CMS price_surcharge. For Signature Essentials 3 only, fall back when CMS
 * still has null: Fancy Bar and the first / bows backdrop option → ₹5,000.
 */
export function resolveDecorOptionSurcharge(
  inclusion,
  { packageSlug = '', backdropOptionIndex = null } = {}
) {
  const fromCms = parseChoiceAmount(inclusion?.price_surcharge ?? inclusion?.priceSurcharge)
  if (fromCms != null) return fromCms

  if (String(packageSlug).trim() !== 'signature-essentials-3') return null
  if (!inclusion?.is_choice_group) return null

  const text = String(inclusion?.text ?? '')
    .trim()
    .toLowerCase()
  const key = String(inclusion?.choice_group_key ?? '').toLowerCase()

  if (key.includes('se3-bar') && text === 'fancy bar') return 5000

  if (key.includes('se3-backdrop')) {
    if (text.includes('single panel') || text.includes('backdrop with bows')) return 5000
    if (backdropOptionIndex === 0) return 5000
  }

  return null
}

export function isChooseOneSectionTitle(title = '') {
  const normalizedTitle = String(title).trim()
  if (!normalizedTitle) {
    return false
  }

  if (/choose\s*(?:[02-9]|\d{2,})/i.test(normalizedTitle)) {
    return false
  }

  return /choose\s*1\b/i.test(normalizedTitle) || /\(choose\s*1\)/i.test(normalizedTitle)
}

export function sectionHasVariableChoicePrices(items = []) {
  const amounts = (Array.isArray(items) ? items : [])
    .map(getChoiceItemAmount)
    .filter(amount => amount != null)

  return new Set(amounts).size > 1
}

export function sectionHasChoiceSurcharges(section) {
  return (Array.isArray(section?.items) ? section.items : []).some(
    item => getChoiceSurcharge(item) != null
  )
}

export function shouldShowChoicePrices(section) {
  return (
    section?.type === 'choice-row' &&
    isChooseOneSectionTitle(section.title) &&
    sectionHasVariableChoicePrices(section.items)
  )
}

export function shouldShowChoiceSurcharges(section) {
  return section?.type === 'choice-row' && sectionHasChoiceSurcharges(section)
}

export function formatInrPrice(amount) {
  const numericValue = Number(amount)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return ''
  }

  return `₹${numericValue.toLocaleString('en-IN')}`
}

export function formatInrSurcharge(amount) {
  const numericValue = Number(amount)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return ''
  }

  return `+${formatInrPrice(numericValue)}`
}

export const SERVICE_CHARGE_OPTION_PREFIX = 'Service charge — '

export function isServiceChargeOptionKey(key = '') {
  return String(key ?? '')
    .trim()
    .toLowerCase()
    .startsWith(SERVICE_CHARGE_OPTION_PREFIX.trim().toLowerCase())
}

export function buildServiceChargeOptionKey(optionTitle = '', index = 0) {
  const title = String(optionTitle ?? '').trim() || 'Option'
  return `${SERVICE_CHARGE_OPTION_PREFIX}${title}_${index}`
}

export function sumSelectedChoiceSurcharges(sections = []) {
  return (Array.isArray(sections) ? sections : []).reduce((sum, section) => {
    if (section?.type !== 'choice-row') return sum

    const selectedItem = (section.items ?? []).find(
      item => typeof item !== 'string' && item.selected
    )
    const surcharge = getChoiceSurcharge(selectedItem)
    return sum + (surcharge ?? 0)
  }, 0)
}

export function resolveChooseOneDisplayPrice(
  sections = [],
  fallbackBasePrice = 0,
  fallbackLabel = ''
) {
  const variableSections = (Array.isArray(sections) ? sections : []).filter(shouldShowChoicePrices)

  if (!variableSections.length) {
    if (fallbackLabel) {
      return fallbackLabel
    }

    const fallbackAmount = parseChoiceAmount(fallbackBasePrice)
    return fallbackAmount ? formatInrPrice(fallbackAmount) : ''
  }

  const selectedAmounts = variableSections
    .map(section => {
      const selectedItem = (section.items ?? []).find(
        item => typeof item !== 'string' && item.selected
      )
      return getChoiceItemAmount(selectedItem)
    })
    .filter(amount => amount != null)

  if (selectedAmounts.length === variableSections.length) {
    const total = selectedAmounts.reduce((sum, amount) => sum + amount, 0)
    return formatInrPrice(total)
  }

  const optionAmounts = variableSections.flatMap(section =>
    (section.items ?? []).map(getChoiceItemAmount).filter(amount => amount != null)
  )

  if (!optionAmounts.length) {
    return fallbackLabel || formatInrPrice(fallbackBasePrice)
  }

  const minAmount = Math.min(...optionAmounts)
  const maxAmount = Math.max(...optionAmounts)

  if (minAmount === maxAmount) {
    return formatInrPrice(minAmount)
  }

  return `${formatInrPrice(minAmount)} – ${formatInrPrice(maxAmount)}`
}

/**
 * Prefer base + selected surcharges when any choice has price_surcharge.
 * Otherwise keep absolute choose-1 pricing (Floating Moments style).
 */
export function resolveDecorDisplayPrice(
  sections = [],
  fallbackBasePrice = 0,
  fallbackLabel = ''
) {
  const list = Array.isArray(sections) ? sections : []
  const hasSurcharges = list.some(sectionHasChoiceSurcharges)

  if (!hasSurcharges) {
    return resolveChooseOneDisplayPrice(sections, fallbackBasePrice, fallbackLabel)
  }

  const baseAmount = parseChoiceAmount(fallbackBasePrice) ?? 0
  const surchargeTotal = sumSelectedChoiceSurcharges(list)
  const total = baseAmount + surchargeTotal

  if (total > 0) {
    return formatInrPrice(total)
  }

  return fallbackLabel || ''
}
