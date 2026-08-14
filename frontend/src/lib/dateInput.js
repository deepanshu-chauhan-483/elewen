function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getDateInputMin({ offsetDays = 0 } = {}) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return toDateInputValue(date)
}

export function buildExcludeDateSet(excludeDates) {
  const dates = Array.isArray(excludeDates) ? excludeDates.filter(d => typeof d === 'string') : []
  return new Set(dates)
}
