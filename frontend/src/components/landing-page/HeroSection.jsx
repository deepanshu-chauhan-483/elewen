import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroVideo from '../../assets/HeroVideo.mp4'
import HeroPreloader from './HeroPreloader'

gsap.registerPlugin(ScrollTrigger)

// ── helpers ──────────────────────────────────────────────────────────────────
const c01 = v => Math.max(0, Math.min(1, v))
const lerp = (a, b, t) => a + (b - a) * t
const sub = (p, start, end) => c01((p - start) / (end - start))

// ── banner text content ───────────────────────────────────────────────────────
const G = '\u2003'
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

// Render one copy of a band's tokens — called twice per band for seamless loop
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
  const preloaderRef = useRef(null) // HeroPreloader imperative handle
  const darkOverlayRef = useRef(null)
  const videoWrapperRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const dk = darkOverlayRef.current
    const vw = videoWrapperRef.current
    const cr = contentRef.current
    if (!dk || !vw || !cr) return

    const lc = preloaderRef.current?.containerEl()
    const li = preloaderRef.current?.imgEl()

    // ── end-state values for the small video at bottom ──────────────────────
    const getEnd = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      const eW = W * 0.4
      const eH = H * 0.6
      return { eW, eH, eL: (W - eW) / 2, eT: H - eH - 40 }
    }

    const W0 = window.innerWidth
    const H0 = window.innerHeight

    const s = {
      logoScale: 1,
      logoOpacity: 1,
      darkAlpha: 1,
      vidTop: H0,
      vidLeft: 0,
      vidW: W0,
      vidH: H0,
      vidTopR: 1200,
      vidR: 0,
      contentOpacity: 0,
      contentY: 50,
    }

    const alreadyDone = sessionStorage.getItem(PRELOADER_DONE_KEY)
    let tl = null

    if (alreadyDone) {
      // Skip preloader: jump straight to post-intro state
      if (lc) lc.style.opacity = '0'
      s.logoOpacity = 0
      s.vidTop = 0
      s.vidTopR = 0
      s.contentOpacity = 1
      s.contentY = 0
      s.darkAlpha = 1 // ScrollTrigger will fade this out
      window.dispatchEvent(new Event('hero-preloader-done'))
    } else {
      // ── Preloader: logo zoom → fade → video slides up ──────────────────
      tl = gsap.timeline()
      tl.to(s, { logoScale: 2.5, duration: 1.8, ease: 'power2.out' })
        .to(s, { logoOpacity: 0, duration: 0.6, ease: 'power2.in' }, '+=0.1')
        .to(s, { vidTop: 0, vidTopR: 0, duration: 1.2, ease: 'power3.inOut' }, '-=0.45')
        .to(s, { contentOpacity: 1, contentY: 0, duration: 0.7, ease: 'power2.out' }, '-=0.1')
        .eventCallback('onComplete', () => {
          sessionStorage.setItem(PRELOADER_DONE_KEY, '1')
          window.dispatchEvent(new Event('hero-preloader-done'))
        })
    }

    // ── ScrollTrigger: phases 2-3 ───────────────────────────────────────────
    const st = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate({ progress: p }) {
        const { eW, eH, eL, eT } = getEnd()
        const W = window.innerWidth
        const H = window.innerHeight

        // Phase 2: content fades out (0.00 → 0.18)
        s.contentOpacity = lerp(1, 0, sub(p, 0.0, 0.18))
        s.contentY = lerp(0, -50, sub(p, 0.0, 0.18))

        // Phase 3: video shrinks to bottom (0.12 → 0.85)
        const shrinkP = sub(p, 0.12, 0.85)
        s.vidTop = lerp(0, eT, shrinkP)
        s.vidLeft = lerp(0, eL, shrinkP)
        s.vidW = lerp(W, eW, shrinkP)
        s.vidH = lerp(H, eH, shrinkP)
        s.vidR = lerp(0, 16, shrinkP)

        // dark overlay fades out (0.12 → 0.40)
        s.darkAlpha = lerp(1, 0, sub(p, 0.12, 0.4))
      },
    })

    // ── RAF render loop ───────────────────────────────────────────────────────
    let rafId
    const render = () => {
      if (lc) lc.style.opacity = s.logoOpacity
      if (li) li.style.transform = `scale(${s.logoScale})`

      dk.style.opacity = s.darkAlpha

      const topR = s.vidTopR + s.vidR
      vw.style.top = `${s.vidTop}px`
      vw.style.left = `${s.vidLeft}px`
      vw.style.width = `${s.vidW}px`
      vw.style.height = `${s.vidH}px`
      vw.style.borderRadius = `${topR}px ${topR}px ${s.vidR}px ${s.vidR}px`

      cr.style.opacity = s.contentOpacity
      cr.style.transform = `translateY(${s.contentY}px)`
      cr.style.pointerEvents = s.contentOpacity > 0.05 ? 'auto' : 'none'

      rafId = requestAnimationFrame(render)
    }
    render()

    return () => {
      tl?.kill()
      st.kill()
      cancelAnimationFrame(rafId)
    }
  }, [])

  // ── band wrapper style: rotation + position only ──────────────────────────
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
          {/* Band 1 — scrolls left */}
          <div style={bandWrap('10%')}>
            <div className="band-scroll dir-left" style={bandFont}>
              {renderBandCopy(BAND1_TOKENS)}
              {renderBandCopy(BAND1_TOKENS)}
            </div>
          </div>

          {/* Band 2 — scrolls right */}
          <div style={bandWrap('27%')}>
            <div className="band-scroll dir-right" style={bandFont}>
              {renderBandCopy(BAND2_TOKENS)}
              {renderBandCopy(BAND2_TOKENS)}
            </div>
          </div>

          {/* Band 3 — scrolls left */}
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
            willChange: 'top, left, width, height, border-radius',
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src={HeroVideo} type="video/mp4" />
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
            opacity: 0,
            pointerEvents: 'none',
            color: '#FAFAFA',
          }}
        >
          <main className="absolute inset-0 flex flex-col justify-center items-start md:items-center z-10 pt-14 md:pt-24 px-4 md:px-0">
            <div className="w-full max-w-249.25 text-left md:text-right flex flex-col pr-0 md:pr-8 lg:pr-0">
              <span
                className="text-[38px] md:text-[48px] leading-none"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                IT&apos;S TIME TO
              </span>
              <span
                className="text-[54px] md:text-[96px] leading-[1.05] md:leading-none mt-2"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                PLAN DIFFERENTLY
              </span>
            </div>
            <div className="w-full max-w-249.25 flex flex-col md:flex-row justify-start md:justify-end items-start md:items-center mt-8 md:mt-12 pr-0 md:pr-12 gap-8 md:gap-0">
              <div className="flex items-center">
                <button className="w-16 h-16 md:w-18 md:h-18 rounded-full border-2 border-white flex items-center justify-center mr-4 md:mr-6 hover:bg-white/20 transition-colors backdrop-blur-sm shrink-0">
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
                <p className="max-w-62.5 text-[15px] md:text-sm font-light leading-relaxed opacity-90 text-left">
                  Explore the collection. Your seamless event is just a few clicks away!
                </p>
              </div>
              <div className="flex md:hidden items-center mt-2">
                <span
                  className="text-[72px] leading-[0.7] font-serif mr-2"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  W
                </span>
                <div className="flex flex-col justify-center text-[12px] font-medium tracking-wide space-y-0.5 mt-2">
                  <p>ork made easy</p>
                  <p>orth the spend</p>
                  <p>ell-vetted vendors</p>
                </div>
              </div>
            </div>
          </main>

          <footer className="absolute bottom-0 w-full flex flex-col md:flex-row items-end justify-between z-20">
            <div className="hidden md:flex items-center px-10 pb-12">
              <span
                className="text-[90px] leading-[0.7] font-serif mr-1"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                W
              </span>
              <div className="flex flex-col justify-center text-sm font-medium tracking-wide space-y-1 mt-3">
                <p>ork made easy</p>
                <p>orth the spend</p>
                <p>ell-vetted vendors</p>
              </div>
            </div>
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
              ].map(({ label, desc, extra }) => (
                <div
                  key={label}
                  className={`col-span-1 md:w-55 h-22.5 md:h-31 md:bg-[#591902]/20 md:backdrop-blur-md relative border-r border-white/20 md:border-white/10 md:border-t hover:bg-[#591902]/30 transition-colors cursor-pointer ${extra}`}
                >
                  <div className="absolute top-4 md:top-5 left-3 md:left-5 right-2 md:right-auto md:w-45 flex flex-col gap-1.5 md:gap-3">
                    <h3
                      className="text-[10px] sm:text-[11px] md:text-sm font-bold tracking-widest uppercase truncate"
                      style={{ fontFamily: "'Malgin', serif" }}
                    >
                      {label}
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

        {/* ── z-40: preloader overlay (swap HeroPreloader to change intro) ─── */}
        <HeroPreloader ref={preloaderRef} />
      </div>
    </div>
  )
}

export default HeroSection
