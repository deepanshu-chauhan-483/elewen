/**
 * Keep the last two words on the same line (avoid a one-word widow).
 *
 * @param {string} value
 * @returns {string}
 */
export function preventWidow(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''

  const parts = text.split(/\s+/)
  if (parts.length < 2) return text

  const last = parts.pop()
  const previous = parts.pop()
  return `${parts.join(' ')}${parts.length ? ' ' : ''}${previous}\u00A0${last}`.trim()
}

/**
 * Strip common UTF-8 mojibake (e.g. â€" for em dash) from CMS / static copy.
 *
 * @param {string} value
 * @returns {string}
 */
export function stripMojibake(value) {
  if (typeof value !== 'string') return value

  return value
    .replace(/Ã¢â‚¬[ÂÂœ]/g, '"')
    .replace(/Ã¢â‚¬[Â˜Â™]/g, "'")
    .replace(/Ã¢â‚¬Â/g, ' - ')
    .replace(/Ã¢â‚¬Â"/g, ' - ')
    .replace(/Ã¢â‚¬â€œ/g, ' - ')
    .replace(/Ã¢â‚¬â€/g, ' - ')
    .replace(/Ã¢â‚¬Â¦/g, '...')
    .replace(/Ã¢â‚¬/g, '')
    .replace(/\u00E2\u20AC[\u201C\u201D\u009D]/g, '"')
    .replace(/\u00E2\u20AC[\u2018\u2019]/g, "'")
    .replace(/â€[œ]/g, '"')
    .replace(/â€[˜™]/g, "'")
    .replace(/â€"/g, ' - ')
    .replace(/â€“/g, ' - ')
    .replace(/â€”/g, ' - ')
    .replace(/â€¦/g, '...')
    .replace(/â€\?/g, ' - ')
    .replace(/â€/g, '')
}
