/**
 * Assert SEO route rules (run: node frontend/scripts/assert-seo-routes.mjs).
 */

import {
  buildCanonicalUrl,
  isNoindexPath,
  resolveSeoForLocation,
} from '../src/lib/seoRoutes.js'

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`ok: ${message}`)
  }
}

assert(!isNoindexPath('/'), 'home is indexable')
assert(!isNoindexPath('/blogs'), 'blogs index is indexable')
assert(!isNoindexPath('/blogs/some-post'), 'blog post is indexable')
assert(!isNoindexPath('/about'), 'about is indexable')
assert(isNoindexPath('/event-flow/service'), 'event-flow is noindex')
assert(isNoindexPath('/packages/catering'), 'packages listing is noindex')
assert(isNoindexPath('/login'), 'login is noindex')
assert(isNoindexPath('/user-dashboard/active-booking'), 'dashboard is noindex')
assert(isNoindexPath('/cart'), 'cart is noindex')
assert(isNoindexPath('/fallback-screen'), 'fallback is noindex')

assert(
  buildCanonicalUrl('/packages/catering') === 'https://elewen.co.in/packages/catering',
  'canonical strips host noise and keeps pathname'
)
assert(buildCanonicalUrl('/') === 'https://elewen.co.in/', 'home canonical has trailing slash')

const funnel = resolveSeoForLocation('/event-flow/decor-theme')
assert(funnel.robots === 'noindex, follow', 'funnel robots are noindex,follow')
assert(
  funnel.canonicalUrl === 'https://elewen.co.in/event-flow/decor-theme',
  'funnel canonical ignores query by using pathname only'
)

const home = resolveSeoForLocation('/')
assert(home.robots === 'index, follow', 'home robots are index,follow')

if (!process.exitCode) {
  console.log('All SEO route asserts passed')
}
