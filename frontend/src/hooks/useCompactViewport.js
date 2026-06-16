import { useEffect, useState } from 'react'

export const COMPACT_VIEWPORT_QUERY = '(max-height: 560px) and (min-width: 600px)'

export const isCompactViewport = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia(COMPACT_VIEWPORT_QUERY).matches
}

export const syncCompactViewportAttribute = () => {
  if (typeof document === 'undefined') return false
  const active = isCompactViewport()
  document.documentElement.dataset.compactViewport = active ? 'true' : 'false'
  return active
}

export function useCompactViewport() {
  const [compact, setCompact] = useState(isCompactViewport)

  useEffect(() => {
    const media = window.matchMedia(COMPACT_VIEWPORT_QUERY)
    const update = () => {
      const active = media.matches
      setCompact(active)
      document.documentElement.dataset.compactViewport = active ? 'true' : 'false'
    }

    update()
    media.addEventListener('change', update)
    window.addEventListener('resize', update, { passive: true })
    window.visualViewport?.addEventListener('resize', update)

    return () => {
      media.removeEventListener('change', update)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return compact
}

export function CompactViewportSync() {
  useCompactViewport()
  return null
}
