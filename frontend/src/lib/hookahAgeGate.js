import { normalizeServiceSlug } from './packageFilters'
import { getPackageServiceSlug } from './packageRoutes'
import { isSheeshaServiceSlug } from './sheeshaCheckout'

const HOOKAH_AGE_CONFIRMED_KEY = 'elewen_hookah_age_confirmed'

/** In-memory backup if sessionStorage is unavailable. */
let hookahAgeConfirmedMemory = false

export function isHookahAgeConfirmed() {
  if (hookahAgeConfirmedMemory) return true

  try {
    if (sessionStorage.getItem(HOOKAH_AGE_CONFIRMED_KEY) === '1') {
      hookahAgeConfirmedMemory = true
      return true
    }
  } catch {
    // Ignore storage failures.
  }

  return false
}

export function setHookahAgeConfirmed() {
  hookahAgeConfirmedMemory = true

  try {
    sessionStorage.setItem(HOOKAH_AGE_CONFIRMED_KEY, '1')
  } catch {
    // Ignore storage failures — memory flag still covers this tab.
  }
}

export function isHookahSearchQuery(query = '') {
  const normalized = String(query ?? '')
    .trim()
    .toLowerCase()
  if (!normalized) return false
  return (
    normalized.includes('hookah') ||
    normalized.includes('hukkah') ||
    normalized.includes('hukka') ||
    normalized.includes('sheesha') ||
    normalized.includes('shisha')
  )
}

export function isSheeshaPackageRecord(pkg) {
  if (!pkg) return false
  const slug = normalizeServiceSlug(getPackageServiceSlug(pkg))
  if (isSheeshaServiceSlug(slug)) return true

  const text = [pkg.title, pkg.category, pkg.slug]
    .map(value => String(value ?? '').toLowerCase())
    .join(' ')
  return text.includes('hookah') || text.includes('sheesha') || text.includes('hukkah')
}
