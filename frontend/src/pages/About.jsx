import { useRef, useEffect, useState, Children } from 'react'
import { useAboutPage } from '../hooks/useCmsPages'
import tangledIllustration from '../assets/images/tangled-lights.png'
import objectImg from '../assets/Object.png'
import bulb1 from '../assets/lightbulb_images/bulb1.png'
import bulb2 from '../assets/lightbulb_images/bulb2.png'

// Resolve image assets from `src/assets/images/*` at build time.
// If an image file isn't present yet, we won't render its <img>, so nothing shows broken.
const aboutImageModules = import.meta.glob('../assets/images/*', {
  eager: true,
  import: 'default',
})

const aboutAssetSrc = fileName => aboutImageModules[`../assets/images/${fileName}`]

const STRAPI_BASE = import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'

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

const getSectionImage = (section, index, fallback = '') =>
  getMediaUrl(section?._sectionImages?.[index]) || fallback

const Img = ({ src, alt = '', className = '', style, ...rest }) => (
  <img
    src={src}
    alt={alt}
    className={className}
    style={style}
    {...rest}
    onError={e => {
      // If the image isn't available yet, hide it so the page doesn't look broken.
      e.currentTarget.style.display = 'none'
    }}
  />
)

function MobileStorySlide({ heading, body, imageSrc, imageAlt, revealDelay = '0.1s' }) {
  return (
    <div className="flex w-full shrink-0 basis-full justify-center px-2">
      <div className="flex w-full max-w-[420px] flex-col gap-4 text-center">
        <div className="flex flex-col">
          <h2
            className="text-white text-[30px] leading-[1.05] font-serif min-h-[100px] flex items-start justify-center"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            <span className="reveal-wrapper block w-full">
              <span className="reveal-text">{heading}</span>
            </span>
          </h2>
          <p className="mt-2 min-h-[82px] text-white text-[14px] leading-[1.45] opacity-90 line-clamp-4">
            <span className="reveal-wrapper block">
              <span className="reveal-text" style={{ '--delay': revealDelay }}>
                {body}
              </span>
            </span>
          </p>
        </div>
        {imageSrc ? (
          <Img
            src={imageSrc}
            alt={imageAlt}
            className="w-full aspect-[4/3] object-cover rounded-[20px]"
          />
        ) : (
          <div className="w-full aspect-[4/3] rounded-[20px] bg-white/10" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

const MOBILE_STORY_SWIPE_THRESHOLD = 48

function MobileStoryCarousel({ activeIndex, onActiveIndexChange, children }) {
  const carouselRef = useRef(null)
  const touchRef = useRef({ startX: 0, startY: 0, lock: null })
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const slideCount = Children.count(children)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return

    const onTouchStart = e => {
      const touch = e.touches[0]
      touchRef.current = { startX: touch.clientX, startY: touch.clientY, lock: null }
      setIsDragging(false)
      setDragOffset(0)
    }

    const onTouchMove = e => {
      const touch = e.touches[0]
      const dx = touch.clientX - touchRef.current.startX
      const dy = touch.clientY - touchRef.current.startY

      if (touchRef.current.lock === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        touchRef.current.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (touchRef.current.lock === 'y') return
        setIsDragging(true)
      }

      if (touchRef.current.lock !== 'x') return

      let offset = dx
      if (activeIndex === 0 && offset > 0) offset *= 0.35
      if (activeIndex === slideCount - 1 && offset < 0) offset *= 0.35
      setDragOffset(offset)
      e.preventDefault()
    }

    const onTouchEnd = e => {
      if (touchRef.current.lock === 'x') {
        const dx = e.changedTouches[0].clientX - touchRef.current.startX
        if (dx < -MOBILE_STORY_SWIPE_THRESHOLD && activeIndex < slideCount - 1) {
          onActiveIndexChange(activeIndex + 1)
        } else if (dx > MOBILE_STORY_SWIPE_THRESHOLD && activeIndex > 0) {
          onActiveIndexChange(activeIndex - 1)
        }
      }

      touchRef.current.lock = null
      setIsDragging(false)
      setDragOffset(0)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [activeIndex, onActiveIndexChange, slideCount])

  return (
    <div ref={carouselRef} className="w-full overflow-hidden touch-pan-y">
      <div
        className="flex w-full"
        style={{
          transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 300ms ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// SVG layout constants â must match the inline SVG's style values below
const SVG_TOP = 430
const SECTION_HEIGHT = 4628
const OBJ_SIZE = 55

const About = () => {
  const { data: cms = {} } = useAboutPage()
  const so = cms.story_opening ?? {}
  const cm = cms.celebrations_matter ?? {}
  const sq = cms.simple_question ?? {}
  const tg = cms.thoughtful_gatherings ?? {}
  const founders = cms.founders ?? {}
  const wc = cms.why_choose ?? {}
  const vq = cms.vendor_quality ?? {}
  const vc = cms.vendor_cta ?? {}

  const tangledIllustrationFallback = aboutAssetSrc('tangled-lights.png') || tangledIllustration
  const story1Fallback = aboutAssetSrc('story-1.png')
  const story2Fallback = aboutAssetSrc('story-2.png')
  const mokshaFallback = aboutAssetSrc('moksha_portrait.jpg')
  const gauriFallback = aboutAssetSrc('gauri.jpg')
  const featureIconFallbacks = ['e47.png', 'e49.png', 'e48.png', 'e50.png'].map(aboutAssetSrc)
  const vendorIconFallbacks = ['quality-icon.png', 'everyone-icon.png', 'tiers-icon.png'].map(
    aboutAssetSrc
  )
  const iconSrc = aboutAssetSrc('image.png')
  const heroIllustrationSrc = getSectionImage(so, 0, tangledIllustrationFallback)
  const story1Src = getSectionImage(sq, 0, story1Fallback)
  const story2Src = getSectionImage(tg, 0, story2Fallback)
  const mokshaSrc = getSectionImage(founders, 0, mokshaFallback)
  const gauriSrc = getSectionImage(founders, 1, gauriFallback)
  const featureIconSrcs = featureIconFallbacks.map((fallback, index) =>
    getSectionImage(wc, index, fallback)
  )
  const vendorIconSrcs = vendorIconFallbacks.map((fallback, index) =>
    getSectionImage(vq, index, fallback)
  )
  const desktopScallopCount = [...Array(10)]
  const mobileScallopCount = desktopScallopCount.slice(0, 6)
  const visibleScallops =
    typeof window !== 'undefined' && window.innerWidth < 661
      ? mobileScallopCount
      : desktopScallopCount

  const pageRef = useRef(null)
  const sectionRef = useRef(null)
  const subTask2Ref = useRef(null)
  const subTask6Ref = useRef(null)
  const svgRef = useRef(null)
  const pathRef = useRef(null)
  const animRef = useRef(null)
  const [objStyle, setObjStyle] = useState({ display: 'none' })
  const [mobileStorySlide, setMobileStorySlide] = useState(0)

  // Trigger reveal animations on scroll
  useEffect(() => {
    const page = pageRef.current
    if (!page) return
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const el = entry.target
          if (el.classList.contains('reveal-wrapper')) {
            // reveal-text is visually outside overflow:hidden so observe the wrapper instead
            el.querySelectorAll('.reveal-text').forEach(t => t.classList.add('is-visible'))
          } else {
            el.classList.add('is-visible')
          }
          observer.unobserve(el)
        })
      },
      { threshold: 0.05 }
    )
    page
      .querySelectorAll('.reveal-wrapper, .anim-element, .card-reveal')
      .forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const isDesktop = () => window.innerWidth >= 661

    const onScroll = () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      animRef.current = requestAnimationFrame(() => {
        if (!isDesktop()) {
          setObjStyle({ display: 'none' })
          return
        }

        const svgEl = svgRef.current
        const path = pathRef.current
        const startEl = subTask2Ref.current
        const endEl = subTask6Ref.current
        if (!svgEl || !path || !startEl || !endEl) return

        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const vh = window.innerHeight
        const totalLength = path.getTotalLength()

        // Use the section's real rendered height (not a fixed reference value) so
        // progress tracking stays accurate across screen sizes/aspect ratios.
        const sectionHeight = section.offsetHeight || SECTION_HEIGHT

        // Map section scroll through viewport to 0â1 progress
        const progress = Math.max(0, Math.min(1, -rect.top / (sectionHeight - vh)))

        const dist = progress * totalLength
        const pt = path.getPointAtLength(dist)
        const svgRect = svgEl.getBoundingClientRect()
        const scaleX = svgRect.width / 1331
        const scaleY = svgRect.height / 3986
        const viewX = svgRect.left + pt.x * scaleX
        const viewY = svgRect.top + pt.y * scaleY
        // Scale the traced object with the SVG's rendered size so it shrinks/grows
        // in proportion to the path on every screen size instead of staying fixed.
        const objSize = OBJ_SIZE * ((scaleX + scaleY) / 2)

        const inView = rect.top < vh && rect.top + sectionHeight > 0
        setObjStyle({
          display: inView ? 'block' : 'none',
          position: 'fixed',
          left: `${viewX}px`,
          top: `${viewY}px`,
          transform: `translate(-50%, -50%)`,
          width: `${objSize}px`,
          height: `${objSize}px`,
          pointerEvents: 'none',
          zIndex: 9999,
        })
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <>
      <section
        ref={pageRef}
        className="w-full bg-[#F8F4ED] flex flex-col items-center font-sans overflow-x-hidden"
      >
        <div
          data-nav-surface="transparent"
          className="relative w-full shrink-0 h-[810px] min-[375px]:h-[850px] min-[540px]:h-[1000px]"
        >
          {/* --- 1. THE BROWN BACKGROUND WITH THE CURVE --- */}
          <div className="absolute left-0 top-0 w-full h-[710px] min-[375px]:h-[745px] min-[540px]:h-[880px] bg-[#591902] overflow-hidden rounded-b-[500px] min-[540px]:rounded-b-[1000px]">
            {/* --- MAIN TEXT CONTENT (FLUID GRID) --- */}
            <div className="relative z-30 max-w-[1440px] mx-auto px-5 min-[375px]:px-6 min-[540px]:px-8 min-[661px]:px-10 lg:px-20 xl:px-[100px] pt-18 min-[375px]:pt-20 min-[540px]:pt-[110px] min-[661px]:pt-[120px] lg:pt-[223px]">
              <div className="grid grid-cols-1 min-[540px]:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)] min-[661px]:grid-cols-12 items-start gap-y-5 min-[540px]:gap-y-0 min-[540px]:gap-x-6 min-[661px]:gap-x-10 lg:gap-x-[72px]">
                {/* Left Heading */}
                <h2 className="min-[661px]:col-span-7 w-full max-w-[564px] min-[540px]:max-w-[390px] min-[661px]:max-w-[564px] text-[#FFFFFF] text-[22px] min-[375px]:text-[24px] min-[540px]:text-[42px] min-[661px]:text-[50px] lg:text-[61px] leading-[1.08] min-[540px]:leading-[1.08] min-[661px]:leading-[1.13] lg:leading-[1.15] font-serif m-0">
                  <span className="reveal-wrapper block">
                    <span className="reveal-text" style={{ animationDelay: '0s' }}>
                      {so.heading_1 ?? 'When we saw Excitement'}
                    </span>
                  </span>
                  <span className="reveal-wrapper block">
                    <span className="reveal-text" style={{ animationDelay: '0.08s' }}>
                      {so.heading_2 ?? 'Turning Into Overthinking'}
                    </span>
                  </span>
                </h2>

                {/* Right Descriptive Paragraphs */}
                <div className="min-[661px]:col-span-5 min-[540px]:justify-self-end w-full max-w-[404px] min-[540px]:max-w-[240px] min-[661px]:max-w-[404px] flex flex-col gap-3 min-[540px]:gap-4 min-[661px]:gap-5">
                  {(
                    so.paragraphs ?? [
                      'Elewen was born from noticing a simple truth: many people love the idea of hosting, but hesitate because planning an event often feels like too much to manage.',
                      'Finding reliable vendors, understanding fair pricing, and coordinating everything usually means relying on social media, referrals, and endless back-and-forth.',
                    ]
                  ).map((para, i) => (
                    <p
                      key={i}
                      className="text-[#FFFFFF] text-[13px] min-[375px]:text-[14px] min-[540px]:text-[14px] min-[661px]:text-[15px] lg:text-[16px] leading-[1.45] min-[661px]:leading-[1.5] font-normal m-0 opacity-80 min-[540px]:opacity-100"
                    >
                      <span className="reveal-wrapper block">
                        <span
                          className="reveal-text"
                          style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                        >
                          {para}
                        </span>
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* --- 2. THE PILL (CLIPPED BY THE CURVE) --- */}
            <div className="pointer-events-none absolute inset-0 z-10">
              <div
                className="anim-element slide-from-bottom absolute top-[452px] min-[375px]:top-[466px] left-[97px] w-[200px] h-[300px] bg-[#BFAC9B] rounded-t-[500px] min-[540px]:top-[427px] min-[540px]:inset-x-0 min-[540px]:mx-auto min-[540px]:bottom-[-170px] min-[540px]:w-[400px] min-[540px]:h-[600px] min-[540px]:rounded-[500px] border-[2px] min-[540px]:border-[4px] border-[#591902] shadow-lg"
                style={{ '--delay': '0.1s' }}
              />
            </div>

            {/* --- MOBILE ONLY: GIRL CLIPPED BY THE CURVE --- */}
            <div className="min-[540px]:hidden pointer-events-none absolute inset-x-0 bottom-[-108px] min-[375px]:bottom-[-118px] z-20 flex justify-center">
              <div className="relative flex justify-center w-[252px] h-[378px] min-[375px]:w-[272px] min-[375px]:h-[402px]">
                <img
                  src={heroIllustrationSrc}
                  alt="Person tangled in lights"
                  className="anim-element slide-from-bottom absolute top-[-28px] left-[-80px] z-10 w-[330px] h-[400px] max-w-none object-contain min-[540px]:left-1/2 min-[540px]:-translate-x-1/2 min-[540px]:top-[9px] min-[540px]:w-[384px] min-[540px]:h-[529px]"
                  style={{ '--delay': '0.3s' }}
                />
              </div>
            </div>
          </div>

          {/* --- 3. THE GIRL (NOT CLIPPED BY THE CURVE) --- */}
          <div className="hidden min-[540px]:block pointer-events-none absolute inset-x-0 top-0 w-full h-[880px] z-20">
            <div className="absolute inset-x-0 bottom-[-160px] flex justify-center">
              <div className="relative flex justify-center w-[400px] h-[600px]">
                <img
                  src={heroIllustrationSrc}
                  alt="Person tangled in lights"
                  className="anim-element slide-from-bottom absolute top-[9px] overflow-visible w-[384px] h-[529px] object-cover max-w-none"
                  style={{ '--delay': '0.3s' }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* --- 4. Celebrations Don't Have to Be Big to Matter --- */}
        <div className="w-full max-w-[1440px] shrink-0 mx-auto px-6 min-[661px]:px-10 lg:px-20 xl:px-[100px] pb-16 min-[661px]:pb-8">
          <div className="grid grid-cols-1 min-[661px]:grid-cols-12 items-center min-[661px]:items-start text-center min-[661px]:text-left gap-y-8 min-[661px]:gap-y-0 min-[661px]:gap-x-12 lg:gap-x-20">
            <h2
              className="min-[661px]:col-span-7 w-full max-w-[546px] text-[#591902] text-[40px] min-[661px]:text-[50px] lg:text-[61px] leading-[1] font-normal font-serif m-0"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              <span className="reveal-wrapper block">
                <span className="reveal-text">
                  {cm.heading ?? "Celebrations Don't Have to Be Big to Matter"}
                </span>
              </span>
            </h2>

            <div className="min-[661px]:col-span-5 min-[661px]:justify-self-end w-full max-w-[463px] flex flex-col gap-5 mx-auto min-[661px]:mx-0">
              {(
                cm.paragraphs ?? [
                  'Hosting a party, celebrating with close friends and family, and taking a pause from everyday life truly matters.',
                  'Elewen exists to protect that feeling. We focus on the little details and personal touches that turn simple gatherings into meaningful moments.',
                ]
              ).map((para, i) => (
                <p
                  key={i}
                  className="text-[#591902] opacity-50 text-[16px] leading-[1.5] font-normal m-0"
                >
                  <span className="reveal-wrapper block">
                    <span className="reveal-text" style={{ animationDelay: `${0.08 + i * 0.08}s` }}>
                      {para}
                    </span>
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* --- ABOUT STORY (inlined, not a separate component call) --- */}
        <section className="relative  w-full bg-[#A5A687] overflow-y-hidden overflow-x-visible font-sans">
          <div ref={sectionRef} className="relative m-9 w-full min-[661px]:max-h-none overflow-x-visible">
            {/* --- SUB-TASK 1: SCALLOPED HEADER --- */}
            <div
              className="absolute hidden min-[661px]:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
              style={{ left: '-10%', top: '5%', transform: 'rotate(-37.82deg)' }}
            />
            <div
              className="absolute hidden min-[661px]:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
              style={{ right: '5%', top: '30%', transform: 'rotate(-37.82deg)' }}
            />

            <div className="absolute -top-[2px] min-[661px]:top-0 left-0 flex w-full pointer-events-none z-10">
              {visibleScallops.map((_, i, arr) => (
                <div key={i} className="relative h-[45px] flex-1 min-[661px]:h-[90px]">
                  <div
                    className="absolute top-0 left-0 w-full h-[36px] min-[661px]:h-[72px] bg-[#CDB17E]"
                    style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
                  />
                  <div
                    className="absolute top-0 left-0 w-full h-[30px] min-[661px]:h-[60px] bg-[#F8F4ED]"
                    style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
                  />

                  {i !== arr.length - 1 && (
                    <div
                      className="absolute top-0 right-0 flex flex-col items-center z-20 animate-swing"
                      style={{
                        animationDuration: `${3.5 + (i % 3) * 0.5}s`,
                        animationDelay: `${(i % 5) * 0.2}s`,
                      }}
                    >
                      <div
                        className={`w-[1px] ${i % 2 === 0 ? 'h-0 min-[661px]:h-[14px]' : 'h-0 min-[661px]:h-[5px]'} bg-[#591902]/40`}
                      />
                      <div className="relative flex flex-col items-center -mt-3 min-[661px]:-mt-4">
                        <img
                          src={i % 2 === 0 ? bulb1 : bulb2}
                          alt="Light"
                          className="w-[20px] min-[661px]:w-[32px] h-auto relative z-10 min-[661px]:[clip-path:inset(10px_0_0_0)] min-[661px]:-mt-[5px] min-[661px]:mb-1"
                        />

                        <div
                          className={`absolute left-1/2 top-full  -translate-y-1 min-[661px]:-translate-y-2 w-[44px] h-[44px] opacity-40 pointer-events-none animate-beam ${
                            i % 2 === 0
                              ? 'min-[661px]:w-[76px] min-[661px]:h-[78px] blur-[6px] min-[661px]:blur-[8px]'
                              : 'min-[661px]:w-[76px] min-[661px]:h-[59px] blur-[4px]'
                          }`}
                          style={{
                            animationDuration: `${4 + (i % 3) * 0.75}s`,
                            animationDelay: `${(i % 5) * 0.2}s`,
                            background:
                              i % 2 === 0
                                ? 'linear-gradient(180deg, #FCD768 0%, rgba(247,247,245,0) 100%)'
                                : 'linear-gradient(180deg, #FCE6A4 -1.95%, rgba(247,247,245,0) 100%)',
                            clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* --- SNAKE LINE SVG --- */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 min-[661px]:block z-0 "
              style={{
                top: `${SVG_TOP}px`,
                transform: 'translateX(-50%)',
                width: '107%',
                maxWidth: '1331px',
                aspectRatio: '1331 / 3986'
              }}
            >
              <svg
                ref={svgRef}
                className="overflow-visible"
                width="1331"
                height="3986"
                viewBox="0 0 1331 3986"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block'
                }}
              >
                <path
                  ref={pathRef}
                  d="M1025.66 0.255077C1025.66 0.255077 1129.61 -1.10623 1171.16 40.7551C1241.72 111.84 1027.17 245.305 1116.16 291.255C1164.72 316.326 1223.76 324.627 1255.66 280.255C1274.36 254.242 1268.89 231.292 1268.66 199.255C1267.29 8.19533 845.493 236.088 786.16 280.255C726.826 324.422 662.444 472.296 571.66 497.755C440.176 534.628 335.494 453.088 228.66 429.755C121.827 406.422 358.807 383.822 435.66 408.255C604.744 462.011 -36.4323 426.44 21.16 594.255C50.7982 680.616 194.729 594.329 213.16 683.755C233.616 783.008 58.6484 805.122 77.1596 904.755C93.4084 992.211 246.16 1033.76 236.16 1063.76C226.16 1093.76 131.136 1075.78 62.1596 1061.26C-91.2256 1028.94 298.411 911.791 449.16 954.755C542.557 981.373 594.16 1050.26 653.66 1096.26C713.16 1142.26 853.835 900.756 843.16 985.755C836.39 1039.66 809.929 1114.21 758.66 1096.26C711.246 1079.65 574.725 939.77 738.16 969.255C901.594 998.74 1156.66 1044.76 1156.66 1044.76C1320.09 1074.24 1338.07 1137.95 1327.66 1238.26C1317.69 1334.32 1142.16 1417.26 1136.16 1394.76C1125.52 1354.86 1153.55 1320.65 1191.66 1304.76C1321.16 1250.76 1321.27 1650.86 1173.16 1761.76C1080.88 1830.85 1106.73 1730.31 1001.66 1777.76C934.873 1807.92 923.939 1871.37 854.16 1893.76C779.407 1917.74 732.124 1876.73 653.66 1879.26C387.415 1887.82 -25.1063 2402.64 23.6596 2140.76C29.6993 2108.32 34.6077 2090.06 47.6596 2059.76C61.6591 2027.26 122.489 2000.95 153.16 2059.76C180.159 2111.52 46.66 2553.26 3.16003 2477.76C-14.0594 2447.87 96.064 2411.76 3.16003 2440.26C-43.882 2454.69 246.212 2447.84 269.16 2565.76C291.613 2681.13 250.518 2780.09 137.66 2747.26C110.16 2739.26 109.733 2700.86 132.16 2650.76C200.515 2498.05 374.529 2793.27 541.16 2778.26C632.81 2770 678.452 2754.86 770.16 2747.26C993.218 2728.76 1168.88 3166.19 1276.16 2969.76C1303.9 2918.96 1336.85 2877.61 1311.16 2825.76C1275.36 2753.5 1174.82 2786 1104.66 2825.76C987.642 2892.06 1240.29 2967.47 1261.66 3100.26C1280.46 3217.07 1077.88 3499.05 1185.66 3450.26C1392.19 3356.77 1281.73 3346.07 1240.16 3346.26C948.385 3347.56 -118.841 3749.65 33.6595 3624.76C186.16 3499.86 253.721 3536.47 174.66 3463.26C109.815 3403.21 264.497 3596.71 237.16 3680.76C204.882 3779.99 96.6079 3680.86 59.1592 3778.26C32.195 3848.38 13.6948 3930.34 77.6592 3969.76C134.152 4004.57 191.16 3969.76 191.16 3969.76"
                  stroke="white"
                  strokeOpacity="0.9"
                  strokeWidth="0.5"
                  strokeDasharray="6 6"
                />
              </svg>
            </div>

            <div className="relative z-10 max-w-[1200px] mx-auto px-6 min-[661px]:px-8 lg:px-12 xl:px-16 pt-16 min-[661px]:pt-20 lg:pt-24 min-[661px]:pb-24 lg:pb-28">
              {/* --- MOBILE CAROUSEL: SUB-TASK 2 -> SUB-TASK 3 --- */}
              <div className="flex w-full flex-col items-center mt-15 min-[661px]:hidden">
                <MobileStoryCarousel
                  activeIndex={mobileStorySlide}
                  onActiveIndexChange={setMobileStorySlide}
                >
                  <MobileStorySlide
                    heading={sq.heading ?? 'We Asked a Simple Question'}
                    body={
                      sq.body ??
                      'Almost everything else in our lives has moved online. We book cabs and holidays in minutes, so why does event planning still feel complicated?'
                    }
                    imageSrc={story2Src}
                    imageAlt="Atmosphere"
                  />
                  <MobileStorySlide
                    heading={tg.heading ?? 'Thoughtful Gatherings Over Loud Distractions?'}
                    body={
                      tg.paragraphs?.[0] ??
                      'With house parties becoming the new way to celebrate, it felt like the right time to bring digitalisation, organisation, and standardisation to the events space.'
                    }
                    imageSrc={story1Src}
                    imageAlt="Details"
                    revealDelay="0.18s"
                  />
                </MobileStoryCarousel>

                <div className="flex justify-center gap-2 mt-6 w-full">
                  <button
                    type="button"
                    aria-label="Show first story slide"
                    onClick={() => setMobileStorySlide(0)}
                    className={`h-[5px] rounded-full transition-all duration-300 ${
                      mobileStorySlide === 0 ? 'w-[26px] bg-white' : 'w-[14px] bg-white/40'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label="Show second story slide"
                    onClick={() => setMobileStorySlide(1)}
                    className={`h-[5px] rounded-full transition-all duration-300 ${
                      mobileStorySlide === 1 ? 'w-[26px] bg-white' : 'w-[14px] bg-white/40'
                    }`}
                  />
                </div>

                <div className="mt-8 flex w-full flex-col items-center text-center gap-4 px-4 max-w-[420px]">
                  <h2
                    className="text-white text-[24px] leading-[1.05] font-serif"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    {sq.closing_heading ? (
                      sq.closing_heading.split('\n').map((line, i, arr) => (
                        <span key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </span>
                      ))
                    ) : (
                      <>
                        Everything moved online.
                        <br />
                        Event planning didn&apos;t.
                      </>
                    )}
                  </h2>

                  <p className="text-white text-[14px] leading-[1.45] opacity-90 max-w-[28rem]">
                    {sq.closing_body ??
                      'Built on trust & to save time, Elewen is a one-stop digital platform that makes hosting simpler with genuine pricing and seamless planning.'}
                  </p>
                </div>
              </div>

              {/* --- SUB-TASK 2: SIMPLE QUESTION BLOCK --- */}
              <div
                ref={subTask2Ref}
                className="hidden min-[661px]:flex mt-8 min-[661px]:mt-48 flex-col min-[661px]:flex-row items-start gap-y-10 min-[661px]:gap-y-0 min-[661px]:gap-x-4 lg:gap-x-6"
              >
                {story1Src && (
                  <Img
                    src={story1Src}
                    alt="Atmosphere"
                    className="anim-element slide-from-left about-page-hover-image w-full min-[661px]:w-[45%] lg:w-[470px] max-w-[470px] shrink-0 aspect-square object-cover rounded-r-[120px] min-[661px]:-ml-10 lg:-ml-20 xl:-ml-[100px]"
                  />
                )}
                <div className="w-full min-[661px]:flex-1 max-w-[486px] flex flex-col gap-7 min-[661px]:mt-28">
                  <h2
                    className="text-white text-[24px] min-[661px]:text-[30px] lg:text-[50px] leading-[1] font-serif"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    <span className="reveal-wrapper block">
                      <span className="reveal-text">
                        {sq.heading ?? 'We Asked a Simple Question'}
                      </span>
                    </span>
                  </h2>
                  <p className="text-white text-[12px] min-[661px]:text-[14px] lg:text-[16px] leading-[1.2]">
                    <span className="reveal-wrapper block">
                      <span className="reveal-text" style={{ '--delay': '0.1s' }}>
                        {sq.body ??
                          'Almost everything else in our lives has moved online. We book cabs and holidays in minutes, so why does event planning still feel complicated?'}
                      </span>
                    </span>
                  </p>
                </div>
              </div>

              {/* --- SUB-TASK 3: THOUGHTFUL GATHERINGS BLOCK --- */}
              <div className="hidden min-[661px]:flex mt-24 min-[661px]:pb-30 flex-col min-[661px]:flex-row items-center gap-y-10 min-[661px]:gap-y-0">
                <div className="order-2 min-[661px]:order-1 w-full min-[661px]:flex-1 min-[661px]:max-w-[560px] min-[661px]:ml-auto min-[661px]:mr-5 flex flex-col gap-7">
                  <h2
                    className="text-white text-[24px] min-[661px]:text-[30px] lg:text-[50px] leading-[1] font-serif"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    <span className="reveal-wrapper block">
                      <span className="reveal-text">
                        {tg.heading ?? 'Thoughtful Gatherings Over Loud Distractions?'}
                      </span>
                    </span>
                  </h2>
                  {(
                    tg.paragraphs ?? [
                      'With house parties becoming the new way to celebrate, it felt like the right time to bring digitalisation, organisation, and standardisation to the events space.',
                    ]
                  ).map((para, i) => (
                    <p
                      key={i}
                      className="text-white text-[12px] min-[661px]:text-[14px] lg:text-[16px] leading-[1.2]"
                    >
                      <span className="reveal-wrapper block">
                        <span className="reveal-text" style={{ '--delay': `${0.1 + i * 0.08}s` }}>
                          {para}
                        </span>
                      </span>
                    </p>
                  ))}
                </div>

                {story2Src && (
                  <Img
                    src={story2Src}
                    alt="Details"
                    className="order-1 min-[661px]:order-2 anim-element slide-from-right about-page-hover-image w-full min-[661px]:w-[45%] lg:w-[470px] max-w-[470px] shrink-0 aspect-square object-cover rounded-l-[120px] -mr-6 min-[661px]:-mr-10 lg:-mr-20 xl:-mr-[100px]"
                  />
                )}
              </div>

              {/* --- SUB-TASK 4: MEET THE FOUNDERS --- */}
              <div className="mt-28 -mx-6 px-6 pb-16 bg-[#222815] min-[661px]:bg-transparent min-[661px]:mx-0 min-[661px]:px-0 min-[661px]:pb-20">
                <div className="flex justify-center min-[661px]:hidden mt-4 pt-16">
                  <h2
                    className="text-white text-[30px] min-[661px]:text-[41px] lg:text-[61px] leading-[1] font-serif text-center"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    <span className="reveal-wrapper block">
                      <span className="reveal-text">{founders.heading ?? 'Meet the Founders'}</span>
                    </span>
                  </h2>
                </div>

                <div className="mt-8 min-[661px]:mt-36 flex flex-col min-[661px]:flex-row items-start min-[661px]:items-start gap-y-10 min-[661px]:gap-y-0 min-[661px]:gap-x-4 lg:gap-x-6 min-[661px]:pb-20">
                  <div className="anim-element slide-from-left w-full max-w-[600px] mx-auto min-[661px]:mx-0 min-[661px]:w-1/2 shrink-0 h-[320px] min-[661px]:h-[420px] lg:h-[520px] xl:h-[600px] bg-[#222815] overflow-hidden min-[661px]:-ml-10 lg:-ml-20 xl:-ml-[100px]">
                    {mokshaSrc && (
                      <Img
                        src={mokshaSrc}
                        alt="Moksha"
                        className="about-page-hover-image w-full h-full object-cover object-[center_15%] rounded-[10px] min-[661px]:rounded-none"
                      />
                    )}
                  </div>

                  <div className="w-full min-[661px]:flex-1 min-[661px]:max-w-[520px] flex flex-col gap-[28px]">
                    <h2
                      className="hidden min-[661px]:block text-white text-[44px] min-[661px]:text-[50px] lg:text-[61px] leading-[1] font-serif min-[661px]:mb-2"
                      style={{ fontFamily: "'Malgin', serif" }}
                    >
                      <span className="reveal-wrapper block">
                        <span className="reveal-text">
                          {founders.heading ?? 'Meet the Founders'}
                        </span>
                      </span>
                    </h2>
                    <h4
                      className="text-white text-[24px] min-[661px]:text-[36px] font-serif min-[661px]:mt-8"
                      style={{ fontFamily: "'Malgin', serif" }}
                    >
                      <span className="reveal-wrapper block">
                        <span className="reveal-text">
                          {founders.founders?.[0]?.name ?? "Hi! I'm Moksha"}
                        </span>
                      </span>
                    </h4>
                    <div className="flex flex-col gap-[20px] text-white text-[14px] leading-[1.5] opacity-90">
                      {(
                        founders.founders?.[0]?.paragraphs ?? [
                          "I still don't fully know how a formerly shy kid has turned into an adult who now builds experiences around people, conversations, and connection, but here we are.",
                          "I've lived a large part of my life at boarding school, The Lawrence School, Sanawar, which has shaped me into an independent person obsessed with structure. An obsession that turned out to be a superpower in the events world.",
                          "After doing a Msc. In International Events from the UK, and spending years in the industry, I knew I didn't want to build just another event management company.",
                          'So, I took a leap of faith and Elewen was born.',
                        ]
                      ).map((para, i) => (
                        <p key={i}>
                          <span className="reveal-wrapper block">
                            <span
                              className="reveal-text"
                              style={{ animationDelay: `${0.08 + i * 0.08}s` }}
                            >
                              {para}
                            </span>
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-20 flex flex-col-reverse min-[661px]:flex-row items-start min-[661px]:items-center gap-y-10 min-[661px]:gap-y-0 min-[661px]:gap-x-0">
                  <div className="w-full min-[661px]:flex-1 min-[661px]:max-w-[520px] flex flex-col gap-[28px] min-[661px]:self-center min-[661px]:ml-auto min-[661px]:pr-0">
                    <h4
                      className="text-white text-[24px] min-[661px]:text-[36px] font-serif"
                      style={{ fontFamily: "'Malgin', serif" }}
                    >
                      <span className="reveal-wrapper block">
                        <span className="reveal-text">
                          {founders.founders?.[1]?.name ?? "Hey! I'm Gauri"}
                        </span>
                      </span>
                    </h4>
                    <div className="flex flex-col gap-[20px] text-white text-[14px] leading-[1.5] opacity-90">
                      {(
                        founders.founders?.[1]?.paragraphs ?? [
                          "I'm a dancer, reader, dreamer, and a believer that every little step eventually leads to the right place.",
                          'I graduated from Ashoka university with an honours in economics and finance. Post-graduation, I was set to be buried in financial spreadsheets, but life had different plans.',
                          'Elewen began as an idea my co-founder and I developed while exploring the opportunity to build a thoughtful, design-driven brand.',
                        ]
                      ).map((para, i) => (
                        <p key={i}>
                          <span className="reveal-wrapper block">
                            <span
                              className="reveal-text"
                              style={{ animationDelay: `${0.08 + i * 0.08}s` }}
                            >
                              {para}
                            </span>
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="anim-element slide-from-right w-full min-[661px]:w-1/2 max-w-[600px] shrink-0 h-[320px] min-[661px]:h-[420px] lg:h-[520px] xl:h-[600px] bg-[#080808] overflow-hidden mx-auto min-[661px]:mx-0 -mr-0 min-[661px]:-mr-10 lg:-mr-20 xl:-mr-[100px] rounded-[10px] min-[661px]:rounded-none">
                    {gauriSrc && (
                      <Img
                        src={gauriSrc}
                        alt="Gauri"
                        className="about-page-hover-image w-full h-full object-cover object-[center_15%] rounded-[20px] min-[661px]:rounded-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* --- SUB-TASK 5: WHY CHOOSE ELEWEN --- */}
              <div className=" -mx-6 px-6 pt-9 pb-14 bg-[#E8DDC6] min-[661px]:mt-40 min-[661px]:bg-transparent min-[661px]:mx-0 min-[661px]:px-0 min-[661px]:py-20 min-[661px]:flex min-[661px]:flex-col min-[661px]:items-start">
                <h2
                  className="text-[#1C1C1C] min-[661px]:text-white text-[24px] min-[661px]:text-[50px] lg:text-[61px] leading-[1] font-serif text-center min-[661px]:text-left"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  <span className="reveal-wrapper block">
                    <span className="reveal-text">{wc.heading ?? 'Why Choose Elewen'}</span>
                  </span>
                </h2>
                <p className="mt-6 min-[661px]:mt-6 w-full max-w-[340px] min-[661px]:max-w-[520px] mx-auto min-[661px]:mx-0 text-[#4F4F4F] min-[661px]:text-white text-[14px] min-[661px]:text-[16px] leading-[1.45] min-[661px]:leading-[1.5] opacity-100 min-[661px]:opacity-80 text-center min-[661px]:text-left">
                  <span className="reveal-wrapper block">
                    <span className="reveal-text" style={{ '--delay': '0.1s' }}>
                      {wc.subheading ??
                        'Everything you need for a beautiful celebration, thoughtfully brought together.'}
                    </span>
                  </span>
                </p>

                <div className="mt-12 grid grid-cols-2 min-[661px]:grid-cols-4 justify-items-center gap-x-8 min-[661px]:gap-x-6 lg:gap-x-8 gap-y-16 min-[661px]:gap-y-12 min-[661px]:w-fit">
                  {[
                    {
                      key: 'e47',
                      mobileOrderClass: 'order-1',
                      left: 0,
                      iconW: 145.02,
                      iconH: 150.97,
                      iconLeft: 35,
                      iconTop: -10,
                      labelW: 174,
                      labelH: 50,
                      label: wc.features?.[0]?.label ?? 'Little details that lift your party',
                    },
                    {
                      key: 'e49',
                      mobileOrderClass: 'order-2',
                      left: 217,
                      iconW: 160,
                      iconH: 134,
                      iconLeft: 0,
                      iconTop: 45,
                      labelW: 174,
                      labelH: 75,
                      label: wc.features?.[1]?.label ?? 'One complete look. Zero running around.',
                    },
                    {
                      key: 'e48',
                      mobileOrderClass: 'order-3',
                      left: 434,
                      iconW: 170,
                      iconH: 174,
                      iconLeft: 26,
                      iconTop: -4,
                      labelW: 174,
                      labelH: 75,
                      label: wc.features?.[2]?.label ?? "A few clicks and you're done planning",
                    },
                    {
                      key: 'e50',
                      mobileOrderClass: 'order-4',
                      left: 660,
                      iconW: 237,
                      iconH: 146,
                      iconLeft: -30,
                      iconTop: 36,
                      labelW: 174,
                      labelH: 75,
                      label: wc.features?.[3]?.label ?? "Behind the scenes? That's on us.",
                    },
                  ].map((item, index) => {
                    const src = featureIconSrcs[index]
                    return (
                      <div
                        key={item.key}
                        className={`anim-element slide-from-bottom ${item.mobileOrderClass} min-[661px]:order-none w-full flex flex-col items-center`}
                        style={{ '--delay': `${index * 0.06}s` }}
                      >
                        <div
                          className={`relative ${
                            index === 1 || index === 3 ? 'overflow-hidden' : 'overflow-visible'
                          } ${
                            index === 0 || index === 2
                              ? 'min-[661px]:overflow-visible'
                              : 'min-[661px]:overflow-hidden'
                          } rounded-full w-[140px] h-[140px] min-[661px]:w-[110px] min-[661px]:h-[110px] min-[900px]:w-[177px] min-[900px]:h-[177px]`}
                        >
                          <div className="absolute inset-0 rounded-full bg-[#F8F4ED]" />
                          <div className="absolute left-0 top-0 w-[177px] h-[177px] origin-top-left scale-[0.79] min-[661px]:scale-[0.621] min-[900px]:scale-100">
                            {src && (
                              <div
                                className="absolute z-10"
                                style={{
                                  width: `${item.iconW}px`,
                                  height: `${item.iconH}px`,
                                  left: `${item.iconLeft}px`,
                                  top: `${item.key === 'e47' ? item.iconTop : item.iconTop - 9}px`,
                                }}
                              >
                                <Img
                                  src={src}
                                  alt=""
                                  className="about-page-hover-image w-full h-full object-cover object-center"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <p
                          className="mt-5 min-[661px]:mt-4 text-[#1C1C1C] min-[661px]:text-white font-normal font-serif text-[16px] min-[661px]:text-[13px] min-[900px]:text-[21px] leading-[1.1] min-[900px]:leading-[120%] text-center w-full max-w-[158px] min-[661px]:max-w-[190px]"
                          style={{ fontFamily: "'Malgin', serif" }}
                        >
                          {item.label}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* --- SUB-TASK 6: VENDOR QUALITY & CARDS --- */}
              <div
                ref={subTask6Ref}
                className="-mx-6 py-24 bg-[#F8F4ED] min-[661px]:bg-transparent px-6 min-[661px]:mt-40 min-[661px]:mx-0 min-[661px]:px-0"
              >
                <div className="flex flex-col items-center text-center min-[661px]:items-end min-[661px]:text-right">
                  <h2
                    className="w-full max-w-[517px] text-[#1C1C1C] text-[30px] min-[661px]:text-[41px] min-[661px]:text-white lg:text-[61px] leading-[1] font-serif"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    <span className="reveal-wrapper block">
                      <span className="reveal-text">
                        {vq.heading ?? 'Our approach to vendor quality'}
                      </span>
                    </span>
                  </h2>
                  <p
                    className="mt-6 w-full max-w-[517px] text-[#1C1C1C] text-[16px] leading-[1.5] opacity-80 min-[661px]:text-white"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <span className="reveal-wrapper block">
                      <span className="reveal-text" style={{ animationDelay: '0.1s' }}>
                        {vq.body ??
                          'We stand by the people behind every celebration, creating steady work, clear processes, and timely payments for vendors.'}
                      </span>
                    </span>
                  </p>
                </div>

                <div className="mt-10 w-full min-[661px]:w-fit mx-auto min-[661px]:mx-0 min-[661px]:ml-auto grid grid-cols-1 min-[661px]:grid-cols-3 gap-[10px] min-[661px]:gap-[20px] justify-items-stretch min-[661px]:justify-items-end">
                  {[
                    {
                      title: vq.cards?.[0]?.title ?? 'Quality you can trust',
                      desc:
                        vq.cards?.[0]?.description ??
                        'Every partner in the Elewen Network is quality-checked for skill, reliability, and consistency.',
                      iconName: 'quality-icon.png',
                      titleWidth: '218px',
                    },
                    {
                      title: vq.cards?.[1]?.title ?? 'Built for everyone involved',
                      desc:
                        vq.cards?.[1]?.description ??
                        'By removing middlemen, we give customers better value and help our partners work in a more organised, digital, and timely system.',
                      iconName: 'everyone-icon.png',
                      titleWidth: '275px',
                    },
                    {
                      title: vq.cards?.[2]?.title ?? 'Clear tiers. Simple Choices',
                      desc:
                        vq.cards?.[2]?.description ??
                        'Our partners are grouped into three levels. You choose your package, and we take care of the rest.',
                      iconName: 'tiers-icon.png',
                      titleWidth: '279px',
                    },
                  ].map((card, index) => {
                    // Dynamically resolve the specific image for this card
                    const currentIconSrc = vendorIconSrcs[index] || iconSrc
                    return (
                      <div
                        key={index}
                        style={{ '--delay': `${0.08 + index * 0.06}s` }}
                        className="card-reveal about-page-card group w-full max-w-none min-[661px]:max-w-[316px] min-h-[120px] min-[661px]:min-h-[275px] bg-[#FFFFFF] rounded-[8px] min-[661px]:rounded-[20px] px-5 py-5 min-[661px]:p-6 flex flex-col items-center justify-center gap-3 min-[661px]:gap-5"
                      >
                        <div className="flex w-[52px] h-[52px] min-[661px]:w-[80px] min-[661px]:h-[80px] shrink-0 items-center justify-center about-page-card-icon">
                          {currentIconSrc && (
                            <div
                              className="w-full h-full origin-center bg-[#591902] about-page-hover-image"
                              style={{
                                WebkitMaskImage: `url(${currentIconSrc})`,
                                WebkitMaskSize: 'contain',
                                WebkitMaskPosition: 'center',
                                WebkitMaskRepeat: 'no-repeat',
                                maskImage: `url(${currentIconSrc})`,
                                maskSize: 'contain',
                                maskPosition: 'center',
                                maskRepeat: 'no-repeat',
                              }}
                            />
                          )}
                        </div>

                        <div className="flex flex-col items-center gap-2 min-[661px]:gap-4 w-full px-0 min-[661px]:p-4">
                          <h5
                            className="about-page-card-title text-[#2D2D2D] text-[14px] min-[375px]:text-[16px] min-[661px]:text-[18px] sm:text-[21px] font-normal text-center leading-[120%] w-full max-w-[210px] min-[661px]:max-w-[240px] sm:max-w-none"
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              lineHeight: '120%',
                              width: '100%',
                            }}
                          >
                            {card.title}
                          </h5>
                          <p
                            className="about-page-card-desc text-[#767676] text-[11px] min-[375px]:text-[12px] min-[661px]:text-[13px] font-normal text-center leading-[150%] w-full max-w-[230px] min-[661px]:max-w-[276px] break-words"
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              lineHeight: '150%',
                              width: '100%',
                            }}
                          >
                            {card.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Call To Action Section --- */}
        {/* Frame 271 */}
        <div className="w-full bg-[#591902] shrink-0">
          <div className="max-w-[1440px] mx-auto px-6 min-[661px]:px-10 lg:px-20 xl:px-[100px] py-12 min-[661px]:py-10">
            <div className="flex flex-col items-center text-center gap-4">
              <h3
                className="text-[#FFFFFF] text-[28px] min-[661px]:text-[40px] lg:text-[47px] font-normal leading-[1.05] m-0"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                <span className="reveal-wrapper block">
                  <span className="reveal-text">
                    {vc.heading ?? 'Not a part of the Elewen Network yet?'}
                  </span>
                </span>
              </h3>
              {/* Frame 151 (Button Group) */}
              <h5
                className="text-[#FFFFFF] text-[18px] min-[661px]:text-[24px] lg:text-[27px] font-normal leading-[1.05] m-0"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                <span className="reveal-wrapper block">
                  <span className="reveal-text" style={{ '--delay': '0.1s' }}>
                    {vc.subheading ?? 'Come join the fam.'}
                  </span>
                </span>
              </h5>
            </div>

            <div className="mt-8 min-[661px]:mt-10 flex flex-row flex-wrap items-center justify-center gap-4">
              <button className="flex flex-row items-center justify-between w-full max-w-[220px] min-[661px]:w-[208px] h-[44px] bg-[#CDB17E] rounded-[56px] pl-[24px] pr-[4px] py-[4px] hover:bg-[#c2a472] transition-colors group">
                <span
                  className="text-[#FFFFFF] text-[16px] font-medium leading-[150%]"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {vc.ctas?.[0]?.label ?? 'Customer Login'}
                </span>

                <div className="flex flex-row justify-center items-center w-[36px] h-[36px] bg-[#FAFAFA] rounded-full shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#CDB17E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 ease-out group-hover:rotate-45"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </div>
              </button>

              <button className="flex flex-row items-center justify-center w-full max-w-[220px] min-[661px]:w-[169px] h-[44px] bg-[#FAFAFA] rounded-[56px] px-[24px] py-[4px] hover:bg-[#FFFFFF] transition-colors">
                <span
                  className="text-[#CDB17E] text-[16px] font-medium leading-[150%]"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {vc.ctas?.[1]?.label ?? 'Join as Vendor'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* --- SCROLL-TRACED OBJECT --- */}
      <img src={objectImg} alt="" style={objStyle} loading="lazy" decoding="async" />
    </>
  )
}

export default About
