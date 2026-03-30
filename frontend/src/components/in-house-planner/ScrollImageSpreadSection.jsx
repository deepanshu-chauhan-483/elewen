import { useRef, useLayoutEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import img1 from '../../assets/images/IMG_9814.jpg'
import img2 from '../../assets/images/IMG_3148.jpg'
import img3 from '../../assets/images/IMG_8625.png'
import img4 from '../../assets/images/6f6af066.jpg'
import img5 from '../../assets/images/IMG_0658.jpg'
import img6 from '../../assets/images/IMG_7025.jpg'
import img7 from '../../assets/images/IMG_0749.jpg'
import img8 from '../../assets/images/IMG_3903.jpg'

gsap.registerPlugin(ScrollTrigger)

// ── Figma collage data ──────────────────────────────────────────────────────
const CANVAS_W = 1438
const CANVAS_H = 802
const MOBILE_QUERY = '(max-width: 540px)'

const getMode = () => {
  if (typeof window === 'undefined') return 'desktop'
  return window.matchMedia?.(MOBILE_QUERY)?.matches ? 'mobile' : 'desktop'
}

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

// Mobile collage (393px-ish) — matches the simple 2-column mosaic shown in designs.
// This is intentionally separate from the desktop Figma-canvas animation.
const MOBILE_SLIDES = [
  {
    id: 'a',
    leftTop: { src: img6, alt: 'Panel Discussion' },
    leftBottom: { src: img7, alt: 'DJ Setup' },
    rightTop: { src: img2, alt: 'Event Decor' },
    rightBottom: { src: img8, alt: 'Car Launch Event' },
  },
  {
    id: 'b',
    leftTop: { src: img1, alt: 'Event Setup' },
    leftBottom: { src: img5, alt: 'Group Photo' },
    rightTop: { src: img3, alt: 'Stage Setup' },
    rightBottom: { src: img4, alt: 'Event Lighting' },
  },
]

// ── Fly-by images: burst through camera and vanish ──────────────────────────
const BASE_IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8]

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
const ScrollImageSpreadSection = () => {
  const flowRef = useRef(null)
  const flyRefs = useRef([])
  const figmaRefs = useRef([])
  const bgRef = useRef(null)
  const whiteRef = useRef(null)
  const labelRef = useRef(null)

  const collageWrapRef = useRef(null)
  const mobileCarouselRef = useRef(null)
  const mobileScrollRafRef = useRef(0)
  const [mobileSlide, setMobileSlide] = useState(0)

  const [mode, setMode] = useState(getMode)

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = e => setMode(e.matches ? 'mobile' : 'desktop')

    // Subscribe (initial value is already derived from useState(getMode))
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  // Mobile: static scaled collage, no pinning (desktop animation remains untouched)
  useLayoutEffect(() => {
    if (mode !== 'mobile') return

    const root = flowRef.current
    const wrap = collageWrapRef.current
    if (!root || !wrap) return

    const ctx = gsap.context(() => {
      if (whiteRef.current) gsap.set(whiteRef.current, { opacity: 0 })
    }, flowRef)

    return () => {
      ctx.revert()
    }
  }, [mode])

  useLayoutEffect(() => {
    if (mode !== 'mobile') return

    const el = mobileCarouselRef.current
    if (!el) return

    const update = () => {
      const w = el.clientWidth || 1
      const next = Math.round(el.scrollLeft / w)
      setMobileSlide(Math.max(0, Math.min(MOBILE_SLIDES.length - 1, next)))
    }

    update()
    return () => {
      if (mobileScrollRafRef.current) cancelAnimationFrame(mobileScrollRafRef.current)
      mobileScrollRafRef.current = 0
    }
  }, [mode])

  // Desktop: existing pinned animation (kept as-is, but gated by mode)
  useLayoutEffect(() => {
    if (mode !== 'desktop') return

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
        figmaImgs.forEach(img => gsap.set(img, { x: 0, y: 0, z: -1000, scale: 0, force3D: true }))
        if (whiteRef.current) gsap.set(whiteRef.current, { opacity: 0 })
      }

      resetAll()

      // Figma images start overlapping with the last fly-bys (no dead gap)
      const FIGMA_START = 0.28
      const WHITE_FADE_START = FIGMA_START
      const WHITE_FADE_END = 0.92
      const WHITE_FADE_RANGE = WHITE_FADE_END - WHITE_FADE_START
      const easeWhite = gsap.parseEase('power2.out')

      st = ScrollTrigger.create({
        trigger: flowEl,
        start: 'top top',
        end: () => `+=${window.innerHeight * 1}`,
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
              z: gsap.utils.interpolate(-1000, 0, imgP),
              scale: gsap.utils.interpolate(0, fp.scale, imgP),
              force3D: true,
            })
          })

          // ── Fade out label once scroll begins ───────────────────────────
          if (labelRef.current) {
            gsap.set(labelRef.current, { opacity: gsap.utils.clamp(0, 1, 1 - p * 4) })
          }

          // ── Fade to white as soon as the final Figma image has settled ──
          if (whiteRef.current) {
            const t = gsap.utils.clamp(0, 1, (p - WHITE_FADE_START) / WHITE_FADE_RANGE)
            gsap.set(whiteRef.current, { opacity: easeWhite(t) })
          }
        },
      })
    }, flowRef)

    return () => {
      st?.kill()
      ctx.revert()
    }
  }, [mode])

  return (
    <section
      ref={flowRef}
      className={
        mode === 'mobile'
          ? 'relative w-full overflow-hidden font-sans pt-8 pb-14 bg-[#F7F7F5]'
          : 'w-full h-screen relative overflow-hidden font-sans'
      }
    >
      {/* Background */}
      <div
        ref={bgRef}
        className={
          mode === 'mobile' ? 'absolute inset-0 bg-[#F7F7F5]' : 'absolute inset-0 bg-[#bfac9b]'
        }
      />
      {/* White overlay — fades in at end to bridge smoothly to next section */}
      <div
        ref={whiteRef}
        className="absolute inset-0 bg-white opacity-0 pointer-events-none"
        style={{ zIndex: mode === 'mobile' ? 20 : 1 }}
      />

      {mode === 'mobile' ? (
        <div className="relative z-10 px-4">
          <div ref={collageWrapRef} className="w-full max-w-[540px] mx-auto">
            <div
              ref={mobileCarouselRef}
              className="[&::-webkit-scrollbar]:hidden flex overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-stop:always]"
              onScroll={() => {
                if (mobileScrollRafRef.current) return
                mobileScrollRafRef.current = requestAnimationFrame(() => {
                  mobileScrollRafRef.current = 0
                  const el = mobileCarouselRef.current
                  if (!el) return
                  const w = el.clientWidth || 1
                  const next = Math.round(el.scrollLeft / w)
                  setMobileSlide(Math.max(0, Math.min(MOBILE_SLIDES.length - 1, next)))
                })
              }}
            >
              {MOBILE_SLIDES.map(s => (
                <div key={s.id} className="w-full shrink-0 snap-center px-2 mt-4">
                  <div className="w-full rounded-[15px] overflow-hidden shadow-lg">
                    <div className="grid grid-cols-[2fr_1fr] grid-rows-3 gap-1 h-[min(78vw,370px)]">
                      {/* Big (top-left) */}
                      <div className="relative overflow-hidden rounded-[16px] bg-white/5 ring-1 ring-white/10 row-span-2 row-start-1 col-start-1">
                        <img
                          src={s.leftTop.src}
                          alt={s.leftTop.alt}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      {/* Small (top-right) */}
                      <div className="relative overflow-hidden rounded-[16px] bg-white/5 ring-1 ring-white/10 row-start-1 col-start-2">
                        <img
                          src={s.rightTop.src}
                          alt={s.rightTop.alt}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      {/* Small (bottom-left) */}
                      <div className="relative overflow-hidden rounded-[16px] bg-white/5 ring-1 ring-white/10 row-start-3 col-start-1">
                        <img
                          src={s.leftBottom.src}
                          alt={s.leftBottom.alt}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      {/* Big (bottom-right) */}
                      <div className="relative overflow-hidden rounded-[16px] bg-white/5 ring-1 ring-white/10 row-span-2 row-start-2 col-start-2">
                        <img
                          src={s.rightBottom.src}
                          alt={s.rightBottom.alt}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slide indicator (matches the small bars shown under the collage) */}
            <div className="flex justify-center gap-2 mt-4">
              {MOBILE_SLIDES.map((s, idx) => (
                <button
                  key={`dot-${s.id}`}
                  type="button"
                  aria-label={`Go to collage ${idx + 1}`}
                  onClick={() => {
                    const el = mobileCarouselRef.current
                    if (!el) return
                    const w = el.clientWidth || 1
                    el.scrollTo({ left: w * idx, behavior: 'smooth' })
                  }}
                  className={
                    idx === mobileSlide
                      ? 'w-[26px] h-[6px] rounded-full bg-[#CDB17E] opacity-100'
                      : 'w-[10px] h-[6px] rounded-full bg-[#D9D9D9] opacity-70'
                  }
                />
              ))}
            </div>

            {/* Mobile text (as per screenshot) */}
            <div className="mt-10">
              <h2
                className="text-[#2D2D2D] text-[32px] leading-[1.05] font-serif"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                What we do as your In-House Planner
              </h2>
              <p className="mt-4 text-[#2D2D2D] opacity-60 text-[14px] leading-[1.7]">
                We handle everything from the first conversation to the final wrap-up, understanding
                your vision, planning the concept and showflow, coordinating vendors and production,
                guiding styling and creative direction, and managing timelines, approvals, and
                execution so you can simply be present and enjoy the event.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Centre label — fades on scroll */}
          <div
            ref={labelRef}
            className="absolute inset-0 z-20 flex items-center justify-center text-center pointer-events-none px-6"
          >
            <p
              className="text-white opacity-80 text-[clamp(1.5rem,5vw,2rem)] leading-[1.2] tracking-[0.05em] font-serif"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              In House Event Planner
              <br />
              <span className="text-[clamp(0.9rem,2vw,1.1rem)] opacity-60 tracking-widest uppercase">
                scroll to discover
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
                <img
                  src={BASE_IMAGES[i % BASE_IMAGES.length]}
                  alt={`Event photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {/* ── Figma landing images: painted last (always on top) ─── */}
            {IMAGE_DATA.map((img, i) => (
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
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default ScrollImageSpreadSection
