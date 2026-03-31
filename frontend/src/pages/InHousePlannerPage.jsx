import { useRef, useState, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePlannerLead } from '../hooks/usePlannerLead'
import { useInHousePlannerPage } from '../hooks/useCmsPages'
import ScrollImageSpreadSection from '../components/in-house-planner/ScrollImageSpreadSection'

import plannerImg from '../assets/images/moksha_portrait.jpg'

import celebrationImg1 from '../assets/images/citroen.png'
import celebrationImg2 from '../assets/images/danube.jpg'
import celebrationImg3 from '../assets/images/guns.jpg'
import celebrationImg4 from '../assets/images/usha.jpg'

import everyDayImg1 from '../assets/images/IMG_3010.jpg' // Top Right
import everyDayImg2 from '../assets/images/IMG_2017.jpg' // Bottom Right
import everyDayImg3 from '../assets/images/IMG_7768.jpg' // Bottom Left
import everyDayImg4 from '../assets/images/IMG_3001.jpg' // Top Center

gsap.registerPlugin(ScrollTrigger)

const celebrationData = [
  {
    id: '01',
    title: 'CITROEN',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg1,
    tall: true,
  },
  {
    id: '02',
    title: 'DANUBE',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg2,
    tall: false,
  },
  {
    id: '03',
    title: 'GUNS & GULAABS',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg3,
    tall: true,
  },
  {
    id: '04',
    title: 'USHA',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg4,
    tall: false,
  },
  {
    id: '05',
    title: 'CITROEN',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg1,
    tall: false,
  },
  {
    id: '06',
    title: 'DANUBE',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg2,
    tall: true,
  },
  {
    id: '07',
    title: 'GUNS & GULAABS',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg3,
    tall: false,
  },
  {
    id: '08',
    title: 'USHA',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg4,
    tall: true,
  },
]

// Defined at module level so React never treats it as a new component type on re-render
const GCTextReveal = ({ children, className = '' }) => (
  <span className="reveal-wrapper overflow-hidden inline-block">
    <span
      className={`gc-reveal-text inline-block ${className}`}
      style={{ willChange: 'transform' }}
    >
      {children}
    </span>
  </span>
)

const GrandCelebrationsSection = () => {
  const { data: cms = {} } = useInHousePlannerPage()
    const gc = cms.grand_celebrations_intro ?? {}
    
  const sectionRef = useRef(null)

  const titleRef = useRef(null)
  const noteRef = useRef(null)
  const arrowLeftRef = useRef(null)
  const arrowRightRef = useRef(null)

  const activeCardRefs = useRef([])
  const activeImgWrapRefs = useRef([])

  const incomingCardRefs = useRef([])
  const incomingImgWrapRefs = useRef([])
  const incomingLayerRef = useRef(null)

  const [perPage, setPerPage] = useState(() => {
    if (typeof window === 'undefined') return 4
    return window.innerWidth >= 540 ? 4 : 1
  })
  const [page, setPage] = useState(0)
  const [incomingPage, setIncomingPage] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const perPageRef = useRef(perPage)

  const totalPages = Math.max(1, Math.ceil(celebrationData.length / perPage))
  const isMobile = perPage === 1

  const getItems = pageIndex => {
    const start = pageIndex * perPage
    return celebrationData.slice(start, start + perPage)
  }

  const getRevealTexts = cards =>
    cards.flatMap(card => Array.from(card.querySelectorAll('.gc-reveal-text')))

  const go = dir => {
    if (isAnimating || totalPages <= 1) return

    const current = ((page % totalPages) + totalPages) % totalPages
    const next = (current + dir + totalPages) % totalPages
    setIsAnimating(true)
    setIncomingPage(next)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const outCards = activeCardRefs.current.filter(Boolean)
        const outWraps = activeImgWrapRefs.current.filter(Boolean)
        const inCards = incomingCardRefs.current.filter(Boolean)
        const inWraps = incomingImgWrapRefs.current.filter(Boolean)

        const outTexts = getRevealTexts(outCards)
        const inTexts = getRevealTexts(inCards)

        // Reveal the incoming layer only after setting hidden initial states (prevents flash)
        gsap.set(incomingLayerRef.current, { opacity: 1 })
        gsap.set(inTexts, { yPercent: 100, autoAlpha: 1 })
        gsap.set(inWraps, { clipPath: 'inset(100% 0% 0% 0%)' })

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            setPage(next)
            setIncomingPage(null)
            setIsAnimating(false)

            activeCardRefs.current = []
            activeImgWrapRefs.current = []
            incomingCardRefs.current = []
            incomingImgWrapRefs.current = []
          },
        })

        tl.to(
          outTexts,
          { yPercent: -100, autoAlpha: 0, duration: 0.34, stagger: 0.015, ease: 'power2.in' },
          0
        ).to(
          outWraps,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: 0.38,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0
        )

        tl.to(inWraps, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.55,
          stagger: 0.045,
          ease: 'power3.out',
        }).to(
          inTexts,
          { yPercent: 0, autoAlpha: 1, duration: 0.55, stagger: 0.02, ease: 'power3.out' },
          '<+=0.02'
        )
      })
    })
  }

  useLayoutEffect(() => {
    perPageRef.current = perPage
  }, [perPage])

  useLayoutEffect(() => {
    const updatePerPage = () => {
      const nextPerPage = window.innerWidth >= 540 ? 4 : 1
      if (perPageRef.current === nextPerPage) return
      perPageRef.current = nextPerPage

      setPerPage(nextPerPage)
      setIncomingPage(null)
      setIsAnimating(false)

      activeCardRefs.current = []
      activeImgWrapRefs.current = []
      incomingCardRefs.current = []
      incomingImgWrapRefs.current = []
    }
    window.addEventListener('resize', updatePerPage)
    return () => window.removeEventListener('resize', updatePerPage)
  }, [])

  const normalizedPage = ((page % totalPages) + totalPages) % totalPages
  const normalizedIncomingPage =
    incomingPage === null ? null : ((incomingPage % totalPages) + totalPages) % totalPages

  const activeItems = getItems(normalizedPage)
  const incomingItems = normalizedIncomingPage === null ? [] : getItems(normalizedIncomingPage)
  const mobileActiveItem = celebrationData[(normalizedPage * perPage) % celebrationData.length]
  const mobileStackItems = isMobile
    ? Array.from({ length: 4 }, (_, offset) => {
        const idx = (normalizedPage + offset) % celebrationData.length
        return celebrationData[idx]
      })
    : []
  const mobileStackTransforms = [
    { rotate: 0, x: 0, y: 0, scale: 1 },
    { rotate: -10, x: -26, y: 16, scale: 0.98 },
    { rotate: 10, x: 26, y: 22, scale: 0.96 },
    { rotate: -6, x: -8, y: 30, scale: 0.94 },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#FFFFFF] flex justify-center overflow-hidden font-sans"
    >
      {isMobile ? (
        <div className="relative w-full max-w-[540px] mx-auto px-6 pt-14 pb-12 min-h-[820px] flex flex-col items-center">
          {/* Title + note (mobile) */}
          <div className="w-full flex flex-col items-center text-center">
            <h3
              className="text-[#2D2D2D] text-[32px] leading-[1.05] font-serif"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              <span ref={titleRef} className="block">
                {gc.heading_1 ?? 'Experience Across Grand Celebrations'}
              </span>
            </h3>
            <p className="mt-6 text-[#2D2D2D] opacity-50 text-[14px] leading-[1.5] max-w-[320px]">
              <span ref={noteRef}>
                   {gc.note ??
                'Executed during my tenure at Wizcraft and/or as a freelance project manager.'}
              </span>
            </p>
          </div>

          {/* Stacked cards (mobile) */}
          <div className="mt-14 flex-1 w-full flex items-center justify-center">
            <div className="relative w-[260px] h-[360px]">
              {mobileStackItems.map((item, idx) => {
                const t =
                  mobileStackTransforms[idx] ||
                  mobileStackTransforms[mobileStackTransforms.length - 1]
                return (
                  <div
                    key={`${item.id}-stack-${idx}`}
                    className="absolute inset-0"
                    style={{
                      transform: `translate3d(${t.x}px, ${t.y}px, 0) rotate(${t.rotate}deg) scale(${t.scale})`,
                      zIndex: mobileStackItems.length - idx,
                      transformOrigin: 'center',
                    }}
                  >
                    <div className="w-full h-full bg-[#F5F5F5] overflow-hidden rounded-[18px] shadow-[0_28px_70px_rgba(0,0,0,0.18)]">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dots + description (mobile) */}
          <div className="w-full flex flex-col items-center mt-5">
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => {
                const active = i === normalizedPage
                return (
                  <button
                    key={`gc-dot-${i}`}
                    type="button"
                    onClick={() => setPage(i)}
                    aria-label={`Go to celebrations ${i + 1}`}
                    className={`rounded-full transition-all ${
                      active ? 'w-5 h-1.5 bg-neutral-800' : 'w-3 h-1.5 bg-neutral-800/30'
                    }`}
                  />
                )
              })}
            </div>

            <h4
              className="mt-8 text-[#2D2D2D] text-[20px] leading-[1.1] font-serif uppercase tracking-wide text-center max-w-[320px]"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              {mobileActiveItem?.title}
            </h4>

            <p className="mt-6 text-[#2D2D2D] opacity-50 text-[14px] leading-[1.6] text-center max-w-[320px]">
              {mobileActiveItem?.desc}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-[1440px] h-[845px] mx-auto">
          {/* Cards area (active + incoming layers) */}
          <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-full px-[5%] lg:px-[76px]">
            <div className="relative">
              {/* Active layer */}
              <div className="grid grid-cols-1 min-[540px]:grid-cols-4 gap-4 min-[540px]:gap-6">
                {activeItems.map((item, index) => (
                  <div
                    key={`active-${item.id}`}
                    ref={el => {
                      activeCardRefs.current[index] = el
                    }}
                    className="relative w-full flex flex-col"
                  >
                    <div
                      ref={el => {
                        activeImgWrapRefs.current[index] = el
                      }}
                      className={`w-full bg-[#F5F5F5] overflow-hidden ${
                        item.tall
                          ? 'h-[320px] min-[540px]:h-[400px]'
                          : 'h-[220px] min-[540px]:h-[300px]'
                      }`}
                      style={{ willChange: 'clip-path' }}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mt-6 w-full flex flex-col gap-[12px] pr-4">
                      <div className="flex gap-[12px] items-start">
                        <span
                          className="text-[#000000] text-[27px] leading-[1] font-serif shrink-0"
                          style={{ fontFamily: "'Malgin', serif" }}
                        >
                          <GCTextReveal>{item.id}</GCTextReveal>
                        </span>
                        <div className="flex flex-col gap-[12px] mt-[5px]">
                          <h4
                            className="text-[#000000] text-[20px] leading-[1] font-serif uppercase tracking-wide"
                            style={{ fontFamily: "'Malgin', serif" }}
                          >
                            <GCTextReveal>{item.title}</GCTextReveal>
                          </h4>
                          <p className="text-[#2D2D2D] opacity-50 text-[12px] leading-[1.5]">
                            <GCTextReveal>{item.desc}</GCTextReveal>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Incoming layer (only during click animation) */}
              {incomingPage !== null && (
                <div
                  ref={incomingLayerRef}
                  className="absolute inset-0 pointer-events-none"
                  style={{ opacity: 0 }}
                >
                  <div className="grid grid-cols-1 min-[540px]:grid-cols-4 gap-4 min-[540px]:gap-6">
                    {incomingItems.map((item, index) => (
                      <div
                        key={`incoming-${item.id}`}
                        ref={el => {
                          incomingCardRefs.current[index] = el
                        }}
                        className="relative w-full flex flex-col"
                      >
                        <div
                          ref={el => {
                            incomingImgWrapRefs.current[index] = el
                          }}
                          className={`w-full bg-[#F5F5F5] overflow-hidden ${
                            item.tall
                              ? 'h-[320px] min-[540px]:h-[400px]'
                              : 'h-[220px] min-[540px]:h-[300px]'
                          }`}
                          style={{ willChange: 'clip-path' }}
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="mt-6 w-full flex flex-col gap-[12px] pr-4">
                          <div className="flex gap-[12px] items-start">
                            <span
                              className="text-[#000000] text-[27px] leading-[1] font-serif shrink-0"
                              style={{ fontFamily: "'Malgin', serif" }}
                            >
                              <GCTextReveal>{item.id}</GCTextReveal>
                            </span>
                            <div className="flex flex-col gap-[12px] mt-[5px]">
                              <h4
                                className="text-[#000000] text-[20px] leading-[1] font-serif uppercase tracking-wide"
                                style={{ fontFamily: "'Malgin', serif" }}
                              >
                                <GCTextReveal>{item.title}</GCTextReveal>
                              </h4>
                              <p className="text-[#2D2D2D] opacity-50 text-[12px] leading-[1.5]">
                                <GCTextReveal>{item.desc}</GCTextReveal>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom text */}
          <div className="absolute w-full bottom-[40px] lg:bottom-[80px] px-[5%] lg:px-[100px] flex flex-col-reverse min-[540px]:flex-row justify-between items-start min-[540px]:items-end gap-8 pointer-events-none z-0">
            <p className="text-[#2D2D2D] opacity-50 text-[14px] min-[540px]:text-[16px] leading-[1.5] text-left min-[540px]:pb-2 max-w-[631px]">
              <span ref={noteRef} className="reveal-text gc-reveal-text">
                              {gc.note ??
                'Executed during my tenure at Wizcraft and/or as a freelance project manager.'}
              </span>
            </p>

            <h3
              className="text-[#2D2D2D] text-[32px] min-[540px]:text-[47px] leading-[1] text-left min-[540px]:text-right font-serif shrink-0"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              <span className="reveal-wrapper">
                <span ref={titleRef} className="reveal-text gc-reveal-text">
                  {gc.heading_1 ?? 'Experience Across Grand Celebrations'}
                </span>
              </span>
            </h3>
          </div>

          {/* Navigation arrows */}
          <button
            ref={arrowLeftRef}
            type="button"
            onClick={() => go(-1)}
            disabled={isAnimating}
            className="absolute left-0 top-[228px] w-[40px] min-[540px]:w-[52px] h-[80px] min-[540px]:h-[104px] bg-[#F2F2F2] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors z-20 shadow-md disabled:opacity-60"
            style={{ borderRadius: '0 104px 104px 0' }}
            aria-label="Previous celebrations"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2D2D2D"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="min-[540px]:ml-[-10px]"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>

          <button
            ref={arrowRightRef}
            type="button"
            onClick={() => go(1)}
            disabled={isAnimating}
            className="absolute right-0 top-[228px] w-[40px] min-[540px]:w-[52px] h-[80px] min-[540px]:h-[104px] bg-[#F2F2F2] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors z-20 shadow-md disabled:opacity-60"
            style={{ borderRadius: '104px 0 0 104px' }}
            aria-label="Next celebrations"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2D2D2D"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="min-[540px]:mr-[-10px]"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}

const ImgBox = ({ src, alt, className, setRef }) => (
  <div
    ref={setRef}
    className={`${className} overflow-hidden`}
    style={{ willChange: 'transform, clip-path', clipPath: 'inset(0% 0% 0% 0%)' }}
  >
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      style={{ willChange: 'transform' }}
    />
  </div>
)

const CelebrationEveryDaySection = () => {
   const { data: cms = {} } = useInHousePlannerPage()
    const ced = cms.celebrations_every_day ?? {}
    const cmsCats = ced.categories ?? []
    
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Replace these mappings with real images per category when you have them.
  const CATEGORY_DATA = [
    {
      name: 'Anniversaries',
      heading: 'ANNIVERSARIES',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
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
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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

  const mobileWrapsRef = useRef({
    topLeft: null,
    topRight: null,
    bottomLeft: null,
    bottomRight: null,
  })
  const mobileHeadingRef = useRef(null)
  const mobileDescRef = useRef(null)

  const incomingHeadingRef = useRef(null)
  const incomingDescRef = useRef(null)
  const activeAccentRef = useRef(null)
  const incomingAccentRef = useRef(null)
  const incomingLayerRef = useRef(null)

  const active = CATEGORY_DATA.find(c => c.name === activeName) ?? CATEGORY_DATA[0]
  const incoming = incomingName ? (CATEGORY_DATA.find(c => c.name === incomingName) ?? null) : null

  const animateSwapMobile = nextName => {
    if (prefersReducedMotion) {
      setActiveName(nextName)
      return
    }
    if (isAnimating) return
    if (nextName === activeName) return

    setIsAnimating(true)

    const top = [mobileWrapsRef.current.topLeft, mobileWrapsRef.current.topRight].filter(Boolean)
    const bottom = [mobileWrapsRef.current.bottomLeft, mobileWrapsRef.current.bottomRight].filter(
      Boolean
    )
    const text = [mobileHeadingRef.current, mobileDescRef.current].filter(Boolean)

    const outTl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        setActiveName(nextName)

        requestAnimationFrame(() => {
          const inTop = [mobileWrapsRef.current.topLeft, mobileWrapsRef.current.topRight].filter(
            Boolean
          )
          const inBottom = [
            mobileWrapsRef.current.bottomLeft,
            mobileWrapsRef.current.bottomRight,
          ].filter(Boolean)
          const inText = [mobileHeadingRef.current, mobileDescRef.current].filter(Boolean)

          gsap.set(inTop, { y: 24, autoAlpha: 0 })
          gsap.set(inBottom, { y: -24, autoAlpha: 0 })
          gsap.set(inText, { yPercent: 100, autoAlpha: 0 })

          gsap
            .timeline({
              defaults: { ease: 'power3.out' },
              onComplete: () => setIsAnimating(false),
            })
            .to(inTop, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.05 }, 0)
            .to(inBottom, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.05 }, 0)
            .to(inText, { yPercent: 0, autoAlpha: 1, duration: 0.55 }, 0.82)
        })
      },
    })

    outTl
      .to(top, { y: -24, autoAlpha: 0, duration: 0.45, stagger: 0.04, ease: 'power2.in' }, 0)
      .to(bottom, { y: 24, autoAlpha: 0, duration: 0.45, stagger: 0.04, ease: 'power2.in' }, 0)
      .to(text, { yPercent: -100, autoAlpha: 0, duration: 0.32, ease: 'power2.in' }, 0.03)
  }

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
        const outBottom = [
          activeWrapsRef.current.bottomLeft,
          activeWrapsRef.current.bottomRight,
        ].filter(Boolean)

        const inTop = [
          incomingWrapsRef.current.topLeft,
          incomingWrapsRef.current.topRight,
          incomingAccentRef.current,
        ].filter(Boolean)
        const inBottom = [
          incomingWrapsRef.current.bottomLeft,
          incomingWrapsRef.current.bottomRight,
        ].filter(Boolean)

        const outHeading = headingRef.current
        const outDesc = descRef.current
        const inHeading = incomingHeadingRef.current
        const inDesc = incomingDescRef.current

        // Prep incoming layer (TOP from below, BOTTOM from above)
        gsap.set(inTop, { y: 60, autoAlpha: 0 })
        gsap.set(inBottom, { y: -60, autoAlpha: 0 })

        // Text: out up, in from below (after images are in place).
        if (inHeading) gsap.set(inHeading, { yPercent: 100, autoAlpha: 0 })
        if (inDesc) gsap.set(inDesc, { yPercent: 120, autoAlpha: 0 })
        // Keep incoming layer hidden until the IN phase starts (prevents any flash).
        if (incomingLayerRef.current) gsap.set(incomingLayerRef.current, { opacity: 0 })

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            setActiveName(nextName)
            setIncomingName(null)
            setIsAnimating(false)

            // clear refs for the unmounted incoming layer
            incomingWrapsRef.current = {
              topLeft: null,
              topRight: null,
              bottomLeft: null,
              bottomRight: null,
            }
          },
        })

        // OUT (hard cut first)
        // Top images: go UP and disappear
        tl.to(
          outTop,
          {
            y: -60,
            autoAlpha: 0,
            duration: 0.75,
            stagger: 0.04,
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
            duration: 0.75,
            stagger: 0.04,
            ease: 'power2.in',
          },
          0
        )

        // Text: out UP (heading + paragraph together)
        if (outHeading) {
          tl.to(
            outHeading,
            { yPercent: -100, autoAlpha: 0, duration: 0.42, ease: 'power2.in' },
            0.03
          )
        }
        if (outDesc) {
          tl.to(outDesc, { yPercent: -120, autoAlpha: 0, duration: 0.34, ease: 'power2.in' }, 0.09)
        }

        // IN: start after OUT finishes (with a small pause) so the swap feels clean.
        const OUT_END = 0.78
        const IN_START = OUT_END + 0.14
        if (incomingLayerRef.current)
          tl.set(incomingLayerRef.current, { opacity: 1 }, IN_START - 0.01)
        // Top images: come from DOWN
        tl.to(
          inTop,
          {
            y: 0,
            autoAlpha: 1,
            duration: 1.05,
            stagger: 0.05,
            ease: 'power3.out',
          },
          IN_START
        )

        // Bottom images: come from UP (reverse)
        tl.to(
          inBottom,
          {
            y: 0,
            autoAlpha: 1,
            duration: 1.05,
            stagger: 0.05,
            ease: 'power3.out',
          },
          IN_START
        )

        // Text: in from below (heading first, paragraph after), after images are set
        const IMAGE_IN_END = IN_START + 1.05 + 0.1
        const TEXT_IN_START = IMAGE_IN_END + 0.12
        if (inHeading) {
          tl.to(
            inHeading,
            { yPercent: 0, autoAlpha: 1, duration: 0.65, ease: 'power3.out' },
            TEXT_IN_START
          )
        }
        if (inDesc) {
          tl.to(
            inDesc,
            { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'power2.out' },
            TEXT_IN_START + 0.12
          )
        }
      })
    })
  }

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
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F8F4ED] flex justify-center overflow-hidden font-sans pb-20"
    >
      {/* Mobile layout (<= md) */}
      <div className="w-full max-w-[540px] px-5 pt-12 min-[540px]:hidden">
        <h2
          className="text-[#2D2D2D] text-[34px] leading-[1.05] text-center font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
           {ced.heading ?? 'Celebrations We Plan Every Day'}
        </h2>

        <p className="mt-5 text-[#2D2D2D] opacity-60 text-[14px] leading-[1.7] text-center">
          {ced.description ??
            'From intimate birthdays to joyful wedding functions, our in-house planner helps bring thoughtful structure and creative detail to social celebrations that matter most.'}
        </p>

        {/* Category tabs (2 rows like screenshot) */}
        <div className="mt-10">
          <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-3 text-[14px]">
            {CATEGORY_DATA.slice(0, 3).map((cat, idx) => {
              const isActive = cat.name === activeName
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAnimating) return
                      animateSwapMobile(cat.name)
                    }}
                    className={
                      isActive
                        ? 'text-[#2D2D2D] font-medium border-b border-[#2D2D2D] pb-1'
                        : 'text-[#2D2D2D]/50 pb-1'
                    }
                  >
                    {cmsCats[idx]?.tab_label ?? cat.name}
                  </button>
                  {idx !== 2 && <span className="text-[#2D2D2D]/50">|</span>}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-center flex-wrap gap-x-3 gap-y-3 text-[14px]">
            {CATEGORY_DATA.slice(3, 6).map((cat, i) => {
              const idx = i + 3
              const isActive = cat.name === activeName
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAnimating) return
                      animateSwapMobile(cat.name)
                    }}
                    className={
                      isActive
                        ? 'text-[#2D2D2D] font-medium border-b border-[#2D2D2D] pb-1'
                        : 'text-[#2D2D2D]/50 pb-1'
                    }
                  >
                    {cmsCats[idx]?.tab_label ?? cat.name}
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
            <div
              ref={el => (mobileWrapsRef.current.topLeft = el)}
              className="relative overflow-hidden rounded-[18px] row-span-2 col-start-1 row-start-1"
              style={{ willChange: 'transform, opacity' }}
            >
              <img
                src={active.images.topLeft}
                alt={`${active.name} left`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Right top */}
            <div
              ref={el => (mobileWrapsRef.current.topRight = el)}
              className="relative overflow-hidden rounded-[18px] col-start-2 row-start-1"
              style={{ willChange: 'transform, opacity' }}
            >
              <img
                src={active.images.topRight}
                alt={`${active.name} right top`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Bottom left */}
            <div
              ref={el => (mobileWrapsRef.current.bottomLeft = el)}
              className="relative overflow-hidden rounded-[18px] col-start-1 row-start-3"
              style={{ willChange: 'transform, opacity' }}
            >
              <img
                src={active.images.bottomLeft}
                alt={`${active.name} bottom left`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Big bottom right */}
            <div
              ref={el => (mobileWrapsRef.current.bottomRight = el)}
              className="relative overflow-hidden rounded-[18px] col-start-2 row-start-2 row-span-2"
              style={{ willChange: 'transform, opacity' }}
            >
              <img
                src={active.images.bottomRight}
                alt={`${active.name} bottom right`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          <h3
            ref={mobileHeadingRef}
            className="mt-8 text-center text-[#2D2D2D] text-[22px] font-serif tracking-wide uppercase"
            style={{ fontFamily: "'Malgin', serif", willChange: 'transform' }}
          >
            {active.heading}
          </h3>
          <p
            ref={mobileDescRef}
            className="mt-3 text-center text-[#2D2D2D] opacity-60 text-[14px] leading-[1.7]"
            style={{ willChange: 'transform' }}
          >
            {active.desc}
          </p>
        </div>
      </div>

      {/* Desktop layout (md+) — existing animation layout kept as-is */}
      <div className="hidden min-[540px]:block w-full">
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
                 {ced.heading ?? 'Celebrations We Plan Every Day'}
              </h2>

              <p className="absolute left-1/2 -translate-x-1/2 top-[169px] w-[809px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5] text-center">
               {ced.description ??
            'From intimate birthdays to joyful wedding functions, our in-house planner helps bring thoughtful structure and creative detail to social celebrations that matter most.'}
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
                    {CATEGORY_DATA.map((cat, idx) => {
                      const isActive = cat.name === activeName
                      return (
                        <div
                          key={cat.name}
                          onClick={() => animateSwap(cat.name)}
                          className={`py-2 pr-4 cursor-pointer w-fit ${
                            isActive
                              ? 'border-b border-[#2D2D2D]'
                              : 'opacity-50 hover:opacity-100 transition-opacity'
                          }`}
                        >
                          <span className="text-[#2D2D2D] text-[16px] font-medium leading-[1.5]">
                             {cmsCats[idx]?.tab_label ?? cat.name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ACTIVE images */}
                <ImgBox
                  key={`${active.name}-topLeft`}
                  src={active.images.topLeft}
                  alt={`${active.name} image`}
                  className="absolute left-[440px] top-[0px] w-[500px] h-[400px] z-10"
                  setRef={el => (activeWrapsRef.current.topLeft = el)}
                />
                <ImgBox
                  key={`${active.name}-topRight`}
                  src={active.images.topRight}
                  alt={`${active.name} image`}
                  className="absolute left-[940px] top-[0px] w-[500px] h-[400px] z-10"
                  setRef={el => (activeWrapsRef.current.topRight = el)}
                />
                <ImgBox
                  key={`${active.name}-bottomLeft`}
                  src={active.images.bottomLeft}
                  alt={`${active.name} image`}
                  className="absolute left-[0px] top-[600px] w-[640px] h-[200px] z-10"
                  setRef={el => (activeWrapsRef.current.bottomLeft = el)}
                />
                <ImgBox
                  key={`${active.name}-bottomRight`}
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
                  <span
                    key={active.name}
                    ref={headingRef}
                    className="inline-block"
                    style={{ willChange: 'transform' }}
                  >
                    {active.heading}
                  </span>
                </h3>

                <p className="absolute left-[100px] top-[455px] w-[340px] text-[#FFFFFF] text-[12px] font-medium leading-[1.5] z-20 overflow-hidden">
                  <span
                    key={active.name}
                    ref={descRef}
                    className="inline-block"
                    style={{ willChange: 'transform' }}
                  >
                    {active.desc}
                  </span>
                </p>

                {/* INCOMING layer (only during click animation) */}
                {incoming && (
                  <div
                    ref={incomingLayerRef}
                    className="absolute inset-0 pointer-events-none z-30"
                    style={{ opacity: 0 }}
                  >
                    <div
                      ref={incomingAccentRef}
                      className="absolute left-[0px] top-[400px] w-[640px] h-[200px] bg-[#CDB17E] z-10"
                      style={{ willChange: 'transform, opacity' }}
                    />
                    <ImgBox
                      key={`${incoming.name}-topLeft`}
                      src={incoming.images.topLeft}
                      alt={`${incoming.name} image`}
                      className="absolute left-[440px] top-[0px] w-[500px] h-[400px]"
                      setRef={el => (incomingWrapsRef.current.topLeft = el)}
                    />
                    <ImgBox
                      key={`${incoming.name}-topRight`}
                      src={incoming.images.topRight}
                      alt={`${incoming.name} image`}
                      className="absolute left-[940px] top-[0px] w-[500px] h-[400px]"
                      setRef={el => (incomingWrapsRef.current.topRight = el)}
                    />
                    <ImgBox
                      key={`${incoming.name}-bottomLeft`}
                      src={incoming.images.bottomLeft}
                      alt={`${incoming.name} image`}
                      className="absolute left-[0px] top-[600px] w-[640px] h-[200px]"
                      setRef={el => (incomingWrapsRef.current.bottomLeft = el)}
                    />
                    <ImgBox
                      key={`${incoming.name}-bottomRight`}
                      src={incoming.images.bottomRight}
                      alt={`${incoming.name} image`}
                      className="absolute left-[640px] top-[400px] w-[800px] h-[400px]"
                      setRef={el => (incomingWrapsRef.current.bottomRight = el)}
                    />

                    <h3
                      className="absolute left-[787px] top-[362px] w-[441px] text-[#FFFFFF] text-[60px] leading-[1] text-center font-normal z-20 drop-shadow-md tracking-wider uppercase overflow-hidden"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <span
                        ref={incomingHeadingRef}
                        className="inline-block"
                        style={{ willChange: 'transform' }}
                      >
                        {incoming.heading}
                      </span>
                    </h3>

                    <p className="absolute left-[100px] top-[455px] w-[340px] text-[#FFFFFF] text-[12px] font-medium leading-[1.5] z-20 overflow-hidden">
                      <span
                        ref={incomingDescRef}
                        className="inline-block"
                        style={{ willChange: 'transform' }}
                      >
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

const SUPPORT_OPTIONS = [
  'Decor & Styling',
  'Catering & Menu Planning',
  'Full Event Planning',
  'Vendor Coordination',
  'Not Sure Yet',
]

const CelebrationFormSection = () => {
  const { data: cms = {} } = useInHousePlannerPage()
    const cta = cms.closing_cta ?? {}

  const [currentStep, setCurrentStep] = useState(1)
  const { mutate: submitLead, isPending, isError, error } = usePlannerLead()

  // Controlled form state — field names match Express API / Prisma schema
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    event_type: '',
    event_date: '',
    guest_count: '',
    venue_type: '',
    support_types: [],
    vision_notes: '',
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleSupport = opt =>
    setForm(prev => ({
      ...prev,
      support_types: prev.support_types.includes(opt)
        ? prev.support_types.filter(o => o !== opt)
        : [...prev.support_types, opt],
    }))

  const handleNext = () => {
    if (currentStep === 3) {
      // Step 3 → submit then advance to success screen
      submitLead(form, {
        onSuccess: () => setCurrentStep(4),
        onError: () => setCurrentStep(4), // show success screen regardless — lead is best-effort
      })
      return
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // Helper for Stepper Colors
  const getStepColor = stepNum => {
    if (currentStep > stepNum) return 'bg-[#364022] text-white' // Completed
    if (currentStep === stepNum) return 'bg-[#591902] text-white' // Active
    return 'bg-[#D9D9D9] text-white' // Pending
  }

  const getLineColor = stepNum => {
    if (currentStep > stepNum) return 'border-[#364022]'
    return 'border-[#2D2D2D]/20'
  }

  return (
    <section className="relative w-full bg-[#FFFFFF] flex flex-col items-center pt-24 pb-32 font-sans overflow-hidden">
      {/* --- Header Section --- */}
      <div className="text-center mb-16 px-4 mx-3">
        <h2
          className="text-[#2D2D2D] text-[40px] min-[540px]:text-[61px] leading-[1] font-serif mb-6"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {cta.heading ?? 'Tell Us About Your Celebration'}
        </h2>
        <p className="text-[#2D2D2D] opacity-50 text-[14px] min-[540px]:text-[16px] leading-[1.5] max-w-[727px] mx-auto">
         {cta.body ??
            'If you’d like me to plan your event end to end, leave your details and we’ll take it from there.'}
        </p>
      </div>

      {/* --- Form Container --- */}
      <div className="relative w-[calc(100%-32px)] max-w-[720px] h-auto min-[540px]:h-[701px] bg-[#F8F4ED] rounded-[20px] shadow-sm mx-auto p-6 min-[540px]:p-0">
        {/* --- ZONE 1: STEPPER (Top 60px) --- */}
        {currentStep < 4 && (
          <div className="relative min-[540px]:absolute min-[540px]:top-[60px] min-[540px]:left-[120px] min-[540px]:right-[120px] flex justify-between items-start z-10 mb-10 min-[540px]:mb-0">
            {/* Connecting Lines */}
            <div className="absolute top-[30px] left-[30px] right-[30px] flex justify-between z-0">
              <div
                className={`w-1/2 border-t-[1.5px] transition-colors duration-300 ${getLineColor(1)}`}
              ></div>
              <div
                className={`w-1/2 border-t-[1.5px] transition-colors duration-300 ${getLineColor(2)}`}
              ></div>
            </div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(1)}`}
              >
                <span
                  className="font-serif text-[27px] leading-[1]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  1
                </span>
              </div>
              <span
                className={`mt-4 text-[10px] min-[540px]:text-[12px] whitespace-normal min-[540px]:whitespace-nowrap text-center max-w-[88px] min-[540px]:max-w-none transition-opacity duration-300 ${currentStep >= 1 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
              >
                Basic Details
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(2)}`}
              >
                <span
                  className="font-serif text-[27px] leading-[1]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  2
                </span>
              </div>
              <span
                className={`mt-4 text-[10px] min-[540px]:text-[12px] whitespace-normal min-[540px]:whitespace-nowrap text-center max-w-[88px] min-[540px]:max-w-none transition-opacity duration-300 ${currentStep >= 2 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
              >
                Event Details
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(3)}`}
              >
                <span
                  className="font-serif text-[27px] leading-[1]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  3
                </span>
              </div>
              <span
                className={`mt-4 text-[10px] min-[540px]:text-[12px] whitespace-normal min-[540px]:whitespace-nowrap text-center max-w-[110px] min-[540px]:max-w-none transition-opacity duration-300 ${currentStep >= 3 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
              >
                Planning Preferences
              </span>
            </div>
          </div>
        )}

        {/* --- ZONE 2: FORM CONTENT (Top 230px) --- */}
        <div className="relative min-[540px]:absolute min-[540px]:top-[230px] min-[540px]:left-[60px] min-[540px]:right-[60px] mb-10 min-[540px]:mb-0">
          {/* STEP 1: Basic Details */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-y-[32px] animate-fadeIn">
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]"
                />
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]"
                />
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]"
                />
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="text"
                  placeholder="City/Location of Event"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Event Details */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-y-[32px] animate-fadeIn">
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <select
                  value={form.event_type}
                  onChange={e => set('event_type', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Type of Event
                  </option>
                  {[
                    'Birthday',
                    'Anniversary',
                    'House Party',
                    'Baby Shower',
                    'Corporate',
                    'Wedding',
                    'Other',
                  ].map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="date"
                  value={form.event_date}
                  onChange={e => set('event_date', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none cursor-pointer"
                />
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <select
                  value={form.guest_count}
                  onChange={e => set('guest_count', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Estimated Guest Count
                  </option>
                  {['1–15', '15–30', '30–50', '50–100', '100+'].map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <select
                  value={form.venue_type}
                  onChange={e => set('venue_type', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Venue Type
                  </option>
                  {[
                    'Home',
                    'Banquet Hall',
                    'Terrace / Rooftop',
                    'Garden / Outdoor',
                    'Office',
                    'Other',
                  ].map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Planning Preferences */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-10 animate-fadeIn">
              <div>
                <h4 className="text-[21px] text-[#2D2D2D] mb-5">
                  What kind of support are you looking for?
                </h4>
                <div className="flex flex-col gap-3">
                  {SUPPORT_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => toggleSupport(opt)}
                        className={`w-[19px] h-[19px] border rounded-[4px] transition-colors flex items-center justify-center shrink-0 cursor-pointer
                          ${
                            form.support_types.includes(opt)
                              ? 'bg-[#591902] border-[#591902]'
                              : 'border-[#2D2D2D] group-hover:bg-[#2D2D2D]/10'
                          }`}
                      >
                        {form.support_types.includes(opt) && (
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[12px] text-[#2D2D2D]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[21px] text-[#2D2D2D] mb-4">
                  Tell us a little about your vision
                </h4>
                <div className="border-b border-[#2D2D2D]/50 pb-2">
                  <input
                    type="text"
                    placeholder="Message"
                    value={form.vision_notes}
                    onChange={e => set('vision_notes', e.target.value)}
                    className="w-full bg-transparent text-[#2D2D2D] text-[12px] outline-none placeholder:text-[#2D2D2D]"
                  />
                </div>
                {isError && (
                  <p className="mt-3 text-[12px] text-red-500">
                    {error?.message ?? 'Something went wrong. Please try again.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 4: Success Screen (Centered entirely) */}
        {currentStep === 4 && (
          <div className="relative min-[540px]:absolute min-[540px]:inset-0 flex flex-col items-center justify-center animate-fadeIn py-16 min-[540px]:py-0">
            {/* Group 62: Star 8 & Check Icon (Fixed with perfect inline SVG!) */}
            <div className="relative w-[116px] h-[116px] mb-10 flex items-center justify-center">
              <svg
                width="116"
                height="116"
                viewBox="0 0 116 116"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M58 0L64.4449 7.4441L74.227 5.17646L78.6836 14.1378L88.6657 14.0754L90.9635 23.8541L100.177 26.3262L99.8804 36.3117L107.575 41.3435L104.708 50.9419L110.824 58L104.708 65.0581L107.575 74.6565L99.8804 79.6883L100.177 89.6738L90.9635 92.1459L88.6657 101.925L78.6836 101.862L74.227 110.824L64.4449 108.556L58 116L51.5551 108.556L41.773 110.824L37.3164 101.862L27.3343 101.925L25.0365 92.1459L15.8234 89.6738L16.1196 79.6883L8.42461 74.6565L11.2918 65.0581L5.17646 58L11.2918 50.9419L8.42461 41.3435L16.1196 36.3117L15.8234 26.3262L25.0365 23.8541L27.3343 14.0754L37.3164 14.1378L41.773 5.17646L51.5551 7.4441L58 0Z"
                  fill="#364022"
                />
                <path
                  d="M40 58 L52 70 L76 46"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-[8px] w-full">
              <h3
                className="text-[27px] leading-[1] text-[#2D2D2D] text-center font-serif m-0"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                Thank you! Your request has been received.
              </h3>
              <p className="text-[16px] leading-[1.5] text-[#2D2D2D] opacity-50 text-center w-full max-w-[535px] m-0">
                Our in-house planner will review your details and reach out within the next 24 hours
                to discuss your celebration.
              </p>
            </div>
          </div>
        )}

        {/* --- ZONE 4: BOTTOM NAVIGATION BUTTONS (Bottom 60px) --- */}
        {currentStep < 4 && (
          <div className="relative min-[540px]:absolute min-[540px]:bottom-[60px] min-[540px]:left-[60px] min-[540px]:right-[60px] flex flex-col min-[540px]:flex-row min-[540px]:justify-between items-center gap-4 min-[540px]:gap-0">
            {/* Previous Button */}
            <div className="w-full min-[540px]:w-auto min-[540px]:flex-1 flex justify-center min-[540px]:justify-start">
              {currentStep > 1 && (
                <>
                  {/* Mobile: full-width pill */}
                  <button
                    onClick={handlePrev}
                    className="min-[540px]:hidden w-full max-w-[520px] flex items-center justify-between bg-[#D9D9D9] rounded-[56px] pl-6 pr-1 py-1 hover:bg-[#c9c9c9] transition-colors group"
                  >
                    <span className="text-[#8C8C8C] text-[16px] font-medium leading-[1.5]">
                      Previous
                    </span>
                    <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#8C8C8C] transition-transform group-hover:scale-105">
                      <svg
                        className="min-[540px]:hidden"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8C8C8C"
                        strokeWidth="1.5"
                      >
                        <path d="M19 12H5" />
                        <path d="m12 19-7-7 7-7" />
                      </svg>
                      <svg
                        className="hidden min-[540px]:block rotate-180"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8C8C8C"
                        strokeWidth="1.5"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </div>
                  </button>

                  {/* Desktop: existing compact button */}
                  <button
                    onClick={handlePrev}
                    className="hidden min-[540px]:flex items-center gap-4 bg-[#D9D9D9] rounded-[56px] pl-1 pr-6 py-1 hover:bg-[#c9c9c9] transition-colors group"
                  >
                    <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#8C8C8C] transition-transform group-hover:scale-105">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8C8C8C"
                        strokeWidth="1.5"
                        className="rotate-180"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </div>
                    <span className="text-[#8C8C8C] text-[16px] font-medium leading-[1.5]">
                      Previous
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Next / Submit Button */}
            <div className="w-full min-[540px]:w-auto flex justify-center min-[540px]:justify-end">
              <button
                onClick={handleNext}
                disabled={currentStep === 3 && isPending}
                className={`w-full max-w-[520px] min-[540px]:w-auto flex items-center justify-between bg-[#CDB17E] rounded-[56px] pl-6 pr-1 py-1 hover:bg-[#bfa06b] transition-colors group ${currentStep === 3 && isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="text-[#FAFAFA] text-[16px] font-medium leading-[1.5] pr-2">
                  {currentStep === 3 && isPending
                    ? 'Submitting...'
                    : currentStep === 3
                      ? 'Submit'
                      : 'Next'}
                </span>
                <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#CDB17E] transition-transform group-hover:scale-105">
                  <svg
                    className="min-[540px]:hidden"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#CDB17E"
                    strokeWidth="1.5"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                  <svg
                    className="hidden min-[540px]:block"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#CDB17E"
                    strokeWidth="1.5"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const InHousePlannerSection = () => {
  const { data: cms = {} } = useInHousePlannerPage()
  const bio = cms.moksha_bio ?? {}

  return (
    <>
      <ScrollImageSpreadSection />

      <section className="w-full bg-[#957960] flex justify-center overflow-hidden font-sans">
        <div className="relative w-[1440px] h-[660px] shrink-0">
          <div className="absolute left-[0px] top-[0px] w-[720px] h-[660px] bg-[#FFFFFF]">
            <img
              src={plannerImg}
              alt="Moksha - In-House Event Planner"
              className="w-full h-full object-cover object-[center_15%]"
            />
          </div>

          <h2
            className="absolute right-[114px] top-[40px] w-[566px] text-[#FFFFFF] text-[61px] leading-[1] font-serif"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            From Our In-House <br /> Event Planner
          </h2>

          <div className="absolute left-[760px] top-[202px] w-[461px] flex flex-col gap-[20px]">
            <h3 className="w-full text-[#FFFFFF] text-[21px] font-medium leading-[1.2]">
              {bio.greeting ?? "Hi, I'm Moksha."}
            </h3>

            <div className="w-full flex flex-col gap-[20px]">
              <p className="w-full text-[#FFFFFF] opacity-80 text-[16px] leading-[1.5] font-normal">
                {bio.intro ??
                  'Co-founder at Elewen and a professional event planner with 6+ years of industry experience. Trained in International Events in the UK, I bring structure, creativity, and calm to every celebration.'}
              </p>

              <p className="w-full text-[#FFFFFF] opacity-80 text-[16px] leading-[1.5] font-normal">
                {bio.personal_note ??
                  "Some events call for personal attention and thoughtful detailing. They need intention, detail, and a planner who truly cares, that's exactly why the In-House Planner was created."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <GrandCelebrationsSection />

      <CelebrationEveryDaySection />

      <CelebrationFormSection />
    </>
  )
}

export default InHousePlannerSection
