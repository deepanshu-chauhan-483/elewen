/**
 * Shared package search matching for nav + listing pages.
 * Matches title, category, description, includes/tags, and common decor keywords.
 */

const KEYWORD_ALIASES = {
  flower: ['flower', 'flowers', 'floral', 'florals'],
  balloon: ['balloon', 'balloons'],
  candle: ['candle', 'candles'],
  backdrop: ['backdrop', 'backdrops', 'back drop'],
  lighting: ['light', 'lighting', 'lights', 'fairy light', 'fairy lights'],
  sheesha: ['sheesha', 'hookah', 'hukkah'],
  decor: ['decor', 'decoration', 'styling'],
}

function expandQueryTokens(query) {
  const raw = String(query ?? '')
    .toLowerCase()
    .trim()
  if (!raw) return []

  const tokens = raw.split(/\s+/).filter(Boolean)
  const expanded = new Set(tokens)

  for (const token of tokens) {
    for (const aliases of Object.values(KEYWORD_ALIASES)) {
      if (aliases.some(alias => alias.includes(token) || token.includes(alias))) {
        aliases.forEach(alias => expanded.add(alias))
      }
    }
  }

  return [...expanded]
}

export function fuzzyMatchText(text, query) {
  const t = String(text ?? '').toLowerCase()
  const q = String(query ?? '')
    .toLowerCase()
    .trim()
  if (!q || !t) return false
  if (t.includes(q)) return true

  const words = q.split(/\s+/).filter(Boolean)
  return words.every(w => {
    if (t.includes(w)) return true
    if (w.endsWith('y') && t.includes(w.slice(0, -1) + 'ies')) return true
    if (w.endsWith('ies') && t.includes(w.slice(0, -3) + 'y')) return true
    if (w.endsWith('s') && t.includes(w.slice(0, -1))) return true
    if (t.includes(w + 's')) return true
    return false
  })
}

function packageSearchBlob(pkg) {
  const includes = Array.isArray(pkg?.includes)
    ? pkg.includes
    : Array.isArray(pkg?.tags)
      ? pkg.tags
      : []

  return [
    pkg?.title,
    pkg?.category,
    pkg?.description,
    pkg?.desc,
    includes.join(' '),
    ...(Array.isArray(pkg?.theme_slugs) ? pkg.theme_slugs : []),
    pkg?.level_slug,
    ...(Array.isArray(pkg?.service_slugs) ? pkg.service_slugs : []),
  ]
    .filter(Boolean)
    .join(' ')
}

export function packageMatchesSearch(pkg, query) {
  const q = String(query ?? '').trim()
  if (!q) return true

  const blob = packageSearchBlob(pkg)
  if (fuzzyMatchText(blob, q)) return true

  // Also accept alias expansions so "flower" hits floral packages, etc.
  return expandQueryTokens(q).some(token => fuzzyMatchText(blob, token))
}
