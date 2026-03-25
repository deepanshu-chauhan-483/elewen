import { useRef, useState, useLayoutEffect } from 'react'
import gsap from 'gsap'

import everyDayImg1 from '../../assets/images/IMG_3010.jpg' // Top Right
import everyDayImg2 from '../../assets/images/IMG_2017.jpg' // Bottom Right
import everyDayImg3 from '../../assets/images/IMG_7768.jpg' // Bottom Left
import everyDayImg4 from '../../assets/images/IMG_3001.jpg' // Top Center

const CelebrationEveryDaySection = () => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Replace these mappings with real images per category when you have them.
  const CATEGORY_DATA = [
    {
      name: 'Anniversaries',
      heading: 'ANNIVERSARIES',
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      images: {
        topLeft: everyDayImg4,
        topRight: everyDayImg1,
        bottomLeft: everyDayImg3,
        bottomRight: everyDayImg2,
      },
    },
    {
      name: 'Birthday Parties',
      heading: 'BIRTHDAY PARTIES',
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      images: {
        topLeft: everyDayImg1,
        topRight: everyDayImg4,
        bottomLeft: everyDayImg2,
        bottomRight: everyDayImg3,
      },
    },
    {
      name: 'Engagement',
      heading: 'ENGAGEMENT',
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      images: {
        topLeft: everyDayImg2,
        topRight: everyDayImg1,
        bottomLeft: everyDayImg4,
        bottomRight: everyDayImg3,
      },
    },
    {
      name: 'Haldi',
      heading: 'HALDI',
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      images: {
        topLeft: everyDayImg3,
        topRight: everyDayImg2,
        bottomLeft: everyDayImg1,
        bottomRight: everyDayImg4,
      },
    },
    {
      name: 'Mehendi',
      heading: 'MEHENDI',
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      images: {
        topLeft: everyDayImg4,
        topRight: everyDayImg2,
        bottomLeft: everyDayImg3,
        bottomRight: everyDayImg1,
      },
    },
    {
      name: 'Weddings',
      heading: 'WEDDINGS',
      desc:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      images: {
        topLeft: everyDayImg1,
        topRight: everyDayImg3,
        bottomLeft: everyDayImg2,
        bottomRight: everyDayImg4,
      },
    },
  ]

  const [activeName, setActiveName] = useState(CATEGORY_DATA[0]?.name ?? '')
  const [incomingName, setIncomingName] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const sectionRef = useRef(null)

  const activeWrapsRef = useRef({
    topLeft: null,
    topRight: null,
    bottomLeft: null,
    bottomRight: null,
  })
  const incomingWrapsRef = useRef({
    topLeft: null,
    topRight: null,
    bottomLeft: null,
    bottomRight: null,
  })

  const headingRef = useRef(null)
  const descRef = useRef(null)

  const incomingHeadingRef = useRef(null)
  const incomingDescRef = useRef(null)
  const activeAccentRef = useRef(null)
  const incomingAccentRef = useRef(null)

  const active = CATEGORY_DATA.find(c => c.name === activeName) ?? CATEGORY_DATA[0]
  const incoming = incomingName ? CATEGORY_DATA.find(c => c.name === incomingName) ?? null : null

  const animateSwap = nextName => {
    if (prefersReducedMotion) {
      setActiveName(nextName)
      return
    }
    if (isAnimating) return
    if (nextName === activeName) return

    setIsAnimating(true)
    setIncomingName(nextName)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const outTop = [
          activeWrapsRef.current.topLeft,
          activeWrapsRef.current.topRight,
          activeAccentRef.current,
        ].filter(Boolean)
        const outBottom = [activeWrapsRef.current.bottomLeft, activeWrapsRef.current.bottomRight].filter(Boolean)

        const inTop = [
          incomingWrapsRef.current.topLeft,
          incomingWrapsRef.current.topRight,
          incomingAccentRef.current,
        ].filter(Boolean)
        const inBottom = [incomingWrapsRef.current.bottomLeft, incomingWrapsRef.current.bottomRight].filter(Boolean)

        const outText = [headingRef.current, descRef.current].filter(Boolean)
        const inText = [incomingHeadingRef.current, incomingDescRef.current].filter(Boolean)

        // Prep incoming layer (TOP from below, BOTTOM from above)
        gsap.set(inTop, { y: 60, autoAlpha: 0 })
        gsap.set(inBottom, { y: -60, autoAlpha: 0 })

        // Text: out up, in from below (after images are in place).
        gsap.set(inText, { yPercent: 100, autoAlpha: 0 })

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            setActiveName(nextName)
            setIncomingName(null)
            setIsAnimating(false)

            // clear refs for the unmounted incoming layer
            incomingWrapsRef.current = { topLeft: null, topRight: null, bottomLeft: null, bottomRight: null }
          },
        })

        // OUT (hard cut first)
        // Top images: go UP and disappear
        tl.to(
          outTop,
          {
            y: -60,
            autoAlpha: 0,
            duration: 0.55,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0
        )

        // Bottom images: go DOWN and disappear (reverse)
        tl.to(
          outBottom,
          {
            y: 60,
            autoAlpha: 0,
            duration: 0.55,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0
        )

        // Text: out UP (heading + paragraph together)
        tl.to(
          outText,
          {
            yPercent: -100,
            autoAlpha: 0,
            duration: 0.34,
            ease: 'power2.in',
          },
          0.02
        )

        // IN (only AFTER OUT finishes)
        // Top images: come from DOWN
        tl.to(inTop, {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.04,
          ease: 'power3.out',
        })

        // Bottom images: come from UP (reverse)
        tl.to(
          inBottom,
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            stagger: 0.04,
            ease: 'power3.out',
          },
          '<'
        )

        // Text: in from below (heading + paragraph together), after images are set
        tl.to(inText, {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.55,
          ease: 'power3.out',
        })
      })
    })
  }

  const ImgBox = ({ src, alt, className, setRef }) => (
    <div
      ref={setRef}
      className={`${className} overflow-hidden`}
      style={{ willChange: 'transform, clip-path', clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" style={{ willChange: 'transform' }} />
    </div>
  )

  const DESKTOP_CANVAS_W = 1440
  const DESKTOP_CANVAS_H = 1097

  const desktopWrapRef = useRef(null)
  const [desktopScale, setDesktopScale] = useState(1)

  useLayoutEffect(() => {
    const wrap = desktopWrapRef.current
    if (!wrap) return

    let raf = 0
    const update = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        raf = 0
        const w = wrap.clientWidth || DESKTOP_CANVAS_W
        const s = Math.min(1, w / DESKTOP_CANVAS_W)
        setDesktopScale(s)
      })
    }

    update()

    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update())
      ro.observe(wrap)
    } else {
      window.addEventListener('resize', update)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (ro) ro.disconnect()
      else window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative w-full bg-[#F8F4ED] flex justify-center overflow-hidden font-sans pb-20">
      {/* Mobile layout (<= md) */}
      <div className="w-full max-w-[540px] px-5 pt-12 md:hidden">
        <h2 className="text-[#2D2D2D] text-[34px] leading-[1.05] text-center font-serif" style={{ fontFamily: "'Malgin', serif" }}>
          Celebrations We Plan <br /> Every Day
        </h2>

        <p className="mt-5 text-[#2D2D2D] opacity-60 text-[14px] leading-[1.7] text-center">
          From intimate birthdays to joyful wedding functions, our in-house planner helps bring thoughtful structure and creative detail to social celebrations that matter most.
        </p>

        {/* Category tabs (2 rows like screenshot) */}
        <div className="mt-10">
          <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-3 text-[14px]">
            {CATEGORY_DATA.slice(0, 3).map((cat, i) => {
              const isActive = cat.name === activeName
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAnimating) return
                      setIncomingName(null)
                      setIsAnimating(false)
                      setActiveName(cat.name)
                    }}
                    className={isActive ? 'text-[#2D2D2D] font-medium border-b border-[#2D2D2D] pb-1' : 'text-[#2D2D2D]/50 pb-1'}
                  >
                    {cat.name}
                  </button>
                  {i !== 2 && <span className="text-[#2D2D2D]/50">|</span>}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-center flex-wrap gap-x-3 gap-y-3 text-[14px]">
            {CATEGORY_DATA.slice(3, 6).map((cat, i) => {
              const isActive = cat.name === activeName
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAnimating) return
                      setIncomingName(null)
                      setIsAnimating(false)
                      setActiveName(cat.name)
                    }}
                    className={isActive ? 'text-[#2D2D2D] font-medium border-b border-[#2D2D2D] pb-1' : 'text-[#2D2D2D]/50 pb-1'}
                  >
                    {cat.name}
                  </button>
                  {i !== 2 && <span className="text-[#2D2D2D]/50">|</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile collage frame */}
        <div className="mt-10">
          <div className="grid grid-cols-[2fr_1fr] grid-rows-3 gap-1 h-[min(78vw,370px)]">
            {/* Big left */}
            <div className="relative overflow-hidden rounded-[18px] row-span-2 col-start-1 row-start-1">
              <img
                src={active.images.topLeft}
                alt={`${active.name} left`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Right top */}
            <div className="relative overflow-hidden rounded-[18px] col-start-2 row-start-1">
              <img
                src={active.images.topRight}
                alt={`${active.name} right top`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Bottom left */}
            <div className="relative overflow-hidden rounded-[18px] col-start-1 row-start-3">
              <img
                src={active.images.bottomLeft}
                alt={`${active.name} bottom left`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Big bottom right */}
            <div className="relative overflow-hidden rounded-[18px] col-start-2 row-start-2 row-span-2">
              <img
                src={active.images.bottomRight}
                alt={`${active.name} bottom right`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          <h3 className="mt-8 text-center text-[#2D2D2D] text-[22px] font-serif tracking-wide uppercase" style={{ fontFamily: "'Malgin', serif" }}>
            {active.heading}
          </h3>
          <p className="mt-3 text-center text-[#2D2D2D] opacity-60 text-[14px] leading-[1.7]">
            {active.desc}
          </p>
        </div>
      </div>

      {/* Desktop layout (md+) — existing animation layout kept as-is */}
      <div className="hidden md:block w-full">
        <div
          ref={desktopWrapRef}
          className="relative w-full max-w-[1440px] mx-auto"
          style={{ height: `${DESKTOP_CANVAS_H * desktopScale}px` }}
        >
          <div
            className="absolute top-0 left-1/2 origin-top"
            style={{
              width: `${DESKTOP_CANVAS_W}px`,
              height: `${DESKTOP_CANVAS_H}px`,
              transform: `translateX(-50%) scale(${desktopScale})`,
            }}
          >
            <div className="relative w-full h-full shrink-0">
          <h2
            className="absolute left-1/2 -translate-x-1/2 top-[80px] w-[967px] text-[#2D2D2D] text-[61px] leading-[1] text-center font-serif"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Celebrations We Plan Every Day
          </h2>

          <p className="absolute left-1/2 -translate-x-1/2 top-[169px] w-[809px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5] text-center">
            From intimate birthdays to joyful wedding functions, our in-house planner helps bring thoughtful structure and
            creative detail to social celebrations that matter most.
          </p>

          <div className="absolute left-[0px] top-[297px] w-[1440px] h-[800px]">
            <div className="absolute left-[0px] top-[0px] w-[1440px] h-[800px] bg-[#EBEBEB] z-0" />
            <div
              key={active.name}
              ref={activeAccentRef}
              className="absolute left-[0px] top-[400px] w-[640px] h-[200px] bg-[#CDB17E] z-10"
              style={{ willChange: 'transform, opacity' }}
            />

            {/* Left categories (stays as-is) */}
            <div className="absolute left-[0px] top-[0px] w-[440px] h-[400px] bg-[#F8F4ED] z-20">
              <div className="absolute left-[100px] top-[0px] flex flex-col pt-12">
                {CATEGORY_DATA.map(cat => {
                  const isActive = cat.name === activeName
                  return (
                    <div
                      key={cat.name}
                      onClick={() => animateSwap(cat.name)}
                      className={`py-2 pr-4 cursor-pointer w-fit ${
                        isActive ? 'border-b border-[#2D2D2D]' : 'opacity-50 hover:opacity-100 transition-opacity'
                      }`}
                    >
                      <span className="text-[#2D2D2D] text-[16px] font-medium leading-[1.5]">{cat.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ACTIVE images */}
            <ImgBox
              src={active.images.topLeft}
              alt={`${active.name} image`}
              className="absolute left-[440px] top-[0px] w-[500px] h-[400px] z-10"
              setRef={el => (activeWrapsRef.current.topLeft = el)}
            />
            <ImgBox
              src={active.images.topRight}
              alt={`${active.name} image`}
              className="absolute left-[940px] top-[0px] w-[500px] h-[400px] z-10"
              setRef={el => (activeWrapsRef.current.topRight = el)}
            />
            <ImgBox
              src={active.images.bottomLeft}
              alt={`${active.name} image`}
              className="absolute left-[0px] top-[600px] w-[640px] h-[200px] z-10"
              setRef={el => (activeWrapsRef.current.bottomLeft = el)}
            />
            <ImgBox
              src={active.images.bottomRight}
              alt={`${active.name} image`}
              className="absolute left-[640px] top-[400px] w-[800px] h-[400px] z-10"
              setRef={el => (activeWrapsRef.current.bottomRight = el)}
            />

            {/* ACTIVE text */}
            <h3
              className="absolute left-[787px] top-[362px] w-[441px] text-[#FFFFFF] text-[60px] leading-[1] text-center font-normal z-20 drop-shadow-md tracking-wider uppercase overflow-hidden"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <span key={active.name} ref={headingRef} className="inline-block" style={{ willChange: 'transform' }}>
                {active.heading}
              </span>
            </h3>

            <p className="absolute left-[100px] top-[455px] w-[340px] text-[#FFFFFF] text-[12px] font-medium leading-[1.5] z-20 overflow-hidden">
              <span key={active.name} ref={descRef} className="inline-block" style={{ willChange: 'transform' }}>
                {active.desc}
              </span>
            </p>

            {/* INCOMING layer (only during click animation) */}
            {incoming && (
              <div className="absolute inset-0 pointer-events-none z-30">
                <div
                  ref={incomingAccentRef}
                  className="absolute left-[0px] top-[400px] w-[640px] h-[200px] bg-[#CDB17E] z-10"
                  style={{ willChange: 'transform, opacity' }}
                />
                <ImgBox
                  src={incoming.images.topLeft}
                  alt={`${incoming.name} image`}
                  className="absolute left-[440px] top-[0px] w-[500px] h-[400px]"
                  setRef={el => (incomingWrapsRef.current.topLeft = el)}
                />
                <ImgBox
                  src={incoming.images.topRight}
                  alt={`${incoming.name} image`}
                  className="absolute left-[940px] top-[0px] w-[500px] h-[400px]"
                  setRef={el => (incomingWrapsRef.current.topRight = el)}
                />
                <ImgBox
                  src={incoming.images.bottomLeft}
                  alt={`${incoming.name} image`}
                  className="absolute left-[0px] top-[600px] w-[640px] h-[200px]"
                  setRef={el => (incomingWrapsRef.current.bottomLeft = el)}
                />
                <ImgBox
                  src={incoming.images.bottomRight}
                  alt={`${incoming.name} image`}
                  className="absolute left-[640px] top-[400px] w-[800px] h-[400px]"
                  setRef={el => (incomingWrapsRef.current.bottomRight = el)}
                />

                <h3
                  className="absolute left-[787px] top-[362px] w-[441px] text-[#FFFFFF] text-[60px] leading-[1] text-center font-normal drop-shadow-md tracking-wider uppercase overflow-hidden"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <span ref={incomingHeadingRef} className="inline-block" style={{ willChange: 'transform' }}>
                    {incoming.heading}
                  </span>
                </h3>

                <p className="absolute left-[100px] top-[455px] w-[340px] text-[#FFFFFF] text-[12px] font-medium leading-[1.5] overflow-hidden">
                  <span ref={incomingDescRef} className="inline-block" style={{ willChange: 'transform' }}>
                    {incoming.desc}
                  </span>
                </p>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CelebrationEveryDaySection

