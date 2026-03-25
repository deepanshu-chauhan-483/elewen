import { useRef, useState, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import celebrationImg1 from '../../assets/images/citroen.png'
import celebrationImg2 from '../../assets/images/danube.jpg'
import celebrationImg3 from '../../assets/images/guns.jpg'
import celebrationImg4 from '../../assets/images/usha.jpg'

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

  useLayoutEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return
    if (perPage === 1) return

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
                Experience Across Grand <br /> Celebrations
              </span>
            </h3>
            <p className="mt-6 text-[#2D2D2D] opacity-50 text-[14px] leading-[1.5] max-w-[320px]">
              <span ref={noteRef}>
                Executed during my tenure at Wizcraft and/ or as a freelance project manager.
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
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
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
                Executed during my tenure at Wizcraft and/ or as a freelance project manager.
              </span>
            </p>

            <h3
              className="text-[#2D2D2D] text-[32px] min-[540px]:text-[47px] leading-[1] text-left min-[540px]:text-right font-serif shrink-0"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              <span className="reveal-wrapper">
                <span ref={titleRef} className="reveal-text gc-reveal-text">
                  Experience Across <br className="hidden min-[540px]:block" /> Grand Celebrations
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

export default GrandCelebrationsSection
