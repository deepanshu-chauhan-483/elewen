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

export function getChoiceItemSurcharge(item) {
  if (!item || typeof item === 'string') {
    return null
  }

  return parseChoiceAmount(item.surcharge ?? item.price_surcharge)
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

export function sectionHasSurchargePrices(items = []) {
  return (Array.isArray(items) ? items : []).some(item => getChoiceItemSurcharge(item) != null)
}

export function shouldShowChoicePrices(section) {
  if (section?.type !== 'choice-row' || !isChooseOneSectionTitle(section.title)) {
    return false
  }

  return sectionHasSurchargePrices(section.items) || sectionHasVariableChoicePrices(section.items)
}

export function sectionsUseSurchargePricing(sections = []) {
  return (Array.isArray(sections) ? sections : []).some(
    section =>
      section?.type === 'choice-row' &&
      isChooseOneSectionTitle(section.title) &&
      sectionHasSurchargePrices(section.items)
  )
}

export function formatInrPrice(amount) {
  const numericValue = Number(amount)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return ''
  }

  return `₹${numericValue.toLocaleString('en-IN')}`
}

export function formatSurchargePrice(amount) {
  const numericValue = Number(amount)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return ''
  }

  return `+₹${numericValue.toLocaleString('en-IN')}`
}

function sumSelectedSurcharges(sections = []) {
  return (Array.isArray(sections) ? sections : []).reduce((sum, section) => {
    if (section?.type !== 'choice-row' || !isChooseOneSectionTitle(section.title)) {
      return sum
    }

    if (!sectionHasSurchargePrices(section.items)) {
      return sum
    }

    const selectedItem = (section.items ?? []).find(
      item => typeof item !== 'string' && item.selected
    )
    const surcharge = getChoiceItemSurcharge(selectedItem) ?? 0
    return sum + surcharge
  }, 0)
}

/**
 * Numeric unit price for cart / header.
 * Surcharge mode: package base + selected option deltas.
 * Absolute mode: sum of selected absolute amounts when every variable section is selected.
 */
export function resolveChooseOneUnitPrice(sections = [], fallbackBasePrice = 0) {
  const fallbackAmount = parseChoiceAmount(fallbackBasePrice) ?? 0

  if (sectionsUseSurchargePricing(sections)) {
    return fallbackAmount + sumSelectedSurcharges(sections)
  }

  const variableSections = (Array.isArray(sections) ? sections : []).filter(shouldShowChoicePrices)

  if (!variableSections.length) {
    return fallbackAmount
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
    return selectedAmounts.reduce((sum, amount) => sum + amount, 0)
  }

  return fallbackAmount
}

export function resolveChooseOneDisplayPrice(
  sections = [],
  fallbackBasePrice = 0,
  fallbackLabel = ''
) {
  if (sectionsUseSurchargePricing(sections)) {
    const unitPrice = resolveChooseOneUnitPrice(sections, fallbackBasePrice)
    return formatInrPrice(unitPrice) || fallbackLabel || ''
  }

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
