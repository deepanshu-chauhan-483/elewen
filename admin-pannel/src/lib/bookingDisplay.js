const CART_META_SEPARATOR = '||__ELEWEN_META__||'

export function parseBookingItemTitle(title = '') {
  const rawTitle = String(title ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return {
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: 'package',
    }
  }

  try {
    const parsed = JSON.parse(metaPart)
    return {
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: parsed?.itemType ?? 'package',
    }
  } catch {
    return {
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: 'package',
    }
  }
}

export function getBookingPackageNames(booking = null) {
  const packageNames = (Array.isArray(booking?.items) ? booking.items : [])
    .map(item => parseBookingItemTitle(item?.title))
    .filter(item => item.itemType !== 'addon')
    .map(item => item.displayTitle)
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

export function getBookingDisplayTitle(booking = null, fallback = 'Booking') {
  const fromItems = getBookingPackageNamesText(booking, '')
  if (fromItems) return fromItems

  return (
    String(booking?.displaySubtitle ?? '').trim() ||
    String(booking?.selectedItemsSummary ?? '').trim() ||
    String(booking?.package?.title ?? '').trim() ||
    String(booking?.event?.name ?? '').trim() ||
    fallback
  )
}
