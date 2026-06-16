import { useRef, useLayoutEffect, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import PlannerImage from './PlannerImage'

import img1 from '../../assets/images/IMG_9814.jpg'
import img2 from '../../assets/images/IMG_3148.jpg'
import img3 from '../../assets/images/IMG_8625.png'
import img4 from '../../assets/images/6f6af066.jpg'
import img5 from '../../assets/images/IMG_0658.jpg'
import img6 from '../../assets/images/IMG_7025.jpg'
import img7 from '../../assets/images/IMG_0749.jpg'
import img8 from '../../assets/images/IMG_3903.jpg'

gsap.registerPlugin(ScrollTrigger)

const STRAPI_BASE = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'

function toAbsoluteMediaUrl(url) {
  const value = String(url ?? '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `${STRAPI_BASE}${value.startsWith('/') ? value : `/${value}`}`
}

// ── Figma collage data ──────────────────────────────────────────────────────
const CANVAS_W = 1438
const CANVAS_H = 802

const IMAGE_DATA = [
  { src: img1, w: 264, h: 360, left: 124, top: 125, alt: 'Event Setup' },
  { src: img2, w: 252, h: 168, left: 404, top: 67, alt: 'Event Decor' },
  { src: img3, w: 252, h: 234, left: 404, top: 251, alt: 'Stage Setup' },
  { src: img4, w: 235, h: 235, left: 672, top: 125, alt: 'Event Lighting' },
  { src: img5, w: 287, h: 235, left: 923, top: 125, alt: 'Group Photo' },
  { src: img6, w: 373, h: 311, left: 672, top: 374, alt: 'Panel Discussion' },
  { src: img7, w: 400, h: 234, left: 256, top: 501, alt: 'DJ Setup' },
  { src: img8, w: 253, h: 226, left: 1061, top: 374, alt: 'Car Launch Event' },
]

// ── Fly-by images: burst through camera and vanish ──────────────────────────
const BASE_IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8]
const MOBILE_SLIDE_INDEXES = [
  [0, 5, 4, 7],
  [1, 3, 2, 6],
]

// 10 positions — all pushed to the periphery so they never block the centre
const FLY_POS = [
  { x: -0.44, y: -0.36 }, // top-left corner
  { x: 0.44, y: -0.36 }, // top-right corner
  { x: -0.44, y: 0.36 }, // bottom-left corner
  { x: 0.44, y: 0.36 }, // bottom-right corner
  { x: -0.48, y: 0.06 }, // mid-left edge
  { x: 0.48, y: 0.06 }, // mid-right edge
  { x: -0.22, y: -0.43 }, // top edge left
  { x: 0.22, y: -0.43 }, // top edge right
  { x: -0.22, y: 0.43 }, // bottom edge left
  { x: 0.22, y: 0.43 }, // bottom edge right
]

// Random-feeling arrival delays for the 8 Figma images (not evenly spaced)
const FIGMA_DELAYS = [0.04, 0.11, 0.01, 0.08, 0.14, 0.06, 0.1, 0.02]

function getMediaDimensions(media) {
  if (!media || typeof media === 'string') return null

  const width = Number(media.width ?? media.data?.attributes?.width ?? media.attributes?.width)
  const height = Number(media.height ?? media.data?.attributes?.height ?? media.attributes?.height)

  if (!width || !height) return null
  return { width, height }
}

function resolveHeroSrc(media, fallback) {
  if (!media) return fallback
  if (typeof media === 'string') return toAbsoluteMediaUrl(media) || media

  const raw = media.url ?? media.src ?? media.data?.attributes?.url ?? media.attributes?.url ?? ''

  return toAbsoluteMediaUrl(raw) || fallback
}

function resolveCollageFrame(baseW, baseH, media) {
  const dims = getMediaDimensions(media)
  if (!dims) return { w: baseW, h: baseH }

  const slotLandscape = baseW >= baseH
  const mediaLandscape = dims.width >= dims.height

  if (slotLandscape !== mediaLandscape) {
    return { w: baseH, h: baseW }
  }

  return { w: baseW, h: baseH }
}

// Compute where each Figma image centre sits relative to viewport centre
const getFinalPositions = () => {
  const s = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)
  return IMAGE_DATA.map(img => ({
    x: (img.left + img.w / 2 - CANVAS_W / 2) * s,
    y: (img.top + img.h / 2 - CANVAS_H / 2) * s,
    scale: s,
  }))
}

// ── Component ───────────────────────────────────────────────────────────────
const ScrollImageSpreadSection = ({
  mobileHeading,
  mobileBody,
  heroLabel,
  heroSubtext,
  heroImages = [],
}) => {
  const flowRef = useRef(null)
  const flyRefs = useRef([])
  const figmaRefs = useRef([])
  const bgRef = useRef(null)
  const whiteRef = useRef(null)
  const labelRef = useRef(null)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < 540
  )
  const [mobilePage, setMobilePage] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const resolvedImageData = IMAGE_DATA.map((item, index) => {
    const media = heroImages[index]
    const frame = resolveCollageFrame(item.w, item.h, media)

    return {
      ...item,
      src: resolveHeroSrc(media, item.src),
      w: frame.w,
      h: frame.h,
    }
  })
  const resolvedBaseImages = BASE_IMAGES.map((src, index) => resolveHeroSrc(heroImages[index], src))
  const mobileSlides = MOBILE_SLIDE_INDEXES.map(indexes =>
    indexes.map(imageIndex => resolvedImageData[imageIndex])
  )

  const goToMobileSlide = direction => {
    setMobilePage(prev => {
      const total = MOBILE_SLIDE_INDEXES.length
      if (total <= 1) return prev
      return (prev + direction + total) % total
    })
  }

  const handleTouchStart = event => {
    touchStartX.current = event.touches[0].clientX
    touchStartY.current = event.touches[0].clientY
  }

  const handleTouchEnd = event => {
    const endX = event.changedTouches[0].clientX
    const endY = event.changedTouches[0].clientY
    const diffX = touchStartX.current - endX
    const diffY = Math.abs(touchStartY.current - endY)

    if (Math.abs(diffX) > 35 && Math.abs(diffX) > diffY) {
      goToMobileSlide(diffX > 0 ? 1 : -1)
    }
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 540)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useLayoutEffect(() => {
    if (isMobile) return undefined

    let st
    const ctx = gsap.context(() => {
      const flowEl = flowRef.current
      const flyImgs = flyRefs.current.filter(Boolean)
      const figmaImgs = figmaRefs.current.filter(Boolean)
      if (!flowEl || flyImgs.length === 0 || figmaImgs.length === 0) return

      let finalPos = []

      const resetAll = () => {
        finalPos = getFinalPositions()
        flyImgs.forEach(img => gsap.set(img, { x: 0, y: 0, z: -1000, scale: 0, force3D: true }))
        figmaImgs.forEach(img =>
          gsap.set(img, { x: 0, y: 0, scale: 0, rotation: 0, force3D: false })
        )
        if (whiteRef.current) gsap.set(whiteRef.current, { opacity: 0 })
      }

      resetAll()

      // Figma images start overlapping with the last fly-bys (no dead gap)
      const FIGMA_START = 0.28
      // Last image finishes when its delayed start plus animation duration reaches 1.0.
      const FIGMA_SETTLE_PROGRESS = FIGMA_START + Math.max(...FIGMA_DELAYS) + 1 / 5
      const WHITE_FADE_END = 0.85
      const WHITE_FADE_RANGE = WHITE_FADE_END - FIGMA_SETTLE_PROGRESS

      st = ScrollTrigger.create({
        trigger: flowEl,
        start: 'top top',
        end: () => `+=${window.innerHeight * 3}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        onRefresh: resetAll,
        onUpdate: self => {
          const p = self.progress
          const sw = window.innerWidth
          const sh = window.innerHeight

          // ── Phase 1: fly-by images burst out and fly through the screen ──
          flyImgs.forEach((img, i) => {
            const pos = FLY_POS[i]
            const imgP = gsap.utils.clamp(0, 1, Math.max(0, (p - i * 0.03) * 4))
            gsap.set(img, {
              x: imgP * pos.x * sw,
              y: imgP * pos.y * sh,
              z: -1000 + imgP * 3000, // -1000 → 2000 (past camera → culled)
              scale: imgP,
              force3D: true,
            })
          })

          // ── Phase 2: Figma images fly in and land at collage positions ───
          // With FIGMA_START + delays and ×5 speed, final settle is ~p=0.62.
          figmaImgs.forEach((img, i) => {
            const fp = finalPos[i]
            const imgP = gsap.utils.clamp(
              0,
              1,
              Math.max(0, (p - FIGMA_START - FIGMA_DELAYS[i]) * 5)
            )
            gsap.set(img, {
              x: imgP * fp.x,
              y: imgP * fp.y,
              scale: gsap.utils.interpolate(0, fp.scale, imgP),
              rotation: 0,
              force3D: false,
            })
          })

          // ── Fade out label once scroll begins ───────────────────────────
          if (labelRef.current) {
            gsap.set(labelRef.current, { opacity: gsap.utils.clamp(0, 1, 1 - p * 4) })
          }

          // ── Fade to white as soon as the final Figma image has settled ──
          if (whiteRef.current) {
            gsap.set(whiteRef.current, {
              opacity: gsap.utils.clamp(0, 1, (p - FIGMA_SETTLE_PROGRESS) / WHITE_FADE_RANGE),
            })
          }
        },
      })
    }, flowRef)

    return () => {
      st?.kill()
      ctx.revert()
    }
  }, [isMobile])

  if (isMobile) {
    const activeSlide = mobileSlides[mobilePage] ?? mobileSlides[0]

    return (
      <section className="w-full bg-[#FFFFFF] font-sans pt-24 pb-14">
        <div className="mx-auto w-full max-w-[430px] px-2">
          <div
            className="mobile-swipe-surface flex flex-col justify-center mx-auto w-full grid h-[min(74vw,278px)] grid-cols-[1.72fr_0.94fr] gap-1"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid min-h-0 grid-rows-[1.52fr_0.86fr] gap-1">
              <div className="relative overflow-hidden rounded-[10px] bg-[#F5F5F5]">
                <PlannerImage
                  src={activeSlide[0]?.src}
                  alt={activeSlide[0]?.alt ?? 'Planner showcase'}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="relative overflow-hidden rounded-[10px] bg-[#F5F5F5]">
                <PlannerImage
                  src={activeSlide[2]?.src}
                  alt={activeSlide[2]?.alt ?? 'Planner showcase'}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="grid min-h-0 grid-rows-2 gap-1">
              <div className="relative overflow-hidden rounded-[10px] bg-[#F5F5F5]">
                <PlannerImage
                  src={activeSlide[1]?.src}
                  alt={activeSlide[1]?.alt ?? 'Planner showcase'}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="relative overflow-hidden rounded-[10px] bg-[#F5F5F5]">
                <PlannerImage
                  src={activeSlide[3]?.src}
                  alt={activeSlide[3]?.alt ?? 'Planner showcase'}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
            {mobileSlides.map((_, idx) => {
              const isActive = idx === mobilePage
              return (
                <span
                  key={`planner-mobile-dot-${idx}`}
                  className={`h-2 rounded-full transition-all ${
                    isActive ? 'w-6 bg-[#7A2D06]' : 'w-3 bg-[#D0D0D0]'
                  }`}
                />
              )
            })}
          </div>

          <h1
            className="mt-10 max-w-[340px] text-[34px] leading-[0.94] tracking-[-0.02em] text-[#2D2D2D]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            {mobileHeading ?? 'What we do as your In-House Planner'}
          </h1>

          <p className="mt-8 max-w-[353px] text-[14px] leading-[1.55] text-[#2D2D2D] opacity-70">
            {mobileBody ??
              'We handle everything from the first conversation to the final wrap-up, understanding your vision, planning the concept and showflow, coordinating vendors and production, guiding styling and creative direction, and managing timelines, approvals, and execution so you can simply be present and enjoy the event.'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={flowRef}
      data-nav-theme="glass"
      data-nav-surface="transparent"
      className="w-full h-screen relative overflow-hidden font-sans"
    >
      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 bg-[#bfac9b]" />
      {/* White overlay — fades in at end to bridge smoothly to next section */}
      <div ref={whiteRef} className="absolute inset-0 bg-white opacity-0" style={{ zIndex: 1 }} />

      {/* Centre label — fades on scroll */}
      <div
        ref={labelRef}
        className="absolute inset-0 z-20 flex items-center justify-center text-center pointer-events-none px-6"
      >
        <p
          className="text-white opacity-80 text-[clamp(1.5rem,5vw,2rem)] leading-[1.2] tracking-[0.05em] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {heroLabel ?? 'In House Event Planner'}
          <br />
          <span className="text-[clamp(0.9rem,2vw,1.1rem)] opacity-60 tracking-widest uppercase">
            {heroSubtext ?? 'scroll to discover'}
          </span>
        </p>
      </div>

      {/* 3D perspective stage (no preserve-3d → DOM order determines painting) */}
      <div
        className="absolute inset-0 z-10"
        style={{ perspective: '800px', perspectiveOrigin: '50% 50%' }}
      >
        {/* ── Fly-by images: painted first (behind) ─── */}
        {FLY_POS.map((_, i) => (
          <div
            key={`fly-${i}`}
            ref={el => {
              flyRefs.current[i] = el
            }}
            className="absolute left-1/2 top-1/2 shadow-lg"
            style={{
              width: '500px',
              height: '350px',
              marginLeft: '-250px',
              marginTop: '-175px',
              willChange: 'transform',
            }}
          >
            <PlannerImage
              src={resolvedBaseImages[i % resolvedBaseImages.length]}
              alt={`Event photo ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* ── Figma landing images: painted last (always on top) ─── */}
        {resolvedImageData.map((img, i) => (
          <div
            key={`figma-${i}`}
            ref={el => {
              figmaRefs.current[i] = el
            }}
            className="absolute left-1/2 top-1/2 shadow-md"
            style={{
              width: `${img.w}px`,
              height: `${img.h}px`,
              marginLeft: `${-img.w / 2}px`,
              marginTop: `${-img.h / 2}px`,
              willChange: 'transform',
            }}
          >
            <PlannerImage src={img.src} alt={img.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default ScrollImageSpreadSection
