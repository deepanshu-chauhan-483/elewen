import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroPreloader from './HeroPreloader'
import { useLenis } from '../../useLenis'

gsap.registerPlugin(ScrollTrigger)

// ── helpers ──────────────────────────────────────────────────────────────────
const c01 = v => Math.max(0, Math.min(1, v))
const lerp = (a, b, t) => a + (b - a) * t
const sub = (p, start, end) => c01((p - start) / (end - start))

// ── banner text content ───────────────────────────────────────────────────────
const G = '\u2002'
const SOLID = { color: '#591902' }
const OUTLINE = { color: 'transparent', WebkitTextStroke: '2px #591902' }

const BAND1_TOKENS = [
  'PLAN DIFFERENTLY',
  '*',
  'ELEWEN',
  '*',
  'PLAN DIFFERENTLY',
  '*',
  'ELEWEN',
  '*',
]
const BAND2_TOKENS = [
  'WORK MADE EASY',
  '*',
  'WORTH THE SPEND',
  '*',
  'WORK MADE EASY',
  '*',
  'WORTH THE SPEND',
  '*',
]
const BAND3_TOKENS = [
  'WELL-VETTED VENDORS',
  '*',
  'MADE REAL',
  '*',
  'WELL-VETTED VENDORS',
  '*',
  'MADE REAL',
  '*',
]

const renderBandCopy = tokens => {
  const items = []
  let idx = 0
  for (let r = 0; r < 4; r++) {
    tokens.forEach((token, ti) => {
      const style = Math.floor(ti / 2) % 2 === 0 ? SOLID : OUTLINE
      items.push(
        <span key={idx} style={style}>
          {token}
        </span>
      )
      items.push(G)
      idx++
    })
  }
  return items
}

// ─────────────────────────────────────────────────────────────────────────────

const PRELOADER_DONE_KEY = 'elewen-preloader-done'

const HeroSection = () => {
  const wrapperRef = useRef(null)
  const preloaderRef = useRef(null)
  const darkOverlayRef = useRef(null)
  const videoWrapperRef = useRef(null)
  const contentRef = useRef(null)
  const lenisRef = useLenis()

  // Motion refs
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ctaArrowRef = useRef(null)
  const ctaLine1Ref = useRef(null)
  const ctaLine2Ref = useRef(null)

  const leftWRefs = useRef([])
  const leftLine1Refs = useRef([])
  const leftLine2Refs = useRef([])
  const leftLine3Refs = useRef([])

  const cardRefs = useRef([])

  function initHeroAnimations() {
    const dk = darkOverlayRef.current
    const vw = videoWrapperRef.current
    const cr = contentRef.current
    if (!dk || !vw || !cr) return () => {}

    const lc = preloaderRef.current?.containerEl()
    const li = preloaderRef.current?.imgEl()

    const getEnd = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      const eW = W * 0.4
      const eH = H * 0.6
      return { eW, eH, eL: (W - eW) / 2, eT: H - eH - 40 }
    }

    const W0 = window.innerWidth
    const H0 = window.innerHeight

    // Base layout & render state
    const s = {
      logoScale: 1,
      darkAlpha: 1,
      vidTop: H0,
      vidLeft: 0,
      vidW: W0,
      vidH: H0,
      vidTopR: 1200,
      vidR: 0,
      vidScale: 1.05,
      contentOpacity: 1,
      contentY: 0,
      // Per-element scroll-out state (reverse of load animation)
      scrollProgress: 0,
      loadComplete: false,
      scrollOut: {
        eyebrow: { opacity: 1, y: 0 },
        heading: { opacity: 1, y: 0 },
        ctaArrow: { opacity: 1, x: 0, scale: 1 },
        ctaLine1: { opacity: 1, y: 0 },
        ctaLine2: { opacity: 1, y: 0 },
        leftW: { opacity: 1, x: 0 },
        leftLine1: { opacity: 1, y: 0 },
        leftLine2: { opacity: 1, y: 0 },
        leftLine3: { opacity: 1, y: 0 },
        card0: { opacity: 1, y: 0 },
        card1: { opacity: 1, y: 0 },
        card2: { opacity: 1, y: 0 },
      },
    }

    let rafId

    // ── React 18 Strict Mode Fix: Wrap in gsap.context() ──
    let ctx = gsap.context(() => {
      // Temporarily ignoring sessionStorage so the preloader is always visible during development
      // const alreadyDone = sessionStorage.getItem(PRELOADER_DONE_KEY)
      // const skipPreloader = alreadyDone && !forceFullAnim()
      const skipPreloader = false

      // Gather elements for initial state setup (filter nulls — refs may not be ready on first paint)
      const motionElements = [
        eyebrowRef.current,
        headingRef.current,
        ctaArrowRef.current,
        ctaLine1Ref.current,
        ctaLine2Ref.current,
        ...(leftWRefs.current || []),
        ...(leftLine1Refs.current || []),
        ...(leftLine2Refs.current || []),
        ...(leftLine3Refs.current || []),
        ...(cardRefs.current || []),
      ].filter(Boolean)

      if (skipPreloader) {
        if (lc) lc.style.opacity = '0'
        s.vidTop = 0
        s.vidTopR = 0
        s.vidScale = 1
        s.darkAlpha = 1
        window.dispatchEvent(new Event('hero-preloader-done'))
        window.dispatchEvent(new Event('hero-header-enter'))
      }

      // Always run content animations (so motion is visible on every visit)
      if (motionElements.length > 0) {
        // Apply starting states immediately to prevent flashes
        gsap.set(motionElements, { opacity: 0 })

        // Motion tokens (seconds)
        const durMedium = 0.3 // mot-duration-medium (300ms)
        const durLayoutMd = 0.5 // mot-duration-layout-md (500ms)
        const durLayoutLg = 0.7 // mot-duration-layout-lg (700ms)
        const easeEnter = 'cubic-bezier(0,0,0.2,1)' // mot-easing-enter
        const easeStandard = 'cubic-bezier(0.4,0,0.2,1)' // mot-easing-standard

        // Hero media starts at 3s; text/cards delayed +1s so they begin at 4s.
        const contentStart = skipPreloader ? 0 : 2.0

        const tl = gsap.timeline({
          delay: skipPreloader ? 0 : 2, // Hold preloader for 2s, then 1s exit = 3s total
          onComplete: () => {
            s.loadComplete = true
            sessionStorage.setItem(PRELOADER_DONE_KEY, '1')
            window.dispatchEvent(new Event('hero-preloader-done'))
          },
        })

        if (!skipPreloader) {
          // Last 1s: zoom in → zoom out → fade
          tl.to(s, { logoScale: 1.25, duration: 0.33, ease: easeStandard }, 0)
          tl.to(s, { logoScale: 0.9, duration: 0.33, ease: easeEnter }, 0.33)
          // Preloader fade out lasts 300ms and completes 100ms before hero media starts.
          if (lc)
            tl.to(
              lc,
              {
                opacity: 0,
                duration: durMedium,
                ease: easeStandard,
                onComplete: () => window.dispatchEvent(new Event('hero-preloader-done')),
              },
              0.6
            )
          tl.to(
            s,
            { vidTop: 0, vidTopR: 0, vidScale: 1, duration: durLayoutLg, ease: easeEnter },
            1.0
          )
        }

        // Content stagger per motion template (delays in seconds)
        const add = (el, from, to, delay) => el && tl.fromTo(el, from, to, delay)
        add(
          eyebrowRef.current,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: durMedium, ease: easeEnter },
          contentStart + 0
        )
        add(
          headingRef.current,
          { y: 80, opacity: 0 },
          { y: 0, opacity: 1, duration: durLayoutMd, ease: easeEnter },
          contentStart + 0.08
        )
        add(
          ctaArrowRef.current,
          { x: -16, scale: 0.95, opacity: 0 },
          { x: 0, scale: 1, opacity: 1, duration: durMedium, ease: easeStandard },
          contentStart + 0.16
        )
        add(
          ctaLine1Ref.current,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: durMedium, ease: easeEnter },
          contentStart + 0.2
        )
        add(
          ctaLine2Ref.current,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: durMedium, ease: easeEnter },
          contentStart + 0.26
        )
        leftWRefs.current?.length &&
          tl.fromTo(
            leftWRefs.current,
            { x: -16, opacity: 0 },
            { x: 0, opacity: 1, duration: durMedium, ease: easeEnter },
            contentStart + 0.22
          )
        leftLine1Refs.current?.length &&
          tl.fromTo(
            leftLine1Refs.current,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: durMedium, ease: easeEnter },
            contentStart + 0.26
          )
        leftLine2Refs.current?.length &&
          tl.fromTo(
            leftLine2Refs.current,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: durMedium, ease: easeEnter },
            contentStart + 0.3
          )
        leftLine3Refs.current?.length &&
          tl.fromTo(
            leftLine3Refs.current,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: durMedium, ease: easeEnter },
            contentStart + 0.34
          )
        cardRefs.current?.[0] &&
          add(
            cardRefs.current[0],
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: durLayoutMd, ease: easeEnter },
            contentStart + 0.32
          )
        cardRefs.current?.[1] &&
          add(
            cardRefs.current[1],
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: durLayoutMd, ease: easeEnter },
            contentStart + 0.42
          )
        cardRefs.current?.[2] &&
          add(
            cardRefs.current[2],
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: durLayoutMd, ease: easeEnter },
            contentStart + 0.52
          )
      }

      // Config: reverse of load animation. Order = scroll-out order (last to appear = first to disappear).
      // Each gets 1/12 of the 0–textCardsEnd range (expanded for slower, smoother scroll-out).
      const scrollOutConfig = [
        { key: 'card2', start: 0, end: 0.021, y: 40 },
        { key: 'card1', start: 0.021, end: 0.042, y: 40 },
        { key: 'leftLine3', start: 0.042, end: 0.063, y: 8 },
        { key: 'card0', start: 0.063, end: 0.083, y: 40 },
        { key: 'leftLine2', start: 0.083, end: 0.104, y: 8 },
        { key: 'leftLine1', start: 0.104, end: 0.125, y: 8 },
        { key: 'ctaLine2', start: 0.125, end: 0.146, y: 16 },
        { key: 'leftW', start: 0.146, end: 0.167, x: -16 },
        { key: 'ctaLine1', start: 0.167, end: 0.188, y: 16 },
        { key: 'ctaArrow', start: 0.188, end: 0.208, x: -16, scale: 0.95 },
        { key: 'heading', start: 0.208, end: 0.229, y: 80 },
        { key: 'eyebrow', start: 0.229, end: 0.25, y: 16 },
      ]

      const scrollOutLerp = (p, cfg) => {
        const t = sub(p, cfg.start, cfg.end)
        const opacity = lerp(1, 0, t)
        const y = cfg.y != null ? lerp(0, cfg.y, t) : 0
        const x = cfg.x != null ? lerp(0, cfg.x, t) : 0
        const scale = cfg.scale != null ? lerp(1, cfg.scale, t) : 1
        return { opacity, y, x, scale }
      }

      // ── ScrollTrigger: phases 2-3 ───────────────────────────────────────────
      const scrubSmooth = 3.5
      const textCardsEnd = 0.25
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: scrubSmooth,
        onUpdate({ progress: p }) {
          const { eW, eH, eL, eT } = getEnd()
          const W = window.innerWidth
          const H = window.innerHeight

          s.scrollProgress = p

          // Phase 2: Per-element reverse animation (reverse of load)
          scrollOutConfig.forEach(cfg => {
            const v = scrollOutLerp(p, cfg)
            s.scrollOut[cfg.key] = v
          })
          s.contentOpacity = lerp(1, 0, sub(p, 0.0, textCardsEnd))
          s.contentY = lerp(0, -50, sub(p, 0.0, textCardsEnd))

          // Phase 3: Video shrinks to bottom layout
          const shrinkP = sub(p, 0.12, 0.85)
          s.vidTop = lerp(0, eT, shrinkP)
          s.vidLeft = lerp(0, eL, shrinkP)
          s.vidW = lerp(W, eW, shrinkP)
          s.vidH = lerp(H, eH, shrinkP)
          s.vidR = lerp(0, 16, shrinkP)

          s.darkAlpha = lerp(1, 0, sub(p, 0.12, 0.4))
        },
      })
    }, wrapperRef) // Scope context to this specific component

    const applyScrollOut = (el, so) => {
      if (!el) return
      el.style.opacity = so.opacity
      const parts = []
      if (so.y) parts.push(`translateY(${so.y}px)`)
      if (so.x) parts.push(`translateX(${so.x}px)`)
      if (so.scale !== 1) parts.push(`scale(${so.scale})`)
      el.style.transform = parts.length ? parts.join(' ') : 'none'
    }

    // ── RAF render loop ───────────────────────────────────────────────────────
    const render = () => {
      if (li) li.style.transform = `scale(${s.logoScale})`

      dk.style.opacity = s.darkAlpha

      const topR = s.vidTopR + s.vidR
      vw.style.top = `${s.vidTop}px`
      vw.style.left = `${s.vidLeft}px`
      vw.style.width = `${s.vidW}px`
      vw.style.height = `${s.vidH}px`
      vw.style.borderRadius = `${topR}px ${topR}px ${s.vidR}px ${s.vidR}px`
      vw.style.transform = s.vidScale !== 1 ? `scale(${s.vidScale})` : 'none'

      cr.style.transform = `translateY(${s.contentY}px)`
      const anyVisible = Object.values(s.scrollOut).some(so => so.opacity > 0.05)
      cr.style.pointerEvents = anyVisible ? 'auto' : 'none'

      // Only apply scroll-out after load animation completes — avoids overwriting GSAP
      if (s.loadComplete) {
        applyScrollOut(eyebrowRef.current, s.scrollOut.eyebrow)
        applyScrollOut(headingRef.current, s.scrollOut.heading)
        applyScrollOut(ctaArrowRef.current, s.scrollOut.ctaArrow)
        applyScrollOut(ctaLine1Ref.current, s.scrollOut.ctaLine1)
        applyScrollOut(ctaLine2Ref.current, s.scrollOut.ctaLine2)
        ;[leftWRefs.current[0], leftWRefs.current[1]]
          .filter(Boolean)
          .forEach(el => applyScrollOut(el, s.scrollOut.leftW))
        ;[leftLine1Refs.current[0], leftLine1Refs.current[1]]
          .filter(Boolean)
          .forEach(el => applyScrollOut(el, s.scrollOut.leftLine1))
        ;[leftLine2Refs.current[0], leftLine2Refs.current[1]]
          .filter(Boolean)
          .forEach(el => applyScrollOut(el, s.scrollOut.leftLine2))
        ;[leftLine3Refs.current[0], leftLine3Refs.current[1]]
          .filter(Boolean)
          .forEach(el => applyScrollOut(el, s.scrollOut.leftLine3))
        ;[0, 1, 2].forEach(
          i => cardRefs.current?.[i] && applyScrollOut(cardRefs.current[i], s.scrollOut[`card${i}`])
        )
      }

      rafId = requestAnimationFrame(render)
    }
    render()

    return () => {
      ctx.revert() // Wipes the slate clean on unmount, fixing Strict Mode issues
      cancelAnimationFrame(rafId)
    }
  }

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      const lenis = lenisRef?.current
      if (lenis) lenis.scrollTo(0, { immediate: true })
    }

    const getScrollY = () =>
      window.scrollY ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0

    let cancelled = false
    let teardown = () => {}
    let timeoutIds = []

    const runSetup = () => {
      if (cancelled) return
      scrollToTop()
      ScrollTrigger.refresh()
      teardown = initHeroAnimations()
    }

    const waitForScrollZero = (attempt = 0, maxAttempts = 30) => {
      if (cancelled) return
      scrollToTop()
      const y = getScrollY()
      if (y < 5 || attempt >= maxAttempts) {
        runSetup()
        const t = setTimeout(() => {
          if (cancelled) return
          scrollToTop()
          ScrollTrigger.refresh()
        }, 200)
        timeoutIds.push(t)
        return
      }
      const t = setTimeout(() => waitForScrollZero(attempt + 1, maxAttempts), 50)
      timeoutIds.push(t)
    }

    scrollToTop()
    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        waitForScrollZero()
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
      timeoutIds.forEach(id => clearTimeout(id))
      teardown()
    }
  }, [lenisRef])

  // ── band wrapper style ────────────────────────────────────────────────────
  const bandWrap = top => ({
    position: 'absolute',
    top,
    left: '-10%',
    width: '160%',
    overflow: 'hidden',
    transform: 'rotate(-10deg)',
    transformOrigin: 'center center',
    pointerEvents: 'none',
    userSelect: 'none',
  })

  const bandFont = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '120px',
    lineHeight: '120%',
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} style={{ height: '420vh' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          backgroundColor: '#bfac9b',
          overflow: 'hidden',
        }}
      >
        {/* ── z-10: diagonal infinite-scrolling banner text ─────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden' }}>
          <div style={bandWrap('10%')}>
            <div className="band-scroll dir-left" style={bandFont}>
              {renderBandCopy(BAND1_TOKENS)}
              {renderBandCopy(BAND1_TOKENS)}
            </div>
          </div>
          <div style={bandWrap('27%')}>
            <div className="band-scroll dir-right" style={bandFont}>
              {renderBandCopy(BAND2_TOKENS)}
              {renderBandCopy(BAND2_TOKENS)}
            </div>
          </div>
          <div style={bandWrap('44%')}>
            <div className="band-scroll dir-left" style={bandFont}>
              {renderBandCopy(BAND3_TOKENS)}
              {renderBandCopy(BAND3_TOKENS)}
            </div>
          </div>
        </div>

        {/* ── z-15: dark overlay ───────────────────────────────────────────── */}
        <div
          ref={darkOverlayRef}
          style={{ position: 'absolute', inset: 0, zIndex: 15, backgroundColor: '#bfac9b' }}
        />

        {/* ── z-20: video ──────────────────────────────────────────────────── */}
        <div
          ref={videoWrapperRef}
          style={{
            position: 'absolute',
            top: '100vh',
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 20,
            overflow: 'hidden',
            borderRadius: 0,
            willChange: 'top, left, width, height, border-radius, transform',
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src="/HeroVideo.mp4" type="video/mp4" />
          </video>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.22)' }} />
        </div>

        {/* ── z-30: hero content ───────────────────────────────────────────── */}
        <div
          ref={contentRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            pointerEvents: 'none',
            color: '#FAFAFA',
          }}
        >
          <main className="absolute inset-0 flex flex-col justify-center items-start md:items-center z-10 pt-14 md:pt-24 px-4 md:px-0">
            <div className="w-full max-w-249.25 text-left md:text-right flex flex-col pr-0 md:pr-8 lg:pr-0">
              <span
                ref={eyebrowRef}
                className="text-[38px] md:text-[48px] leading-none"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                IT&apos;S TIME TO
              </span>
              <span
                ref={headingRef}
                className="text-[54px] md:text-[96px] leading-[1.05] md:leading-none mt-2"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                PLAN DIFFERENTLY
              </span>
            </div>

            <div className="w-full max-w-249.25 flex flex-col md:flex-row justify-start md:justify-end items-start md:items-center mt-8 md:mt-12 pr-0 md:pr-12 gap-8 md:gap-0">
              <div className="flex items-center">
                <button
                  ref={ctaArrowRef}
                  className="w-16 h-16 md:w-18 md:h-18 rounded-full border-2 border-white flex items-center justify-center mr-4 md:mr-6 hover:bg-white/20 transition-colors backdrop-blur-sm shrink-0"
                >
                  <svg
                    className="w-8 h-8 text-[#FAFAFA]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <div className="max-w-62.5 text-[15px] md:text-sm font-light leading-relaxed opacity-90 text-left overflow-hidden">
                  <p ref={ctaLine1Ref}>Explore the collection. Your seamless</p>
                  <p ref={ctaLine2Ref}>event is just a few clicks away!</p>
                </div>
              </div>

              {/* Mobile W Left Block */}
              <div className="flex md:hidden items-center mt-2">
                <span
                  ref={el => (leftWRefs.current[1] = el)}
                  className="text-[72px] leading-[0.7] font-serif mr-2"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  W
                </span>
                <div className="flex flex-col justify-center text-[12px] font-medium tracking-wide space-y-0.5 mt-2 overflow-hidden">
                  <p ref={el => (leftLine1Refs.current[1] = el)}>ork made easy</p>
                  <p ref={el => (leftLine2Refs.current[1] = el)}>orth the spend</p>
                  <p ref={el => (leftLine3Refs.current[1] = el)}>ell-vetted vendors</p>
                </div>
              </div>
            </div>
          </main>

          <footer className="absolute bottom-0 w-full flex flex-col md:flex-row items-end justify-between z-20">
            {/* Desktop W Left Block */}
            <div className="hidden md:flex items-center px-10 pb-12">
              <span
                ref={el => (leftWRefs.current[0] = el)}
                className="text-[90px] leading-[0.7] font-serif mr-1"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                W
              </span>
              <div className="flex flex-col justify-center text-sm font-medium tracking-wide space-y-1 mt-3 overflow-hidden">
                <p ref={el => (leftLine1Refs.current[0] = el)}>ork made easy</p>
                <p ref={el => (leftLine2Refs.current[0] = el)}>orth the spend</p>
                <p ref={el => (leftLine3Refs.current[0] = el)}>ell-vetted vendors</p>
              </div>
            </div>

            {/* Cards section */}
            <div className="grid grid-cols-3 md:flex w-full md:w-auto border-t md:border-t-0 border-white/20 bg-black/20 md:bg-transparent backdrop-blur-md md:backdrop-blur-none">
              {[
                {
                  label: 'Birthday',
                  desc: 'Curated décor & catering packages',
                  extra: 'md:rounded-tl-[20px]',
                },
                { label: 'Anniversaries', desc: 'Intimate, elegant setups handled', extra: '' },
                {
                  label: 'House Parties',
                  desc: 'Simple planning. Beautiful execution.',
                  extra: 'md:border-t-0 border-t border-white/20',
                },
              ].map(({ label, desc, extra }, i) => (
                <div
                  key={label}
                  ref={el => (cardRefs.current[i] = el)}
                  className={`col-span-1 md:w-55 h-22.5 md:h-31 md:bg-[#591902]/20 md:backdrop-blur-md relative border-r border-white/20 md:border-white/10 md:border-t hover:bg-[#591902]/30 transition-colors cursor-pointer ${extra}`}
                >
                  <div className="absolute top-4 md:top-5 left-3 md:left-5 right-2 md:right-auto md:w-45 flex flex-col gap-1.5 md:gap-3">
                    <h3
                      className="text-[10px] sm:text-[11px] md:text-sm font-bold tracking-widest uppercase truncate reveal-heading"
                      style={{ fontFamily: "'Malgin', serif" }}
                    >
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{label}</span>
                      </span>
                    </h3>
                    <p className="text-[9px] md:text-xs font-light opacity-90 leading-[1.3] line-clamp-3">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </footer>
        </div>

        {/* ── z-40: preloader overlay ────────────────────────────────────────── */}
        <HeroPreloader ref={preloaderRef} />
      </div>
    </div>
  )
}

export default HeroSection
