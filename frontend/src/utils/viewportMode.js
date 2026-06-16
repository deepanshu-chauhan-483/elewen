export const getViewportMode = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, isCompact: false, useMobileHeroLayout: false }
  }

  const width = window.innerWidth
  const height = window.visualViewport?.height ?? window.innerHeight
  const isMobile = width < 768
  const isCompact = width >= 600 && height <= 560

  return {
    isMobile,
    isCompact,
    useMobileHeroLayout: isMobile || isCompact,
  }
}
