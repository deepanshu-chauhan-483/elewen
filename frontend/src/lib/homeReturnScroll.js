const HOME_SCROLL_KEY = 'elewen:home-scroll'
const PENDING_HOME_SCROLL_KEY = 'elewen:pending-home-scroll'
const SKIP_HERO_TOP_KEY = 'elewen:skip-hero-top'
const HOME_RESTORING_CLASS = 'home-scroll-restoring'
const PLAN_SECTION_MIN_SCROLL = 80

export function getWindowScrollY(lenis) {
  if (lenis && typeof lenis.scroll === 'number' && Number.isFinite(lenis.scroll)) {
    return Math.max(0, lenis.scroll)
  }

  if (typeof window === 'undefined') return 0

  return Math.max(
    0,
    window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
  )
}

/** Remember home scroll before leaving for event-flow (landing / hero cards). */
export function rememberHomeScroll(lenis) {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(HOME_SCROLL_KEY, String(getWindowScrollY(lenis)))
  } catch {
    // Ignore storage failures.
  }
}

export function readRememberedHomeScroll() {
  if (typeof window === 'undefined') return 0

  try {
    const raw = sessionStorage.getItem(HOME_SCROLL_KEY)
    if (raw == null) return 0
    const y = Number(raw)
    return Number.isFinite(y) ? Math.max(0, y) : 0
  } catch {
    return 0
  }
}

export function markHomeScrollRestoring() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.add(HOME_RESTORING_CLASS)
}

export function clearHomeScrollRestoring() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove(HOME_RESTORING_CLASS)
}

/** Resolve saved Y, falling back to Plan Differently when the hero would show. */
export function resolveHomeRestoreTargetY(savedY = 0) {
  let y = Math.max(0, Number(savedY) || 0)

  if (y >= PLAN_SECTION_MIN_SCROLL || typeof document === 'undefined') {
    return y
  }

  const section = document.getElementById('plan-your-event')
  if (!section) return y

  return Math.max(
    y,
    section.getBoundingClientRect().top +
      (window.scrollY || document.documentElement.scrollTop || 0)
  )
}

/** Queue a home scroll restore for the next visit to `/`. */
export function queueHomeScrollRestore(scrollY) {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(PENDING_HOME_SCROLL_KEY, String(Math.max(0, Number(scrollY) || 0)))
    sessionStorage.setItem(SKIP_HERO_TOP_KEY, '1')
    markHomeScrollRestoring()
  } catch {
    // Ignore storage failures.
  }
}

export function consumePendingHomeScroll() {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(PENDING_HOME_SCROLL_KEY)
    if (raw == null) return null
    sessionStorage.removeItem(PENDING_HOME_SCROLL_KEY)
    const y = Number(raw)
    return Number.isFinite(y) ? Math.max(0, y) : 0
  } catch {
    return null
  }
}

export function peekPendingHomeScroll() {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(PENDING_HOME_SCROLL_KEY)
    if (raw == null) return null
    const y = Number(raw)
    return Number.isFinite(y) ? Math.max(0, y) : 0
  } catch {
    return null
  }
}

export function peekSkipHeroScrollTop() {
  if (typeof window === 'undefined') return false

  try {
    return sessionStorage.getItem(SKIP_HERO_TOP_KEY) === '1'
  } catch {
    return false
  }
}

/** Hero must not force scroll-to-top when we are restoring a return position. */
export function consumeSkipHeroScrollTop() {
  if (typeof window === 'undefined') return false

  try {
    const skip = sessionStorage.getItem(SKIP_HERO_TOP_KEY) === '1'
    if (skip) sessionStorage.removeItem(SKIP_HERO_TOP_KEY)
    return skip
  } catch {
    return false
  }
}

/** True when returning to home Plan Differently (Previous or queued restore). */
export function shouldPreserveHomeScroll() {
  return (
    peekPendingHomeScroll() != null ||
    peekSkipHeroScrollTop() ||
    (typeof document !== 'undefined' &&
      document.documentElement.classList.contains(HOME_RESTORING_CLASS))
  )
}

export function finishHomeScrollRestore() {
  clearHomeScrollRestoring()
  consumeSkipHeroScrollTop()
}

export function applyHomeScrollRestore(savedY = 0, lenis) {
  if (typeof window === 'undefined') return 0

  const targetY = resolveHomeRestoreTargetY(savedY)
  window.scrollTo({ top: targetY, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = targetY
  document.body.scrollTop = targetY
  if (lenis) lenis.scrollTo(targetY, { immediate: true })
  return targetY
}

export function confirmHomeScrollRestore(savedY = 0, lenis) {
  const targetY = resolveHomeRestoreTargetY(savedY)
  applyHomeScrollRestore(savedY, lenis)
  const currentY = getWindowScrollY(lenis)
  const section = document.getElementById('plan-your-event')

  if (section && Math.abs(currentY - targetY) < 48) {
    finishHomeScrollRestore()
    return true
  }

  if (!section && Number(savedY) >= PLAN_SECTION_MIN_SCROLL && Math.abs(currentY - Number(savedY)) < 48) {
    finishHomeScrollRestore()
    return true
  }

  return false
}
