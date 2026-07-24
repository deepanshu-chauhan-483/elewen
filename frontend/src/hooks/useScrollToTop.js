import { useEffect, useRef } from 'react'

const SCROLL_STORAGE_PREFIX = 'elewen:scroll:'

export function getLocationScrollKey(pathname = '', search = '') {
  return `${pathname}${search}`
}

export function saveLocationScroll(key, y = typeof window !== 'undefined' ? window.scrollY : 0) {
  if (typeof window === 'undefined' || !key) return

  try {
    sessionStorage.setItem(`${SCROLL_STORAGE_PREFIX}${key}`, String(Math.max(0, y || 0)))
  } catch {
    // Ignore quota / private-mode failures
  }
}

export function readLocationScroll(key) {
  if (typeof window === 'undefined' || !key) return null

  try {
    const raw = sessionStorage.getItem(`${SCROLL_STORAGE_PREFIX}${key}`)
    if (raw == null) return null
    const y = Number(raw)
    return Number.isFinite(y) ? Math.max(0, y) : null
  } catch {
    return null
  }
}

export function scrollPageTo(y = 0, lenis) {
  if (typeof window === 'undefined') return

  const top = Math.max(0, y || 0)
  window.scrollTo({ top, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = top
  document.body.scrollTop = top
  if (lenis) lenis.scrollTo(top, { immediate: true })
}

export function scrollPageToTop(lenis) {
  scrollPageTo(0, lenis)
}

/** Persist scroll for the current location; write final value on leave. */
export function usePersistLocationScroll(locationKey, getScrollY) {
  const readyRef = useRef(false)
  const getScrollYRef = useRef(getScrollY)
  getScrollYRef.current = getScrollY

  useEffect(() => {
    if (typeof window === 'undefined' || !locationKey) return undefined

    readyRef.current = false
    const enableTimer = window.setTimeout(() => {
      readyRef.current = true
    }, 350)

    const resolveY = () => {
      const getter = getScrollYRef.current
      if (typeof getter === 'function') {
        const y = getter()
        if (Number.isFinite(y)) return Math.max(0, y)
      }
      return Math.max(0, window.scrollY || 0)
    }

    const persist = () => {
      if (!readyRef.current) return
      saveLocationScroll(locationKey, resolveY())
    }

    window.addEventListener('scroll', persist, { passive: true })

    return () => {
      window.clearTimeout(enableTimer)
      // Always save on leave so Back can restore the last spot
      saveLocationScroll(locationKey, resolveY())
      window.removeEventListener('scroll', persist)
    }
  }, [locationKey])
}

export function useScrollToTop(trigger) {
  useEffect(() => {
    scrollPageToTop()
  }, [trigger])
}
