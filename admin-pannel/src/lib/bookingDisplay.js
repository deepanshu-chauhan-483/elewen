const CART_META_SEPARATOR = '||__ELEWEN_META__||'
const CART_ADDITIONAL_INFO_KEY = '__additional_info__'

export function parseBookingItemTitle(title = '') {
  const rawTitle = String(title ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return {
      rawTitle,
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: 'package',
      addonTitle: '',
      selectedOptions: {},
      additionalInfo: '',
    }
  }

  try {
    const parsed = JSON.parse(metaPart)
    const parsedSelectedOptions =
      parsed?.selectedOptions && typeof parsed.selectedOptions === 'object'
        ? parsed.selectedOptions
        : {}

    return {
      rawTitle,
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: parsed?.itemType ?? 'package',
      addonTitle: String(parsed?.addonTitle ?? '').trim(),
      selectedOptions: parsedSelectedOptions,
      additionalInfo: String(
        parsed?.additionalInfo ?? parsedSelectedOptions?.[CART_ADDITIONAL_INFO_KEY] ?? ''
      ).trim(),
    }
  } catch {
    return {
      rawTitle,
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: 'package',
      addonTitle: '',
      selectedOptions: {},
      additionalInfo: '',
    }
  }
}

export function getSelectedOptionsText(selectedOptions = {}) {
  if (!selectedOptions || typeof selectedOptions !== 'object') return ''

  return Object.entries(selectedOptions)
    .filter(
      ([key]) =>
        String(key ?? '')
          .trim()
          .toLowerCase() !== CART_ADDITIONAL_INFO_KEY
    )
    .map(([, value]) => value)
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

export function getBookingAdditionalInfoText(booking = null) {
  const fromItems = (Array.isArray(booking?.items) ? booking.items : [])
    .map(item => parseBookingItemTitle(item?.title).additionalInfo)
    .map(value => String(value ?? '').trim())
    .filter(Boolean)

  const uniqueValues = [...new Set(fromItems)]
  return uniqueValues.join(' · ')
}

export function formatInfoStatus(status = '') {
  switch (String(status ?? '').toLowerCase()) {
    case 'waiting':
      return { label: 'Pending', pending: true }
    case 'submitted':
      return { label: 'Submitted', pending: false }
    case 'verified':
      return { label: 'Verified', pending: false }
    default:
      return { label: 'Pending', pending: true }
  }
}

export function buildSelectedItemRows(booking = null) {
  const items = Array.isArray(booking?.items) ? booking.items : []
  const rows = []

  for (const item of items) {
    const meta = parseBookingItemTitle(item?.title)
    if (meta.itemType === 'addon') continue

    rows.push({
      id: item?.id ?? `${booking?.id ?? 'row'}-${rows.length}`,
      title: getPackageLineLabel(item?.title, booking?.package?.title),
      includes: getPackageLineSubtitle(item?.title),
      additionalInfo: meta.additionalInfo,
      amount: item?.totalPrice ?? 0,
    })
  }

  if (!rows.length && booking?.package?.title) {
    rows.push({
      id: `package-${booking?.id ?? 'row'}`,
      title: booking.package.title,
      includes: '',
      additionalInfo: '',
      amount: booking?.totalPrice ?? booking?.package?.basePrice ?? 0,
    })
  }

  return rows
}

export function buildAddonItemRows(booking = null) {
  return (Array.isArray(booking?.items) ? booking.items : [])
    .map((item, index) => {
      const meta = parseBookingItemTitle(item?.title)
      if (meta.itemType !== 'addon') return null

      return {
        id: item?.id ?? `${booking?.id ?? 'addon'}-${index}`,
        title: getPackageLineLabel(item?.title, 'Add-on'),
        includes: getPackageLineSubtitle(item?.title),
        additionalInfo: meta.additionalInfo,
        amount: item?.totalPrice ?? 0,
      }
    })
    .filter(Boolean)
}
