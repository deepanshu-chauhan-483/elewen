import { normalizeServiceSlug } from './packageFilters'
import { getPackageServiceSlug } from './packageRoutes'
import { isSheeshaServiceSlug } from './sheeshaCheckout'

const HOOKAH_AGE_CONFIRMED_KEY = 'elewen_hookah_age_confirmed'

export function isHookahAgeConfirmed() {
  try {
    return sessionStorage.getItem(HOOKAH_AGE_CONFIRMED_KEY) === '1'
  } catch {
    return false
  }
}

export function setHookahAgeConfirmed() {
  try {
    sessionStorage.setItem(HOOKAH_AGE_CONFIRMED_KEY, '1')
  } catch {
    // Ignore storage failures.
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
