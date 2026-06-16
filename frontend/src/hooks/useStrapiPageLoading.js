import { USE_FALLBACK } from '../lib/strapi'

/**
 * True while the first Strapi fetch is still in flight.
 * Ignores background refetches after real data is cached.
 */
export function isStrapiQueryPending(query) {
  if (!query || USE_FALLBACK) return false
  if (query.isPending) return true
  if (query.isFetching && query.isPlaceholderData) return true
  return false
}

/** True if any of the given react-query results are still loading Strapi data. */
export function isStrapiPageLoading(...queries) {
  return queries.some(isStrapiQueryPending)
}

/** @deprecated Use isStrapiPageLoading — not a React hook despite the name. */
export const useStrapiPageLoading = isStrapiPageLoading
