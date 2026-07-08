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

export function shouldShowChoicePrices(section) {
  return (
    section?.type === 'choice-row' &&
    isChooseOneSectionTitle(section.title) &&
    sectionHasVariableChoicePrices(section.items)
  )
}

export function formatInrPrice(amount) {
  const numericValue = Number(amount)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return ''
  }

  return `₹${numericValue.toLocaleString('en-IN')}`
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
