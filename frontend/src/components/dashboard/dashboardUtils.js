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

export function getInitials(value = '') {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
