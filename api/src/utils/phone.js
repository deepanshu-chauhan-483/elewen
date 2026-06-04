/** Strip formatting and return a 10-digit Indian mobile, or '' if empty. */
export function normalizeIndianPhone(value) {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (raw === '') return ''

  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  if (digits.length === 10) return digits
  return digits
}

export function isValidIndianPhone(value) {
  const normalized = normalizeIndianPhone(value)
  return normalized === '' || /^[6-9]\d{9}$/.test(normalized)
}
