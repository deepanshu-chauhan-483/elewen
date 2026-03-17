import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const ThoughtBubbleIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M52 26C52 26 53 20 44 20C38 20 36 24 36 24C36 24 30 22 26 28C22 34 26 40 26 40C26 40 22 46 30 50C36 54 42 50 42 50C42 50 50 54 56 46C60 38 52 34 52 34C52 34 58 30 52 26Z" />
    <circle cx="28" cy="58" r="3" />
    <circle cx="22" cy="66" r="2" />
  </svg>
)

const ChecklistIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="36" y="24" width="24" height="8" rx="2" />
    <circle cx="26" cy="28" r="4" />
    <circle cx="26" cy="42" r="4" />
    <circle cx="26" cy="56" r="4" />
    <path d="M40 38H60M40 52H50" />
    <path d="M44 64V54C44 51.7909 45.7909 50 48 50C50.2091 50 52 51.7909 52 54V56C52 56 56 50 60 54C64 58 56 68 50 72H44V64Z" />
  </svg>
)

const GridIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="22" y="22" width="14" height="14" rx="2" />
    <rect x="44" y="22" width="14" height="14" rx="2" />
    <rect x="22" y="44" width="14" height="14" rx="2" />
    <rect x="44" y="44" width="14" height="14" rx="2" />
  </svg>
)

const PlusIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="40" cy="40" r="24" />
    <path d="M40 28V52M28 40H52" />
  </svg>
)

const LightbulbIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 54H48M34 60H46M38 66H42" />
    <path d="M26 36C26 28.268 32.268 22 40 22C47.732 22 54 28.268 54 36C54 41.5283 50.8037 46.2863 46 48.2435V54H34V48.2435C29.1963 46.2863 26 41.5283 26 36Z" />
    <path d="M40 12V16M16 40H20M60 40H64M24 24L28 28M56 24L52 28" />
  </svg>
)

const CoinIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="40" cy="40" r="24" />
    <circle cx="40" cy="40" r="18" />
    <path d="M40 30V50M36 34H42C44.2091 34 46 35.7909 46 38C46 40.2091 44.2091 42 42 42H38C35.7909 42 34 43.7909 34 46C34 48.2091 35.7909 50 38 50H44" />
  </svg>
)

const steps = [
  { id: 1, title: 'You Dream It. We Handle The Rest', desc: 'All you need is a reason to celebrate and a few basic details.', side: 'right', icon: ThoughtBubbleIcon },
  { id: 2, title: 'Choose What You Need', desc: 'Browse through decor, furniture, catering, bartenders, and more.', side: 'left', icon: ChecklistIcon },
  { id: 3, title: 'Explore Our Themes And Packages', desc: 'From small, budget setups to full themed transformations.', side: 'right', icon: GridIcon },
  { id: 4, title: 'Add What You Love', desc: "Build your party, piece by piece. Save, mix, match, and create a setup that feels like you.", side: 'left', icon: PlusIcon },
  { id: 5, title: "Have An Idea That's A Little Different?", desc: "Leave us a note, ask a question, or pitch your wild idea — we'll align, curate, and make your party effortless.", side: 'right', icon: LightbulbIcon },
  { id: 6, title: 'Confirm With A Small Advance', desc: 'Pay a percentage to lock your booking and reserve your date', side: 'left', icon: CoinIcon },
]

const HowItWorksSection = ({ disableScrollAnimations, isVisible = true }) => {
  const containerRef = useRef(null)
  const stepsWrapRef = useRef(null)

  useEffect(() => {
    if (disableScrollAnimations || !isVisible) return
    const container = containerRef.current
    const stepsWrap = stepsWrapRef.current
    if (!container || !stepsWrap) return

    const progressLine = container.querySelector('.progress-line')
    const stepElements = gsap.utils.toArray('.step-item', stepsWrap)

    const updateStepHighlights = () => {
      const stepItems = container.querySelectorAll('.step-item')
      const vh = window.innerHeight
      const center = vh * 0.5

      if (progressLine && stepItems.length > 0) {
        const firstStep = stepItems[0]
        const lastStep = stepItems[stepItems.length - 1]
        const firstRect = firstStep.getBoundingClientRect()
        const lastRect = lastStep.getBoundingClientRect()
        const firstCenter = firstRect.top + firstRect.height / 2
        const lastCenter = lastRect.top + lastRect.height / 2
        const range = lastCenter - firstCenter
        const progress = range > 0 ? Math.max(0, Math.min(1, (center - firstCenter) / range)) : 1
        progressLine.style.transform = `translateX(-50%) scaleY(${progress})`
        progressLine.style.transformOrigin = 'top center'
      }
    }

    let rafId = null
    const onScroll = () => {
      if (rafId != null) return
      rafId = requestAnimationFrame(() => {
        updateStepHighlights()
        rafId = null
      })
    }

    let highlightTrigger = null

    const ctx = gsap.context(() => {
      highlightTrigger = ScrollTrigger.create({
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: updateStepHighlights,
      })

      // Set all steps hidden initially
      stepElements.forEach((step) => {
        const leftContent = step.querySelector('.left-content')
        const rightContent = step.querySelector('.right-content')
        if (leftContent) gsap.set(leftContent, { x: -50, opacity: 0 })
        if (rightContent) gsap.set(rightContent, { x: 50, opacity: 0 })
      })

      // Single timeline: steps reveal one by one as you scroll through the section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stepsWrap,
          start: 'top 98%',
          end: 'bottom 5%',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })

      // Steps 4, 5, 6 start earlier so they don't feel delayed - compressed timing for later steps
      const getStartPos = (i) => {
        if (i < 3) return i * 0.15
        return 0.4 + (i - 3) * 0.12
      }
      const duration = 0.18
      stepElements.forEach((step, i) => {
        const leftContent = step.querySelector('.left-content')
        const rightContent = step.querySelector('.right-content')
        if (!leftContent || !rightContent) return

        const startPos = getStartPos(i)
        tl.to(
          [leftContent, rightContent],
          { x: 0, opacity: 1, duration, ease: 'power2.out', overwrite: 'auto', force3D: true },
          startPos
        )
      })

    }, container)

    updateStepHighlights()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    ScrollTrigger.addEventListener('refresh', updateStepHighlights)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ScrollTrigger.refresh()
            requestAnimationFrame(updateStepHighlights)
          }
        })
      },
      { threshold: 0, rootMargin: '100px' }
    )
    observer.observe(container)

    const t1 = setTimeout(() => {
      ScrollTrigger.refresh()
      updateStepHighlights()
    }, 600)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ScrollTrigger.removeEventListener('refresh', updateStepHighlights)
      if (rafId != null) cancelAnimationFrame(rafId)
      highlightTrigger?.kill()
      ctx.revert()
      observer.disconnect()
      clearTimeout(t1)
    }
  }, [disableScrollAnimations, isVisible])

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#591902] py-40 overflow-hidden font-sans text-white"
    >
      <h2 className="text-[61px] text-center mb-32 tracking-wide font-serif font-display">
        HOW 11 WORKS
      </h2>

      <div ref={stepsWrapRef} className="relative w-full max-w-[1000px] mx-auto flex flex-col items-center">
        {/* Background track */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white opacity-20 -translate-x-1/2" />
        
        {/* Progress line */}
        <div
          className="progress-line absolute top-0 bottom-0 left-1/2 w-[2px] bg-white -translate-x-1/2 z-30"
          style={{
            transformOrigin: 'top center',
            boxShadow: '0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(205,177,126,0.5)',
          }}
        />

        {steps.map((step) => {
          const IconComponent = step.icon
          return (
            <div
              key={step.id}
              className="step-item relative w-full flex items-start justify-between mb-[140px] last:mb-0"
              // REMOVED `style={{ opacity: 0.25 }}` here so GSAP can take over smoothly
            >
              {step.side === 'right' ? (
                <>
                  <div className="left-content w-1/2 pr-20 flex justify-end items-start mt-8" style={!disableScrollAnimations && !isVisible ? { opacity: 0 } : undefined}>
                    <IconComponent />
                  </div>
                  <div className="right-content w-1/2 pl-20 flex flex-col items-start text-left relative z-20" style={!disableScrollAnimations && !isVisible ? { opacity: 0 } : undefined}>
                    <div
                      className="w-[60px] h-[60px] bg-[#CDB17E] rounded-full flex items-center justify-center text-[22px] font-serif mb-6"
                      style={{
                        boxShadow:
                          '-25px 18px 12px rgba(0,0,0,0.03), -14px 10px 10px rgba(0,0,0,0.1), -6px 4px 8px rgba(0,0,0,0.16), -2px 1px 4px rgba(0,0,0,0.19)',
                      }}
                    >
                      {step.id}
                    </div>
                    <h3 className="text-[27px] font-serif font-display mb-3 leading-[1.1] opacity-100">
                      {step.title}
                    </h3>
                    <p className="text-[16px] leading-[1.5] max-w-[342px] font-light opacity-100">
                      {step.desc}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="left-content w-1/2 pr-20 flex flex-col items-end text-right relative z-20" style={!disableScrollAnimations && !isVisible ? { opacity: 0 } : undefined}>
                    <div
                      className="w-[60px] h-[60px] bg-[#CDB17E] rounded-full flex items-center justify-center text-[22px] font-serif mb-6"
                      style={{
                        boxShadow:
                          '-25px 18px 12px rgba(0,0,0,0.03), -14px 10px 10px rgba(0,0,0,0.1), -6px 4px 8px rgba(0,0,0,0.16), -2px 1px 4px rgba(0,0,0,0.19)',
                      }}
                    >
                      {step.id}
                    </div>
                    <h3 className="text-[27px] font-serif font-display mb-3 leading-[1.1] opacity-100">
                      {step.title}
                    </h3>
                    <p className="text-[16px] leading-[1.5] max-w-[342px] font-light opacity-100">
                      {step.desc}
                    </p>
                  </div>
                  <div className="right-content w-1/2 pl-20 flex justify-start items-start mt-8" style={!disableScrollAnimations && !isVisible ? { opacity: 0 } : undefined}>
                    <IconComponent />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default HowItWorksSection
