import { normalizeServiceSlug } from './packageFilters'
import { getPackageServiceSlug } from './packageRoutes'
import { isSheeshaServiceSlug } from './sheeshaCheckout'

const HOOKAH_AGE_CONFIRMED_KEY = 'elewen_hookah_age_confirmed'
export const HOOKAH_AGE_CONFIRMED_EVENT = 'elewen-hookah-age-confirmed'

/** In-memory backup if web storage is unavailable. */
let hookahAgeConfirmedMemory = false

function readStoredConfirmation() {
  try {
    if (localStorage.getItem(HOOKAH_AGE_CONFIRMED_KEY) === '1') return true
  } catch {
    // Ignore.
  }

  try {
    // Migrate older session-only flag so existing confirms still count.
    if (sessionStorage.getItem(HOOKAH_AGE_CONFIRMED_KEY) === '1') {
      try {
        localStorage.setItem(HOOKAH_AGE_CONFIRMED_KEY, '1')
      } catch {
        // Ignore.
      }
      return true
    }
  } catch {
    // Ignore.
  }

  return false
}

export function isHookahAgeConfirmed() {
  if (hookahAgeConfirmedMemory) return true

  if (readStoredConfirmation()) {
    hookahAgeConfirmedMemory = true
    return true
  }

  return false
}

function notifyHookahAgeConfirmed() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(HOOKAH_AGE_CONFIRMED_EVENT))
}

/** Keep NavHeader + page gates in sync after any confirm path. */
export function subscribeHookahAgeConfirmation(listener) {
  if (typeof window === 'undefined') return () => {}

  const handleConfirm = () => listener()
  window.addEventListener(HOOKAH_AGE_CONFIRMED_EVENT, handleConfirm)
  window.addEventListener('storage', handleConfirm)

  return () => {
    window.removeEventListener(HOOKAH_AGE_CONFIRMED_EVENT, handleConfirm)
    window.removeEventListener('storage', handleConfirm)
  }
}

export function setHookahAgeConfirmed() {
  hookahAgeConfirmedMemory = true

  try {
    localStorage.setItem(HOOKAH_AGE_CONFIRMED_KEY, '1')
  } catch {
    // Ignore — memory flag still covers this tab.
  }

  try {
    sessionStorage.setItem(HOOKAH_AGE_CONFIRMED_KEY, '1')
  } catch {
    // Ignore.
  }

  notifyHookahAgeConfirmed()
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
