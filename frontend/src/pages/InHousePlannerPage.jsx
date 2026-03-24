import { useRef, useState, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePlannerLead } from '../hooks/usePlannerLead'
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

  const [perPage, setPerPage] = useState(4)
  const [page, setPage] = useState(0)
  const [incomingPage, setIncomingPage] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const totalPages = Math.max(1, Math.ceil(celebrationData.length / perPage))

  const getItems = pageIndex => {
    const start = pageIndex * perPage
    return celebrationData.slice(start, start + perPage)
  }

  const getRevealTexts = cards =>
    cards.flatMap(card => Array.from(card.querySelectorAll('.gc-reveal-text')))

  const go = dir => {
    if (isAnimating || totalPages <= 1) return

    const next = (page + dir + totalPages) % totalPages
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
          { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.38, stagger: 0.03, ease: 'power2.in' },
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
    const updatePerPage = () => setPerPage(window.innerWidth >= 768 ? 4 : 1)
    updatePerPage()
    window.addEventListener('resize', updatePerPage)
    return () => window.removeEventListener('resize', updatePerPage)
  }, [])

  useLayoutEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      const cards = activeCardRefs.current.filter(Boolean)
      const wraps = activeImgWrapRefs.current.filter(Boolean)
      const arrows = [arrowLeftRef.current, arrowRightRef.current].filter(Boolean)
      const bottomTexts = [titleRef.current, noteRef.current].filter(Boolean)
      const cardTexts = getRevealTexts(cards)

      gsap.set(cardTexts, { yPercent: 100, autoAlpha: 1 })
      gsap.set(wraps, { clipPath: 'inset(100% 0% 0% 0%)' })
      gsap.set(bottomTexts, { yPercent: 100, autoAlpha: 1 })
      gsap.set(arrows, { autoAlpha: 0, y: 10, scale: 0.98 })

      gsap
        .timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 72%',
            toggleActions: 'play none none reverse',
          },
        })
        .to(wraps, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, stagger: 0.06 })
        .to(cardTexts, { yPercent: 0, duration: 0.55, stagger: 0.02 }, 0.1)
        .to(bottomTexts, { yPercent: 0, duration: 0.65, stagger: 0.08 }, 0.18)
        .to(arrows, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.06 }, 0.22)
    }, sectionRef)

    return () => ctx.revert()
  }, [perPage])

  const activeItems = getItems(page)
  const incomingItems = incomingPage === null ? [] : getItems(incomingPage)

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#FFFFFF] flex justify-center overflow-hidden font-sans"
    >
      <div className="relative w-full max-w-[1440px] h-[845px] mx-auto">
        {/* Cards area (active + incoming layers) */}
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-full px-[5%] lg:px-[76px]">
          <div className="relative">
            {/* Active layer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
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
                      item.tall ? 'h-[320px] md:h-[400px]' : 'h-[220px] md:h-[300px]'
                    }`}
                    style={{ willChange: 'clip-path' }}
                  >
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
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
                          item.tall ? 'h-[320px] md:h-[400px]' : 'h-[220px] md:h-[300px]'
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
        <div className="absolute w-full bottom-[40px] lg:bottom-[80px] px-[5%] lg:px-[100px] flex flex-col-reverse md:flex-row justify-between items-start md:items-end gap-8 pointer-events-none z-0">
          <p className="text-[#2D2D2D] opacity-50 text-[14px] md:text-[16px] leading-[1.5] text-left md:pb-2 max-w-[631px]">
            <span ref={noteRef} className="reveal-text gc-reveal-text">
              Executed during my tenure at Wizcraft and/ or as a freelance project manager.
            </span>
          </p>

          <h3
            className="text-[#2D2D2D] text-[32px] md:text-[47px] leading-[1] text-left md:text-right font-serif shrink-0"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            <span className="reveal-wrapper">
              <span ref={titleRef} className="reveal-text gc-reveal-text">
                Experience Across <br className="hidden md:block" /> Grand Celebrations
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
          className="absolute left-0 top-[228px] w-[40px] md:w-[52px] h-[80px] md:h-[104px] bg-[#F2F2F2] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors z-20 shadow-md disabled:opacity-60"
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
            className="md:ml-[-10px]"
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
          className="absolute right-0 top-[228px] w-[40px] md:w-[52px] h-[80px] md:h-[104px] bg-[#F2F2F2] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors z-20 shadow-md disabled:opacity-60"
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
            className="md:mr-[-10px]"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}

const EveryDayImgBox = ({ src, alt, className, setRef }) => (
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

const CelebrationsEveryDaySection = () => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  const incomingLayerRef = useRef(null)

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

  const active = CATEGORY_DATA.find(c => c.name === activeName) ?? CATEGORY_DATA[0]
  const incoming = incomingName ? (CATEGORY_DATA.find(c => c.name === incomingName) ?? null) : null

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
        const outTop = [activeWrapsRef.current.topLeft, activeWrapsRef.current.topRight].filter(
          Boolean
        )
        const outBottom = [
          activeWrapsRef.current.bottomLeft,
          activeWrapsRef.current.bottomRight,
        ].filter(Boolean)

        const inTop = [incomingWrapsRef.current.topLeft, incomingWrapsRef.current.topRight].filter(
          Boolean
        )
        const inBottom = [
          incomingWrapsRef.current.bottomLeft,
          incomingWrapsRef.current.bottomRight,
        ].filter(Boolean)

        const outText = [headingRef.current, descRef.current].filter(Boolean)
        const inText = [incomingHeadingRef.current, incomingDescRef.current].filter(Boolean)

        if (incomingLayerRef.current) gsap.set(incomingLayerRef.current, { opacity: 0 })
        gsap.set(inTop, { y: 46, autoAlpha: 1, clipPath: 'inset(0% 0% 100% 0%)' })
        gsap.set(inBottom, { y: -46, autoAlpha: 1, clipPath: 'inset(0% 0% 100% 0%)' })
        gsap.set(inText, { yPercent: 100, autoAlpha: 1 })
        if (incomingLayerRef.current) gsap.set(incomingLayerRef.current, { opacity: 1 })

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            const nextActiveWraps = [
              activeWrapsRef.current.topLeft,
              activeWrapsRef.current.topRight,
              activeWrapsRef.current.bottomLeft,
              activeWrapsRef.current.bottomRight,
            ].filter(Boolean)
            const nextActiveText = [headingRef.current, descRef.current].filter(Boolean)

            // Reset base layer to a visible settled state before dropping incoming overlay.
            gsap.set(nextActiveWraps, { y: 0, autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)' })
            gsap.set(nextActiveText, { yPercent: 0, autoAlpha: 1 })
            if (incomingLayerRef.current) gsap.set(incomingLayerRef.current, { opacity: 0 })

            setActiveName(nextName)
            setIncomingName(null)
            setIsAnimating(false)
            incomingWrapsRef.current = {
              topLeft: null,
              topRight: null,
              bottomLeft: null,
              bottomRight: null,
            }
          },
        })

        tl.to(
          outTop,
          {
            y: -46,
            autoAlpha: 0,
            duration: 0.55,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0
        ).to(
          outTop,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: 0.55,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0
        )

        tl.to(
          outBottom,
          {
            y: 46,
            autoAlpha: 0,
            duration: 0.55,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0
        ).to(
          outBottom,
          {
            clipPath: 'inset(100% 0% 0% 0%)',
            duration: 0.55,
            stagger: 0.03,
            ease: 'power2.in',
          },
          0
        )

        tl.to(
          outText,
          {
            yPercent: 100,
            autoAlpha: 0,
            duration: 0.34,
            stagger: 0.04,
            ease: 'power2.in',
          },
          0.02
        )

        tl.to(inTop, {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.04,
          ease: 'power3.out',
        }).to(
          inTop,
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.8,
            stagger: 0.04,
            ease: 'power3.out',
          },
          '<'
        )

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
        ).to(
          inBottom,
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.8,
            stagger: 0.04,
            ease: 'power3.out',
          },
          '<'
        )

        tl.to(inText, {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power3.out',
        })
      })
    })
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F8F4ED] flex justify-center overflow-hidden font-sans pb-20"
    >
      <div className="relative w-[1440px] h-[1097px] shrink-0">
        <h2
          className="absolute left-1/2 -translate-x-1/2 top-[80px] w-[967px] text-[#2D2D2D] text-[61px] leading-[1] text-center font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Celebrations We Plan Every Day
        </h2>

        <p className="absolute left-1/2 -translate-x-1/2 top-[169px] w-[809px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5] text-center">
          From intimate birthdays to joyful wedding functions, our in-house planner helps bring
          thoughtful structure and creative detail to social celebrations that matter most.
        </p>

        <div className="absolute left-[0px] top-[297px] w-[1440px] h-[800px]">
          <div className="absolute left-[0px] top-[0px] w-[1440px] h-[800px] bg-[#EBEBEB] z-0" />
          <div className="absolute left-[0px] top-[400px] w-[640px] h-[200px] bg-[#CDB17E] z-10" />

          <div className="absolute left-[0px] top-[0px] w-[440px] h-[400px] bg-[#F8F4ED] z-20">
            <div className="absolute left-[100px] top-[0px] flex flex-col pt-12">
              {CATEGORY_DATA.map(cat => {
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
                      {cat.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <EveryDayImgBox
            key={`${active.name}-topLeft`}
            src={active.images.topLeft}
            alt={`${active.name} image`}
            className="absolute left-[440px] top-[0px] w-[500px] h-[400px] z-10"
            setRef={el => (activeWrapsRef.current.topLeft = el)}
          />
          <EveryDayImgBox
            key={`${active.name}-topRight`}
            src={active.images.topRight}
            alt={`${active.name} image`}
            className="absolute left-[940px] top-[0px] w-[500px] h-[400px] z-10"
            setRef={el => (activeWrapsRef.current.topRight = el)}
          />
          <EveryDayImgBox
            key={`${active.name}-bottomLeft`}
            src={active.images.bottomLeft}
            alt={`${active.name} image`}
            className="absolute left-[0px] top-[600px] w-[640px] h-[200px] z-10"
            setRef={el => (activeWrapsRef.current.bottomLeft = el)}
          />
          <EveryDayImgBox
            key={`${active.name}-bottomRight`}
            src={active.images.bottomRight}
            alt={`${active.name} image`}
            className="absolute left-[640px] top-[400px] w-[800px] h-[400px] z-10"
            setRef={el => (activeWrapsRef.current.bottomRight = el)}
          />

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

          {incoming && (
            <div
              ref={incomingLayerRef}
              className="absolute inset-0 pointer-events-none z-30"
              style={{ opacity: 0 }}
            >
              <EveryDayImgBox
                src={incoming.images.topLeft}
                alt={`${incoming.name} image`}
                className="absolute left-[440px] top-[0px] w-[500px] h-[400px]"
                setRef={el => (incomingWrapsRef.current.topLeft = el)}
              />
              <EveryDayImgBox
                src={incoming.images.topRight}
                alt={`${incoming.name} image`}
                className="absolute left-[940px] top-[0px] w-[500px] h-[400px]"
                setRef={el => (incomingWrapsRef.current.topRight = el)}
              />
              <EveryDayImgBox
                src={incoming.images.bottomLeft}
                alt={`${incoming.name} image`}
                className="absolute left-[0px] top-[600px] w-[640px] h-[200px]"
                setRef={el => (incomingWrapsRef.current.bottomLeft = el)}
              />
              <EveryDayImgBox
                src={incoming.images.bottomRight}
                alt={`${incoming.name} image`}
                className="absolute left-[640px] top-[400px] w-[800px] h-[400px]"
                setRef={el => (incomingWrapsRef.current.bottomRight = el)}
              />

              <h3
                className="absolute left-[787px] top-[362px] w-[441px] text-[#FFFFFF] text-[60px] leading-[1] text-center font-normal drop-shadow-md tracking-wider uppercase overflow-hidden"
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

              <p className="absolute left-[100px] top-[455px] w-[340px] text-[#FFFFFF] text-[12px] font-medium leading-[1.5] overflow-hidden">
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
      <div className="text-center mb-16 px-4">
        <h2
          className="text-[#2D2D2D] text-[40px] md:text-[61px] leading-[1] font-serif mb-6"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Tell Us About Your Celebration
        </h2>
        <p className="text-[#2D2D2D] opacity-50 text-[14px] md:text-[16px] leading-[1.5] max-w-[727px] mx-auto">
          If you’d like me to plan your event end to end, leave your details and we’ll take it from
          there.
        </p>
      </div>

      {/* --- Form Container --- */}
      <div className="relative w-full max-w-[720px] h-[701px] bg-[#F8F4ED] rounded-[20px] shadow-sm mx-4">
        {/* --- ZONE 1: STEPPER (Top 60px) --- */}
        {currentStep < 4 && (
          <div className="absolute top-[60px] left-[20px] right-[20px] md:left-[120px] md:right-[120px] flex justify-between items-start z-10">
            {/* Connecting Lines */}
            <div className="absolute top-[30px] left-[30px] right-[30px] md:left-[90px] md:right-[90px] flex justify-between z-0">
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
                className={`mt-4 text-[12px] whitespace-nowrap transition-opacity duration-300 ${currentStep >= 1 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
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
                className={`mt-4 text-[12px] whitespace-nowrap transition-opacity duration-300 ${currentStep >= 2 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
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
                className={`mt-4 text-[12px] whitespace-nowrap transition-opacity duration-300 ${currentStep >= 3 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
              >
                Planning Preferences
              </span>
            </div>
          </div>
        )}

        {/* --- ZONE 2: FORM CONTENT (Top 230px) --- */}
        <div className="absolute top-[230px] left-[30px] right-[30px] md:left-[60px] md:right-[60px]">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn">
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
          <div className="absolute bottom-[60px] left-[30px] right-[30px] md:left-[60px] md:right-[60px] flex justify-between items-center">
            {/* Previous Button */}
            <div className="flex-1">
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-4 bg-[#D9D9D9] rounded-[56px] pl-1 pr-6 py-1 hover:bg-[#c9c9c9] transition-colors group"
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
              )}
            </div>

            {/* Next / Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={currentStep === 3 && isPending}
                className={`flex items-center gap-4 bg-[#CDB17E] rounded-[56px] pl-6 pr-1 py-1 hover:bg-[#bfa06b] transition-colors group ${currentStep === 3 && isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="text-[#FAFAFA] text-[16px] font-medium leading-[1.5]">
                  {currentStep === 3 && isPending
                    ? 'Submitting...'
                    : currentStep === 3
                      ? 'Submit'
                      : 'Next'}
                </span>
                <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#CDB17E] transition-transform group-hover:scale-105">
                  <svg
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
              Hi, I&apos;m Moksha.
            </h3>

            <div className="w-full flex flex-col gap-[20px]">
              <p className="w-full text-[#FFFFFF] opacity-80 text-[16px] leading-[1.5] font-normal">
                Co-founder at Elewen and a professional event planner with 6+ years of industry
                experience. Trained in International Events in the UK, I bring structure,
                creativity, and calm to every celebration.
              </p>

              <p className="w-full text-[#FFFFFF] opacity-80 text-[16px] leading-[1.5] font-normal">
                Some events call for personal attention and thoughtful detailing. They need
                intention, detail, and a planner who truly cares, that&apos;s exactly why the
                In-House Planner was created.
              </p>
            </div>
          </div>
        </div>
      </section>

      <GrandCelebrationsSection />

      <CelebrationsEveryDaySection />

      <CelebrationFormSection />
    </>
  )
}

export default InHousePlannerSection
