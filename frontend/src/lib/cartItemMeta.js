const CART_META_SEPARATOR = '||__ELEWEN_META__||'

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

export function parseSelectedOptionsFromCartItemTitle(title = '') {
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

export function resolveCartItemSelectedOptions(item = {}) {
  const fromApi = normalizeSelectedOptions(item?.selectedOptions)
  if (Object.keys(fromApi).length) return fromApi

  return parseSelectedOptionsFromCartItemTitle(item?.title)
}
