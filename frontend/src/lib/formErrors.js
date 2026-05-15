export function getFieldErrors(error, fieldMap = {}) {
  const source =
    error?.fieldErrors && typeof error.fieldErrors === 'object' ? error.fieldErrors : {}

  return Object.entries(source).reduce((acc, [key, value]) => {
    const nextKey = fieldMap[key] ?? key
    const nextValue = Array.isArray(value) ? value[0] : value

    if (!nextKey || !nextValue) return acc

    acc[nextKey] = String(nextValue)
    return acc
  }, {})
}

export function getGlobalErrorMessage(error, fallback) {
  return typeof error?.message === 'string' && error.message.trim() ? error.message : fallback
}
