import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import navLogo from '../../assets/images/navbar.png'
import HeroVideo from '../../assets/HeroVideo.mp4'

gsap.registerPlugin(ScrollTrigger)

// ── helpers ──────────────────────────────────────────────────────────────────
const c01 = v => Math.max(0, Math.min(1, v))
const lerp = (a, b, t) => a + (b - a) * t
// progress of a sub-phase inside the full 0→1 range
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

const renderBand = tokens => {
  const items = []
  let idx = 0
  for (let r = 0; r < 8; r++) {
    tokens.forEach((token, ti) => {
      // every phrase+separator pair alternates: pair 0 solid, pair 1 outline, …
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

const HeroSection = () => {
  const wrapperRef = useRef(null)
  const logoContainerRef = useRef(null)
  const logoImgRef = useRef(null)
  const darkOverlayRef = useRef(null)
  const videoWrapperRef = useRef(null)
  const contentRef = useRef(null)
  const band1Ref = useRef(null)
  const band2Ref = useRef(null)
  const band3Ref = useRef(null)

  useEffect(() => {
    // Poppins for banner text
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    const lc = logoContainerRef.current
    const li = logoImgRef.current
    const dk = darkOverlayRef.current
    const vw = videoWrapperRef.current
    const cr = contentRef.current
    const b1 = band1Ref.current
    const b2 = band2Ref.current
    const b3 = band3Ref.current
    if (!lc || !li || !dk || !vw || !cr || !b1 || !b2 || !b3) return

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

    // ── animState: written by preloader + ScrollTrigger, read by RAF ─────────
    const s = {
      logoScale: 1,
      logoOpacity: 1,
      darkAlpha: 1,
      vidTop: H0, // starts below viewport — preloader animates to 0
      vidLeft: 0,
      vidW: W0,
      vidH: H0,
      vidTopR: 1200, // large rounded top during slide-in, flattens to 0
      vidR: 0, // corner radius used when video shrinks on scroll
      contentOpacity: 0,
      contentY: 50, // px — starts below, rises to 0 on fade-in, lifts to -50 on fade-out
      shift: 0,
    }

    // ── Preloader: logo zoom → fade → video slides up ────────────────────────
    let preloaderDone = false
    const tl = gsap.timeline()
    tl.to(s, { logoScale: 2.5, duration: 1.8, ease: 'power2.out' })
      .to(s, { logoOpacity: 0, duration: 0.6, ease: 'power2.in' }, '+=0.1')
      // video rises with rounded top; radius flattens as it reaches top=0
      .to(s, { vidTop: 0, vidTopR: 0, duration: 1.2, ease: 'power3.inOut' }, '-=0.45')
      // hero content expands up + fades in once video is fullscreen
      .to(s, { contentOpacity: 1, contentY: 0, duration: 0.7, ease: 'power2.out' }, '-=0.1')
      .eventCallback('onComplete', () => {
        preloaderDone = true
        window.dispatchEvent(new Event('hero-preloader-done'))
      })

    // ── ScrollTrigger: phases 2-4 only (video already fullscreen at scroll=0) ─
    const st = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate({ progress: p }) {
        if (!preloaderDone) return
        const { eW, eH, eL, eT } = getEnd()
        const W = window.innerWidth
        const H = window.innerHeight

        // ── Phase 2: content collapses up + fades OUT (0.00 → 0.20) ────────────
        s.contentOpacity = lerp(1, 0, sub(p, 0.0, 0.2))
        s.contentY = lerp(0, -50, sub(p, 0.0, 0.2))

        // ── Phase 3: video shrinks to bottom (0.15 → 0.55) ───────────────────
        const shrinkP = sub(p, 0.15, 0.55)
        s.vidTop = lerp(0, eT, shrinkP)
        s.vidLeft = lerp(0, eL, shrinkP)
        s.vidW = lerp(W, eW, shrinkP)
        s.vidH = lerp(H, eH, shrinkP)
        s.vidR = lerp(0, 16, shrinkP)

        // ── dark overlay fades out (0.15 → 0.45) — reveals #bfac9b ───────────
        s.darkAlpha = lerp(1, 0, sub(p, 0.15, 0.45))

        // ── Phase 4: banner text slides (0.55 → 1.00) ────────────────────────
        s.shift = lerp(0, 340, sub(p, 0.55, 1.0))
      },
    })

    // ── RAF render loop (Vucko pattern) ──────────────────────────────────────
    let rafId
    const render = () => {
      li.style.transform = `scale(${s.logoScale})`
      lc.style.opacity = s.logoOpacity

      dk.style.opacity = s.darkAlpha

      // top radius: preloader slide-in (vidTopR) + scroll shrink corner (vidR)
      const topR = s.vidTopR + s.vidR
      vw.style.top = `${s.vidTop}px`
      vw.style.left = `${s.vidLeft}px`
      vw.style.width = `${s.vidW}px`
      vw.style.height = `${s.vidH}px`
      vw.style.borderRadius = `${topR}px ${topR}px ${s.vidR}px ${s.vidR}px`

      cr.style.opacity = s.contentOpacity
      cr.style.transform = `translateY(${s.contentY}px)`
      cr.style.pointerEvents = s.contentOpacity > 0.05 ? 'auto' : 'none'

      b1.style.transform = `rotate(-20deg) translateX(${-s.shift}px)`
      b2.style.transform = `rotate(-20deg) translateX(${+s.shift}px)`
      b3.style.transform = `rotate(-20deg) translateX(${-s.shift}px)`

      rafId = requestAnimationFrame(render)
    }
    render()

    return () => {
      tl.kill()
      st.kill()
      cancelAnimationFrame(rafId)
    }
  }, [])

  // ── band style factory ────────────────────────────────────────────────────
  const bandStyle = top => ({
    position: 'absolute',
    top,
    left: '-100%',
    width: '300%',
    whiteSpace: 'nowrap',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '120px',
    lineHeight: '120%',
    letterSpacing: 0,
    color: 'inherit',
    opacity: 1,
    transformOrigin: 'center center',
    transform: 'rotate(-10deg)',
    pointerEvents: 'none',
    userSelect: 'none',
  })

  // ─────────────────────────────────────────────────────────────────────────
  return (
    /*
      600vh wrapper → 500vh scroll range → progress 0→1.
      Sticky container pins at top for the full duration.
    */
    <div ref={wrapperRef} style={{ height: '600vh' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          backgroundColor: '#bfac9b', // revealed in Phase 3
          overflow: 'hidden',
        }}
      >
        {/* ── z-10: diagonal banner text (hidden by dark overlay until Phase 3) */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden' }}>
          <div ref={band1Ref} style={bandStyle('10%')}>
            {renderBand(BAND1_TOKENS)}
          </div>
          <div ref={band2Ref} style={bandStyle('25%')}>
            {renderBand(BAND2_TOKENS)}
          </div>
          <div ref={band3Ref} style={bandStyle('40%')}>
            {renderBand(BAND3_TOKENS)}
          </div>
        </div>

        {/* ── z-15: dark overlay — covers #bfac9b + text in Phases 1 & 2 ───── */}
        <div
          ref={darkOverlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 15,
            backgroundColor: '#bfac9b',
          }}
        />

        {/* ── z-20: video — starts below, swipes up, then shrinks to bottom ── */}
        <div
          ref={videoWrapperRef}
          style={{
            position: 'absolute',
            top: '100vh', // initial: below viewport
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
          {/* overlay darkens video — shrinks with it, never covers #bfac9b */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.22)' }} />
        </div>

        {/* ── z-30: hero content — fades in (Phase 2) and out (Phase 3) ───── */}
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
          {/* Main Center Content */}
          <main className="absolute inset-0 flex flex-col justify-center items-start md:items-center z-10 pt-14 md:pt-24 px-4 md:px-0">
            <div className="w-full max-w-[997px] text-left md:text-right flex flex-col pr-0 md:pr-8 lg:pr-0">
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
            <div className="w-full max-w-[997px] flex flex-col md:flex-row justify-start md:justify-end items-start md:items-center mt-8 md:mt-12 pr-0 md:pr-12 gap-8 md:gap-0">
              <div className="flex items-center">
                <button className="w-16 h-16 md:w-18 md:h-18 rounded-full border border-2 border-white flex items-center justify-center mr-4 md:mr-6 hover:bg-white/20 transition-colors backdrop-blur-sm shrink-0">
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
                <p className="max-w-[250px] text-[15px] md:text-sm font-light leading-relaxed opacity-90 text-left">
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
                <div className="flex flex-col justify-center text-[12px] font-medium tracking-wide space-y-[2px] mt-2">
                  <p>ork made easy</p>
                  <p>orth the spend</p>
                  <p>ell-vetted vendors</p>
                </div>
              </div>
            </div>
          </main>

          {/* Bottom Footer Section */}
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
                  className={`col-span-1 md:w-[220px] h-[90px] md:h-[124px] md:bg-[#591902]/20 md:backdrop-blur-md relative border-r border-white/20 md:border-white/10 md:border-t hover:bg-[#591902]/30 transition-colors cursor-pointer ${extra}`}
                >
                  <div className="absolute top-[16px] md:top-[20px] left-[12px] md:left-[20px] right-[8px] md:right-auto md:w-[180px] flex flex-col gap-[6px] md:gap-[12px]">
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

        {/* ── z-40: logo — only visible at scroll=0, grows then fades ─────── */}
        <div
          ref={logoContainerRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <img
            ref={logoImgRef}
            src={navLogo}
            alt="Elewen"
            style={{
              width: '380px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1) drop-shadow(0 18px 16px rgba(89,25,2,0.5))',
              willChange: 'transform',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default HeroSection
