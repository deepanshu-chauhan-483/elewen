'use client'

import { useState, useRef } from 'react'

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

export default function PackageCard({ pkg }) {
  const images = pkg.images || []
  const [currentIndex, setCurrentIndex] = useState(0)

  const startX = useRef(0)
  const endX = useRef(0)

  const currentImage = images[currentIndex]

  // 🔥 LOOP LOGIC (important)
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
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

  return (
    <article className="flex min-h-[380px] flex-col rounded-[8px] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
      {/* Image Container */}
      <div
        className="relative overflow-hidden rounded-[6px] bg-[#E8E2DA]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img src={currentImage} alt={pkg.title} className="h-[280px] w-full object-cover" />

        {/* Price */}
        <div className="absolute right-3 top-3 z-30 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#4B4B4B]">
          Starting from {pkg.price}
        </div>

        {/* 🔥 LEFT ARROW (DIV STYLE) */}
        {images.length > 1 && (
          <div
            onClick={goToPrevious}
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
            onClick={goToNext}
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
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[16px] font-medium text-[#2D2D2D]">{pkg.title}</h3>
          <span className="rounded-full bg-black/5 px-2 py-1 text-[12px] text-[#2D2D2D]">
            {pkg.category || 'Package'}
          </span>
        </div>

        <p className="mt-2 text-[12px] text-[#767676]">{pkg.description}</p>

        <div className="mt-3">
          <p className="text-[12px] font-medium">Includes :</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(pkg.tags ?? []).slice(0, 5).map((tag, i) => (
              <span
                key={i}
                className="text-[#2D2D2D] px-2 py-1 text-[12px] bg-black/5 rounded-full font-medium"
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
