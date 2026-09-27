/**
 * Assert Word-doc catalog resolve rules (run: node frontend/scripts/assert-decor-theme-catalog.mjs).
 * Rollback check: VITE_DECOR_THEME_CATALOG=legacy node ...
 */

import {
  filterThemesByCatalogAllowlist,
  getWordDocDecorEntry,
  isLegacyDecorThemeCatalog,
  isWordDocDecorThemeCatalog,
  resolveDecorEventFlow,
  resolveDecorThemeSlugAllowlist,
  WORD_DOC_EVENT_DECOR_MAP,
} from '../src/lib/decorEventThemeCatalog.js'

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`ok: ${message}`)
  }
}

assert(isWordDocDecorThemeCatalog() || isLegacyDecorThemeCatalog(), 'catalog mode resolves')

if (isLegacyDecorThemeCatalog()) {
  assert(resolveDecorEventFlow('birthday-parties') === null, 'legacy: flow null (use old Sets)')
  assert(resolveDecorThemeSlugAllowlist('birthday-parties') === null, 'legacy: allowlist null')
  console.log('Legacy rollback path OK')
  process.exit(process.exitCode || 0)
}

assert(resolveDecorEventFlow('birthday-parties') === 'theme_step', 'birthday → theme_step')
assert(
  resolveDecorThemeSlugAllowlist('birthday-parties').includes('birthday-party'),
  'birthday includes General Pack slug'
)
assert(
  resolveDecorThemeSlugAllowlist('birthday-parties').includes('pastel'),
  'birthday includes pastel'
)
assert(resolveDecorEventFlow('house-parties') === 'theme_step', 'houseparty → theme_step')
assert(resolveDecorEventFlow('bridal-shower') === 'skip_to_packages', 'bridal → skip')
assert(resolveDecorEventFlow('proposal') === 'skip_to_packages', 'proposal → skip')
assert(resolveDecorEventFlow('mehendi') === 'consultation', 'mehendi → consultation')
assert(resolveDecorEventFlow('mehndi') === 'consultation', 'mehndi alias → consultation')
assert(resolveDecorEventFlow('haldi') === 'consultation', 'haldi → consultation')
assert(resolveDecorEventFlow('sufi-night') === 'consultation', 'sufi → consultation')
assert(resolveDecorEventFlow('wedding') === 'unavailable', 'wedding → unavailable')
assert(resolveDecorEventFlow('diwali-party') === null, 'diwali not in word-doc map')
assert(!Object.keys(WORD_DOC_EVENT_DECOR_MAP).includes('diwali-party'), 'diwali key absent')

const cmsExtra = [{ slug: 'neon-nights', name: 'Neon Nights' }]
const birthdayWithExtra = resolveDecorThemeSlugAllowlist('birthday-parties', cmsExtra)
assert(birthdayWithExtra.includes('neon-nights'), 'CMS extra merges into birthday allowlist')

const filtered = filterThemesByCatalogAllowlist(
  [
    { slug: 'birthday-party', label: 'General Pack' },
    { slug: 'disco', label: 'Disco' },
    { slug: 'pastel', label: 'Pastel' },
  ],
  resolveDecorThemeSlugAllowlist('birthday-parties')
)
assert(
  filtered.map(t => t.slug).join(',') === 'birthday-party,pastel',
  'filter drops themes outside word-doc list'
)

assert(getWordDocDecorEntry('anniversaries')?.flow === 'theme_step', 'anniversary alias')

if (!process.exitCode) {
  console.log('All decor theme catalog asserts passed')
}
