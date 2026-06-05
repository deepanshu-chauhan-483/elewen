const CART_META_SEPARATOR = '||__ELEWEN_META__||'
const MAX_CART_TITLE_LENGTH = 255

export function normalizeSelectedOptions(selectedOptions) {
  if (!selectedOptions || typeof selectedOptions !== 'object' || Array.isArray(selectedOptions)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(selectedOptions)
      .map(([key, value]) => [String(key ?? '').trim(), String(value ?? '').trim()])
      .filter(([key, value]) => key && value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  )
}

export function parseSelectedOptionsFromTitle(title = '') {
  const rawTitle = String(title ?? '')
  const [, metaPart] = rawTitle.split(CART_META_SEPARATOR)
  if (!metaPart) return {}

  try {
    const parsed = JSON.parse(metaPart)
    return normalizeSelectedOptions(parsed?.selectedOptions)
  } catch {
    return {}
  }
}

export function getDisplayTitle(title = '') {
  return String(title ?? '')
    .split(CART_META_SEPARATOR)[0]
    .trim()
}

export function resolveCartItemSelectedOptions(item = {}) {
  const fromColumn = normalizeSelectedOptions(item?.selectedOptions)
  if (Object.keys(fromColumn).length) return fromColumn

  return parseSelectedOptionsFromTitle(item?.title)
}

function truncateTitle(value = '') {
  const text = String(value ?? '').trim()
  if (text.length <= MAX_CART_TITLE_LENGTH) return text
  return text.slice(0, MAX_CART_TITLE_LENGTH)
}

export function buildStoredCartItemTitle(displayTitle, selectedOptions, meta = {}) {
  const normalized = normalizeSelectedOptions(selectedOptions)
  const trimmedAddonTitle = String(meta.addonTitle ?? '').trim()
  const baseTitle = truncateTitle(getDisplayTitle(displayTitle) || displayTitle)

  if (trimmedAddonTitle) {
    const compactMeta = JSON.stringify({
      itemType: 'addon',
      addonTitle: trimmedAddonTitle,
      parentPackageId: String(meta.parentPackageId ?? ''),
    })
    const withMeta = `${truncateTitle(trimmedAddonTitle)}${CART_META_SEPARATOR}${compactMeta}`
    if (withMeta.length <= MAX_CART_TITLE_LENGTH) return withMeta

    return truncateTitle(trimmedAddonTitle)
  }

  if (!Object.keys(normalized).length) return baseTitle

  const legacyPayload = `${baseTitle}${CART_META_SEPARATOR}${JSON.stringify({
    selectedOptions: normalized,
  })}`

  if (legacyPayload.length <= MAX_CART_TITLE_LENGTH) return legacyPayload

  return baseTitle
}

export function attachSelectedOptionsToCartItems(cart) {
  if (!cart?.items) return cart

  return {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      selectedOptions: resolveCartItemSelectedOptions(item),
    })),
  }
}
