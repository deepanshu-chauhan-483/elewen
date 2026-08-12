import { useEffect, useRef, useState } from 'react'
import { useNavigate, useNavigationType } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroPreloader from './HeroPreloader'
import { useLandingPage } from '../../hooks/useCmsPages'
import { useLenis } from '../../useLenis'
import { getViewportMode } from '../../utils/viewportMode'
import { waitForHomePageAssets } from '../../utils/homePagePreload'
import HeroVideo from '../../assets/newvideo.mp4'
import {
  getWindowScrollY,
  peekSkipHeroScrollTop,
  rememberHomeScroll,
  shouldPreserveHomeScroll,
} from '../../lib/homeReturnScroll'

gsap.registerPlugin(ScrollTrigger)

// ── helpers ──────────────────────────────────────────────────────────────────
const c01 = v => Math.max(0, Math.min(1, v))
const lerp = (a, b, t) => a + (b - a) * t
const sub = (p, start, end) => c01((p - start) / (end - start))

// ── banner text content ───────────────────────────────────────────────────────
const G = '\u2002'
const SOLID = { color: '#591902' }
const OUTLINE = { color: 'transparent', WebkitTextStroke: '0.1px #591902' }

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

const STRAPI_BASE = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'
const hasSeenHeroPreloader = () =>
  typeof window !== 'undefined' && window.__elewenHeroPreloaderSeen === true

/** iOS Safari often ignores autoPlay when the video starts off-screen (Low Power Mode too). */
const ensureHeroVideoPlaying = videoEl => {
  if (!videoEl) return
  videoEl.muted = true
  videoEl.defaultMuted = true
  videoEl.setAttribute('muted', '')
  videoEl.setAttribute('playsinline', '')
  videoEl.setAttribute('webkit-playsinline', '')
  const playAttempt = videoEl.play()
  if (playAttempt?.catch) playAttempt.catch(() => {})
}

// Use a Vite import so the URL is generated correctly.
const HERO_VIDEO_SRC = HeroVideo
const HERO_LEFT_TAGLINES_FALLBACK = ['Work made easy', 'Worth the spend', 'Well-vetted Vendors']
const HERO_RIGHT_CARDS_FALLBACK = [
  {
    label: 'Birthday',
    tagline: 'Curated décor & catering packages',
    href: '/event-flow/service?category=social&event=birthday-parties&eventId=176',
  },
  {
    label: 'Anniversary',
    tagline: 'Intimate, elegant setups handled end-to-end',
    href: '/event-flow/decor-theme?category=social&event=anniversaries&eventId=178&service=decor&serviceId=123',
  },
  {
    label: 'House Party',
    tagline: 'Simple planning. Beautiful execution.',
    href: '/event-flow/service?category=social&event=house-parties&eventId=188',
  },
]
const getTrailingWWord = (value, fallback) =>
  String(value ?? fallback)
    .trim()
    .replace(/^[Ww]\s*/, '')

const toAbsoluteMediaUrl = url => {
  const value = String(url ?? '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `${STRAPI_BASE}${value.startsWith('/') ? value : `/${value}`}`
}

const getMediaUrl = media => {
  if (!media) return ''
  if (typeof media === 'string') return toAbsoluteMediaUrl(media)
  if (Array.isArray(media)) return getMediaUrl(media[0])

  return toAbsoluteMediaUrl(
    media.url ??
      media.src ??
      media.image?.url ??
      media.data?.url ??
      media.data?.attributes?.url ??
      media.formats?.large?.url ??
      media.formats?.medium?.url ??
      media.formats?.small?.url ??
      media.formats?.thumbnail?.url ??
      ''
  )
}

const buildBandTokens = (tokens, fallbackTokens) => {
  if (!Array.isArray(tokens) || tokens.length < 2) return fallbackTokens

  const [first, second] = tokens
  return [first, '*', second, '*', first, '*', second, '*']
}

const HeroSection = () => {
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const { data: cms = {} } = useLandingPage()
  const hero = cms.hero ?? {}
  const leftTaglines = Array.isArray(hero.left_taglines)
    ? hero.left_taglines
    : HERO_LEFT_TAGLINES_FALLBACK

  // Merge Strapi cards with defaults while preserving the full CMS card list.
  const strapiCards = Array.isArray(hero.right_cards) ? hero.right_cards : []
  const cardCount = Math.max(HERO_RIGHT_CARDS_FALLBACK.length, strapiCards.length)
  const rightCards = Array.from({ length: cardCount }, (_, idx) => {
    const defaultCard = HERO_RIGHT_CARDS_FALLBACK[idx] || {}
    const strapiCard = strapiCards[idx] || {}

    return {
      ...defaultCard,
      ...strapiCard,
      label: strapiCard.label || defaultCard.label || '',
      tagline: strapiCard.tagline || strapiCard.description || defaultCard.tagline || '',
    }
  })
  const bandTokens = Array.isArray(hero.band_tokens) ? hero.band_tokens.filter(Boolean) : []
  const heroBand1Tokens = buildBandTokens(bandTokens.slice(0, 2), BAND1_TOKENS)
  const heroBand2Tokens = buildBandTokens(bandTokens.slice(2, 4), BAND2_TOKENS)
  const heroBand3Tokens = buildBandTokens(bandTokens.slice(4, 6), BAND3_TOKENS)
  const heroVideoSrc =
    getMediaUrl(
      hero.video ??
        hero.hero_video ??
        hero.background_video ??
        hero.media ??
        hero._sectionImages?.find(item =>
          String(item?.mime ?? item?.data?.attributes?.mime ?? '').startsWith('video/')
        ) ??
        hero._sectionImages?.[0]
    ) || HERO_VIDEO_SRC
  const hasSeenPreloader = hasSeenHeroPreloader()
  const [useMobileHeroLayout, setUseMobileHeroLayout] = useState(
    () => getViewportMode().useMobileHeroLayout
  )
  const wrapperRef = useRef(null)
  const preloaderRef = useRef(null)
  const darkOverlayRef = useRef(null)
  const videoWrapperRef = useRef(null)
  const videoRef = useRef(null)
  const videoNaturalRef = useRef({ w: 0, h: 0 })
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
      const H = window.visualViewport?.height ?? window.innerHeight
      const useMobileLayout = getViewportMode().useMobileHeroLayout

      const eW = useMobileLayout ? W * 0.85 : W * 0.4
      const eH = useMobileLayout ? eW * 1.2 : H * 0.6
      const eT = Math.max(H - eH - (useMobileLayout ? 60 : 40), 16)

      return { eW, eH, eL: (W - eW) / 2, eT }
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
      // Keep initial full-screen video corners sharp (no rounded top corners on first load).
      vidTopR: 0,
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
      const skipPreloader = hasSeenHeroPreloader()

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

        const contentStart = skipPreloader ? 0 : 2.0

        const tl = gsap.timeline({
          paused: !skipPreloader,
          onComplete: () => {
            s.loadComplete = true
            if (typeof window !== 'undefined') window.__elewenHeroPreloaderSeen = true
            window.dispatchEvent(new Event('hero-preloader-done'))
          },
        })

        if (!skipPreloader) {
          waitForHomePageAssets({
            videoSrc: heroVideoSrc,
            getVideoEl: () => videoRef.current,
            isCmsReady: () => !!cms.hero,
            onProgress: v => preloaderRef.current?.setProgress(v),
          }).then(() => {
            ensureHeroVideoPlaying(videoRef.current)
            setTimeout(() => tl.play(), 300)
          })

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
            {
              vidTop: 0,
              vidTopR: 0,
              vidScale: 1,
              duration: durLayoutLg,
              ease: easeEnter,
              onStart: () => ensureHeroVideoPlaying(videoRef.current),
              onComplete: () => ensureHeroVideoPlaying(videoRef.current),
            },
            1.0
          )
        } else {
          ensureHeroVideoPlaying(videoRef.current)
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
      const scrollOutConfig = [
        { key: 'card2', start: 0, end: 0.021, y: 40 },
        { key: 'card1', start: 0, end: 0.021, y: 40 },
        { key: 'card0', start: 0, end: 0.021, y: 40 },
        { key: 'leftLine3', start: 0, end: 0.021, y: 8 },
        { key: 'leftLine2', start: 0, end: 0.021, y: 8 },
        { key: 'leftLine1', start: 0, end: 0.021, y: 8 },
        { key: 'leftW', start: 0, end: 0.021, x: -16 },
        { key: 'ctaLine2', start: 0.021, end: 0.042, y: 16 },
        { key: 'ctaLine1', start: 0.042, end: 0.063, y: 16 },
        { key: 'ctaArrow', start: 0.063, end: 0.083, x: -16, scale: 0.95 },
        { key: 'heading', start: 0.083, end: 0.104, y: 80 },
        { key: 'eyebrow', start: 0.104, end: 0.125, y: 16 },
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
      // Low scrub lag + shorter wrapper height ≈ one wheel/swipe to next section.
      const scrubSmooth = true
      const textCardsEnd = 0.125
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: scrubSmooth,
        onUpdate({ progress: p }) {
          const { eW, eH, eL, eT } = getEnd()
          const W = window.innerWidth
          const H = window.innerHeight
          const useMobileLayout = getViewportMode().useMobileHeroLayout

          s.scrollProgress = p

          // Phase 2: Per-element reverse animation (reverse of load)
          scrollOutConfig.forEach(cfg => {
            const v = scrollOutLerp(p, cfg)
            s.scrollOut[cfg.key] = v
          })
          s.contentOpacity = lerp(1, 0, sub(p, 0.04, textCardsEnd))
          s.contentY = lerp(0, -50, sub(p, 0.04, textCardsEnd))

          // Phase 3: Video shrinks to bottom layout
          const shrinkStart = useMobileLayout ? 0.08 : 0.12
          const shrinkP = sub(p, shrinkStart, 0.85)
          s.vidTop = lerp(0, eT, shrinkP)
          s.vidLeft = lerp(0, eL, shrinkP)
          s.vidW = lerp(W, eW, shrinkP)
          s.vidH = lerp(H, eH, shrinkP)
          s.vidR = lerp(0, 16, shrinkP)

          const overlayFadeStart = useMobileLayout ? 0.06 : 0.12
          const overlayFadeEnd = useMobileLayout ? 0.28 : 0.4
          s.darkAlpha = lerp(1, 0, sub(p, overlayFadeStart, overlayFadeEnd))
        },
      })
    }, wrapperRef) // Scope context to this specific component

    const applyScrollOut = (el, so, opacityMul = 1) => {
      if (!el) return
      el.style.opacity = so.opacity * opacityMul
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

      // Manually compute "cover" sizing for the video element. Some source videos
      // (e.g. portrait-oriented clips) aren't fitted correctly by object-fit: cover
      // when the wrapper's aspect ratio swings widely during the shrink animation,
      // leaving letterbox gaps. Sizing explicitly avoids that.
      // Reads videoWidth/videoHeight live (not just the cached onLoadedMetadata
      // value) and falls back to a 16:9 guess before metadata is available, so
      // large/TV displays — where object-fit support or metadata timing can be
      // unreliable — never show a letterboxed video.
      const video = videoRef.current
      if (video) {
        const nat = videoNaturalRef.current
        const natW = video.videoWidth || nat.w || 16
        const natH = video.videoHeight || nat.h || 9
        const coverScale = Math.max(s.vidW / natW, s.vidH / natH)
        video.style.width = `${natW * coverScale}px`
        video.style.height = `${natH * coverScale}px`
      }

      cr.style.transform = `translateY(${s.contentY}px)`
      cr.style.opacity = s.contentOpacity
      cr.style.pointerEvents = s.contentOpacity > 0.1 ? 'auto' : 'none'

      // Only apply scroll-out after load animation completes — avoids overwriting GSAP
      if (s.loadComplete) {
        applyScrollOut(eyebrowRef.current, s.scrollOut.eyebrow, s.contentOpacity)
        applyScrollOut(headingRef.current, s.scrollOut.heading, s.contentOpacity)
        applyScrollOut(ctaArrowRef.current, s.scrollOut.ctaArrow, s.contentOpacity)
        applyScrollOut(ctaLine1Ref.current, s.scrollOut.ctaLine1, s.contentOpacity)
        applyScrollOut(ctaLine2Ref.current, s.scrollOut.ctaLine2, s.contentOpacity)
        ;[leftWRefs.current[0], leftWRefs.current[1]]
          .filter(Boolean)
          .forEach(el => applyScrollOut(el, s.scrollOut.leftW, s.contentOpacity))
        ;[leftLine1Refs.current[0], leftLine1Refs.current[1]]
          .filter(Boolean)
          .forEach(el => applyScrollOut(el, s.scrollOut.leftLine1, s.contentOpacity))
        ;[leftLine2Refs.current[0], leftLine2Refs.current[1]]
          .filter(Boolean)
          .forEach(el => applyScrollOut(el, s.scrollOut.leftLine2, s.contentOpacity))
        ;[leftLine3Refs.current[0], leftLine3Refs.current[1]]
          .filter(Boolean)
          .forEach(el => applyScrollOut(el, s.scrollOut.leftLine3, s.contentOpacity))
        ;[0, 1, 2].forEach(
          i =>
            cardRefs.current?.[i] &&
            applyScrollOut(cardRefs.current[i], s.scrollOut[`card${i}`], s.contentOpacity)
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
    let resizeTimer
    const onResize = () => {
      setUseMobileHeroLayout(getViewportMode().useMobileHeroLayout)
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh()
      }, 150)
    }
    onResize()
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  // Low Power Mode / failed autoplay: first touch unlocks muted inline playback on iPhone.
  useEffect(() => {
    const unlock = () => ensureHeroVideoPlaying(videoRef.current)
    window.addEventListener('touchstart', unlock, { once: true, passive: true })
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => {
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('pointerdown', unlock)
    }
  }, [heroVideoSrc])

  useEffect(() => {
    const isReturningViaBack =
      navigationType === 'POP' || peekSkipHeroScrollTop() || shouldPreserveHomeScroll()
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
      // Keep restored scroll when returning via Previous/Back.
      if (!isReturningViaBack) scrollToTop()
      ScrollTrigger.refresh()
      teardown = initHeroAnimations()
    }

    const waitForScrollZero = (attempt = 0, maxAttempts = 30) => {
      if (cancelled) return
      if (isReturningViaBack) {
        runSetup()
        return
      }
      scrollToTop()
      const y = getScrollY()
      if (y < 5 || attempt >= maxAttempts) {
        runSetup()
        const t = setTimeout(() => {
          if (cancelled) return
          if (!isReturningViaBack) scrollToTop()
          ScrollTrigger.refresh()
        }, 200)
        timeoutIds.push(t)
        return
      }
      const t = setTimeout(() => waitForScrollZero(attempt + 1, maxAttempts), 50)
      timeoutIds.push(t)
    }

    if (isReturningViaBack) {
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return
          ScrollTrigger.refresh()
          teardown = initHeroAnimations()
        })
      })
      return () => {
        cancelled = true
        cancelAnimationFrame(frameId)
        timeoutIds.forEach(id => clearTimeout(id))
        teardown()
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lenisRef, navigationType])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      data-nav-theme="glass"
      data-nav-surface="transparent"
      className="hero-scroll-wrapper"
      style={{ height: useMobileHeroLayout ? '145vh' : '160vh' }}
    >
      <div
        className="hero-sticky-viewport hero-desktop-scale-shell h-[100dvh] md:h-screen"
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#bfac9b',
          overflow: 'hidden',
        }}
      >
        {/* ── z-10: diagonal infinite-scrolling banner text ───────────────── */}
        <div className="hero-scroll-bands">
          <div className="hero-band-row hero-band-row-1">
            <div className="band-scroll dir-left hero-band-text">
              {renderBandCopy(heroBand1Tokens)}
              {renderBandCopy(heroBand1Tokens)}
            </div>
          </div>
          <div className="hero-band-row hero-band-row-2">
            <div className="band-scroll dir-right hero-band-text">
              {renderBandCopy(heroBand2Tokens)}
              {renderBandCopy(heroBand2Tokens)}
            </div>
          </div>
          <div className="hero-band-row hero-band-row-3">
            <div className="band-scroll dir-left hero-band-text">
              {renderBandCopy(heroBand3Tokens)}
              {renderBandCopy(heroBand3Tokens)}
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
            top: hasSeenPreloader ? 0 : '100vh',
            left: 0,
            width: '100%',
            height: '100dvh',
            zIndex: 20,
            overflow: 'hidden',
            borderRadius: 0,
            willChange: 'top, left, width, height, border-radius, transform',
            transform: hasSeenPreloader ? 'none' : 'scale(1.05)',
          }}
        >
          <video
            ref={videoRef}
            key={heroVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src={heroVideoSrc}
            disablePictureInPicture
            onLoadedMetadata={e => {
              const v = e.currentTarget
              videoNaturalRef.current = { w: v.videoWidth || 0, h: v.videoHeight || 0 }
              ensureHeroVideoPlaying(v)
            }}
            onCanPlay={e => ensureHeroVideoPlaying(e.currentTarget)}
            onError={() => {
              // Helps diagnose "video not showing" vs "video offscreen" during hero animations.
              console.error('Hero video failed to load:', heroVideoSrc)
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.22)' }} />

          {/* Mobile Gradients for text readability */}
          <div
            className="absolute inset-0 md:hidden pointer-events-none"
            style={{
              background: `linear-gradient(180deg, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.4) 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(255, 255, 255, 0) 50%)`,
            }}
          />
        </div>

        {/* ── z-30: hero content ───────────────────────────────────────────── */}
        <div
          ref={contentRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            pointerEvents: 'auto',
            color: '#FAFAFA',
          }}
        >
          <main className="hero-compact-main absolute inset-0 z-10 flex flex-col items-center justify-center px-[clamp(1rem,4vw,1.25rem)] pb-[clamp(5rem,14vw,7.5rem)] pt-[clamp(4rem,12vw,4.5rem)] md:translate-y-0 md:px-0 md:pb-0 md:pt-[clamp(8.5rem,12vw,11rem)]">
            <div className="hero-compact-headline-stack mx-auto flex w-full max-w-[min(997px,calc(100vw-2rem))] flex-col items-center md:mx-0 md:max-w-[997px] md:items-end md:pr-8 lg:pr-0">
              <div className="hero-compact-copy pointer-events-auto flex w-full flex-col items-center pr-0 md:w-full md:items-end md:pr-0">
                <span
                  ref={eyebrowRef}
                  className="hero-compact-eyebrow self-end text-right text-[clamp(1.125rem,4.8vw,1.5rem)] leading-none tracking-[0] text-[#FAFAFA] md:text-[clamp(1.25rem,3.33vw,3rem)] md:leading-none"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  {hero.eyebrow ?? "IT'S TIME TO"}
                </span>
                <span
                  ref={headingRef}
                  className="hero-compact-heading mt-1 w-full max-w-full text-center text-[clamp(1.625rem,8.2vw,2.75rem)] uppercase leading-[1.02] tracking-[0] text-[#FAFAFA] md:mt-[clamp(0.75rem,2.22vw,2rem)] md:text-right md:text-[clamp(2.5rem,6.67vw,6rem)] md:leading-[1.05]"
                  style={{ fontFamily: "'Malgin', serif", fontWeight: 400 }}
                >
                  {hero.heading ?? 'PLAN DIFFERENTLY'}
                </span>
              </div>

              <div className="hero-compact-cta-row pointer-events-auto mt-[clamp(1.25rem,4vw,1.5rem)] flex w-full flex-row items-center justify-center gap-3 min-[360px]:gap-5 md:mt-[clamp(1.5rem,3vw,3rem)] md:w-full md:justify-end md:gap-[clamp(0px,1.5vw,2rem)] md:pr-0">
                <div className="hero-compact-cta-inner flex min-w-0 max-w-full flex-row items-center gap-3 min-[360px]:gap-5 md:gap-0">
                  <button
                    ref={ctaArrowRef}
                    onClick={() => navigate('/event-flow/category')}
                    className="hero-compact-cta-btn group pointer-events-auto relative flex h-14 w-14 min-w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white backdrop-blur-sm min-[360px]:h-[68px] min-[360px]:w-[68px] min-[360px]:min-w-[68px] min-[360px]:rounded-[80px] md:mr-[clamp(0.75rem,1.2vw,1.5rem)] md:h-[clamp(3rem,5vw,4.5rem)] md:w-[clamp(3rem,5vw,4.5rem)] md:min-w-[clamp(3rem,5vw,4.5rem)]"
                  >
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-0 w-0 rounded-full bg-white transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:h-[180%] group-hover:w-[180%]" />
                    </span>
                    <svg
                      className="relative z-10 h-7 w-7 text-[#FAFAFA] transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[#591902] min-[360px]:h-8 min-[360px]:w-8 md:h-[clamp(1.5rem,2.5vw,2.25rem)] md:w-[clamp(1.5rem,2.5vw,2.25rem)]"
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
                  <div
                    className="hero-compact-cta-text min-w-0 flex-1 text-left text-[clamp(0.6875rem,3.1vw,0.75rem)] font-normal leading-[1.5] text-[#FAFAFA] opacity-90 md:w-[clamp(180px,20vw,300px)] md:max-w-65 md:flex-none md:text-[clamp(0.625rem,0.9vw,0.875rem)] md:font-light md:leading-relaxed"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <p ref={ctaLine1Ref} className="m-0">
                      {hero.search_line_1 ?? 'Explore the collection. Your seamless'}
                    </p>
                    <p ref={ctaLine2Ref} className="m-0">
                      {hero.search_line_2 ?? 'event is just a few clicks away!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <footer className="hero-compact-footer absolute bottom-0 w-full flex flex-col md:flex-row items-end justify-between z-20 pointer-events-auto">
            {/* Mobile only: Birthday / Anniversary / House Party (no Work made easy) */}
            <div className="hero-mobile-footer z-20 flex w-full items-stretch border-t border-white/20 bg-black/20 backdrop-blur-md md:hidden">
              {rightCards.map((card, i) => {
                const resolvedLabel = card.label ? String(card.label).trim() : ''
                const cardHref =
                  card.href ||
                  `/event-flow/service?category=social&event=${resolvedLabel.toLowerCase().replace(/\s+/g, '-')}`
                const lineRefAssigners = [
                  el => {
                    leftLine1Refs.current[1] = el
                  },
                  el => {
                    leftLine2Refs.current[1] = el
                  },
                  el => {
                    leftLine3Refs.current[1] = el
                  },
                ]

                return (
                  <div
                    key={resolvedLabel || `mobile-card-${i}`}
                    ref={lineRefAssigners[i]}
                    onClick={() => {
                      rememberHomeScroll(lenisRef?.current)
                      navigate(cardHref, {
                        state: {
                          from: '/',
                          fromLanding: true,
                          scrollY: getWindowScrollY(lenisRef?.current),
                        },
                      })
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        rememberHomeScroll(lenisRef?.current)
                        navigate(cardHref, {
                          state: {
                            from: '/',
                            fromLanding: true,
                            scrollY: getWindowScrollY(lenisRef?.current),
                          },
                        })
                      }
                    }}
                    className={`hero-mobile-event-card relative flex min-h-[4.5rem] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 px-2.5 py-3 text-center transition-colors duration-300 hover:bg-[#591902]/40 ${
                      i < rightCards.length - 1 ? 'border-r border-white/20' : ''
                    }`}
                  >
                    <h3
                      className="m-0 w-full text-center text-[clamp(0.625rem,3.2vw,0.75rem)] font-normal uppercase leading-[1.2] tracking-[0.08em] text-[#FAFAFA]"
                      style={{ fontFamily: "'Malgin', serif" }}
                    >
                      {resolvedLabel}
                    </h3>
                  </div>
                )
              })}
            </div>

            {/* Desktop W Left Block — no gap between W and ork/orth/ell */}
            <div className="hero-desktop-w-footer hero-desktop-footer hidden shrink-0 md:flex md:items-center md:px-[clamp(0.75rem,2vw,2.5rem)] md:pb-[clamp(1rem,2.5vw,3rem)]">
              <span
                ref={el => (leftWRefs.current[0] = el)}
                className="hero-desktop-w-letter font-serif leading-[0.7] text-[#FFFFFF] md:mr-0 md:text-[clamp(2.5rem,calc(-2.625rem+9.17vw),5.625rem)]"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                W
              </span>
              <div
                className="hero-desktop-w-lines flex flex-col justify-center overflow-hidden whitespace-nowrap text-[#FFFFFF] md:-ml-[0.12em] md:text-[clamp(0.375rem,calc(-0.5rem+1.67vw),1rem)] md:font-medium md:leading-[1.5] md:tracking-normal md:space-y-[clamp(0.0625rem,calc(-0.125rem+0.35vw),0.25rem)] md:mb-[clamp(0.125rem,calc(-0.5rem+1.04vw),0.75rem)]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <p ref={el => (leftLine1Refs.current[0] = el)} className="m-0">
                  {getTrailingWWord(leftTaglines[0], 'Work made easy')}
                </p>
                <p ref={el => (leftLine2Refs.current[0] = el)} className="m-0">
                  {getTrailingWWord(leftTaglines[1], 'Worth the spend')}
                </p>
                <p ref={el => (leftLine3Refs.current[0] = el)} className="m-0">
                  {getTrailingWWord(leftTaglines[2], 'Well-vetted Vendors')}
                </p>
              </div>
            </div>

            {/* Cards section - strictly hidden on Mobile using hidden md:flex */}
            <div
              className="hero-desktop-cards hero-desktop-footer hidden w-full shrink-0 border-t border-white/20 bg-black/20 backdrop-blur-md md:flex md:w-auto md:border-t-0 md:bg-transparent md:backdrop-blur-none"
              style={{ pointerEvents: 'auto' }}
            >
              {rightCards.map((card, i) => {
                const extras = [
                  'md:rounded-tl-[20px]',
                  '',
                  'md:border-t-0 border-t border-white/20',
                ]
                const extra = extras[i] ?? ''
                const resolvedLabel = card.label ? String(card.label).trim() : ''
                const resolvedDesc =
                  card.tagline || card.description || card.desc || ''
                    ? String(card.tagline || card.description || card.desc).trim()
                    : ''
                const cardHref =
                  card.href ||
                  `/event-flow/service?category=social&event=${resolvedLabel.toLowerCase().replace(/\s+/g, '-')}`

                return (
                  <div
                    key={resolvedLabel || i}
                    ref={el => (cardRefs.current[i] = el)}
                    onClick={() => {
                      rememberHomeScroll(lenisRef?.current)
                      navigate(cardHref, {
                        state: {
                          from: '/',
                          fromLanding: true,
                          scrollY: getWindowScrollY(lenisRef?.current),
                        },
                      })
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        rememberHomeScroll(lenisRef?.current)
                        navigate(cardHref, {
                          state: {
                            from: '/',
                            fromLanding: true,
                            scrollY: getWindowScrollY(lenisRef?.current),
                          },
                        })
                      }
                    }}
                    style={{ pointerEvents: 'auto' }}
                    className={`hero-desktop-card col-span-1 h-22.5 md:h-[clamp(5.5rem,9.72vw,8.75rem)] md:w-[clamp(7rem,15.28vw,13.75rem)] md:bg-[#591902]/20 md:backdrop-blur-md relative border-r border-white/20 md:border-white/10 md:border-t hover:bg-[#591902]/40 transition-colors duration-300 cursor-pointer ${extra}`}
                  >
                    <div className="hero-desktop-card-inner absolute flex flex-col top-[clamp(0.75rem,3.5vw,1rem)] left-[clamp(0.625rem,2.5vw,0.75rem)] right-[clamp(0.375rem,1.5vw,0.5rem)] md:top-[clamp(0.875rem,1.39vw,1.25rem)] md:left-[clamp(0.875rem,1.39vw,1.25rem)] md:right-[clamp(0.5rem,0.7vw,0.75rem)] gap-[clamp(0.5rem,0.83vw,0.75rem)]">
                      <h3
                        className="text-[10px] sm:text-[11px] md:text-[clamp(0.625rem,1.11vw,1rem)] font-bold md:font-normal tracking-[0.14em] md:tracking-[0.04em] uppercase text-[#FAFAFA] md:leading-[1.2]"
                        style={{ fontFamily: "'Malgin', serif" }}
                      >
                        {resolvedLabel}
                      </h3>
                      <p
                        className="text-[9px] md:text-[clamp(0.5rem,0.833vw,0.75rem)] font-light md:font-normal opacity-90 leading-[1.3] md:leading-[1.5] md:tracking-normal line-clamp-3 md:line-clamp-2 text-[#FAFAFA]"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {resolvedDesc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </footer>
        </div>

        {/* ── z-40: preloader overlay ────────────────────────────────────────── */}
        <HeroPreloader ref={preloaderRef} initiallyHidden={hasSeenPreloader} />
      </div>
    </div>
  )
}

export default HeroSection
