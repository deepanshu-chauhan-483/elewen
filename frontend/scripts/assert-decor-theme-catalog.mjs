/**
 * Assert Word-doc catalog resolve rules (run: node frontend/scripts/assert-decor-theme-catalog.mjs).
 * Rollback check: VITE_DECOR_THEME_CATALOG=legacy node ...
 */

import {
  buildThemesFromCmsEventThemes,
  filterThemesByCatalogAllowlist,
  getWordDocDecorEntry,
  isLegacyDecorThemeCatalog,
  isWordDocDecorThemeCatalog,
  resolveDecorEventFlow,
  resolveDecorThemeSlugAllowlist,
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
assert(resolveDecorEventFlow('house-parties') === 'theme_step', 'houseparty → theme_step')
assert(resolveDecorEventFlow('bridal-shower') === 'skip_to_packages', 'bridal → skip')
assert(resolveDecorEventFlow('proposal') === 'skip_to_packages', 'proposal → skip')
assert(resolveDecorEventFlow('mehendi') === 'consultation', 'mehendi → consultation')
assert(resolveDecorEventFlow('mehndi') === 'consultation', 'mehndi alias → consultation')
assert(resolveDecorEventFlow('haldi') === 'consultation', 'haldi → consultation')
assert(resolveDecorEventFlow('sufi-night') === 'consultation', 'sufi → consultation')
assert(resolveDecorEventFlow('wedding') === 'unavailable', 'wedding → unavailable')
assert(resolveDecorEventFlow('diwali-party') === 'consultation', 'diwali → consultation')
assert(resolveDecorEventFlow('bachelors-bachelorette') === 'skip_to_packages', 'CMS bridal slug → skip')
assert(resolveDecorEventFlow('event') === 'consultation', 'CMS mehndi slug event → consultation')
assert(
  resolveDecorEventFlow('diwali-party', 'consultation') === 'consultation',
  'CMS decor_flow wins for diwali'
)
assert(
  resolveDecorEventFlow('house-parties', 'unavailable') === 'unavailable',
  'CMS decor_flow can mark unavailable without delete'
)
assert(resolveDecorEventFlow('holi-party') === null, 'unlisted event → no catalog override')
assert(resolveDecorEventFlow('movie-night') === null, 'unlisted event → no catalog override')
assert(resolveDecorEventFlow('bachelors') === null, 'bare bachelors slug not remapped to bridal')

assert(
  resolveDecorThemeSlugAllowlist('birthday-parties') === null,
  'no CMS themes => no catalog allowlist'
)

const cmsExtra = [{ slug: 'neon-nights', name: 'Neon Nights' }]
const birthdayWithExtra = resolveDecorThemeSlugAllowlist('birthday-parties', cmsExtra)
assert(birthdayWithExtra.includes('neon-nights'), 'CMS themes define catalog allowlist')

const dedupedCmsThemes = buildThemesFromCmsEventThemes([
  { id: 1, slug: 'general-pack', name: 'General Pack' },
  { id: 2, slug: 'birthday-party', name: 'General Pack Duplicate' },
  { id: 3, slug: 'pastel', name: 'Pastel' },
])
assert(dedupedCmsThemes.length === 2, 'dedupe keeps one canonical General Pack')
assert(dedupedCmsThemes[0].slug === 'birthday-party', 'General Pack canonical slug is birthday-party')
assert(dedupedCmsThemes[0].label === 'General Pack', 'General Pack display label applied')

const filtered = filterThemesByCatalogAllowlist(
  [
    { slug: 'birthday-party', label: 'General Pack' },
    { slug: 'disco', label: 'Disco' },
    { slug: 'pastel', label: 'Pastel' },
  ],
  resolveDecorThemeSlugAllowlist('birthday-parties', [
    { slug: 'birthday-party' },
    { slug: 'pastel' },
  ])
)
assert(
  filtered.map(t => t.slug).join(',') === 'birthday-party,pastel',
  'filter drops themes outside CMS allowlist'
)

assert(getWordDocDecorEntry('anniversaries')?.flow === 'theme_step', 'anniversary alias')

if (!process.exitCode) {
  console.log('All decor theme catalog asserts passed')
}
