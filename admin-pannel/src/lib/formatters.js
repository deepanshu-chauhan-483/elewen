export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export function formatDate(value) {
  if (!value) return 'Pending'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Pending'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value) {
  if (!value) return 'Pending'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Pending'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatCount(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value ?? 0))
}

export function sentenceCase(value = '') {
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || 'AD'
}
