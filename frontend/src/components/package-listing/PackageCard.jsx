'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWishlist } from '../../hooks/useWishlist'
import BrandedImage from '../common/BrandedImage'
import { preloadImages } from '../../utils/preloadAssets'
import { getPackageHref } from '../../lib/packageRoutes'

function ImageDots({ count, currentIndex = 0 }) {
  if (count <= 1) return null

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`transition-all duration-300 ${
            i === currentIndex
              ? 'h-[6px] w-[22px] rounded-full bg-white'
              : 'h-[6px] w-[6px] rounded-full bg-white/60'
          }`}
        />
      ))}
    </div>
  )
}

export default function PackageCard({ pkg, className = '', compactMode = false }) {
  const images = useMemo(() => pkg.images || [], [pkg.images])
  const pkgId = pkg.documentId ?? pkg.id
  const coverIndex = Number.isInteger(pkg.coverImageIndex) ? pkg.coverImageIndex : 0
  const [sliderState, setSliderState] = useState({ pkgId, coverIndex, index: coverIndex })
  const currentIndex =
    sliderState.pkgId === pkgId && sliderState.coverIndex === coverIndex
      ? sliderState.index
      : coverIndex
  const setCurrentIndex = updater => {
    setSliderState(prev => {
      const baseIndex =
        prev.pkgId === pkgId && prev.coverIndex === coverIndex ? prev.index : coverIndex
      const nextIndex = typeof updater === 'function' ? updater(baseIndex) : updater
      return { pkgId, coverIndex, index: nextIndex }
    })
  }
  const tags = useMemo(() => {
    if (Array.isArray(pkg.includes)) return pkg.includes.filter(Boolean)
    if (Array.isArray(pkg.tags)) return pkg.tags.filter(Boolean)
    return []
  }, [pkg.includes, pkg.tags])
  const includesResetKey = `${pkg.id ?? ''}|${pkg.documentId ?? ''}|${tags.length}|${compactMode}`
  const [includesState, setIncludesState] = useState({ resetKey: '', showAll: false })
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 768
  })
  const includesResetKeyWithViewport = `${includesResetKey}|${isDesktopViewport}`
  const showAllIncludes =
    includesState.resetKey === includesResetKeyWithViewport ? includesState.showAll : false
  const setShowAllIncludes = showAll => {
    setIncludesState({ resetKey: includesResetKeyWithViewport, showAll })
  }
  const [visibleTagCount, setVisibleTagCount] = useState(0)
  const location = useLocation()
  const { isSaved, pendingPackageId, toggleSavedPackage } = useWishlist()
  const packageId = pkg.documentId ?? pkg.id
  const wishlistPackageId = String(pkg.id ?? pkg.documentId ?? '').trim()
  const serviceSlug = String(pkg.serviceSlug ?? pkg.service_slugs?.[0] ?? '')
    .trim()
    .toLowerCase()
  const basePackageHref = getPackageHref(serviceSlug, packageId)
  const packageHref = `${basePackageHref}${location.search || ''}`

  const startX = useRef(0)
  const endX = useRef(0)
  const visibleTagsViewportRef = useRef(null)
  const hiddenTagsMeasureRef = useRef(null)

  const currentImage = images[currentIndex]
  const saved =
    isSaved(wishlistPackageId) ||
    (pkg.id != null && isSaved(pkg.id)) ||
    (pkg.documentId && isSaved(pkg.documentId))
  const isWishlistPending = [wishlistPackageId, pkg.id, pkg.documentId].some(
    id => id != null && String(pendingPackageId) === String(id)
  )

  useEffect(() => {
    if (!images.length) return

    const activeIndex = Number.isInteger(currentIndex) ? currentIndex : 0
    const nextIndex = images.length > 1 ? (activeIndex + 1) % images.length : activeIndex
    const urls = [images[activeIndex], images[nextIndex]].filter(Boolean)

    preloadImages([...new Set(urls)])
  }, [currentIndex, images, pkg.documentId, pkg.id])

  const effectiveVisibleTagCount = showAllIncludes ? tags.length : visibleTagCount
  const hasMoreIncludes = tags.length > effectiveVisibleTagCount
  const visibleTags = showAllIncludes ? tags : tags.slice(0, effectiveVisibleTagCount)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const handleViewportChange = event => {
      setIsDesktopViewport(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange)
      return () => mediaQuery.removeEventListener('change', handleViewportChange)
    }

    mediaQuery.addListener(handleViewportChange)
    return () => mediaQuery.removeListener(handleViewportChange)
  }, [])

  useEffect(() => {
    if (showAllIncludes) {
      return undefined
    }

    const calculateVisibleTags = () => {
      const viewport = visibleTagsViewportRef.current
      const measureContainer = hiddenTagsMeasureRef.current

      if (!viewport || !measureContainer) return

      const availableHeight = viewport.clientHeight
      const availableWidth = viewport.clientWidth

      if (!availableHeight || !availableWidth) {
        setVisibleTagCount(tags.length)
        return
      }

      measureContainer.style.width = `${availableWidth}px`

      const tagNodes = Array.from(measureContainer.querySelectorAll('[data-tag-index]'))
      const moreNode = measureContainer.querySelector('[data-more-tag]')

      tagNodes.forEach(node => {
        node.style.display = 'none'
      })

      if (moreNode) {
        moreNode.style.display = 'none'
      }

      let fittedCount = tagNodes.length

      for (let index = 0; index < tagNodes.length; index += 1) {
        tagNodes[index].style.display = 'inline-flex'

        const hasRemainingTags = index < tagNodes.length - 1
        if (moreNode) {
          moreNode.style.display = hasRemainingTags ? 'inline-flex' : 'none'
        }

        if (measureContainer.scrollHeight > availableHeight) {
          tagNodes[index].style.display = 'none'
          fittedCount = Math.max(index, 1)
          break
        }
      }

      if (fittedCount === tagNodes.length && moreNode) {
        moreNode.style.display = 'none'
      }

      setVisibleTagCount(fittedCount)
    }

    calculateVisibleTags()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', calculateVisibleTags)
      return () => window.removeEventListener('resize', calculateVisibleTags)
    }

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleTags()
    })

    if (visibleTagsViewportRef.current) {
      resizeObserver.observe(visibleTagsViewportRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [showAllIncludes, tags, isDesktopViewport, compactMode])

  // 🔥LOOP LOGIC (important)
  const goToPrevious = () => {
    if (!images.length) return
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    if (!images.length) return
    setCurrentIndex(prev => (prev + 1) % images.length)
  }

  // 🔥 SWIPE HANDLERS
  const handleTouchStart = e => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = e => {
    endX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = startX.current - endX.current

    if (diff > 50) {
      goToNext()
    } else if (diff < -50) {
      goToPrevious()
    }
  }

  const handleWishlistClick = async event => {
    event.stopPropagation()
    await toggleSavedPackage({ packageId: wishlistPackageId })
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => {
        if (packageHref) window.open(packageHref, '_blank', 'noopener')
      }}
      onKeyDown={event => {
        if ((event.key === 'Enter' || event.key === ' ') && packageHref) {
          event.preventDefault()
          window.open(packageHref, '_blank', 'noopener')
        }
      }}
      className={`relative flex min-h-[500px] cursor-pointer flex-col rounded-[8px] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-1 ${className}`}
    >
      {/* Image Container */}
      <div
        className="relative h-[280px] overflow-hidden rounded-[6px] bg-[#E8E2DA]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentImage ? (
          <BrandedImage
            src={currentImage}
            alt={pkg.title}
            position="bottom-right"
            showLogoBg={true}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-[280px] w-full items-center justify-center bg-[#E7DDCF] px-6 text-center text-[18px] font-semibold uppercase tracking-[0.08em] text-[#8C4A22]">
            {pkg.title}
          </div>
        )}

        {/* Price + Wishlist */}
        <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
          {pkg.price ? (
            <div className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#591902] shadow-sm">
              Starting from <span className="font-bold">{pkg.price}</span>
            </div>
          ) : null}
          <button
            type="button"
            aria-label={
              isWishlistPending
                ? 'Updating wishlist'
                : saved
                  ? 'Remove from wishlist'
                  : 'Add to wishlist'
            }
            aria-pressed={saved}
            aria-busy={isWishlistPending}
            disabled={isWishlistPending}
            onClick={handleWishlistClick}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isWishlistPending ? (
              <svg
                className="h-[18px] w-[18px] animate-spin text-[#8C3B11]"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px] transition-colors duration-200"
                fill={saved ? '#8C3B11' : 'none'}
                stroke="#8C3B11"
                strokeWidth="1.8"
              >
                <path
                  d="M12 21s-6.716-4.35-9.193-8.107C.708 9.704 1.48 5.5 5.538 4.39A5.39 5.39 0 0 1 12 6.303a5.39 5.39 0 0 1 6.462-1.913c4.057 1.11 4.83 5.314 2.73 8.503C18.716 16.65 12 21 12 21Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* 🔥 LEFT ARROW (DIV STYLE) */}
        {images.length > 1 && (
          <div
            onClick={event => {
              event.stopPropagation()
              goToPrevious()
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-[41px] w-[20px] items-center justify-center rounded-r-full bg-white/20 backdrop-blur-md cursor-pointer"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth="2"
              fill="none"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </div>
        )}

        {/* 🔥 RIGHT ARROW (DIV STYLE) */}
        {images.length > 1 && (
          <div
            onClick={event => {
              event.stopPropagation()
              goToNext()
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex h-[41px] w-[21px] items-center justify-center rounded-l-full bg-white/20 backdrop-blur-md cursor-pointer"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth="2"
              fill="none"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        )}

        {/* Dots */}
        <ImageDots count={images.length} currentIndex={currentIndex} />
      </div>

      {/* Content */}
      <div className="flex min-h-[200px] flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="min-w-0 flex-1 text-[12px] font-semibold leading-[1.35] text-[#2D2D2D] sm:text-[13px]"
            style={{ fontFamily: 'Poppins' }}
          >
            {pkg.title}
          </h3>
          <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[11px] text-[#2D2D2D]">
            {pkg.category || 'Package'}
          </span>
        </div>

        {pkg.price ? (
          <p className="mt-2 text-[13px] leading-none text-[#2D2D2D]">
            Starting from <span className="text-[15px] font-bold text-[#591902]">{pkg.price}</span>
          </p>
        ) : null}

        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          <p className="text-[12px] font-medium">Includes :</p>
          <div
            ref={visibleTagsViewportRef}
            className={`mt-2 min-h-0 flex-1 ${showAllIncludes ? 'overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'overflow-hidden'}`}
          >
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-black/5 px-2 py-1 text-[12px] font-medium text-[#2D2D2D]"
                >
                  {tag}
                </span>
              ))}
              {hasMoreIncludes && !showAllIncludes ? (
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    setShowAllIncludes(true)
                  }}
                  className="rounded-full bg-black/5 px-2 py-1 text-[12px] font-medium text-[#2D2D2D]"
                >
                  More
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0">
        <div
          ref={hiddenTagsMeasureRef}
          className="flex flex-wrap gap-1.5"
          style={{ position: 'absolute', visibility: 'hidden' }}
        >
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              data-tag-index={index}
              className="rounded-full bg-black/5 px-2 py-1 text-[12px] font-medium text-[#2D2D2D]"
            >
              {tag}
            </span>
          ))}
          <button
            type="button"
            data-more-tag
            className="rounded-full bg-black/5 px-2 py-1 text-[12px] font-medium text-[#2D2D2D]"
          >
            More
          </button>
        </div>
      </div>
    </article>
  )
}
