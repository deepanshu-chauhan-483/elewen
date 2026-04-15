import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function ImageDots({ count, currentIndex = 0 }) {
  if (count <= 1) return null

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 z-10">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-[6px] w-[6px] rounded-full transition-all ${
            i === currentIndex ? 'bg-white scale-110' : 'bg-white/60'
          }`}
        />
      ))}
    </div>
  )
}

function EventCarouselArrow({ direction = 'left' }) {
  const rotationClass = direction === 'right' ? '' : 'rotate-180'

  return (
    <svg
      viewBox="0 0 22 22"
      className={`h-9 w-9 ${rotationClass}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PackageCard({ pkg }) {
  const images = pkg.images || []
  const [currentIndex, setCurrentIndex] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  const currentImage = images.length > 0 ? images[currentIndex] : null
  const packageId = String(pkg.documentId ?? pkg.id ?? pkg.title)
    .trim()
    .toLowerCase()
  const serviceSlug =
    pkg.serviceSlug || new URLSearchParams(location.search).get('service') || 'decor'
  const packageHref = `/packages/${serviceSlug}/${packageId}${location.search || ''}`

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => navigate(packageHref)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate(packageHref)
        }
      }}
      className="flex min-h-[380px] cursor-pointer flex-col rounded-[8px] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-[6px] bg-[#E8E2DA]">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`${pkg.title} - ${currentIndex + 1}`}
            className="h-[280px] w-full object-cover"
          />
        ) : (
          <div className="h-[158px] w-full bg-[linear-gradient(135deg,#f0e8df_0%,#e4d7c8_100%)]" />
        )}

        {/* Price Tag */}
        <div className="absolute right-3 top-3 z-30 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#4B4B4B] ">
          Starting from {pkg.price}
        </div>

        {/* Left Navigation Button - Tall Half Circle */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={event => {
              event.stopPropagation()
              goToPrevious()
            }}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 z-20 hidden h-[41px] w-[20px]  -translate-y-1/2 items-center justify-end rounded-r-full bg-[#E6DDD3] pl-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45 md:flex"
            aria-label="Previous image"
          >
            <EventCarouselArrow direction="left" />
          </button>
        )}

        {/* Right Navigation Button - Tall Half Circle */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={event => {
              event.stopPropagation()
              goToNext()
            }}
            disabled={currentIndex === images.length - 1}
            className="absolute right-0 top-1/2 z-20 hidden h-[41px] w-[20px] -translate-y-1/2 items-center justify-center rounded-l-full bg-[#E6DDD3] pr-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45 md:flex"
            aria-label="Next image"
          >
            <EventCarouselArrow direction="right" />
          </button>
        )}

        {/* Image Dots */}
        <ImageDots count={images.length} currentIndex={currentIndex} />
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[16px] font-medium leading-[1.3] text-[#2D2D2D]">{pkg.title}</h3>
          <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[12px] text-[#2D2D2D]">
            {pkg.category || 'Package'}
          </span>
        </div>

        <p className="mt-2 text-[12px] leading-[1.45] text-[#767676]">{pkg.description}</p>

        <div className="mt-3">
          <p className="text-[12px] font-medium text-[#2D2D2D]">Includes :</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(pkg.tags ?? []).slice(0, 5).map((tag, i) => (
              <span
                key={i}
                className="rounded-[4px] bg-black/5 px-2 py-1 text-[12px] leading-none text-[#2D2D2D]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
