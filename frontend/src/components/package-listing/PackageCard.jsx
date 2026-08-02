'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWishlist } from '../../hooks/useWishlist'
import BrandedImage from '../common/BrandedImage'
import { preloadImages } from '../../utils/preloadAssets'
import { getPackageHref } from '../../lib/packageRoutes'

const TAG_PILL_CLASS =
  'inline-flex rounded-full bg-black/5 px-2 py-1 text-[12px] font-medium leading-normal text-[#2D2D2D]'

const MAX_TAG_LINES = 2

function TagPill({ children, className = '', ...rest }) {
  return (
    <span className={`${TAG_PILL_CLASS}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </span>
  )
}

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

export default function PackageCard({ pkg, className = '', compactMode = false, hidePrice = false }) {
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
  const [visibleTagCount, setVisibleTagCount] = useState(0)
  const [tagBlockMaxHeight, setTagBlockMaxHeight] = useState(null)
  const tagsContainerRef = useRef(null)
  const tagsMeasureRef = useRef(null)
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

  useLayoutEffect(() => {
    if (!tags.length) {
      setVisibleTagCount(0)
      setTagBlockMaxHeight(null)
      return undefined
    }

    const calculateVisibleTags = () => {
      const container = tagsContainerRef.current
      const measureContainer = tagsMeasureRef.current

      if (!container || !measureContainer) return

      const availableWidth = container.clientWidth
      if (!availableWidth) return

      measureContainer.style.width = `${availableWidth}px`

      const tagNodes = Array.from(measureContainer.querySelectorAll('[data-tag-index]'))
      const moreNode = measureContainer.querySelector('[data-more-tag]')

      tagNodes.forEach(node => {
        node.style.display = 'none'
      })

      if (moreNode) {
        moreNode.style.display = 'none'
      }

      if (!tagNodes.length) {
        setVisibleTagCount(0)
        return
      }

      tagNodes[0].style.display = 'inline-flex'
      const singleLineHeight = measureContainer.scrollHeight
      const rowGap = 6
      const maxHeight = singleLineHeight * MAX_TAG_LINES + rowGap

      tagNodes.forEach(node => {
        node.style.display = 'none'
      })

      let fittedCount = 0

      for (let tagIndex = 0; tagIndex < tagNodes.length; tagIndex += 1) {
        tagNodes[tagIndex].style.display = 'inline-flex'

        const hasRemainingTags = tagIndex < tagNodes.length - 1
        if (moreNode) {
          moreNode.style.display = hasRemainingTags ? 'inline-flex' : 'none'
        }

        if (measureContainer.scrollHeight > maxHeight) {
          tagNodes[tagIndex].style.display = 'none'
          fittedCount = Math.max(tagIndex, 1)
          break
        }

        fittedCount = tagIndex + 1
      }

      if (fittedCount === tagNodes.length && moreNode) {
        moreNode.style.display = 'none'
      }

      setTagBlockMaxHeight(maxHeight)
      setVisibleTagCount(fittedCount)
    }

    calculateVisibleTags()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', calculateVisibleTags)
      return () => window.removeEventListener('resize', calculateVisibleTags)
    }

    const resizeObserver = new ResizeObserver(calculateVisibleTags)

    if (tagsContainerRef.current) {
      resizeObserver.observe(tagsContainerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [tags, pkg.documentId, pkg.id])
  
  const visibleTags = tags.slice(0, visibleTagCount)
  const hasMoreTags = tags.length > visibleTagCount

  const goToPrevious = () => {
    if (!images.length) return
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    if (!images.length) return
    setCurrentIndex(prev => (prev + 1) % images.length)
  }

  const handleTouchStart = e => {
    e.stopPropagation()
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = e => {
    e.stopPropagation()
    endX.current = e.touches[0].clientX
  }

  const handleTouchEnd = e => {
    e.stopPropagation()
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
      className={`relative flex h-full cursor-pointer flex-col rounded-[8px] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-1 ${className}`}
    >
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
            cropWatermark={false}
            className="h-full w-full"
            imgClassName="object-cover object-center"
          />
        ) : (
          <div className="flex h-[280px] w-full items-center justify-center bg-[#E7DDCF] px-6 text-center text-[18px] font-semibold uppercase tracking-[0.08em] text-[#8C4A22]">
            {pkg.title}
          </div>
        )}

        <div className="absolute right-3 top-3 z-30">
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

        {images.length > 1 && (
          <div
            onClick={event => {
              event.stopPropagation()
              goToPrevious()
            }}
            className="absolute left-0 top-1/2 z-20 flex h-[41px] w-[20px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-full bg-white/20 backdrop-blur-md"
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

        {images.length > 1 && (
          <div
            onClick={event => {
              event.stopPropagation()
              goToNext()
            }}
            className="absolute right-0 top-1/2 z-20 flex h-[41px] w-[21px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-full bg-white/20 backdrop-blur-md"
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

        <ImageDots count={images.length} currentIndex={currentIndex} />
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="min-h-[34px] min-w-0 flex-1 text-[12px] font-semibold leading-[1.35] text-[#2D2D2D] sm:text-[13px]"
            style={{ fontFamily: 'Poppins' }}
          >
            {pkg.title}
          </h3>
          <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[11px] text-[#2D2D2D]">
            {pkg.category || 'Package'}
          </span>
        </div>

        {hidePrice ? (
          <div className="min-h-[20px]" aria-hidden="true" />
        ) : pkg.price ? (
          <div className="mt-0 min-h-[20px] text-[13px] leading-none text-[#2D2D2D]">
            <p className="flex flex-wrap items-center gap-2">
              <span>
                Price <span className="text-[15px] font-bold text-[#591902]">{pkg.price}</span>
              </span>
              {pkg.compare_at_price ? (
                <span className="text-[12px] font-normal text-[#8A847E] line-through">
                  {pkg.compare_at_price}
                </span>
              ) : null}
              {pkg.discount_badge ? (
                <span className="package-offer-badge inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#CDB17E] to-[#D4BA8E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#591902]">
                  <span aria-hidden="true">★</span>
                  {pkg.discount_badge}
                </span>
              ) : null}
            </p>
          </div>
        ) : (
          <div className="min-h-[20px]" aria-hidden="true" />
        )}

        {pkg.sheesha_size_label ? (
          <p className="mt-1 min-h-[18px] text-[12px] leading-none text-[#2D2D2D]">
            Size{' '}
            <span className="text-[13px] font-semibold text-[#591902]">{pkg.sheesha_size_label}</span>
          </p>
        ) : null}

        <div
          ref={tagsContainerRef}
          className="mt-4 min-h-[52px] overflow-hidden"
          style={tagBlockMaxHeight ? { maxHeight: `${tagBlockMaxHeight}px` } : undefined}
        >
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag, tagIndex) => (
                <TagPill key={`${tag}-${tagIndex}`}>{tag}</TagPill>
              ))}
              {hasMoreTags ? <TagPill>More</TagPill> : null}
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0" aria-hidden="true">
          <div
            ref={tagsMeasureRef}
            className="flex flex-wrap gap-1.5"
            style={{ position: 'absolute', visibility: 'hidden' }}
          >
            {tags.map((tag, tagIndex) => (
              <TagPill key={`measure-${tag}-${tagIndex}`} data-tag-index={tagIndex}>
                {tag}
              </TagPill>
            ))}
            <TagPill data-more-tag>More</TagPill>
          </div>
        </div>
      </div>
    </article>
  )
}
