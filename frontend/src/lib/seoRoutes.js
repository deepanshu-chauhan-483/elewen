/**
 * SEO route rules for crawlers. Does not change user navigation.
 *
 * Indexable marketing/content pages stay indexable.
 * Booking funnel, auth, cart, and account URLs are noindex,follow.
 * Canonicals always use https://elewen.co.in + pathname (query stripped).
 */

export const SEO_SITE_ORIGIN = 'https://elewen.co.in'

/** Exact pathnames that should stay in the index. */
const INDEXABLE_EXACT = new Set([
  '/',
  '/about',
  '/in-house-planner',
  '/how-it-work',
  '/blogs',
  '/faqs',
  '/legalpages',
  '/privacy',
  '/contact',
  '/vendor-registration',
  '/book-consultation',
])

/** Path prefixes that must not be indexed. */
const NOINDEX_PREFIXES = [
  '/event-flow',
  '/packages',
  '/package-listing',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/new-password',
  '/auth/',
  '/cart',
  '/single-package-cart',
  '/checkout',
  '/payment',
  '/booking-confirmation',
  '/consultation-confirmation',
  '/sample-test-booking',
  '/user-dashboard',
  '/fallback-screen',
]

const PAGE_TITLES = {
  '/': 'Elewen | Event décor, catering & planning in Delhi NCR',
  '/about': 'About Elewen | Plan differently',
  '/in-house-planner': 'In-House Event Planner | Elewen',
  '/how-it-work': 'How It Works | Elewen',
  '/blogs': 'Blogs & Guides | Elewen',
  '/faqs': "FAQ's | Elewen",
  '/legalpages': 'Terms & Conditions | Elewen',
  '/privacy': 'Privacy Policy | Elewen',
  '/contact': 'Contact Us | Elewen',
  '/vendor-registration': 'Vendor Registration | Elewen',
  '/book-consultation': 'Book a Consultation | Elewen',
}

const DEFAULT_DESCRIPTION =
  'Elewen simplifies event planning with curated décor, catering, and personal coordination across Delhi NCR.'

function normalizePathname(pathname = '/') {
  const raw = String(pathname || '/')
  if (raw.length > 1 && raw.endsWith('/')) return raw.slice(0, -1)
  return raw || '/'
}

function matchesPathPrefix(path, prefix) {
  if (prefix.endsWith('/')) {
    return path === prefix.slice(0, -1) || path.startsWith(prefix)
  }
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function isNoindexPath(pathname = '/') {
  const path = normalizePathname(pathname)
  if (INDEXABLE_EXACT.has(path)) return false
  if (path.startsWith('/blogs/')) return false
  return NOINDEX_PREFIXES.some(prefix => matchesPathPrefix(path, prefix))
}

export function buildCanonicalUrl(pathname = '/') {
  const path = normalizePathname(pathname)
  if (path === '/') return `${SEO_SITE_ORIGIN}/`
  return `${SEO_SITE_ORIGIN}${path}`
}

export function resolveSeoForLocation(pathname = '/') {
  const path = normalizePathname(pathname)
  const noindex = isNoindexPath(path)
  const title = PAGE_TITLES[path] || (path.startsWith('/blogs/') ? 'Blog | Elewen' : 'Elewen')

  return {
    title,
    description: DEFAULT_DESCRIPTION,
    canonicalUrl: buildCanonicalUrl(path),
    robots: noindex ? 'noindex, follow' : 'index, follow',
  }
}
