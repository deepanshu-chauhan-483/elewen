import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import imgScrolling from './images/scrolling.png'
import imgCalls from './images/calls.png'
import imgVendors from './images/vendors.png'
import imgDecisions from './images/decisions.png'
import bulb1 from './lightbulb_images/bulb1.png'
import bulb2 from './lightbulb_images/bulb2.png'
import CelebrationDoor from './CelebrationDoor'
import HowItWorksSection from './HowItWorksSection'
import CTASection from './CTASection'
import BetterWaySection from './BetterWaySection'

gsap.registerPlugin(ScrollTrigger)

const LAYOUT_W = 1034
const LAYOUT_H = 684

const ChecklistSection = () => {
  const scallopCount = [...Array(15)]
  const sectionRef = useRef(null)
  const [howItWorksVisible, setHowItWorksVisible] = useState(false)
  const gateAreaRef = useRef(null)
  const gateRef = useRef(null)
  const howItWorksRef = useRef(null)
  const layoutWrapRef = useRef(null)
  const layoutInnerRef = useRef(null)

  useEffect(() => {
    const wrap = layoutWrapRef.current
    const inner = layoutInnerRef.current
    if (!wrap || !inner) return

    const resize = () => {
      const available = wrap.clientWidth
      const scale = Math.min(available / LAYOUT_W, 1)
      inner.style.transform = `scale(${scale})`
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const gateArea = gateAreaRef.current
    const gate = gateRef.current
    const howItWorks = howItWorksRef.current
    if (!gateArea || !gate || !howItWorks) return

    const doorFill = gate.querySelector('#door-fill')
    const doorTable = gate.querySelector('#door-table')
    const doorLights = gate.querySelector('#door-lights')

    const isMobile = window.innerWidth < 768
    const scaleEnd = isMobile ? 3 : 4
    const scrollEnd = isMobile ? 800 : 1500
    const scrubVal = isMobile ? 1.5 : 1
    const startTrigger = isMobile ? 'top center' : 'center center'

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: gateArea,
        start: startTrigger,
        end: `+=${scrollEnd}`,
        scrub: scrubVal,
        pin: true,
        pinSpacing: true,
      },
    })

    // Full zoom into door (no fade) - like going inside
    tl.to(gate, { scale: scaleEnd, ease: 'power2.in', duration: 1 }, 0)
    if (doorTable) tl.to(doorTable, { x: 120, ease: 'power2.in', duration: 1 }, 0)
    if (doorLights) tl.to(doorLights, { y: -60, ease: 'power2.in', duration: 1 }, 0)
    if (doorFill) tl.to(doorFill, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.4)
    tl.to(howItWorks, { opacity: 1, duration: 0.5, ease: 'power2.in', onComplete: () => { setHowItWorksVisible(true); setTimeout(() => ScrollTrigger.refresh(), 100) } }, 0.4)
      // Door frame fades out at end for clean transition
      .to(gate, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0.85)

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative w-full min-h-screen bg-white overflow-x-clip flex flex-col items-center pb-0">

      {/* --- Background Faint Diagonal Rectangles (hidden on mobile) --- */}
      <div
        className="absolute hidden md:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
        style={{ left: '-10%', top: '5%', transform: 'rotate(-37.82deg)' }}
      />
      <div
        className="absolute hidden md:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
        style={{ right: '5%', top: '30%', transform: 'rotate(-37.82deg)' }}
      />

      {/* --- 1. Top Scalloped Edge & Lights --- smaller on mobile like PlanEventSection */}
      <div className="absolute top-0 left-0 w-full flex pointer-events-none z-10">
        {scallopCount.map((_, i) => (
          <div key={i} className="relative shrink-0 w-[72px] md:w-[144px] h-[45px] md:h-[90px]">
            <div
              className="absolute top-0 left-0 w-full h-[36px] md:h-[72px] bg-[#CDB17E]"
              style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
            ></div>
            <div
              className="absolute top-0 left-0 w-full h-[30px] md:h-[60px] bg-[#F2F2F2]"
              style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
            ></div>

            {i !== scallopCount.length - 1 && (
              <div className="absolute top-0 right-0 translate-x-1/2 flex flex-col items-center z-20">
                <div className={`w-[1px] ${i % 2 === 0 ? 'h-[-10px] md:h-[-14px]' : 'h-[-4px] md:h-[-5px]'} bg-[#591902]/40`}></div>
                <div className="relative flex flex-col items-center">
                  <img src={i % 2 === 0 ? bulb1 : bulb2} alt="Light" className="w-[20px] md:w-[32px] h-auto relative z-10" />
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] md:w-[76px] md:h-[78px] opacity-40 blur-[6px] md:blur-[8px] pointer-events-none"
                    style={{ 
                      background: 'linear-gradient(180deg, #FCD768 0%, #F2F2F2 100%)', 
                      clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- 2. Main Title --- */}
      <h2
        className="text-[40px] md:text-[61px] leading-[1.1] md:leading-[1] text-center text-[#591902] font-normal tracking-normal mt-[110px] md:mt-[260px] px-4 relative z-10"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        Somewhere along the way, <br />
        Hosting turned into checklists.
      </h2>

      {/* --- 3. Figma Layout — scales down dynamically on smaller screens --- */}
      <div ref={layoutWrapRef} className="w-full max-w-[1034px] mx-auto mt-6 md:mt-24 mb-8 md:mb-32 z-10 font-sans">
        <div
          className="w-full overflow-hidden mx-auto"
          style={{ maxWidth: `${LAYOUT_W}px`, aspectRatio: `${LAYOUT_W}/${LAYOUT_H}` }}
        >
          <div
            ref={layoutInnerRef}
            className="relative"
            style={{ width: `${LAYOUT_W}px`, height: `${LAYOUT_H}px`, transformOrigin: 'top left' }}
          >

          {/* ---- ITEM 1: Too much scrolling ---- */}
          <div className="absolute left-[283px] top-[19px] w-[211px] h-[211px]">
            <div className="absolute inset-0 bg-[#BFAC9B] rounded-tl-full z-0 shadow-sm"></div>
            <img src={imgScrolling} className="absolute bottom-0 right-[-40px] h-[250px] w-auto max-w-none object-contain object-bottom z-10 pointer-events-none" alt="Scrolling" />
          </div>
          <div className="absolute left-[196px] top-[170px] w-[113px] text-right z-20">
            <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">Too much scrolling.</h3>
          </div>
          <div className="absolute left-[0px] top-[232px] w-[273px] text-right z-20">
            <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">What was once simple now means endless scrolling — and still no confidence.</p>
          </div>

          {/* ---- ITEM 2: Too many calls ---- */}
          <div className="absolute left-[510px] top-[1px] w-[524px] h-[229px] z-10">
            <div
              className="absolute left-[0px] top-[18px] w-[211px] h-[211px] bg-[#BFAC9B] rounded-tr-full z-0"
            ></div>
            <img
              src={imgCalls}
              alt="Calls"
              className="absolute left-[13px] top-[0px] w-[231px] h-[229px] object-cover object-top z-10 pointer-events-none"
              style={{
                filter: 'drop-shadow(33px 41px 32px rgba(109, 57, 8, 0.16)) drop-shadow(15px 18px 24px rgba(109, 57, 8, 0.28)) drop-shadow(4px 5px 13px rgba(109, 57, 8, 0.32))'
              }}
            />
            <div className="absolute left-[157px] top-[83px] w-[113px] text-left z-20">
              <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2] font-sans">
                Too many calls.
              </h3>
            </div>
            <div className="absolute left-[251px] top-[145px] w-[273px] text-left z-20">
              <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5] font-sans">
                Follow-ups, confirmations, negotiations, and last-minute checks — your phone turns into a coordination hub, and excitement becomes stress.
              </p>
            </div>
          </div>

          {/* ---- ITEM 3: Too many vendors ---- */}
          <div className="absolute left-[510px] top-[246px] w-[211px] h-[211px]">
            <div className="absolute inset-0 bg-[#BFAC9B] z-0 shadow-sm"></div>
            <img src={imgVendors} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[280px] w-auto max-w-[400px] object-contain object-bottom z-10 pointer-events-none" alt="Vendors" />
          </div>
          <div className="absolute left-[400px] top-[337px] w-[113px] text-right z-20">
            <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">Too many vendors.</h3>
          </div>
          <div className="absolute left-[225px] top-[399px] w-[273px] text-right z-20">
            <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">One decorator, one caterer, one supplier, different prices, different chaos. You're not planning a celebration; you're managing a team.</p>
          </div>

          {/* ---- ITEM 4: Too many decisions ---- */}
          <div className="absolute left-[461px] top-[466px] w-[260px] h-[211px] overflow-hidden rounded-br-full">
            <div className="absolute right-0 top-0 w-[211px] h-full bg-[#BFAC9B] z-0 shadow-sm"></div>
            <img
              src={imgDecisions}
              alt="Decisions"
              className="absolute bottom-[-50px] left-[-50px] h-[300px] w-auto max-w-none object-cover object-bottom z-10 pointer-events-none"
            />
          </div>
          <div className="absolute left-[662px] top-[551px] w-[122px] text-left z-20">
            <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">Too many decisions.</h3>
          </div>
          <div className="absolute left-[721px] top-[613px] w-[273px] text-left z-20">
            <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">Color themes, backdrops, menus, endless add-ons — more options don't mean more freedom, just more pressure.</p>
          </div>

          </div>
        </div>
      </div>

      {/* --- 4. Deep Breath & Summary Text --- */}
      <div className="flex flex-col items-center gap-6 md:gap-8 mb-8 md:mb-32 z-10 text-center mt-8 md:mt-[40px] px-6">
        <h3 className="text-[28px] md:text-[36px] text-[#591902] leading-[1] font-serif" style={{ fontFamily: "'Malgin', serif" }}>
          Stop take a deep breath
        </h3>

        <div className="flex flex-col items-center gap-2">
          <p className="text-[17px] md:text-[21px] text-[#591902] opacity-50 font-sans">You don&apos;t have to manage people.</p>
          <p className="text-[17px] md:text-[21px] text-[#591902] opacity-50 font-sans">You don&apos;t have to manage logistics</p>
          <p className="text-[17px] md:text-[21px] text-[#591902] opacity-50 font-sans">No chasing vendors.</p>
          <p className="text-[17px] md:text-[21px] text-[#591902] opacity-50 font-sans">No waiting anxiously.</p>
        </div>

        <h4 className="text-[20px] md:text-[27px] text-[#591902] leading-[1.2] font-serif mt-8 md:mt-12 px-2" style={{ fontFamily: "'Malgin', serif" }}>
          11 takes the chaos out so you can stay in the moment
        </h4>
      </div>

      {/* --- 5. Celebration Door: full zoom into door, table right + lights up, HowItWorksSection revealed through arch --- */}
      <div className="relative w-full z-10 mt-0 md:mt-10 overflow-visible md:overflow-hidden min-h-[50vh] md:min-h-[100vh]">
        <div ref={gateAreaRef} className="relative w-full h-[50vh] md:h-[100vh] z-20">
          <div className="absolute inset-0 flex justify-center items-start md:items-center pt-20 md:pt-0">
            <div
              ref={gateRef}
              className="w-full max-w-[1200px] px-2 md:px-4"
              style={{ transformOrigin: 'center center', willChange: 'transform' }}
            >
              <div className="scale-165 md:scale-100 origin-center w-full">
                <CelebrationDoor className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* HowItWorksSection behind door (z-10) - revealed when door fill fades, overlaps via negative margin */}
        <div
          ref={howItWorksRef}
          className="relative z-10 -mt-[50vh] md:-mt-[100vh]"
          style={{ opacity: 0 }}
        >
          <HowItWorksSection isVisible={howItWorksVisible} />
        </div>
      </div>

      {/* CTA Section - below the timeline (HowItWorksSection) */}
      <CTASection />

      {/* Better Way Section - below CTA */}
      <BetterWaySection />

    </section>
  );
};

export default ChecklistSection;
