function formatNumber(value) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

export function formatDashboardCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(formatNumber(value))
}

export function formatDashboardDate(value) {
  if (!value) return 'Date pending'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date pending'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatDashboardDateTime(value) {
  if (!value) return 'Date pending'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date pending'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function getInitials(value = '') {
  const parts = String(value).trim().split(/\s+/).filter(Boolean)

  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

export function normalizeDashboardSearchTerm(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

export function matchesDashboardSearch(searchTerm, values = []) {
  const normalizedTerm = normalizeDashboardSearchTerm(searchTerm)
  if (!normalizedTerm) return true

  const candidates = (Array.isArray(values) ? values : [values]).flatMap(value =>
    Array.isArray(value) ? value : [value]
  )

  return candidates.some(value =>
    String(value ?? '')
      .toLowerCase()
      .includes(normalizedTerm)
  )
}
