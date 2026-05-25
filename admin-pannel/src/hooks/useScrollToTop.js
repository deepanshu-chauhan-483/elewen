import { useEffect } from 'react'

export function scrollWindowToTop() {
  if (typeof window === 'undefined') return

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'auto',
  })
}

export function useScrollToTop(trigger) {
  useEffect(() => {
    scrollWindowToTop()
  }, [trigger])
}
