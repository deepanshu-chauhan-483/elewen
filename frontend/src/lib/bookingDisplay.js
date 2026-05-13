const CART_META_SEPARATOR = '||__ELEWEN_META__||'

export function parseBookingItemTitle(title = '') {
  const rawTitle = String(title ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return {
      rawTitle,
      displayTitle: displayTitle || rawTitle,
      itemType: 'package',
      addonTitle: '',
      selectedOptions: {},
    }
  }

  try {
    const parsed = JSON.parse(metaPart)
    return {
      rawTitle,
      displayTitle: displayTitle || rawTitle,
      itemType: parsed?.itemType ?? 'package',
      addonTitle: String(parsed?.addonTitle ?? '').trim(),
      selectedOptions:
        parsed?.selectedOptions && typeof parsed.selectedOptions === 'object'
          ? parsed.selectedOptions
          : {},
    }
  } catch {
    return {
      rawTitle,
      displayTitle: displayTitle || rawTitle,
      itemType: 'package',
      addonTitle: '',
      selectedOptions: {},
    }
  }
}

export function getSelectedOptionsText(selectedOptions = {}) {
  if (!selectedOptions || typeof selectedOptions !== 'object') return ''

  return Object.values(selectedOptions)
    .map(value => String(value ?? '').trim())
    .filter(Boolean)
    .join(', ')
}

export function getPackageLineLabel(itemTitle = '', fallbackTitle = '') {
  const parsed = parseBookingItemTitle(itemTitle)
  if (parsed.itemType === 'addon') {
    return parsed.addonTitle || parsed.displayTitle || fallbackTitle || 'Add-on'
  }
  return parsed.displayTitle || fallbackTitle || 'Package'
}

export function getPackageLineSubtitle(itemTitle = '') {
  const parsed = parseBookingItemTitle(itemTitle)
  return getSelectedOptionsText(parsed.selectedOptions)
}

export function getBookingPackageNames(booking = null) {
  const packageNames = (Array.isArray(booking?.items) ? booking.items : [])
    .map(item => parseBookingItemTitle(item?.title))
    .filter(item => item.itemType !== 'addon')
    .map(item => item.displayTitle)
    .map(value => String(value ?? '').trim())
    .filter(Boolean)

  const uniquePackageNames = [...new Set(packageNames)]

  if (uniquePackageNames.length) return uniquePackageNames

  const fallbackTitle = String(booking?.package?.title ?? '').trim()
  return fallbackTitle ? [fallbackTitle] : []
}

export function getBookingPackageNamesText(booking = null, fallback = 'Selected package') {
  const packageNames = getBookingPackageNames(booking)
  return packageNames.length ? packageNames.join(', ') : fallback
}
