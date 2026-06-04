'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWishlist } from '../../hooks/useWishlist'
import BrandedImage from '../common/BrandedImage'

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

function getPackageHref(serviceSlug, packageId) {
  const normalizedService = String(serviceSlug ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')

  if (normalizedService === 'decor') return `/packages/decor-single/${packageId}`
  if (normalizedService === 'sheesha') return `/packages/sheesha-single/${packageId}`
  if (normalizedService === 'bartending') return `/packages/bartending-single/${packageId}`
  if (normalizedService === 'catering') return `/packages/catering-single/${packageId}`
  if (normalizedService) return `/packages/${normalizedService}/${packageId}`

  return `/packages/decor-single/${packageId}`
}

export default function PackageCard({ pkg, className = '', compactMode = false }) {
  const images = pkg.images || []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAllIncludes, setShowAllIncludes] = useState(false)
  const [visibleTagCount, setVisibleTagCount] = useState(0)
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 768
  })
  const navigate = useNavigate()
  const location = useLocation()
  const { isSaved, pendingPackageId, toggleSavedPackage } = useWishlist()
  const packageId = pkg.documentId ?? pkg.id
  const wishlistPackageId = pkg.id ?? pkg.documentId
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
  const saved = isSaved(wishlistPackageId)
  const isWishlistPending = String(pendingPackageId) === String(wishlistPackageId)
  const tags = useMemo(() => {
    if (Array.isArray(pkg.includes)) return pkg.includes.filter(Boolean)
    if (Array.isArray(pkg.tags)) return pkg.tags.filter(Boolean)
    return []
  }, [pkg.includes, pkg.tags])
  const shouldUseCompactMode = compactMode || !isDesktopViewport
  const hasMoreIncludes = tags.length > visibleTagCount
  const visibleTags = showAllIncludes ? tags : tags.slice(0, visibleTagCount)
  const descriptionText = String(pkg.description ?? '')
  const visibleDescription =
    shouldUseCompactMode && descriptionText.length > 110
      ? `${descriptionText.slice(0, 110).trim()}...`
      : descriptionText

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowAllIncludes(false)
  }, [pkg.id, pkg.documentId, tags.length, isDesktopViewport, compactMode])

  useEffect(() => {
    if (showAllIncludes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleTagCount(tags.length)
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
  }, [showAllIncludes, tags, visibleDescription, isDesktopViewport, compactMode])

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
        if (packageHref) navigate(packageHref)
      }}
      onKeyDown={event => {
        if ((event.key === 'Enter' || event.key === ' ') && packageHref) {
          event.preventDefault()
          navigate(packageHref)
        }
      }}
      className={`relative flex h-[500px] cursor-pointer flex-col rounded-[8px] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-1 ${className}`}
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
          <div className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#4B4B4B]">
            Starting from {pkg.price}
          </div>
          <button
            type="button"
            aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={saved}
            disabled={isWishlistPending}
            onClick={handleWishlistClick}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#8C3B11] shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 ${
              saved ? 'bg-[#8C3B11] text-white border-[#8C3B11]' : ''
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M12 21s-6.716-4.35-9.193-8.107C.708 9.704 1.48 5.5 5.538 4.39A5.39 5.39 0 0 1 12 6.303a5.39 5.39 0 0 1 6.462-1.913c4.057 1.11 4.83 5.314 2.73 8.503C18.716 16.65 12 21 12 21Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
      <div className="flex h-[200px] flex-col px-1 pb-1 pt-3">
        <div className="flex items-center justify-between gap-3">
          <h3
            className="line-clamp-1 text-[16px] font-medium text-[#2D2D2D]"
            style={{ fontFamily: 'Poppins' }}
          >
            {pkg.title}
          </h3>
          <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[12px] text-[#2D2D2D]">
            {pkg.category || 'Package'}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 min-h-[36px] text-[12px] text-[#767676]">
          {visibleDescription}
        </p>

        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <p className="text-[12px] font-medium">Includes :</p>
          <div
            ref={visibleTagsViewportRef}
            className={`mt-2 min-h-0 ${showAllIncludes ? 'overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'overflow-hidden'}`}
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
