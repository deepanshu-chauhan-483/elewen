import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import white11logo from '../assets/images/white11logo.png'

import CelebrationDoor from '../components/landing-page/CelebrationDoor'
import HeroSection from '../components/landing-page/HeroSection'
import DiscountBannerCarousel from '../components/landing-page/DiscountBannerCarousel'
import { usePackages } from '../hooks/usePackages'
import { useEventCategories, useEventCards, useServiceCards } from '../hooks/useEventTypes'
import {
  DECOR_LANE_LABEL,
  normalizeServiceLaneKey,
  SERVICE_CATEGORY_ORDER,
} from '../data/eventTypes'
import { useTestimonials } from '../hooks/useTestimonials'
import { useBlogs, useBlogCategories } from '../hooks/useBlogs'
import { useLandingPage } from '../hooks/useCmsPages'
import { useDiscountBanners } from '../hooks/useDiscountBanners'
import { normalizeServiceSlug } from '../lib/packageFilters'
import {
  buildEventSelectionDestination,
  buildServicesFlowDestination,
  DEFAULT_EVENT_CATEGORY_SLUG,
} from '../lib/serviceFlow'
import { rememberHomeScroll } from '../lib/homeReturnScroll'
import { useLenis } from '../useLenis'
import { getPackageHref } from '../lib/packageRoutes'
import { preventWidow, stripMojibake } from '../lib/textFormat'
import { PACKAGES_FALLBACK } from '../data/packages'

import { preloadImages, usePreloadOnApproach } from '../utils/preloadAssets'
import { HOME_TIER1_IMAGE_URLS } from '../utils/homePagePreload'
import inspirationImg from '../assets/images/inspiration.png'
import pkgImg1 from '../assets/images/IMG_3903.jpg'
import pkgImg2 from '../assets/images/IMG_7768.jpg'
import pkgImg3 from '../assets/images/IMG_0749.jpg'
import pkgImg4 from '../assets/images/IMG_0658.jpg'
import pkgImg5 from '../assets/images/IMG_3148.jpg'
import pkgImg6 from '../assets/images/IMG_7025.jpg'
import pkgImg7 from '../assets/images/IMG_8625.png'
import pkgImg8 from '../assets/images/IMG_9814.jpg'
import pkgImg9 from '../assets/images/6f6af066.jpg'
import imgScrolling from '../assets/images/scrolling.png'
import imgCalls from '../assets/images/calls.png'
import imgVendors from '../assets/images/vendors.png'
import imgDecisions from '../assets/images/decisions.png'
import centerLogo from '../assets/images/navbar.png'
import img1 from '../assets/images/img2017.jpg'
import img2 from '../assets/images/img3001.jpg'
import img3 from '../assets/images/img3010.jpg'
import img4 from '../assets/images/img8f9e.jpg'
import img5 from '../assets/images/img6a98.jpg'
import bulb1 from '../assets/lightbulb_images/bulb1.png'
import bulb2 from '../assets/lightbulb_images/bulb2.png'
import {
  useHowItWorksLandingPage,
  fetchHowItWorksLandingPage,
} from '../hooks/useHowItWorksLandingPage'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

const CARDS_PER_PAGE = 3

// Local placeholder images for event, service, and blog cards.
// Used when Strapi hasn't provided a real image yet.
const CARD_LOCAL_IMAGES = [
  pkgImg3,
  pkgImg1,
  pkgImg5,
  pkgImg4,
  pkgImg6,
  pkgImg2,
  pkgImg7,
  pkgImg8,
  pkgImg9,
  img1,
  img2,
  img3,
  img4,
  img5,
]

const slugifyValue = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildEventListingHref = (categorySlug, eventSlug, eventId) =>
  buildEventSelectionDestination({
    categorySlug: categorySlug || DEFAULT_EVENT_CATEGORY_SLUG,
    eventSlug,
    eventId: eventId != null ? String(eventId) : '',
  })

const buildServiceListingHref = (serviceSlug, serviceId) => {
  const normalizedService = normalizeServiceSlug(serviceSlug)
  if (!normalizedService) return '/package-listing'

  const resolvedServiceId =
    normalizedService === 'decor' ? '' : serviceId != null ? String(serviceId) : ''

  return buildServicesFlowDestination({
    serviceSlug: normalizedService,
    serviceId: resolvedServiceId,
  })
}

const MOBILE_CAROUSEL_STAGE_CLASS =
  'relative min-h-[400px] md:min-h-0 w-full max-w-[100vw] md:static md:w-auto md:max-w-none'

const MOBILE_CAROUSEL_VIEWPORT_CLASS =
  'mobile-carousel-scroll w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-hidden md:w-auto md:snap-none md:mx-0'

const MOBILE_CAROUSEL_TRACK_CLASS =
  'flex w-max md:w-full gap-4 md:gap-4 justify-start md:transition-[transform,opacity] md:duration-[950ms] md:ease-[cubic-bezier(0.19,1,0.22,1)] md:will-change-transform'

const MOBILE_CAROUSEL_ARROW_BTN_LEFT =
  'pointer-events-auto w-[64px] h-[64px] rounded-full bg-[#ECE7DC] flex items-center justify-end px-2 disabled:opacity-40 transition-opacity shadow-[0_0_0_1px_rgba(205,177,126,0.06)]'

const MOBILE_CAROUSEL_ARROW_BTN_RIGHT =
  'pointer-events-auto w-[64px] h-[64px] rounded-full bg-[#ECE7DC] flex items-center justify-start px-2 disabled:opacity-40 transition-opacity shadow-[0_0_0_1px_rgba(205,177,126,0.06)]'

const MobileCarouselPrevIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#CDB17E"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const MobileCarouselNextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12H19M19 12L12 19M19 12L12 5"
      stroke="#CDB17E"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const getResolvedMobileCardWidth = (viewportWidth, fallbackWidth) =>
  viewportWidth > 0 ? Math.min(fallbackWidth, Math.floor(viewportWidth)) : fallbackWidth

const getVisiblePaginationDots = (totalItems, activeIndex, maxVisible = 5) => {
  if (totalItems <= 0) return []
  if (totalItems <= maxVisible) {
    return Array.from({ length: totalItems }, (_, index) => index)
  }

  const halfWindow = Math.floor(maxVisible / 2)
  const maxStart = totalItems - maxVisible
  const start = Math.max(0, Math.min(activeIndex - halfWindow, maxStart))

  return Array.from({ length: maxVisible }, (_, index) => start + index)
}

const PACKAGE_CYLINDER_ARC = 4
const PACKAGE_CAROUSEL_TRANSITION = 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)'

const getPackageCardZIndex = (index, activeIndex, total) => {
  if (index === activeIndex) return 50
  const direct = Math.abs(index - activeIndex)
  const wrapped = total - direct
  const distance = Math.min(direct, wrapped)
  return Math.max(0, 40 - distance * 5)
}

const LandingPackageCarouselCard = memo(function LandingPackageCarouselCard({
  pkg,
  index,
  isActive,
  isMobile,
  usePackageCylinder,
  onActivate,
  style,
}) {
  const navigate = useNavigate()
  const fallbackImages = pkg.fallbackImages ?? []
  const packageId = pkg.documentId ?? pkg.id
  const serviceSlug = String(pkg.serviceSlug ?? pkg.service_slugs?.[0] ?? '')
    .trim()
    .toLowerCase()
  const packageHref = packageId ? getPackageHref(serviceSlug, packageId) : ''

  const handleImageError = (event, imageIndex = 0) => {
    const fallbackSrc = fallbackImages[imageIndex % Math.max(fallbackImages.length, 1)]
    if (fallbackSrc && event.currentTarget.src !== fallbackSrc) {
      event.currentTarget.src = fallbackSrc
    }
  }
  const tags = useMemo(() => {
    if (Array.isArray(pkg.includes)) return pkg.includes.filter(Boolean)
    if (Array.isArray(pkg.tags)) return pkg.tags.filter(Boolean)
    return []
  }, [pkg.includes, pkg.tags])

  const renderTagPills = (textClassName = '') =>
    tags.map((tag, tagIndex) => (
      <div
        key={`${tag}-${tagIndex}`}
        className="flex justify-center items-center rounded-[29px] md:rounded-[48px]"
        style={{
          background: 'rgba(0, 0, 0, 0.05)',
          padding: isMobile ? '1.2px 7.4px' : '2px 12px',
        }}
      >
        <span
          className={`text-[#2D2D2D] font-medium leading-[150%] font-['Poppins'] md:font-sans ${textClassName || 'text-[12px] md:text-[18px]'}`}
        >
          {tag}
        </span>
      </div>
    ))

  const handleCardClick = () => {
    if (usePackageCylinder && !isActive) {
      onActivate(index)
      return
    }

    if (packageHref) {
      navigate(packageHref)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={`relative flex flex-col bg-white overflow-hidden pointer-events-auto 
                    cursor-pointer
                    w-[289px] md:w-[640px] h-[474px] md:h-[770px]
                    rounded-[8px] md:rounded-none
                  `}
      style={{
        gridArea: '1/1',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        ...style,
      }}
    >
      <div className="p-[12px] md:px-5 md:pt-5 shrink-0">
        <div
          className={`relative w-full h-[240px] md:h-[450px] bg-[#EAEAEA] overflow-hidden rounded-[8px] md:rounded-none`}
        >
          <img
            src={pkg.images?.[0] ?? fallbackImages[0] ?? ''}
            alt={pkg.title}
            className="w-full h-full object-cover object-center"
            loading={isActive ? 'eager' : 'lazy'}
            decoding="async"
            onError={event => handleImageError(event, 0)}
          />

          {pkg.price ? (
            <div
              className="absolute right-[12px] md:right-4 top-[12px] md:top-4 flex items-center justify-center gap-1 bg-white rounded-[22px] md:rounded-[36px] z-10 pointer-events-none"
              style={{ padding: isMobile ? '2.5px 7.4px' : '4px 12px' }}
            >
              <span className="text-[#364022] text-[12px] md:text-[18px] font-medium leading-[150%] font-['Poppins'] md:font-sans">
                Starting from {pkg.price}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="flex flex-col items-start flex-1 min-h-0 px-[12px] pb-[14px] md:px-8 md:pb-6 gap-[12px] md:gap-[20px]"
        style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
      >
        <div className="flex flex-col items-start w-full gap-[12px] md:gap-[24px] min-h-0 flex-1">
          <div className="flex flex-col items-start w-full gap-[7.4px] md:gap-[12px]">
            <div className="flex flex-row justify-between items-center w-full gap-[20px]">
              <h4 className="text-[#2D2D2D] truncate font-medium text-[16px] md:text-[28px] leading-[150%] font-['Poppins'] md:font-sans">
                {pkg.title}
              </h4>
              <div
                className="flex justify-center items-center rounded-[29px] md:rounded-[48px] shrink-0"
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  padding: isMobile ? '1.2px 7.4px' : '2px 12px',
                }}
              >
                <span className="text-[#2D2D2D] font-medium text-[16px] md:text-[18px] leading-[150%] font-['Poppins'] md:font-sans">
                  {pkg.category}
                </span>
              </div>
            </div>

            <p className="text-[#767676] line-clamp-2 w-full font-normal text-[12px] md:text-[18px] h-[36px] md:h-auto leading-[150%] font-['Poppins'] md:font-sans">
              {pkg.desc}
            </p>
          </div>

          <div className="flex flex-col items-start w-full gap-[12px] md:gap-[8px] min-h-0 flex-1">
            {tags.length > 0 ? (
              <>
                {isActive ? (
                  <p className="text-[#2D2D2D] w-full font-medium text-[16px] md:text-[18px] leading-[150%] font-['Poppins'] md:font-sans">
                    Includes :
                  </p>
                ) : null}
                <div className="w-full overflow-hidden max-h-[47px] md:max-h-[68px]">
                  <div className="flex flex-wrap gap-[2.5px] md:gap-1">
                    {renderTagPills(isActive ? '' : 'text-[12px] md:text-[16px]')}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
})

const PlanEventSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.plan_event_intro ?? {}
  const lenisRef = useLenis()
  const { data: discountBanners = [] } = useDiscountBanners()
  const hasDiscountBanners = discountBanners.length > 0

  // CMS: Strapi `events` top-level categories + featured sub-type cards
  const { data: categories = [] } = useEventCategories()
  const { data: eventCards = [] } = useEventCards()

  const safeCategories = Array.isArray(categories) ? categories : []
  const safeEventCards = Array.isArray(eventCards) ? eventCards : []

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [page, setPage] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [carouselViewportWidth, setCarouselViewportWidth] = useState(0)
  const [isCarouselSliding, setIsCarouselSliding] = useState(false)
  const [slideDirection, setSlideDirection] = useState('next')

  // Track window size to toggle cards per page natively
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Default to Social once categories load; keep explicit selection after user clicks.
  const activeCategory =
    selectedCategory ??
    safeCategories.find(cat => String(cat).toLowerCase() === 'social') ??
    safeCategories[0] ??
    null
  const activeCategorySlug = slugifyValue(activeCategory)

  // Filter cards by selected category
  const filteredCards = activeCategory
    ? safeEventCards.filter(c => c?.category === activeCategory)
    : safeEventCards

  // Re-run reveal when placeholder cards swap to Strapi identities (length alone is not enough).
  const cardRevealSignature = filteredCards
    .map(card => `${card.slug ?? ''}:${card.id ?? ''}:${card.image ?? ''}`)
    .join('|')

  // Dynamic pagination: 1 card on mobile, CARDS_PER_PAGE (e.g. 3) on desktop
  const currentCardsPerPage = isMobile
    ? 1
    : typeof CARDS_PER_PAGE !== 'undefined'
      ? CARDS_PER_PAGE
      : 3
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / currentCardsPerPage))
  const safePage = Math.min(page, totalPages - 1)
  const mobileCardWidth = 322
  const mobileCardGap = 16
  const edgeFadeMask =
    slideDirection === 'prev'
      ? 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 9%, black 22%, black 86%, rgba(0,0,0,0.5) 95%, transparent 100%)'
      : 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 5%, black 14%, black 78%, rgba(0,0,0,0.3) 91%, transparent 100%)'

  // Reset page when category changes
  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setSlideDirection('next')
    setPage(0)
  }
  const goToPrevPage = () => {
    setSlideDirection('prev')
    setPage(p => Math.max(0, p - 1))
  }
  const goToNextPage = () => {
    setSlideDirection('next')
    setPage(p => Math.min(totalPages - 1, p + 1))
  }
  const goToPage = nextPage => {
    if (nextPage === safePage) return
    setSlideDirection(nextPage < safePage ? 'prev' : 'next')
    setPage(Math.min(nextPage, totalPages - 1))
  }

  // const scallopCount = [...Array(15)]

  const sectionRef = useRef(null)
  const carouselViewportRef = useRef(null)
  const resolvedMobileCardWidth = getResolvedMobileCardWidth(carouselViewportWidth, mobileCardWidth)

  useEffect(() => {
    const viewport = carouselViewportRef.current
    if (!viewport) return

    const updateWidth = () => setCarouselViewportWidth(viewport.clientWidth)

    const ro = new ResizeObserver(updateWidth)
    ro.observe(viewport)
    updateWidth()

    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (page === 0) return
    const frameId = requestAnimationFrame(() => setIsCarouselSliding(true))
    const timer = setTimeout(() => setIsCarouselSliding(false), 560)
    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timer)
    }
  }, [page])

  useEffect(() => {
    const root = sectionRef.current
    if (!root) return

    const cards = Array.from(root.querySelectorAll('.card-reveal')).filter(
      el => !el.classList.contains('is-visible')
    )
    if (cards.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0, rootMargin: '0px' }
    )

    cards.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [cardRevealSignature, page, activeCategory])

  return (
    <section
      ref={sectionRef}
      id="plan-your-event"
      className={`relative w-full min-h-auto bg-[#F2F2F2] flex flex-col overflow-hidden font-sans ${
        hasDiscountBanners
          ? 'pt-6 md:pt-10 lg:min-h-screen lg:pt-16'
          : 'pt-[32px] md:pt-24 lg:min-h-screen lg:pt-52'
      }`}
    >
      {/* Background Decor (Desktop predominantly) */}
      {/* <div className="absolute top-0 left-0 w-full hidden md:flex pointer-events-none z-0">
        {scallopCount.map((_, i) => (
          <div key={i} className="relative shrink-0 w-[72px] md:w-[144px] h-[45px] md:h-[90px]">
            <div
              className="absolute top-0 left-0 w-full h-full bg-[#727355]"
              style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
            ></div>
            <div
              className="absolute top-0 left-0 w-full h-[36px] md:h-[72px] bg-[#BFAC9B]"
              style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
            ></div>
            {i !== scallopCount.length - 1 && (
              <div
                className="absolute top-0 right-0 flex flex-col items-center z-20 animate-swing"
                style={{
                  animationDuration: `${3.5 + (i % 3) * 0.5}s`,
                  animationDelay: '0s',
                }}
              >
                <div
                  className={`w-[1px] ${i % 2 === 0 ? 'h-[-10px] md:h-[-15px]' : 'h-[-4px] md:h-[-5px]'} bg-[#3D4035]/60`}
                ></div>
                <div className="relative flex flex-col items-center -mt-3 md:-mt-4">
                  <img
                    src={i % 2 === 0 ? bulb1 : bulb2}
                    alt="Pendant Light"
                    className="w-[20px] md:w-[32px] h-auto relative z-10"
                    loading="eager"
                  />
                  <div
                    className={`absolute left-1/2 top-full -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] opacity-40 pointer-events-none animate-beam ${
                      i % 2 === 0
                        ? 'md:w-[76px] md:h-[78px] blur-[6px] md:blur-[8px]'
                        : 'md:w-[76px] md:h-[59px] blur-[4px] md:blur-[4px]'
                    }`}
                    style={{
                      animationDuration: `${4 + (i % 3) * 0.75}s`,
                      animationDelay: '0s',
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
      </div> */}

      {/* Header Info */}
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 pb-8 md:pb-12 flex flex-col md:flex-row justify-between items-center md:items-end relative z-10">
        <h1
          className="text-[24px] md:text-[61px] leading-[1.08] md:leading-[1] text-[#364022] md:text-[#3D4035] font-normal tracking-normal text-center md:text-left reveal-heading max-w-[320px] md:max-w-none"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading_1 || s.heading_2 ? (
                <>
                  {s.heading_1 ?? 'Plan Your Event,'} <br className="hidden md:block" />{' '}
                  {s.heading_2 ?? 'Differently.'}
                </>
              ) : (
                (s.heading ?? (
                  <>
                    Plan Your Event, <br className="hidden md:block" /> Differently.
                  </>
                ))
              )}
            </span>
          </span>
        </h1>

        <div className="relative max-w-[320px] md:max-w-[340px] mt-5 md:mt-4 md:top-4 flex flex-col items-center md:items-start">
          <p className="text-[#727355] md:text-[#3D4035]/70 text-[14px] md:text-[15px] leading-[1.45] md:leading-relaxed mb-0 md:mb-6 font-normal md:font-medium text-center md:text-left font-['Poppins'] reveal-on-scroll">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.description ??
                  'Choose your event type and explore curated Decor and catering packages designed to simplify planning.'}
              </span>
            </span>
          </p>

          <span className="!hidden md:!inline-flex reveal-wrapper reveal-on-scroll">
            <span className="reveal-text">
              <Link
                to={s.cta_url ?? `/event-flow/category?category=${DEFAULT_EVENT_CATEGORY_SLUG}`}
                className="flex items-center pl-6 pr-1.5 py-1.5 bg-[#D4BA8E] rounded-full hover:bg-[#C6AB7F] transition-colors group w-fit"
              >
                <span className="text-white font-medium text-[15px] mr-5">
                  {s.cta_label ?? 'View All'}
                </span>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg
                    className="w-[20px] h-[20px] text-[#D4BA8E] group-hover:text-[#C6AB7F] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.83301 5.83337H14.1663M14.1663 5.83337V14.1667M14.1663 5.83337L5.83301 14.1667"
                      stroke="#CDB17E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            </span>
          </span>
        </div>
      </div>

      <div className="hidden md:block relative left-1/2 -translate-x-1/2 w-screen h-[1px] z-10 reveal-border-x">
        <div className="absolute top-0 left-0 w-full h-full bg-[#3D4035]/15 border-fill-x"></div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1 relative z-10">
        {/* Categories Bar */}
        <aside className="w-full lg:w-[320px] pt-8 pb-0 md:pt-8 md:pb-4 lg:py-20 px-4 md:px-8 lg:px-16 flex flex-col items-center lg:items-start shrink-0 relative reveal-border-y">
          <div className="hidden lg:block absolute right-0 top-0 w-[1px] h-full bg-[#3D4035]/15 border-fill-y"></div>
          <div className="hidden md:block absolute left-[-64px] bottom-0 w-[calc(100%+64px)] h-[1px] reveal-border-x">
            <div className="absolute top-0 left-0 w-full h-full bg-[#3D4035]/15 border-fill-x"></div>
          </div>
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-[12px] md:gap-5 lg:gap-8 flex-wrap justify-center w-full">
            {safeCategories.map((cat, index) => {
              const isActive = cat === activeCategory
              return (
                <React.Fragment key={cat}>
                  <div
                    className="cursor-pointer group relative w-fit flex flex-col pb-1.5 reveal-on-scroll"
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <span
                      className={`font-['Poppins'] text-[14px] md:text-[16px] transition-colors font-medium tracking-wide ${
                        isActive
                          ? 'text-[#364022] md:text-[#3D4035] md:font-bold'
                          : 'text-[#364022] md:text-[#A3A3A3] group-hover:text-[#3D4035]'
                      }`}
                    >
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{cat}</span>
                      </span>
                    </span>

                    {/* Animated Underline */}
                    <span
                      className={`absolute bottom-0 left-0 h-[1.5px] bg-[#3D4035] transition-all duration-300 ease-out ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </div>
                  {/* Vertical Separator for Mobile */}
                  {index < safeCategories.length - 1 && (
                    <div className="block lg:hidden w-[1px] h-[20px] bg-[#1C1C1C]"></div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </aside>

        <div className="flex-1 py-4 md:py-8 lg:py-16 px-6 md:px-8 lg:px-8 min-w-0">
          {/* Cards Carousel Area */}
          <div className="flex-1 py-0 md:py-6 lg:py-16 px-0 md:px-0 lg:px-8 w-full overflow-visible md:overflow-hidden min-w-0">
            <div className={MOBILE_CAROUSEL_STAGE_CLASS}>
              <div className="hidden pointer-events-none absolute top-1/2 left-0 z-20 -translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={goToPrevPage}
                  disabled={safePage === 0}
                  className={MOBILE_CAROUSEL_ARROW_BTN_LEFT}
                  aria-label="Previous card"
                >
                  <MobileCarouselPrevIcon />
                </button>
              </div>

              <div
                ref={carouselViewportRef}
                className={MOBILE_CAROUSEL_VIEWPORT_CLASS}
                style={{
                  maskImage: isCarouselSliding ? edgeFadeMask : 'none',
                  WebkitMaskImage: isMobile ? 'none' : isCarouselSliding ? edgeFadeMask : 'none',
                  transition:
                    'mask-image 420ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-mask-image 420ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div
                  className={MOBILE_CAROUSEL_TRACK_CLASS}
                  style={
                    isMobile
                      ? undefined
                      : {
                          transform: `translateX(-${safePage * carouselViewportWidth}px)`,
                        }
                  }
                >
                  {filteredCards.map((card, i) => (
                    <Link
                      key={card.slug ?? card.documentId ?? card.id ?? card.title}
                      to={buildEventListingHref(
                        card.categorySlug || activeCategorySlug,
                        card.slug,
                        card.id
                      )}
                      state={{
                        from: '/',
                        fromLanding: true,
                      }}
                      onClick={() => rememberHomeScroll(lenisRef?.current)}
                      aria-label={card.title}
                      style={{
                        '--delay': `${0.04 + i * 0.03}s`,
                        width: isMobile
                          ? `${resolvedMobileCardWidth}px`
                          : `calc((100% - ${(currentCardsPerPage - 1) * 24}px) / ${currentCardsPerPage})`,
                      }}
                      className="snap-center bg-white p-[10px] md:p-2.5 rounded-[8px] shadow-sm flex flex-col h-[394px] md:h-[460px] group cursor-pointer relative card-reveal plan-event-card shrink-0"
                    >
                      <div className="flex-1 rounded-[8px] md:rounded-b-none bg-[#FFFFFF] relative overflow-hidden h-full md:min-h-0">
                        {card.image ? (
                          <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover object-center plan-event-card-image transition-transform duration-500 ease-out group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <img
                            src={CARD_LOCAL_IMAGES[card.id % CARD_LOCAL_IMAGES.length]}
                            alt={card.title}
                            className="w-full h-full object-cover object-center plan-event-card-image transition-transform duration-500 ease-out group-hover:scale-110"
                            loading="lazy"
                          />
                        )}
                      </div>

                      <div className="absolute bottom-[15px] left-[15px] right-[15px] md:my-2 md:bottom-0 md:left-0 md:right-0 md:static bg-[#7F8060] md:bg-[#787A5E] rounded-[8px] p-3 md:p-3 lg:p-4 h-[90px] md:h-[150px] flex flex-col justify-start transition-colors duration-300 plan-event-card-content group-hover:bg-[#4F533D]">
                        <h3
                          className="text-white font-medium md:font-semibold text-[14px] md:text-[clamp(0.75rem,1.18vw,1.0625rem)] mb-[6px] md:mb-2.5 tracking-wide font-['Poppins'] leading-[1.3] md:leading-[1.35] line-clamp-2"
                          style={{ fontFamily: "'Poppins'" }}
                        >
                          {card.title}
                        </h3>
                        <p className="text-white/65 md:text-white/80 text-[12px] md:text-[clamp(0.6875rem,0.9vw,0.8125rem)] leading-[1.45] md:leading-relaxed font-normal md:font-light font-['Poppins'] line-clamp-2">
                          {cleanCopy(card.tagline)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden pointer-events-none absolute top-1/2 right-0 z-20 translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={safePage >= totalPages - 1}
                  className={MOBILE_CAROUSEL_ARROW_BTN_RIGHT}
                  aria-label="Next card"
                >
                  <MobileCarouselNextIcon />
                </button>
              </div>
            </div>

            {/* Pagination Controls */}

            {/* Desktop Pagination Block */}
            <div className="hidden md:flex w-[611px] max-w-[90vw] h-[48px] mt-16 mx-auto justify-between items-center gap-[25px]">
              <button
                onClick={goToPrevPage}
                disabled={safePage === 0}
                className="w-12 h-12 rounded-[96px] bg-[#E6DCC6] flex items-center justify-center text-[#BEB09B] hover:bg-[#957960] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-[4px] justify-center">
                {[...Array(totalPages)].map((_, i) => (
                  <div
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`cursor-pointer rounded-[8px] transition-all ${
                      i === safePage
                        ? 'w-[52px] h-[8px] bg-[#D4BA8E]'
                        : 'w-[8px] h-[8px] bg-[#D4D4D4]'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={goToNextPage}
                disabled={safePage >= totalPages - 1}
                className="w-12 h-12 rounded-[96px] bg-[#E6DCC6] flex items-center justify-center text-[#BEB09B] hover:bg-[#957960] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12H19M19 12L12 19M19 12L12 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile Pagination Dots — hidden; mobile uses horizontal scroll */}
            <div className="hidden items-center justify-center gap-[5px] mt-10 mb-8">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`cursor-pointer rounded-[12px] transition-all ${
                    i === safePage
                      ? 'w-[20px] h-[4px] bg-[#D4BA8E]'
                      : 'w-[8px] h-[4px] bg-[#C8C8C8]'
                  }`}
                />
              ))}
            </div>

            {/* Mobile View All Button */}
            <div className="flex md:hidden justify-center pb-12 reveal-on-scroll">
              <span className="reveal-wrapper reveal-wrapper--overflow-visible !pb-1">
                <span className="reveal-text">
                  <Link
                    to={s.cta_url ?? `/event-flow/category?category=${DEFAULT_EVENT_CATEGORY_SLUG}`}
                    className="flex items-center pl-[18px] pr-[3px] py-[3px] bg-[#CDB17E] rounded-[42px] hover:bg-[#C6AB7F] transition-colors group"
                  >
                    <span className="text-[#FAFAFA] font-medium text-[12px] mr-[12px] font-['Poppins']">
                      {s.cta_label ?? 'View All'}
                    </span>
                    <div className="w-[27px] h-[27px] bg-[#FAFAFA] rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        className="w-[15px] h-[15px] text-[#CDB17E] group-hover:text-[#C6AB7F] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.83301 5.83337H14.1663M14.1663 5.83337V14.1667M14.1663 5.83337L5.83301 14.1667"
                          stroke="#CDB17E"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </Link>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const WhatToPlanSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.what_to_plan_intro ?? {}

  // CMS: Strapi `service-categories` featured items
  const { data: serviceCards = [] } = useServiceCards()

  const safeServiceCards = Array.isArray(serviceCards) ? serviceCards : []

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [page, setPage] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [carouselViewportWidth, setCarouselViewportWidth] = useState(0)

  // Track window size to toggle cards per page natively
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prefer Decor first; keep sidebar lanes in product order (no F&B grouping).
  const categories = (() => {
    const lanes = safeServiceCards.reduce((acc, card) => {
      const lane = card?.category
      if (lane && !acc.includes(lane)) acc.push(lane)
      return acc
    }, [])
    const remaining = [...lanes]
    const ordered = []
    for (const preferred of SERVICE_CATEGORY_ORDER) {
      const idx = remaining.findIndex(
        name => normalizeServiceLaneKey(name) === normalizeServiceLaneKey(preferred)
      )
      if (idx !== -1) ordered.push(remaining.splice(idx, 1)[0])
    }
    return ordered.concat(remaining)
  })()
  const preferredDecor =
    categories.find(category => normalizeServiceLaneKey(category) === 'decor') ??
    categories.find(category => category === DECOR_LANE_LABEL) ??
    null
  const activeCategory = selectedCategory ?? preferredDecor ?? categories[0] ?? null

  const filteredCards = activeCategory
    ? safeServiceCards.filter(
        s =>
          normalizeServiceLaneKey(s?.category) === normalizeServiceLaneKey(activeCategory)
      )
    : safeServiceCards

  // Re-run reveal when placeholder cards swap to Strapi identities (length alone is not enough).
  const cardRevealSignature = filteredCards
    .map(card => `${card.slug ?? ''}:${card.id ?? ''}:${card.image ?? ''}`)
    .join('|')

  // Dynamic pagination: 1 card on mobile, CARDS_PER_PAGE (e.g. 3) on desktop
  const currentCardsPerPage = isMobile
    ? 1
    : typeof CARDS_PER_PAGE !== 'undefined'
      ? CARDS_PER_PAGE
      : 3
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / currentCardsPerPage))
  const safePage = Math.min(page, totalPages - 1)
  const mobileCardWidth = 322
  const mobileCardGap = 16

  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setPage(0)
  }
  const goToPrevPage = () => {
    setPage(p => Math.max(0, p - 1))
  }
  const goToNextPage = () => {
    setPage(p => Math.min(totalPages - 1, p + 1))
  }
  const goToPage = nextPage => {
    if (nextPage === safePage) return
    setPage(Math.min(nextPage, totalPages - 1))
  }

  const sectionRef = useRef(null)
  const carouselViewportRef = useRef(null)
  const resolvedMobileCardWidth = getResolvedMobileCardWidth(carouselViewportWidth, mobileCardWidth)

  useEffect(() => {
    const viewport = carouselViewportRef.current
    if (!viewport) return

    const updateWidth = () => setCarouselViewportWidth(viewport.clientWidth)

    const ro = new ResizeObserver(updateWidth)
    ro.observe(viewport)
    updateWidth()

    return () => ro.disconnect()
  }, [])

  // Simple, section-scoped reveal (no global mutation observers).
  useEffect(() => {
    const root = sectionRef.current
    if (!root) return

    const targets = Array.from(
      root.querySelectorAll('.reveal-heading, .reveal-on-scroll, .card-reveal')
    ).filter(el => !el.classList.contains('is-visible'))

    if (targets.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const el = entry.target

          // Full-card reveal
          if (el.classList.contains('card-reveal')) el.classList.add('is-visible')

          // Text reveal inside the element
          Array.from(el.querySelectorAll('.reveal-text')).forEach(span => {
            span.style.animationDelay = '0s'
            span.classList.add('is-visible')
          })

          io.unobserve(el)
        })
      },
      { threshold: 0, rootMargin: '0px' }
    )

    targets.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [categories.length, cardRevealSignature, page, activeCategory])

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-auto bg-[#F2F2F2] flex flex-col overflow-hidden font-sans lg:min-h-screen"
    >
      {/* Header Info */}
      <div className="w-full max-w-[1440px] mx-auto pt-10 md:pt-24 pb-8 md:pb-12 px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center md:items-center">
        <div className="max-w-[353px] md:max-w-[340px] order-last lg:order-first mt-5 md:mt-0 flex flex-col items-center md:items-start">
          <p className="text-[#727355] md:text-[#3D4035]/70 text-[14px] md:text-[15px] leading-[150%] md:leading-relaxed mb-0 md:mb-6 font-normal md:font-medium text-center md:text-left font-['Poppins'] reveal-on-scroll">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.description ??
                  'Choose a service category to explore curated packages designed for your event.'}
              </span>
            </span>
          </p>

          <span className="!hidden md:!inline-flex reveal-wrapper reveal-on-scroll">
            <span className="reveal-text">
              <Link
                to={s.cta_url ?? '/event-flow/service?flow=services'}
                className="flex items-center pl-6 pr-1.5 py-1.5 bg-[#D4BA8E] rounded-full hover:bg-[#C6AB7F] transition-colors group w-fit"
              >
                <span className="text-white font-medium text-[15px] mr-5">
                  {s.cta_label ?? 'View All'}
                </span>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {/* <svg
                    className="w-[18px] h-[18px] text-[#D4BA8E] group-hover:text-[#C6AB7F] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 17L17 7M17 7H9M17 7v8"
                    />
                  </svg> */}

                  <svg
                    className="w-[20px] h-[20px] text-[#D4BA8E] group-hover:text-[#C6AB7F] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.83301 5.83337H14.1663M14.1663 5.83337V14.1667M14.1663 5.83337L5.83301 14.1667"
                      stroke="#CDB17E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            </span>
          </span>
        </div>

        <h2
          className="font-display text-[28px] md:text-[61px] leading-[1] md:leading-[1] text-[#364022] md:text-[#3D4035] font-normal tracking-normal text-center md:text-left order-first lg:order-last reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading_1 || s.heading_2 ? (
                <>
                  {s.heading_1 ?? 'What Would You'} <br className="hidden md:block" />{' '}
                  {s.heading_2 ?? 'Like To Plan?'}
                </>
              ) : (
                (s.heading ?? (
                  <>
                    What Would You <br className="hidden md:block" /> Like To Plan?
                  </>
                ))
              )}
            </span>
          </span>
        </h2>
      </div>

      <div className="hidden md:block relative left-1/2 -translate-x-1/2 w-screen h-[1px] reveal-border-x">
        <div className="absolute top-0 left-0 w-full h-full bg-[#3D4035]/15 border-fill-x"></div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row-reverse flex-1 mb-10">
        <aside className="w-full lg:w-[320px] pt-8 pb-0 md:pt-8 md:pb-4 lg:py-20 px-4 md:px-8 lg:px-16 flex flex-col items-center lg:items-start shrink-0 relative reveal-border-y">
          <div className="hidden md:block absolute left-0 top-0 w-[1px] h-full bg-[#3D4035]/15 border-fill-y"></div>
          <div className="hidden md:block absolute left-[-64px] bottom-0 w-[calc(100%+64px)] h-[1px] reveal-border-x">
            <div className="absolute top-0 left-16 w-full h-full bg-[#3D4035]/15 border-fill-x"></div>
          </div>
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-[12px] md:gap-5 lg:gap-8 flex-wrap justify-center w-full">
            {categories.map((cat, index) => {
              const isActive = cat === activeCategory
              return (
                <React.Fragment key={cat}>
                  <div
                    className="cursor-pointer group relative w-fit flex flex-col pb-1.5 reveal-on-scroll"
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <span
                      className={`font-['Poppins'] text-[14px] md:text-[16px] transition-colors font-medium tracking-wide ${
                        isActive
                          ? 'text-[#364022] md:text-[#3D4035] md:font-bold'
                          : 'text-[#364022] md:text-[#A3A3A3] group-hover:text-[#3D4035]'
                      }`}
                    >
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{cat}</span>
                      </span>
                    </span>

                    <span
                      className={`absolute bottom-0 left-0 h-[1.5px] bg-[#3D4035] transition-all duration-300 ease-out ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </div>
                  {index < categories.length - 1 && (
                    <div className="block lg:hidden w-[1px] h-[20px] bg-[#1C1C1C]"></div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </aside>

        <div className="flex-1 py-4 md:py-8 lg:py-16 px-6 md:px-8 lg:px-8">
          <div className="flex-1 py-0 md:py-6 lg:py-16 px-0 md:px-0 lg:px-8 w-full overflow-visible md:overflow-hidden">
            <div className={MOBILE_CAROUSEL_STAGE_CLASS}>
              <div className="hidden pointer-events-none absolute top-1/2 left-0 z-20 -translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={goToPrevPage}
                  disabled={safePage === 0}
                  className={MOBILE_CAROUSEL_ARROW_BTN_LEFT}
                  aria-label="Previous card"
                >
                  <MobileCarouselPrevIcon />
                </button>
              </div>

              <div
                ref={carouselViewportRef}
                className={MOBILE_CAROUSEL_VIEWPORT_CLASS}
              >
                <div
                  className={`${MOBILE_CAROUSEL_TRACK_CLASS} md:gap-6`}
                  style={
                    isMobile
                      ? undefined
                      : {
                          transform: `translateX(-${safePage * carouselViewportWidth}px)`,
                        }
                  }
                >
                  {filteredCards.map((card, i) => (
                    <Link
                      key={card.slug ?? card.documentId ?? card.id ?? card.title}
                      to={buildServiceListingHref(card.slug ?? card.title, card.id)}
                      className="snap-center bg-white p-[10px] md:p-2.5 mx-auto md:mx-0 rounded-[8px] shadow-sm flex flex-col h-[394px] md:h-[460px] group cursor-pointer relative card-reveal plan-event-card shrink-0"
                      style={{
                        '--delay': `${0.04 + i * 0.03}s`,
                        width: isMobile
                          ? `${resolvedMobileCardWidth}px`
                          : `calc((100% - ${(currentCardsPerPage - 1) * 24}px) / ${currentCardsPerPage})`,
                      }}
                    >
                      <div className="flex-1 rounded-[8px] md:rounded-b-none bg-[#FFFFFF] relative overflow-hidden h-full md:min-h-0">
                        <img
                          src={card.image ?? CARD_LOCAL_IMAGES[card.id % CARD_LOCAL_IMAGES.length]}
                          alt={card.title}
                          className="w-full h-full object-cover object-center plan-event-card-image transition-transform duration-500 ease-out group-hover:scale-110"
                        />
                      </div>

                      <div className="absolute bottom-[15px] left-[15px] right-[15px] md:my-2 md:bottom-0 md:left-0 md:right-0 md:static bg-[#7F8060] md:bg-[#787A5E] rounded-[8px] px-3 py-3 md:px-3 md:py-3 lg:p-3 h-[90px] md:h-[150px] flex flex-col justify-start transition-colors duration-300 plan-event-card-content group-hover:bg-[#4F533D]">
                        {' '}
                        <h3
                          className="text-white font-medium md:font-semibold text-[14px] md:text-[clamp(0.75rem,1.18vw,1.0625rem)] mb-[6px] md:mb-2.5 tracking-wide font-['Poppins'] leading-[1.3] md:leading-[1.35] line-clamp-2"
                          style={{ fontFamily: "'Poppins'" }}
                        >
                          {card.title}
                        </h3>
                        <p className="text-white/65 md:text-white/80 text-[12px] md:text-[clamp(0.6875rem,0.9vw,0.8125rem)] leading-[1.45] md:leading-relaxed font-normal md:font-light pr-2 font-['Poppins'] line-clamp-2">
                          {cleanCopy(card.description)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden pointer-events-none absolute top-1/2 right-0 z-20 translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={safePage >= totalPages - 1}
                  className={MOBILE_CAROUSEL_ARROW_BTN_RIGHT}
                  aria-label="Next card"
                >
                  <MobileCarouselNextIcon />
                </button>
              </div>
            </div>

            {/* Desktop Pagination Block */}
            <div className="hidden md:flex w-[611px] max-w-[90vw] h-[48px] mt-12 md:mt-16 mx-auto justify-between items-center gap-[25px] ">
              <button
                onClick={goToPrevPage}
                disabled={safePage === 0}
                className="w-12 h-12 rounded-[96px] bg-[#E6DCC6] flex items-center justify-center text-[#BEB09B] hover:bg-[#957960] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-[4px] justify-center">
                {[...Array(totalPages)].map((_, i) => (
                  <div
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`cursor-pointer rounded-[8px] transition-all ${
                      i === safePage
                        ? 'w-[52px] h-[8px] bg-[#D4BA8E]'
                        : 'w-[8px] h-[8px] bg-[#D4D4D4]'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={safePage >= totalPages - 1}
                className="w-12 h-12 rounded-[96px] bg-[#E6DCC6] flex items-center justify-center text-[#BEB09B] hover:bg-[#957960] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12H19M19 12L12 19M19 12L12 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile Pagination Dots — hidden; mobile uses horizontal scroll */}
            <div className="hidden items-center justify-center gap-[5px] mt-10 mb-8">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`cursor-pointer rounded-[12px] transition-all ${
                    i === safePage
                      ? 'w-[20px] h-[4px] bg-[#D4BA8E]'
                      : 'w-[8px] h-[4px] bg-[#C8C8C8]'
                  }`}
                />
              ))}
            </div>
            {/* Mobile View All Button */}
            <div className="flex md:hidden justify-center pb-12 reveal-on-scroll">
              <span className="reveal-wrapper reveal-wrapper--overflow-visible !pb-1">
                <span className="reveal-text">
                  <Link
                    to={s.cta_url ?? '/event-flow/service?flow=services'}
                    className="flex items-center pl-[18px] pr-[3px] py-[3px] bg-[#CDB17E] rounded-[42px] hover:bg-[#C6AB7F] transition-colors group"
                  >
                    <span className="text-[#FAFAFA] font-medium text-[12px] mr-[12px] font-['Poppins']">
                      {s.cta_label ?? 'View All'}
                    </span>
                    <div className="w-[27px] h-[27px] bg-[#FAFAFA] rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        className="w-[15px] h-[15px] text-[#CDB17E] group-hover:text-[#C6AB7F] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.83301 5.83337H14.1663M14.1663 5.83337V14.1667M14.1663 5.83337L5.83301 14.1667"
                          stroke="#CDB17E"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </Link>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const ThoughtBubbleIcon = () => (
  <svg
    className="block h-[60px] w-[60px] shrink-0 md:h-[96px] md:w-[96px]"
    viewBox="0 0 80 80"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M52 26C52 26 53 20 44 20C38 20 36 24 36 24C36 24 30 22 26 28C22 34 26 40 26 40C26 40 22 46 30 50C36 54 42 50 42 50C42 50 50 54 56 46C60 38 52 34 52 34C52 34 58 30 52 26Z" />
    <circle cx="28" cy="58" r="3" />
    <circle cx="22" cy="66" r="2" />
  </svg>
)

const ChecklistIcon = () => (
  <svg
    className="block h-[60px] w-[60px] shrink-0 md:h-[96px] md:w-[96px]"
    viewBox="0 0 80 80"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="36" y="24" width="24" height="8" rx="2" />
    <circle cx="26" cy="28" r="4" />
    <circle cx="26" cy="42" r="4" />
    <circle cx="26" cy="56" r="4" />
    <path d="M40 38H60M40 52H50" />
    <path d="M44 64V54C44 51.7909 45.7909 50 48 50C50.2091 50 52 51.7909 52 54V56C52 56 56 50 60 54C64 58 56 68 50 72H44V64Z" />
  </svg>
)

const GridIcon = () => (
  <svg
    className="block h-[60px] w-[60px] shrink-0 md:h-[96px] md:w-[96px]"
    viewBox="0 0 80 80"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="22" y="22" width="14" height="14" rx="2" />
    <rect x="44" y="22" width="14" height="14" rx="2" />
    <rect x="22" y="44" width="14" height="14" rx="2" />
    <rect x="44" y="44" width="14" height="14" rx="2" />
  </svg>
)

const PlusIcon = () => (
  <svg
    className="block h-[60px] w-[60px] shrink-0 md:h-[96px] md:w-[96px]"
    viewBox="0 0 80 80"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="40" cy="40" r="24" />
    <path d="M40 28V52M28 40H52" />
  </svg>
)

const LightbulbIcon = () => (
  <svg
    className="block h-[60px] w-[60px] shrink-0 md:h-[96px] md:w-[96px]"
    viewBox="0 0 80 80"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M32 54H48M34 60H46M38 66H42" />
    <path d="M26 36C26 28.268 32.268 22 40 22C47.732 22 54 28.268 54 36C54 41.5283 50.8037 46.2863 46 48.2435V54H34V48.2435C29.1963 46.2863 26 41.5283 26 36Z" />
    <path d="M40 12V16M16 40H20M60 40H64M24 24L28 28M56 24L52 28" />
  </svg>
)

const CoinIcon = () => (
  <svg
    className="block h-[60px] w-[60px] shrink-0 md:h-[96px] md:w-[96px]"
    viewBox="0 0 80 80"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="40" cy="40" r="24" />
    <circle cx="40" cy="40" r="18" />
    <path
      d="M40 30V50M36 34H42C44.2091 34 46 35.7909 46 38C46 40.2091 44.2091 42 42 42H38C35.7909 42 34 43.7909 34 46C34 48.2091 35.7909 50 38 50H44"
      transform="translate(80, 0) scale(-1, 1)"
    />
  </svg>
)

/* const howSteps = [
  {
    id: 1,
    title: 'You Dream It. We Handle The Rest',
    desc: 'All you need is a reason to celebrate and a few basic details.',
    side: 'right',
    icon: ThoughtBubbleIcon,
  },
  {
    id: 2,
    title: 'Choose What You Need',
    desc: 'Browse through decor, furniture, catering, bartenders, and more.',
    side: 'left',
    icon: ChecklistIcon,
  },
  {
    id: 3,
    title: 'Explore Our Themes And Packages',
    desc: 'From small, budget setups to full themed transformations.',
    side: 'right',
    icon: GridIcon,
  },
  {
    id: 4,
    title: 'Add What You Love',
    desc: 'Build your party, piece by piece. Save, mix, match, and create a setup that feels like you.',
    side: 'left',
    icon: PlusIcon,
  },
  {
    id: 5,
    title: "Have An Idea That's A Little Different?",
    desc: "Leave us a note, ask a question, or pitch your wild idea - we'll align, curate, and make your party effortless.",
    side: 'right',
    icon: LightbulbIcon,
  },
  {
    id: 6,
    title: 'Confirm With A Small Advance',
    desc: 'Pay a percentage to lock your booking and reserve your date',
    side: 'left',
    icon: CoinIcon,
  },
]
*/

gsap.registerPlugin(ScrollTrigger)

const iconByIndex = index => {
  const icons = [ThoughtBubbleIcon, ChecklistIcon, GridIcon, PlusIcon, LightbulbIcon, CoinIcon]
  return icons[index % icons.length]
}

const normalizeText = value => (value == null ? '' : String(value))

const cleanCopy = value => preventWidow(stripMojibake(normalizeText(value)))

const HowItWorksSection = ({ disableScrollAnimations, isVisible = true }) => {
  const { data: howItWorks = { title: '', sections: [] } } = useHowItWorksLandingPage()
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  const steps = useMemo(() => {
    const list = Array.isArray(howItWorks.sections) ? howItWorks.sections : []
    return list.map((section, index) => ({
      id: section.section_id ?? index + 1,
      title: cleanCopy(section.title),
      desc: cleanCopy(section.desc),
      image: section.image ?? null,
      side: index % 2 === 0 ? 'right' : 'left',
    }))
  }, [howItWorks.sections])

  useEffect(() => {
    const urls = steps.map(step => step.image).filter(Boolean)
    if (urls.length) preloadImages(urls)
  }, [steps])

  const containerRef = useRef(null)
  const stepsWrapRef = useRef(null)

  // ── Icon renderer ──────────────────────────────────────────
  // stepIndex: position of this step in the list
  // activeStepIndex: currently highlighted step
  // white = active OR already passed (index <= activeStepIndex)
  const renderIcon = (step, stepIndex) => {
    const isWhite = stepIndex <= activeStepIndex

    const imgStyle = {
      transition: 'filter 0.4s ease',
      transform: 'none',
      filter: isWhite
        ? 'brightness(0) invert(1)' // pure white
        : 'brightness(0) invert(1) opacity(0.25)', // dim for future steps
    }

    if (step.image) {
      return (
        <img
          src={step.image}
          alt={step.title}
          className="block h-[60px] w-[60px] shrink-0 md:h-[96px] md:w-[96px] object-contain object-center"
          style={imgStyle}
        />
      )
    }

    // Fallback SVG icon — apply white via className
    const FallbackIcon = iconByIndex(stepIndex)
    return (
      <span style={imgStyle} className="block">
        <FallbackIcon />
      </span>
    )
  }

  // Track mobile viewport for disabling scroll animations
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Setup mobile progress line initial state
  useEffect(() => {
    if (!isMobileView || !containerRef.current) return
    const container = containerRef.current

    // Show heading
    const heading = container.querySelector('h2')
    if (heading) {
      heading.style.opacity = '1'
    }

    // Initialize progress line
    const progressLine = container.querySelector('.progress-line-active')
    const firstStep = container.querySelector('.step-item')
    if (progressLine && firstStep) {
      gsap.set(progressLine, {
        top: firstStep.offsetTop,
        height: firstStep.offsetHeight,
        opacity: 1,
      })
    }
  }, [isMobileView, steps.length])

  // Mobile animations - match desktop behavior with intersection observers
  useEffect(() => {
    if (!isMobileView || !containerRef.current) return
    const container = containerRef.current
    const stepsWrap = stepsWrapRef.current
    if (!stepsWrap) return

    const progressLine = container.querySelector('.progress-line-active')
    const stepElements = Array.from(stepsWrap.querySelectorAll('.step-item'))

    if (stepElements.length === 0 || !progressLine) return

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return

          const stepEl = entry.target
          const stepIndex = stepElements.indexOf(stepEl)

          // Update progress line position and height
          const targetTop = stepEl.offsetTop
          const targetHeight = stepEl.offsetHeight

          gsap.to(progressLine, {
            top: targetTop,
            height: targetHeight,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto',
          })

          // Mark step as active
          stepElements.forEach((step, idx) => {
            step.classList.toggle('is-step-active', idx === stepIndex)
          })
          setActiveStepIndex(stepIndex)

          // Animate left and right content
          const leftContent = stepEl.querySelector('.left-content')
          const rightContent = stepEl.querySelector('.right-content')

          const tl = gsap.timeline()

          if (leftContent) {
            tl.fromTo(
              leftContent,
              { x: -88, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.2, ease: 'power2.out' },
              0
            )
          }

          if (rightContent) {
            tl.fromTo(
              rightContent,
              { x: 88, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.2, ease: 'power2.out' },
              0
            )
          }

          // Animate reveal-text elements
          const revealTexts = Array.from(stepEl.querySelectorAll('.reveal-text'))
          revealTexts.forEach(text => {
            if (!text.classList.contains('is-visible')) {
              text.classList.add('is-visible')
            }
          })

          io.unobserve(stepEl)
        })
      },
      { threshold: 0, rootMargin: '0px' }
    )

    stepElements.forEach(el => io.observe(el))
    return () => {
      io.disconnect()
      gsap.killTweensOf(progressLine)
    }
  }, [isMobileView, steps.length])

  // ── GSAP scroll animations ──────────────────────────────────
  gsap.config({ autoSleep: 60, force3D: true, nullTargetWarn: false })
  ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true })

  useLayoutEffect(() => {
    if (disableScrollAnimations || !isVisible || isMobileView) return
    const container = containerRef.current
    const stepsWrap = stepsWrapRef.current
    if (!container || !stepsWrap) return

    const progressLine = container.querySelector('.progress-line-active')
    const stepElements = gsap.utils.toArray('.step-item', stepsWrap)

    const revealTexts = elements => {
      elements.forEach(element => {
        if (element.classList.contains('is-visible')) return
        element.style.animationDelay = '0s'
        element.classList.add('is-visible')
      })
    }

    const revealHeading = () => {
      revealTexts(Array.from(container.querySelectorAll('h2 .reveal-text')), 0)
    }

    const revealStepText = (step = {}) => {
      revealTexts(Array.from(step.querySelectorAll('.reveal-text')), 0)
    }

    const revealedSteps = new WeakSet()

    const animateStepContent = (step, { fast = false } = {}) => {
      if (revealedSteps.has(step)) return
      revealedSteps.add(step)

      const leftContent = step.querySelector('.left-content')
      const rightContent = step.querySelector('.right-content')

      revealStepText(step, { fast })

      const stepTimeline = gsap.timeline({
        defaults: {
          duration: fast ? 0.2 : 0.25,
          ease: 'power2.out',
          overwrite: 'auto',
        },
      })

      if (leftContent)
        stepTimeline.to(leftContent, { x: 0, opacity: 1, clearProps: 'transform' }, 0)
      if (rightContent)
        stepTimeline.to(rightContent, { x: 0, opacity: 1, clearProps: 'transform' }, 0)
    }

    let currentActiveIndex = 0

    const setActiveStepLine = (
      stepItems,
      nextIndex,
      { immediate = false, revealContent = false, fast = false } = {}
    ) => {
      if (!progressLine || !stepItems[nextIndex]) return

      const targetStep = stepItems[nextIndex]
      const targetTop = targetStep.offsetTop
      const targetHeight = targetStep.offsetHeight

      stepItems.forEach((step, index) => {
        step.classList.toggle('is-step-active', index === nextIndex)
      })

      const wasInactive = currentActiveIndex === -1
      currentActiveIndex = nextIndex

      // ✅ Update React state so icons re-render with correct white filter
      setActiveStepIndex(nextIndex)

      gsap.killTweensOf(progressLine)

      if (immediate) {
        gsap.set(progressLine, { top: targetTop, height: targetHeight, opacity: 1 })
        if (revealContent) requestAnimationFrame(() => animateStepContent(targetStep, { fast }))
        return
      }

      if (wasInactive) {
        gsap.fromTo(
          progressLine,
          { top: targetTop + 16, height: Math.max(targetHeight * 0.85, 1), opacity: 0 },
          {
            top: targetTop,
            height: targetHeight,
            opacity: 1,
            duration: fast ? 0.3 : 0.5,
            ease: 'power3.out',
            overwrite: 'auto',
            onStart: () => {
              if (revealContent) animateStepContent(targetStep, { fast })
            },
          }
        )
        return
      }

      gsap.to(progressLine, {
        top: targetTop,
        height: targetHeight,
        opacity: 1,
        duration: 0.25,
        ease: 'none',
        overwrite: 'auto',
        onStart: () => {
          if (revealContent) animateStepContent(targetStep)
        },
      })
    }

    const updateStepHighlights = ({ reposition = false, immediate = false } = {}) => {
      const stepItems = Array.from(container.querySelectorAll('.step-item'))
      if (!progressLine || stepItems.length === 0) return

      const center = window.innerHeight * 0.5
      let nearestStepIndex = 0
      let nearestDistance = Number.POSITIVE_INFINITY

      stepItems.forEach((step, index) => {
        const rect = step.getBoundingClientRect()
        const stepCenter = rect.top + rect.height / 2
        const distance = Math.abs(stepCenter - center)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestStepIndex = index
        }
      })

      const shouldRevealContent = nearestStepIndex !== currentActiveIndex

      if (reposition || shouldRevealContent) {
        setActiveStepLine(stepItems, nearestStepIndex, {
          immediate,
          revealContent: shouldRevealContent,
        })
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
    const refreshStepHighlights = () => updateStepHighlights({ reposition: true })

    const ctx = gsap.context(() => {
      highlightTrigger = ScrollTrigger.create({
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: updateStepHighlights,
      })

      revealHeading()

      stepElements.forEach(step => {
        const leftContent = step.querySelector('.left-content')
        const rightContent = step.querySelector('.right-content')
        if (leftContent) gsap.set(leftContent, { x: -88, opacity: 0, force3D: true })
        if (rightContent) gsap.set(rightContent, { x: 88, opacity: 0, force3D: true })
      })
    }, container)

    updateStepHighlights({ reposition: true, immediate: true })

    const firstStep = stepElements[0]
    if (firstStep) animateStepContent(firstStep, { fast: true })

    if (progressLine && stepElements[0]) {
      gsap.set(progressLine, {
        top: stepElements[0].offsetTop,
        height: stepElements[0].offsetHeight,
        opacity: 1,
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    ScrollTrigger.addEventListener('refresh', refreshStepHighlights)

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            ScrollTrigger.refresh()
            requestAnimationFrame(() => updateStepHighlights({ reposition: true }))
          }
        })
      },
      { threshold: 0, rootMargin: '100px' }
    )
    observer.observe(container)

    ScrollTrigger.refresh()
    updateStepHighlights({ reposition: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ScrollTrigger.removeEventListener('refresh', refreshStepHighlights)
      if (rafId != null) cancelAnimationFrame(rafId)
      gsap.killTweensOf(progressLine)
      highlightTrigger?.kill()
      ctx.revert()
      observer.disconnect()
    }
  }, [disableScrollAnimations, isVisible, steps.length, isMobileView])

  return (
    <section
      ref={containerRef}
      data-nav-theme="dark"
      className="relative w-full bg-[#591902] py-16 md:py-40 overflow-hidden font-sans text-white"
      // style={{ scrollMarginTop: '100px' }}
    >
      <h2 className="text-[24px] md:text-[61px] text-center mb-16 md:mb-32 tracking-wide font-serif font-display flex items-center justify-center gap-2 md:gap-3">
        {(() => {
          const title = howItWorks.title || 'HOW 11 WORKS'
          const parts = title.split('11')
          return (
            <>
              {parts[0]}
              <img
                src={white11logo}
                alt="11"
                className="h-[24px] md:h-[48px] mx-1.5 w-auto inline-block"
              />
              {parts[1]}
            </>
          )
        })()}
      </h2>

      <div
        ref={stepsWrapRef}
        className="relative w-full max-w-[1000px] mx-auto flex flex-col items-center px-4 md:px-0"
      >
        {/* Vertical line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white opacity-20 -translate-x-1/2" />

        {/* Active progress line */}
        <div
          className="progress-line progress-line-active absolute left-1/2 w-[2px] bg-white -translate-x-1/2 z-30"
          style={{
            top: 0,
            height: 0,
            opacity: 0,
            willChange: 'top, height, opacity',
            backfaceVisibility: 'hidden',
          }}
        />

        {steps.map((step, index) => (
          <div
            key={step.id}
            className="step-item relative w-full flex items-start justify-between mb-[50px] md:mb-10 last:mb-0"
          >
            {step.side === 'right' ? (
              <>
                {/* Icon LEFT */}
                <div className="left-content w-1/2 pr-4 md:pr-20 flex justify-end items-start mt-8 step-reveal opacity-0 min-w-0">
                  <span className="reveal-wrapper">
                    <span className="reveal-text reveal-text-x-left">
                      {renderIcon(step, index)}
                    </span>
                  </span>
                </div>

                {/* Text RIGHT */}
                <div className="right-content w-1/2 min-w-0 pl-4 md:pl-20 flex flex-col items-start self-stretch text-left relative z-20 opacity-0">
                  <div
                    className="reveal-wrapper reveal-wrapper-circle reveal-wrapper-circle-right step-reveal mb-2 md:mb-6"
                    style={{ display: 'inline-flex' }}
                  >
                    <div className="reveal-text reveal-text-x-right reveal-circle-text">
                      <div
                        className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] bg-[#CDB17E] rounded-[40px] md:rounded-full flex items-center justify-center text-[18px] md:text-[22px] font-serif"
                        style={{
                          boxShadow:
                            '-25px 18px 12px rgba(0,0,0,0.03), -14px 10px 10px rgba(0,0,0,0.1), -6px 4px 8px rgba(0,0,0,0.16), -2px 1px 4px rgba(0,0,0,0.19)',
                        }}
                      >
                        {step.id}
                      </div>
                    </div>
                  </div>

                  <h3 className="w-full text-[16px] md:text-[27px] font-serif font-display mb-3 leading-[1.1] opacity-100 step-reveal text-pretty">
                    <span className="reveal-wrapper">
                      <span className="reveal-text">{step.title}</span>
                    </span>
                  </h3>

                  <p className="w-full text-[12px] md:text-[16px] leading-[1.5] max-w-[342px] font-light opacity-100 step-reveal text-pretty">
                    <span className="reveal-wrapper">
                      <span className="reveal-text">{step.desc}</span>
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Text LEFT */}
                <div className="left-content w-1/2 min-w-0 pr-4 md:pr-20 flex flex-col items-start md:items-end text-left md:text-right relative z-20 step-reveal opacity-0 self-stretch">
                  <div
                    className="reveal-wrapper reveal-wrapper-circle reveal-wrapper-circle-left step-reveal mb-2 md:mb-6"
                    style={{ display: 'inline-flex' }}
                  >
                    <div className="reveal-text reveal-text-x-left reveal-circle-text">
                      <div
                        className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] bg-[#CDB17E] rounded-[40px] md:rounded-full flex items-center justify-center text-[18px] md:text-[22px] font-serif"
                        style={{
                          boxShadow:
                            '-25px 18px 12px rgba(0,0,0,0.03), -14px 10px 10px rgba(0,0,0,0.1), -6px 4px 8px rgba(0,0,0,0.16), -2px 1px 4px rgba(0,0,0,0.19)',
                        }}
                      >
                        {step.id}
                      </div>
                    </div>
                  </div>

                  <h3 className="w-full text-[16px] md:text-[27px] font-serif font-display mb-3 leading-[1.1] opacity-100 step-reveal text-pretty">
                    <span className="reveal-wrapper">
                      <span className="reveal-text">{step.title}</span>
                    </span>
                  </h3>

                  <p className="w-full text-[12px] md:text-[16px] leading-[1.5] max-w-[342px] font-light opacity-100 step-reveal text-pretty">
                    <span className="reveal-wrapper">
                      <span className="reveal-text">{step.desc}</span>
                    </span>
                  </p>
                </div>

                {/* Icon RIGHT */}
                <div className="right-content w-1/2 min-w-0 pl-4 md:pl-20 flex justify-start items-start mt-8 step-reveal opacity-0">
                  <span className="reveal-wrapper">
                    <span className="reveal-text reveal-text-x-right">
                      {renderIcon(step, index)}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const CTASection = () => {
  // ✅ Now using useHowItWorksLandingPage instead of useLandingPage
  const { data: howItWorks = { cta: {} } } = useHowItWorksLandingPage()
  const s = howItWorks.cta ?? {}

  return (
    <section data-nav-theme="dark" className="w-full flex justify-center bg-[#591902] font-sans">
      <div className="w-full max-w-[1440px] h-[360px] flex flex-col items-center py-[80px] px-6">
        <h2
          className="text-[#FFFFFF] text-[24px] md:text-[36px] font-normal leading-none text-center font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading || 'Confused, Excited or somewhere in between?'}
            </span>
          </span>
        </h2>

        <p className="text-[#FFFFFF] opacity-50 text-[12px] md:text-[16px] font-normal leading-[1.5] text-center max-w-[723px] mt-[32px] reveal-on-scroll">
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.body ||
                "Drop your details, and we'll get in touch. You're just one call away from turning the confusion into a clear, sorted plan."}
            </span>
          </span>
        </p>

        <span className="mt-[40px] reveal-wrapper reveal-wrapper--overflow-visible reveal-on-scroll">
          <span className="reveal-text">
            <Link
              to="/book-consultation"
              className="group flex flex-row justify-center items-center gap-[12.2px] bg-[#CDB17E] rounded-[42.6878px] w-[180.98px] min-h-[36px] h-[36px] pl-[18.2948px] pr-[3.04913px] py-0 md:rounded-[56px] md:w-[243px] md:h-[44px] md:min-h-0 md:pl-[24px] md:pr-[4px] md:py-[4px] hover:bg-[#bfa06b] transition-colors"
            >
              <span className="text-[#FAFAFA] text-[12px] md:text-[16px] font-medium leading-[150%] tracking-wide w-[120px] h-[18px] md:w-auto md:h-auto whitespace-nowrap">
                Book a Consultation
              </span>

              <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <svg
                  className="transition-transform duration-300 ease-out group-hover:rotate-45"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#CDB17E"
                  strokeWidth="1.14342"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </div>
            </Link>
          </span>
        </span>
      </div>
    </section>
  )
}

const BetterWaySection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.better_way ?? {}

  const desktopScallopCount = 10
  const mobileScallopCount = 6

  const desktopBulbCount = desktopScallopCount - 1 // 9
  const mobileBulbCount = mobileScallopCount - 1 // 5

  const renderScallopStrip = ({
    scallopCount,
    bulbCount,
    itemWidthClass,
    topHeightClass,
    innerHeightClass,
    bulbImageSizeClass,
    beamSizeClass,
    beamBlurEven,
    beamBlurOdd,
    beamYClass,
    topOffsetClass,
    containerClass = 'left-0 right-0 w-full',
  }) => {
    return (
      <div className={`absolute ${topOffsetClass} ${containerClass} flex pointer-events-none z-10`}>
        {Array.from({ length: scallopCount }).map((_, i) => (
          <div key={i} className={`relative flex-1 shrink-0 ${itemWidthClass} overflow-visible`}>
            <div
              className={`absolute top-0 left-0 right-0 ${topHeightClass} bg-[#CDB17E]`}
              style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
            />
            <div
              className={`absolute top-0 left-0 right-0 ${innerHeightClass} bg-[#591902]`}
              style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
            />

            {i < bulbCount && (
              <div
                className="absolute top-0 right-0 z-20 flex flex-col items-center animate-swing"
                style={{
                  animationDuration: `${3.5 + (i % 3) * 0.5}s`,
                  animationDelay: '0s',
                }}
              >
                <div
                  className={`w-[1px] ${
                    i % 2 === 0 ? 'h-[-10px] md:h-[-14px]' : 'h-[-4px] md:h-[-5px]'
                  } bg-[#591902]/40`}
                />
                <div className={`relative flex flex-col items-center -mt-3 md:-mt-4 ${beamYClass}`}>
                  <img
                    src={i % 2 === 0 ? bulb1 : bulb2}
                    alt="Light"
                    className={bulbImageSizeClass}
                  />
                  <div
                    className={`absolute left-1/2 top-full -translate-y-1 md:-translate-y-2 opacity-40 pointer-events-none animate-beam ${beamSizeClass} ${
                      i % 2 === 0 ? beamBlurEven : beamBlurOdd
                    }`}
                    style={{
                      animationDuration: `${4 + (i % 3) * 0.75}s`,
                      animationDelay: '0s',
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
    )
  }

  return (
    <section
      data-nav-theme="glass"
      className="relative -mt-px  md:mt-0 w-full flex justify-center bg-[#F2F2F2] md:bg-[#F7F7F5] overflow-hidden font-sans"
    >
      <div className="relative w-full max-w-[1600px] mx-auto min-h-0 pb-6 md:min-h-[820px] md:max-lg:min-h-[980px] lg:h-[1040px] xl:h-[1171px] shrink-0 overflow-x-hidden">
        {/* --- SCALLOP / BULB SECTION --- */}
        <div className="hidden lg:flex">
          {renderScallopStrip({
            scallopCount: desktopScallopCount,
            bulbCount: desktopBulbCount,
            itemWidthClass: '',
            topHeightClass: 'h-[90px]',
            innerHeightClass: 'h-[72px]',
            bulbImageSizeClass: 'w-[32px] h-auto relative z-10',
            beamSizeClass: 'w-[76px] h-[78px] md:w-[76px] md:h-[78px] blur-[6px] md:blur-[8px]',
            beamBlurEven: '',
            beamBlurOdd: 'md:w-[76px] md:h-[59px] blur-[4px] md:blur-[4px]',
            beamYClass: '',
            topOffsetClass: 'top-0',
            containerClass: 'top-0 left-1/2 -translate-x-1/2 w-screen',
          })}
        </div>

        <div className="flex lg:hidden">
          {renderScallopStrip({
            scallopCount: mobileScallopCount,
            bulbCount: mobileBulbCount,
            itemWidthClass: '',
            topHeightClass: 'h-[41px]',
            innerHeightClass: 'h-[34px]',
            bulbImageSizeClass: 'w-[20px] h-auto relative z-10',
            beamSizeClass: 'w-[40px] h-[48px] blur-[4px]',
            beamBlurEven: 'blur-[5px]',
            beamBlurOdd: 'blur-[4px]',
            beamYClass: '',
            topOffsetClass: '-top-px',
            containerClass: 'left-0 right-0 w-full',
          })}
        </div>

        {/* --- HEADINGS --- */}
        <div className="relative mx-auto w-full max-w-[353px] px-4 pt-30 pb-4 flex flex-col items-center gap-5 lg:absolute lg:w-[760px] xl:w-[809px] lg:max-w-[calc(100%-2rem)] lg:left-1/2 lg:-translate-x-1/2 lg:top-[180px] xl:top-[253px] lg:gap-[10px] lg:static lg:block lg:w-full lg:max-w-none lg:translate-x-0 lg:px-0 lg:pt-0 lg:pb-0">
          <h2
            className="w-full text-[#2D2D2D] text-[24px] lg:text-[54px] xl:text-[61px] leading-[1] text-center font-serif reveal-heading lg:absolute lg:w-[620px] xl:w-[679px] lg:left-1/2 lg:-translate-x-1/2 lg:top-[180px] xl:top-[253px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            {s.heading_1 || s.heading_2 ? (
              <>
                <span className="reveal-wrapper">
                  <span className="reveal-text">{s.heading_1 ?? 'A Better Way Between'}</span>
                </span>
                <br className="hidden lg:block" />
                <span className="reveal-wrapper">
                  <span className="reveal-text">{s.heading_2 ?? 'Event and DIY'}</span>
                </span>
              </>
            ) : s.heading ? (
              <span className="reveal-wrapper">
                <span className="reveal-text">{s.heading}</span>
              </span>
            ) : (
              <>
                <span className="reveal-wrapper">
                  <span className="reveal-text">A Better Way Between </span>
                </span>
                <br className="hidden lg:block" />
                <span className="reveal-wrapper">
                  <span className="reveal-text">Event and DIY</span>
                </span>
              </>
            )}
          </h2>

          <p className="w-full text-[#2D2D2D] opacity-50 text-[14px] lg:text-[15px] xl:text-[16px] leading-[150%] lg:leading-[1.5] text-center reveal-on-scroll lg:absolute lg:w-[760px] xl:w-[809px] lg:left-1/2 lg:-translate-x-1/2 lg:top-[290px] xl:top-[403px] font-['Poppins'] lg:font-sans">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.body ??
                  'Event planners can feel expensive and overwhelming. Doing everything yourself can quickly become stressful. Elewen brings the best of both, thoughtful styling without the chaos.'}
              </span>
            </span>
          </p>
        </div>

        {/* --- VENN DIAGRAM (MOBILE & DESKTOP) --- */}
        {/* Desktop Version */}
        <motion.div
          className="hidden lg:block absolute lg:w-[620px] xl:w-[723px] max-w-[calc(100%-2rem)] lg:h-[362px] xl:h-[422px] left-1/2 -translate-x-1/2 lg:top-[395px] xl:top-[531px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.45 }}
        >
          <svg
            width="723"
            height="422"
            viewBox="0 0 723 422"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-hidden"
          >
            <defs>
              <clipPath id="intersectClipDesktop">
                <circle cx="211" cy="211" r="211" />
              </clipPath>
            </defs>
            <motion.circle
              cx="211"
              cy="211"
              r="211"
              fill="#CDB17E"
              variants={{
                hidden: { x: -120, opacity: 0 },
                visible: {
                  x: 0,
                  opacity: 1,
                  transition: { duration: 1.45, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            />
            <motion.g
              variants={{
                hidden: { x: 120, opacity: 0 },
                visible: {
                  x: 0,
                  opacity: 1,
                  transition: { duration: 1.45, ease: [0.22, 1, 0.36, 1], delay: 0 },
                },
              }}
            >
              <circle cx="512" cy="211" r="211" fill="#591902" />
              <circle
                cx="512"
                cy="211"
                r="211"
                fill="#FFFFFF"
                clipPath="url(#intersectClipDesktop)"
              />
            </motion.g>
          </svg>
        </motion.div>

        {/* Mobile Version */}
        <div className="relative z-20 mx-auto mt-8 flex w-full max-w-[420px] flex-col items-center px-4 pb-10 lg:hidden">
          <motion.div
            className="relative mx-auto w-full max-w-[min(100%,320px)] aspect-[353/207] overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.45 }}
          >
            <svg
              viewBox="0 0 353 207"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full overflow-hidden"
            >
              <defs>
                <clipPath id="intersectClipMobile">
                  <circle cx="103.02" cy="103.02" r="103.02" />
                </clipPath>
              </defs>
              <motion.circle
                cx="103.02"
                cy="103.02"
                r="103.02"
                fill="#CDB17E"
                variants={{
                  hidden: { x: -56, opacity: 0 },
                  visible: {
                    x: 0,
                    opacity: 1,
                    transition: { duration: 1.3, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              />
              <motion.g
                variants={{
                  hidden: { x: 56, opacity: 0 },
                  visible: {
                    x: 0,
                    opacity: 1,
                    transition: { duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0 },
                  },
                }}
              >
                <circle cx="249.98" cy="103.02" r="103.02" fill="#591902" />
                <circle
                  cx="249.98"
                  cy="103.02"
                  r="103.02"
                  fill="#FFFFFF"
                  clipPath="url(#intersectClipMobile)"
                />
              </motion.g>
            </svg>

            <h5
              className="absolute left-[26%] top-1/2 w-[30%] max-w-[92px] -translate-x-1/2 -translate-y-1/2 px-1 text-center text-[#591902] text-[clamp(13px,3.6vw,18px)] leading-[1.05] font-serif break-words hyphens-auto"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              {s.left_label ?? 'Event Planner'}
            </h5>

            <h5
              className="absolute left-[74%] top-1/2 w-[24%] max-w-[72px] -translate-x-1/2 -translate-y-1/2 px-1 text-center text-[#CDB17E] text-[clamp(13px,3.6vw,18px)] leading-[1.05] font-serif break-words hyphens-auto"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              {s.right_label ?? 'DIY'}
            </h5>

            <div className="absolute left-1/2 top-1/2 flex h-[clamp(48px,14vw,64px)] w-[clamp(44px,12vw,56px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <img
                src={centerLogo}
                alt="11 Logo"
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
          </motion.div>

          <div className="mt-5 grid w-full max-w-[353px] grid-cols-2 gap-4">
            <p className="text-[#957960] text-[12px] leading-[1.5] font-['Poppins'] text-left">
              Costly and slow, with too many layers.
            </p>

            <p className="text-[#591902] text-[12px] leading-[1.5] text-right font-['Poppins']">
              Too many vendors, too many choices, DIY planning turns joy into work.
            </p>
          </div>

          <p className="mt-5 w-full max-w-[260px] text-center text-[#2D2D2D] text-[12px] leading-[1.5] font-['Poppins']">
            The perfect balance of structure and simplicity. Curated decor, trusted vendors, guided
            planning, without the cost or pressure.
          </p>
        </div>

        {/* --- DIAGRAM TEXTS --- */}
        <h5
          className="hidden lg:block absolute lg:left-[calc(50%-157px)] xl:left-[calc(50%-183px)] lg:top-[576px] xl:top-[742px] lg:w-[160px] xl:w-[185px] -translate-x-1/2 -translate-y-1/2 text-center  text-[#591902] lg:text-[23px] xl:text-[27px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {s.left_label ?? 'Event Planner'}
        </h5>

        <h5
          className="hidden lg:block absolute lg:left-[calc(50%+157px)] xl:left-[calc(50%+183px)] lg:top-[576px] xl:top-[742px] lg:w-[68px] xl:w-[80px] -translate-x-1/2 -translate-y-1/2 text-center text-[#CDB17E] lg:text-[23px] xl:text-[27px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {s.right_label ?? 'DIY'}
        </h5>

        {/* --- LOGO --- */}
        <div className="hidden lg:flex absolute left-1/2 lg:top-[576px] xl:top-[742px] lg:w-[250px] lg:h-[250px] xl:w-[320px] xl:h-[320px] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <img
            src={centerLogo}
            alt="11 Logo"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>

        {/* --- SUB TEXTS --- */}
        <p className="hidden lg:block absolute lg:w-[170px] xl:w-[200px] lg:left-[22px] xl:left-[30px] lg:top-[520px] xl:top-[688px] text-[#957960] text-[11px] xl:text-[12px] leading-[1.5] font-['Poppins'] lg:font-sans">
          {s.left_body ??
            'Full-service planning often comes with high costs and long coordination cycles. You rely on large teams, multiple approvals, and a process that can feel heavier than the event itself.'}
        </p>

        <p className="hidden lg:block absolute lg:w-[170px] xl:w-[200px] lg:right-[22px] xl:right-[30px] lg:top-[520px] xl:top-[688px] text-[#591902] text-[11px] xl:text-[12px] leading-[1.5] text-right font-['Poppins'] lg:font-sans">
          {s.right_body ??
            'Planning everything yourself means juggling vendors, comparing prices, managing logistics, and making countless decisions. It quickly turns a celebration into a checklist.'}
        </p>

        <p className="hidden lg:block absolute lg:w-[265px] xl:w-[285px] left-1/2 -translate-x-1/2 lg:top-[770px] xl:top-[993px] text-[#2D2D2D] text-[11px] xl:text-[12px] leading-[1.5] text-center font-['Poppins'] lg:font-sans">
          {s.center_body ??
            'The balance between structure and simplicity. You get curated decor, trusted vendors, and guided planning, without the pressure or the price of full-scale event management.'}
        </p>
      </div>
    </section>
  )
}

const LAYOUT_W = 1034
const LAYOUT_H = 684

const ChecklistSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.checklist ?? {}
  const reliefItems = s.relief_items ?? [
    "You don't manage people",
    "You don't manage logistics",
    'No chasing vendors',
    'No waiting anxiously!',
  ]
  const doorTagline = s.tagline ?? 'It takes the chaos out so you can stay in the moment'
  const desktopScallopCount = 10
  const mobileScallopCount = 6
  const desktopBulbCount = desktopScallopCount - 1
  const mobileBulbCount = mobileScallopCount - 1
  const sectionRef = usePreloadOnApproach(
    [imgScrolling, imgCalls, imgVendors, imgDecisions],
    '250% 0px'
  )
  const [howItWorksVisible, setHowItWorksVisible] = useState(false)
  const [isLayoutVisible, setIsLayoutVisible] = useState(false)
  const gateAreaRef = useRef(null)
  const gateRef = useRef(null)
  const insideBgRef = useRef(null)
  const doorHeadingRef = useRef(null)
  const howItWorksRef = useRef(null)
  const layoutWrapRef = useRef(null)
  const [layoutScale, setLayoutScale] = useState(1)

  useEffect(() => {
    const wrap = layoutWrapRef.current
    if (!wrap) return
    const resize = () => {
      const isMobile = window.innerWidth < 768
      const available = isMobile ? window.innerWidth : wrap.clientWidth
      const gutter = isMobile ? 4 : 0
      const fitScale = (available - gutter) / LAYOUT_W
      const scale = Math.min(fitScale, 1)
      setLayoutScale(scale)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const wrap = layoutWrapRef.current
    if (!wrap) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLayoutVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(wrap)
    return () => {
      observer.disconnect()
    }
  }, [])

  // Setup reveal animations for door section heading
  useEffect(() => {
    const root = sectionRef.current
    if (!root) return

    const targets = Array.from(
      root.querySelectorAll('.reveal-heading, .reveal-on-scroll, .card-reveal')
    ).filter(el => !el.classList.contains('is-visible'))

    if (targets.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          Array.from(entry.target.querySelectorAll('.reveal-text')).forEach(span => {
            span.classList.add('is-visible')
          })
          io.unobserve(entry.target)
        })
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    )

    targets.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sectionRef])

  useEffect(() => {
    const gateArea = gateAreaRef.current
    const gate = gateRef.current
    const insideBg = insideBgRef.current
    const doorHeading = doorHeadingRef.current
    const howItWorks = howItWorksRef.current
    if (!gateArea || !gate || !insideBg || !howItWorks) return

    const doorTable = gate.querySelector('#door-table')
    const doorLights = gate.querySelector('#door-lights')
    const doorCurvedText = gate.querySelector('#door-curved-text')

    const isMobile = window.innerWidth < 768
    if (isMobile) return
    const frameHalfWidthRatio = 190 / 1440
    const requiredScaleToClearViewport = gate.offsetWidth
      ? (window.innerWidth / (2 * gate.offsetWidth * frameHalfWidthRatio)) * 1.28
      : 6.4

    const scaleEnd = Math.max(isMobile ? 5.4 : 5.9, requiredScaleToClearViewport)
    const gateLiftY = -320
    const scrollEnd = 1200
    const scrubVal = 0.8
    const doorOpenEnd = 1.2
    const insideBgRevealStart = doorOpenEnd - 0.08
    const gateFadeStart = doorOpenEnd + 0.02
    const howItWorksStart = doorOpenEnd - 0.02
    const doorZoomOrigin = '50% 50%'
    let howItWorksActivated = false
    const activateHowItWorks = () => {
      if (howItWorksActivated) return
      howItWorksActivated = true
      setHowItWorksVisible(true)
      requestAnimationFrame(() => ScrollTrigger.refresh())
    }

    gsap.set(gate, {
      transformOrigin: doorZoomOrigin,
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
    })
    gsap.set(gateArea, { backgroundColor: 'transparent' })
    gsap.set(insideBg, { opacity: 0 })
    if (doorHeading) gsap.set(doorHeading, { opacity: 0, y: 16 })
    gsap.set(howItWorks, { yPercent: 104, opacity: 1 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: gate,
        start: 'bottom bottom',
        end: `+=${scrollEnd}`,
        scrub: scrubVal,
        pin: gateArea,
        pinSpacing: true,
        invalidateOnRefresh: true,
      },
    })

    tl.to(gate, { scale: scaleEnd, y: gateLiftY, ease: 'power2.in', duration: doorOpenEnd }, 0)
    if (doorTable) tl.to(doorTable, { x: 180, ease: 'power2.in', duration: doorOpenEnd }, 0)
    if (doorLights)
      tl.to(doorLights, { x: -120, y: -40, ease: 'power2.in', duration: doorOpenEnd }, 0)
    const archPath = gate.querySelector('#door-arch-path')
    if (doorCurvedText && archPath)
      tl.to(
        doorCurvedText,
        {
          motionPath: {
            path: archPath,
            align: archPath,
            alignOrigin: [0.5, 0.5],
            autoRotate: false,
            start: 0,
            end: 0.5,
          },
          ease: 'power2.in',
          duration: doorOpenEnd,
        },
        0
      )

    tl.to(insideBg, { opacity: 1, duration: 0.18, ease: 'power2.out' }, insideBgRevealStart)
    if (doorHeading)
      tl.to(
        doorHeading,
        { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' },
        insideBgRevealStart + 0.05
      )
    tl.to(gate, { opacity: 0, duration: 0.12, ease: 'power2.out' }, gateFadeStart)

    tl.to(
      howItWorks,
      {
        yPercent: 0,
        duration: 0.55,
        ease: 'power2.out',
        onStart: () => {
          activateHowItWorks()
        },
        onComplete: () => {
          requestAnimationFrame(() => ScrollTrigger.refresh())
        },
      },
      howItWorksStart
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  const renderChecklistScallopStrip = ({
    scallopCount,
    bulbCount,
    itemHeightClass,
    topHeightClass,
    innerHeightClass,
    bulbImageSizeClass,
    beamSizeClass,
    beamBlurEven,
    beamBlurOdd,
    topOffsetClass,
  }) => (
    <div className={`absolute ${topOffsetClass} left-0 right-0 w-full flex`}>
      {Array.from({ length: scallopCount }).map((_, i) => (
        <div key={i} className={`relative flex-1 shrink-0 overflow-visible ${itemHeightClass}`}>
          <div
            className={`absolute top-0 left-0 right-0 ${topHeightClass} bg-[#CDB17E]`}
            style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
          />
          <div
            className={`absolute top-0 left-0 right-0 ${innerHeightClass} bg-[#F2F2F2]`}
            style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
          />
          {i < bulbCount && (
            <div
              className="absolute top-0 right-0 flex flex-col items-center z-20 animate-swing"
              style={{
                animationDuration: `${3.5 + (i % 3) * 0.5}s`,
                animationDelay: `${(i % 5) * 0.08}s`,
              }}
            >
              <div
                className={`w-[1px] ${
                  i % 2 === 0 ? 'h-[-10px] md:h-[-15px]' : 'h-[-4px] md:h-[-5px]'
                } bg-[#591902]/40`}
              />
              <div className="relative flex flex-col items-center -mt-3 md:-mt-4">
                <img
                  src={i % 2 !== 0 ? bulb1 : bulb2}
                  alt="Light"
                  className={bulbImageSizeClass}
                  loading="lazy"
                />
                <div
                  className={`absolute left-1/2 top-full -translate-y-1 md:-translate-y-2 opacity-40 pointer-events-none animate-beam ${beamSizeClass} ${
                    i % 2 === 0 ? beamBlurEven : beamBlurOdd
                  }`}
                  style={{
                    animationDuration: `${4 + (i % 3) * 0.75}s`,
                    animationDelay: '0s',
                    background:
                      i % 2 === 0
                        ? 'linear-gradient(180deg, #FCD768 0%, #F8F4ED 100%)'
                        : 'linear-gradient(180deg, #FCE6A4 -1.95%, #F8F4ED 100%)',
                    clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <section
      ref={sectionRef}
      data-nav-theme="glass"
      className="checklist-section relative -mt-px md:mt-0 w-full min-h-screen bg-white overflow-x-clip flex flex-col items-center pb-0"
    >
      {/* Lightbulbs */}
      <div className="absolute -top-px md:top-0 left-0 w-full h-[300px] overflow-hidden pointer-events-none z-10">
        <div className="hidden md:flex">
          {renderChecklistScallopStrip({
            scallopCount: desktopScallopCount,
            bulbCount: desktopBulbCount,
            itemHeightClass: 'h-[90px]',
            topHeightClass: 'h-[72px]',
            innerHeightClass: 'h-[60px]',
            bulbImageSizeClass: 'w-[32px] h-auto relative z-10',
            beamSizeClass: 'w-[76px] h-[78px] blur-[6px] md:blur-[8px]',
            beamBlurEven: '',
            beamBlurOdd: 'w-[76px] h-[59px] blur-[4px] md:blur-[4px]',
            topOffsetClass: 'top-0',
          })}
        </div>

        <div className="flex md:hidden">
          {renderChecklistScallopStrip({
            scallopCount: mobileScallopCount,
            bulbCount: mobileBulbCount,
            itemHeightClass: 'h-[40.94px]',
            topHeightClass: 'h-[40.94px]',
            innerHeightClass: 'h-[33px]',
            bulbImageSizeClass: 'w-[20px] h-auto relative z-10',
            beamSizeClass: 'w-[44px] h-[44px] blur-[4px]',
            beamBlurEven: 'blur-[5px]',
            beamBlurOdd: 'blur-[4px]',
            topOffsetClass: 'top-0',
          })}
        </div>
      </div>

      <h2
        className="text-[22px] sm:text-[24px] md:text-[61px] leading-[1.15] md:leading-[1.20] text-center text-[#591902] font-normal tracking-normal mt-[110px] md:mt-[260px] px-4 md:px-4 max-w-[340px] sm:max-w-[420px] md:max-w-none mx-auto relative z-10 reveal-heading"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        <span className="reveal-wrapper">
          <span className="reveal-text">{s.heading_1 ?? 'Somewhere along the way,'} </span>
        </span>
        <br />
        <span className="reveal-wrapper">
          <span className="reveal-text">{s.heading_2 ?? 'Hosting turned into Checklists.'}</span>
        </span>
      </h2>

      {/* Desktop layout - unchanged */}
      <div
        ref={layoutWrapRef}
        className="checklist-chaos-layout block w-screen max-w-[100vw] relative left-1/2 -translate-x-1/2 px-0 md:static md:w-full md:max-w-none md:left-auto md:translate-x-0 mt-6 md:mt-24 mb-8 md:mb-32 z-10 font-sans"
      >
        <div
          className="relative w-full flex justify-center overflow-hidden md:overflow-visible"
          style={{
            height: `${LAYOUT_H * layoutScale}px`,
          }}
        >
          {/* SCALE + CENTER FIX */}
          <div
            className="absolute top-0 left-1/2"
            style={{
              width: `${LAYOUT_W}px`,
              height: `${LAYOUT_H}px`,
              transform: `translateX(-50%) scale(${layoutScale})`,
              transformOrigin: 'top center',
            }}
          >
            <div className="relative w-full h-full max-w-full mx-auto px-0 overflow-hidden">
              {' '}
              {/* STEP 1: Too much scrolling (Starts immediately) */}
              <div className="absolute left-[28%] top-[3%] w-[20%] max-w-[211px] aspect-square">
                {' '}
                <div
                  className={`anim-element slide-from-left ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute inset-0 bg-[#BFAC9B] rounded-tl-full z-0 shadow-sm`}
                  style={{ '--delay': '0s' }}
                ></div>
                <img
                  src={imgScrolling}
                  className={`anim-element slide-from-bottom ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute bottom-0 right-[-40px] h-[250px] w-auto max-w-none object-contain object-bottom z-10 pointer-events-none`}
                  alt="Scrolling"
                  style={{
                    '--delay': '0s',
                    filter: `
      drop-shadow(-8px -10px 18px rgba(0,0,0,0.10))
      drop-shadow(-2px -4px 8px rgba(0,0,0,0.06))
    `,
                  }}
                  loading="lazy"
                />
              </div>
              <div
                className={`anim-element slide-from-left ${
                  isLayoutVisible ? 'is-visible' : ''
                } absolute left-[196px] top-[170px] w-[113px] text-right z-20`}
                style={{ '--delay': '0s' }}
              >
                <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">
                  Too much scrolling.
                </h3>
              </div>
              <div
                className={`anim-element slide-from-left hidden md:block ${
                  isLayoutVisible ? 'is-visible' : ''
                } absolute left-[0px] top-[232px] w-[273px] text-right z-20`}
                style={{ '--delay': '0s' }}
              >
                <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                  What was once simple now means endless scrolling - and still no confidence.
                </p>
              </div>
              {/* STEP 2: Too many calls (Starts at 1.4s) */}
              <div className="absolute left-[510px] top-[1px] w-[524px] h-[229px] z-10">
                <div
                  className={`anim-element slide-from-right ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute left-[0px] top-[18px] w-[211px] h-[211px] bg-[#BFAC9B] rounded-tr-full z-0`}
                  style={{ '--delay': '0s' }}
                ></div>
                <img
                  src={imgCalls}
                  alt="Calls"
                  className={`anim-element slide-from-bottom ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute left-[13px] top-[0px] w-[231px] h-[229px] object-cover object-top z-10 pointer-events-none`}
                  style={{
                    '--delay': '0s',
                    filter: `
    drop-shadow(0px -10px 18px rgba(109, 57, 8, 0.18))
    drop-shadow(-6px 0px 12px rgba(109, 57, 8, 0.12))
  `,
                  }}
                  loading="lazy"
                />
                <div
                  className={`anim-element slide-from-right ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute left-[157px] top-[83px] w-[113px] text-left z-20`}
                  style={{ '--delay': '0s' }}
                >
                  <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2] font-sans">
                    Too many calls.
                  </h3>
                </div>
                <div
                  className={`anim-element slide-from-right hidden md:block ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute left-[251px] top-[145px] w-[273px] text-left z-20`}
                  style={{ '--delay': '0s' }}
                >
                  <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5] font-sans">
                    Follow-ups, confirmations, negotiations, and last-minute checks - your phone
                    turns into a coordination hub, and excitement becomes stress.
                  </p>
                </div>
              </div>
              {/* STEP 3: Too many vendors (Starts at 2.8s) */}
              <div className="absolute left-[510px] top-[246px] w-[211px] h-[211px]">
                <div
                  className={`anim-element slide-from-left ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute inset-0 bg-[#BFAC9B] z-0 shadow-sm`}
                  style={{ '--delay': '0s' }}
                ></div>
                <img
                  src={imgVendors}
                  className={`anim-element slide-from-bottom ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute bottom-0 left-1/2 -translate-x-1/2 h-[280px] w-auto max-w-[400px] object-contain object-bottom z-10 pointer-events-none`}
                  alt="Vendors"
                  style={{
                    '--delay': '0s',
                    filter: `
      drop-shadow(0px -10px 18px rgba(0,0,0,0.12))
      drop-shadow(-4px -6px 10px rgba(0,0,0,0.08))
    `,
                  }}
                  loading="lazy"
                />
              </div>
              <div
                className={`anim-element slide-from-left ${
                  isLayoutVisible ? 'is-visible' : ''
                } absolute left-[400px] top-[337px] w-[113px] text-right z-20`}
                style={{ '--delay': '0s' }}
              >
                <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">
                  Too many vendors.
                </h3>
              </div>
              <div
                className={`anim-element slide-from-left hidden md:block ${
                  isLayoutVisible ? 'is-visible' : ''
                } absolute left-[225px] top-[399px] w-[273px] text-right z-20`}
                style={{ '--delay': '0s' }}
              >
                <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                  One decorator, one caterer, one supplier, different prices, different chaos.
                  You&apos;re not planning a celebration; you&apos;re managing a team.
                </p>
              </div>
              {/* STEP 4: Too many decisions (Starts at 4.2s) */}
              <div className="absolute left-[461px] top-[466px] w-[260px] h-[211px] overflow-hidden rounded-br-full">
                <div
                  className={`anim-element slide-from-right ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute right-0 top-0 w-[211px] h-full bg-[#BFAC9B] z-0 shadow-sm`}
                  style={{ '--delay': '0s' }}
                ></div>
                <img
                  src={imgDecisions}
                  alt="Decisions"
                  className={`anim-element slide-from-bottom ${
                    isLayoutVisible ? 'is-visible' : ''
                  } absolute bottom-[-50px] left-[-50px] h-[300px] w-auto max-w-none object-cover object-bottom z-10 pointer-events-none`}
                  style={{
                    '--delay': '0s',
                    filter: `
      drop-shadow(0px -12px 20px rgba(0,0,0,0.14))
      
    `,
                  }}
                  loading="lazy"
                />
              </div>
            </div>
            <div
              className={`anim-element slide-from-right ${
                isLayoutVisible ? 'is-visible' : ''
              } absolute left-[662px] top-[551px] w-[122px] text-left z-20`}
              style={{ '--delay': '1.75s' }}
            >
              <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">
                Too many decisions.
              </h3>
            </div>

            <div
              className={`anim-element slide-from-right hidden md:block ${
                isLayoutVisible ? 'is-visible' : ''
              } absolute left-[721px] top-[613px] w-[273px] text-left z-20`}
              style={{ '--delay': '1.8s' }}
            >
              <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                Color themes, backdrops, menus, endless add-ons - more options don&apos;t mean more
                freedom, just more pressure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Relief text */}
      <div className="relative z-20 flex flex-col items-center gap-6 md:gap-8 mb-0 md:mb-32 text-center mt-8 md:mt-[40px] px-6">
        <h3
          className="text-[20px] md:text-[36px] text-[#591902] leading-[1] font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.relief_heading ?? 'Stop take a deep breath'}</span>
          </span>
        </h3>
        <div className="flex flex-col items-center">
          {reliefItems.map((item, i) => (
            <p
              key={i}
              className="text-[14px] md:text-[21px] text-[#591902] opacity-50 font-sans reveal-on-scroll"
            >
              <span className="reveal-wrapper">
                <span className="reveal-text">{item}</span>
              </span>
            </p>
          ))}
        </div>
        <h4
          className="text-[20px] md:text-[27px] text-[#591902] leading-[1.2] font-serif mt-8 md:mt-12 mb-10 md:mb-0 px-2 reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{doorTagline}</span>
          </span>
        </h4>
      </div>

      {/* Door section unchanged */}
      <div className="door-section relative z-10 w-full overflow-hidden">
        <div ref={gateAreaRef} className="door-section__pin relative z-20 w-full">
          <div
            ref={insideBgRef}
            className="door-section__inside-bg pointer-events-none absolute bg-[#F6D69D] opacity-0"
          />

          <div
            ref={doorHeadingRef}
            className="absolute inset-0 z-[6] flex items-center justify-center pointer-events-none opacity-0"
          >
            <h2
              className="text-[24px] md:text-[61px] text-[#591902] text-center tracking-wide font-display"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              HOW 11 WORKS
            </h2>
          </div>

          <div className="door-section__stage">
            <div ref={gateRef} className="door-section__gate" style={{ willChange: 'transform' }}>
              <div className="door-section__gate-inner mt-4 w-full origin-center flex items-center justify-center leading-none h-full">
                <CelebrationDoor className="block h-full w-full" />
              </div>
            </div>
          </div>
        </div>

        <div ref={howItWorksRef} className="door-section__overlay relative z-20 bg-[#591902]">
          <HowItWorksSection isVisible={howItWorksVisible} />
        </div>
      </div>

      <CTASection />
      <BetterWaySection />
    </section>
  )
}

// Order matches PACKAGES_FALLBACK in src/data/packages.js
const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg2, pkgImg3],
  [pkgImg4, pkgImg5, pkgImg6],
  [pkgImg7, pkgImg8, pkgImg9],
  [pkgImg2, pkgImg4, pkgImg7],
  [pkgImg5, pkgImg1, pkgImg8],
]

function resolvePackageImages(pkg, index) {
  const remote = (Array.isArray(pkg.images) ? pkg.images : []).filter(
    url => typeof url === 'string' && url.trim()
  )
  const fallback = PKG_LOCAL_IMAGES[index % PKG_LOCAL_IMAGES.length] ?? PKG_LOCAL_IMAGES[0] ?? []

  return {
    images: remote.length > 0 ? remote : fallback,
    fallbackImages: fallback,
  }
}

const PackagesSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.packages_intro ?? {}

  const [virtualIndex, setVirtualIndex] = useState(null)
  const [disableTransition, setDisableTransition] = useState(false)
  const lastDirectionRef = useRef('next')
  const isAnimatingRef = useRef(false)
  const virtualIndexRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const packagePreloadRef = useRef(null)

  // Touch handlers for mobile swiping of the main packages
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  // Track window size to seamlessly adjust 3D geometry sizes
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // CMS: Strapi `packages` with elements, addons, images — fallback when Strapi is off/empty
  const { data: cmsPackages = [] } = usePackages()
  const packagesData = useMemo(() => {
    const sourcePackages = cmsPackages.length > 0 ? cmsPackages : PACKAGES_FALLBACK

    return sourcePackages.map((pkg, i) => {
      const { images, fallbackImages } = resolvePackageImages(pkg, i)
      const includes = (pkg.includes ?? pkg.tags ?? []).filter(Boolean)
      const price =
        typeof pkg.price === 'string' && pkg.price.trim()
          ? pkg.price.trim()
          : pkg.base_price
            ? `₹${Number(pkg.base_price).toLocaleString('en-IN')}`
            : ''

      return {
        ...pkg,
        desc:
          typeof pkg.description === 'string'
            ? pkg.description
            : typeof pkg.desc === 'string'
              ? pkg.desc
              : '',
        price,
        includes,
        tags: includes,
        images,
        fallbackImages,
      }
    })
  }, [cmsPackages])

  const count = packagesData.length
  const totalCards = count * 3
  /** 3D ring needs ≥2 packages; with 1 CMS item the triple-buffer showed 3 identical cards */
  const usePackageCylinder = count > 1
  /** Show nav buttons/dots whenever there is at least 1 package */
  const showNavButtons = count > 0

  useEffect(() => {
    const urls = packagesData
      .flatMap(pkg => [
        ...(Array.isArray(pkg.images) ? pkg.images.slice(0, 2) : []),
        ...(Array.isArray(pkg.fallbackImages) ? pkg.fallbackImages.slice(0, 1) : []),
      ])
      .filter(Boolean)
    if (urls.length) preloadImages(urls)
  }, [packagesData])

  useEffect(() => {
    const el = packagePreloadRef.current
    if (!el || packagesData.length === 0) return

    const urls = packagesData.map(pkg => pkg.images?.[0]).filter(Boolean)

    let fired = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || fired) return
        fired = true
        preloadImages(urls)
        observer.disconnect()
      },
      { rootMargin: '180% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [packagesData])

  const finishCarouselAnimation = useCallback(() => {
    requestAnimationFrame(() => {
      isAnimatingRef.current = false
    })
  }, [])

  const snapCarouselIndex = useCallback(
    nextIndex => {
      setDisableTransition(true)
      setVirtualIndex(nextIndex)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDisableTransition(false)
          finishCarouselAnimation()
        })
      })
    },
    [finishCarouselAnimation]
  )

  const handleTransitionEnd = useCallback(
    event => {
      if (event.propertyName !== 'transform') return
      if (count === 0 || !usePackageCylinder) {
        finishCarouselAnimation()
        return
      }

      const current = virtualIndexRef.current ?? count

      if (current >= count * 2) {
        snapCarouselIndex(current - count)
        return
      }

      if (current < count) {
        snapCarouselIndex(current + count)
        return
      }

      finishCarouselAnimation()
    },
    [count, usePackageCylinder, finishCarouselAnimation, snapCarouselIndex]
  )

  const handleNext = useCallback(() => {
    if (count === 0 || !usePackageCylinder || isAnimatingRef.current) return
    isAnimatingRef.current = true
    lastDirectionRef.current = 'next'
    setVirtualIndex(prev => (prev ?? count) + 1)
  }, [count, usePackageCylinder])

  const handlePrev = useCallback(() => {
    if (count === 0 || !usePackageCylinder || isAnimatingRef.current) return
    isAnimatingRef.current = true
    lastDirectionRef.current = 'prev'
    setVirtualIndex(prev => (prev ?? count) - 1)
  }, [count, usePackageCylinder])

  const handleActivate = useCallback(index => {
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true
    setVirtualIndex(index)
  }, [])

  const handleTouchStart = e => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = e => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const diffX = touchStartX.current - touchEndX
    const diffY = Math.abs(touchStartY.current - touchEndY)

    // Swipe threshold of 30px, and must be a distinctly horizontal swipe (diffX > diffY)
    if (Math.abs(diffX) > 30 && Math.abs(diffX) > diffY) {
      if (diffX > 0) handleNext()
      else handlePrev()
    }
  }

  const effectiveVirtualIndex = count <= 1 ? 0 : (virtualIndex ?? count)
  const displayIndex = count > 0 ? effectiveVirtualIndex % count : 0
  const visiblePackageDots = getVisiblePaginationDots(count, displayIndex, 5)

  useLayoutEffect(() => {
    virtualIndexRef.current = effectiveVirtualIndex
  }, [effectiveVirtualIndex])

  const extendedCards = useMemo(() => {
    if (count === 0) return []
    if (count === 1) return [{ pkg: packagesData[0], index: 0 }]

    return [...packagesData, ...packagesData, ...packagesData].map((pkg, index) => ({
      pkg,
      index,
    }))
  }, [packagesData, count])

  const renderCards = useMemo(() => {
    if (!usePackageCylinder) return extendedCards

    return extendedCards.filter(({ index }) => {
      const direct = Math.abs(index - effectiveVirtualIndex)
      const wrapped = totalCards - direct
      return Math.min(direct, wrapped) <= PACKAGE_CYLINDER_ARC
    })
  }, [extendedCards, effectiveVirtualIndex, totalCards, usePackageCylinder])

  return (
    <section
      ref={packagePreloadRef}
      className="relative w-full min-h-auto md:min-h-screen bg-[#F2F2F2] md:bg-[#F4F4F2] pt-10 md:pt-8 pb-10 md:pb-28 md:-mt-4 overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Global Styles for testimonials Swiper below */}
      <style>{`
        .inner-card-swiper .swiper-pagination-bullet {
          background-color: #FFFFFF;
          opacity: 1;
          width: 5px;
          height: 5px;
          border-radius: 5px;
          transition: all 0.3s ease;
        }
        @media (min-width: 768px) {
          .inner-card-swiper .swiper-pagination-bullet {
            opacity: 0.8;
            width: 8px;
            height: 8px;
            border-radius: 8px;
          }
        }
        .inner-card-swiper .swiper-pagination-bullet-active {
          background-color: #2D2D2D;
          width: 17px;
        }
        @media (min-width: 768px) {
          .inner-card-swiper .swiper-pagination-bullet-active {
            background-color: #CDB17E;
            width: 24px;
          }
        }
        /* Swiper container: do not capture clicks - lets arrows receive them */
        .inner-card-swiper { pointer-events: none !important; }
        /* Only the slide area and pagination capture events when card is active */
        .card-swiper-active .inner-card-swiper .swiper-wrapper,
        .card-swiper-active .inner-card-swiper .swiper-pagination { pointer-events: auto; }
      `}</style>

      {/* --- 1. Top Headings --- */}
      <div className="flex flex-col items-center text-center px-5 md:px-6 z-20 relative pt-0 md:pt-16">
        <h2
          className="text-[#2D2D2D] text-[24px] md:text-[61px] leading-[1.20] max-w-[353px] md:max-w-[1050px] mb-[16px] md:mb-6 font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">Somewhere Between Moodboards </span>
          </span>
          <br className="hidden md:block" />
          <span className="reveal-wrapper">
            <span className="reveal-text">and Reality, the Feeling Got Lost.</span>
          </span>
        </h2>
        <p className="text-[#2D2D2D] opacity-50 text-[14px] md:text-[16px] leading-[150%] max-w-[353px] md:max-w-[809px] mb-[24px] md:mb-20 reveal-on-scroll">
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.body ??
                'They became louder and Bigger, but less personal. Elewen exists to bring that feeling back. Not through more, but through meaning.'}
            </span>
          </span>
        </p>

        <h3
          className="text-[#000000] md:text-[#2D2D2D] text-[20px] md:text-[32px] leading-[1.20] font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.section_heading ?? 'OUR MOST LOVED PACKAGES'}</span>
          </span>
        </h3>
      </div>

      {/* --- 2. Carousel - 3D cylinder --- */}
      <div className="relative w-full overflow-x-hidden mt-[24px] md:mt-8">
        {/* Top curved edge (Hidden on mobile to save space, z-0 to stay behind cards) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[1440px] max-w-[100vw] h-[100px] z-0 pointer-events-none hidden md:block"
          style={{
            background: '#F4F4F2',
            borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          }}
        />

        {isMobile ? (
          <div className="relative min-h-[480px] w-full z-10">
            <div className="mobile-carousel-scroll flex w-full gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {packagesData.map((pkg, index) => (
                <div
                  key={`pkg-mobile-${pkg.id ?? pkg.documentId ?? 'fallback'}-${index}`}
                  className="snap-center shrink-0 pointer-events-auto"
                >
                  <LandingPackageCarouselCard
                    pkg={pkg}
                    index={index}
                    isActive
                    isMobile
                    usePackageCylinder={false}
                    onActivate={handleActivate}
                    style={{
                      position: 'relative',
                      transform: 'none',
                      opacity: 1,
                      pointerEvents: 'auto',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="relative min-h-[790px] w-full grid place-content-center overflow-hidden px-0 z-10"
            style={{
              perspective: '80em',
              maskImage:
                'linear-gradient(90deg, transparent 0%, black 28%, black 72%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(90deg, transparent 0%, black 28%, black 72%, transparent 100%)',
            }}
          >
            <div
              className="grid place-self-center w-full max-w-[100vw] pointer-events-none"
              style={{
                transformStyle: 'preserve-3d',
                transform: `translate3d(0, 0, 0) rotateY(${usePackageCylinder ? -effectiveVirtualIndex * 36 : 0}deg)`,
                transition: disableTransition ? 'none' : PACKAGE_CAROUSEL_TRANSITION,
                willChange: 'transform',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {renderCards.map(({ pkg, index }) => {
                const baseAngle = 36
                const halfAngleDeg = baseAngle / 2
                const halfAngleRad = (halfAngleDeg * Math.PI) / 180
                const cardWidth = 640
                const gap = 8
                const radius = (cardWidth / 2 + gap / 2) / Math.tan(halfAngleRad)
                const isActive = index === effectiveVirtualIndex

                return (
                  <LandingPackageCarouselCard
                    key={`pkg-${pkg.id ?? pkg.documentId ?? 'fallback'}-${index}`}
                    pkg={pkg}
                    index={index}
                    isActive={isActive}
                    isMobile={false}
                    usePackageCylinder={usePackageCylinder}
                    onActivate={handleActivate}
                    style={{
                      transform: `rotateY(${index * 36}deg) translateZ(${-radius}px)`,
                      boxShadow: isActive
                        ? '0 12px 32px rgba(0,0,0,0.15)'
                        : '0 6px 20px rgba(0,0,0,0.1)',
                      opacity: isActive ? 1 : 0.92,
                      pointerEvents: isActive ? 'auto' : 'auto',
                      zIndex: getPackageCardZIndex(index, effectiveVirtualIndex, totalCards),
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transition: disableTransition
                        ? 'none'
                        : 'opacity 0.28s ease-out, box-shadow 0.28s ease-out',
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom curved edge */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[1440px] max-w-[100vw] h-[100px] z-10 pointer-events-none hidden md:block"
          style={{
            background: '#F4F4F2',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          }}
        />
      </div>

      {/* --- 3. Bottom Carousel Controls --- */}

      {/* Desktop Controls */}
      <div
        className={`${showNavButtons ? 'hidden md:flex' : 'hidden'} w-[611px] max-w-[90vw] h-[48px] mx-auto justify-between items-center gap-[25px] z-20 relative -mt-20`}
      >
        <button
          type="button"
          onClick={handlePrev}
          className="w-12 h-12 rounded-[96px] flex items-center justify-center transition-all shrink-0 bg-[#2D2D2D] hover:bg-black cursor-pointer"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.167 13.9997H5.83366M5.83366 13.9997L14.0003 22.1663M5.83366 13.9997L14.0003 5.83301"
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-[4px] w-[100px] h-[8px] justify-center">
          {visiblePackageDots.map(idx => (
            <div
              key={idx}
              className={`h-[8px] rounded-[8px] transition-all duration-500 ${displayIndex === idx ? 'w-[52px] bg-[#591902]' : 'w-[8px] bg-[#ADADAD]'}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="w-12 h-12 rounded-[96px] flex items-center justify-center transition-all shrink-0 bg-[#2D2D2D] hover:bg-black cursor-pointer"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.83301 13.9997H22.1663M22.1663 13.9997L13.9997 22.1663M22.1663 13.9997L13.9997 5.83301"
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Main Pagination Dots — hidden; mobile uses horizontal scroll */}
      <div className="hidden items-center justify-center gap-[6px] mt-[16px] z-20 relative">
        {visiblePackageDots.map(idx => (
          <div
            key={idx}
            className={`h-[4px] rounded-[12px] transition-all duration-500 ${displayIndex === idx ? 'w-[20px] bg-[#1C1C1C]' : 'w-[8px] bg-[#BFBFBF]'}`}
          />
        ))}
      </div>
    </section>
  )
}

const CelebrationFeelingSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.planner_cta ?? {}

  const containerRef = useRef(null)
  const revealRef = useRef(null)

  useEffect(() => {
    preloadImages([img1, img2, img3, img4, img5])
  }, [])

  useEffect(() => {
    const section = containerRef.current
    if (!section || typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let listening = false

    const updateProgress = () => {
      const rect = section.getBoundingClientRect()
      const total = section.offsetHeight + window.innerHeight
      const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / total))
      section.style.setProperty('--celebration-p', progress.toFixed(4))
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(updateProgress)
    }

    const proximityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!listening) {
            listening = true
            updateProgress()
            window.addEventListener('scroll', onScroll, { passive: true })
            window.addEventListener('resize', updateProgress, { passive: true })
          }
        } else if (listening) {
          listening = false
          window.removeEventListener('scroll', onScroll)
          window.removeEventListener('resize', updateProgress)
          cancelAnimationFrame(raf)
        }
      },
      { rootMargin: '60% 0px' }
    )

    proximityObserver.observe(section)
    updateProgress()
    return () => {
      proximityObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateProgress)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    const root = revealRef.current
    if (!root) return

    const imgs = Array.from(root.querySelectorAll('.celebration-img-reveal')).filter(
      el => !el.classList.contains('is-visible')
    )
    if (imgs.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
    )

    imgs.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={containerRef}
      data-nav-theme="glass"
      className="celebration-feeling-section w-full bg-[#BFAC9B] overflow-hidden flex justify-center font-sans relative h-[700px] md:h-[900px]"
    >
      <div ref={revealRef} className="relative w-[1440px] max-w-full h-full shrink-0">
        <div
          style={{ '--img-delay': '0.02s' }}
          className="celebration-img-slot celebration-parallax-slot--1 celebration-img-reveal absolute w-[336px] md:w-[347px] h-[271px] md:h-[280px] -left-[103px] md:left-[0px] top-[5px] md:top-[100px] pointer-events-none z-0"
        >
          <img src={img1} alt="Event Decor" loading="lazy" decoding="async" />
        </div>

        <div
          style={{ '--img-delay': '0.06s' }}
          className="celebration-img-slot celebration-parallax-slot--2 celebration-img-reveal absolute w-[246px] md:w-[249px] h-[268px] md:h-[375px] -left-[46px] md:left-[42px] top-[432px] md:top-[450px] pointer-events-none z-0"
        >
          <img src={img2} alt="Event Decor" loading="lazy" decoding="async" />
        </div>

        <div
          style={{ '--img-delay': '0.10s' }}
          className="celebration-img-slot celebration-parallax-slot--3 celebration-img-reveal absolute hidden md:block w-[290px] h-[316px] left-[497px] top-[700px] pointer-events-none z-0"
        >
          <img src={img3} alt="Event Decor" loading="lazy" decoding="async" />
        </div>

        <div
          style={{ '--img-delay': '0.14s' }}
          className="celebration-img-slot celebration-parallax-slot--4 celebration-img-reveal absolute w-[158px] md:w-[312px] h-[161px] md:h-[318px] left-[278px] md:left-[1034px] top-[391px] md:top-[400px] pointer-events-none z-0"
        >
          <img src={img4} alt="Event Decor" loading="lazy" decoding="async" />
        </div>

        <div
          style={{ '--img-delay': '0.18s' }}
          className="celebration-img-slot celebration-parallax-slot--5 celebration-img-reveal absolute w-[215px] md:w-[505px] h-[113px] md:h-[265px] left-[257px] md:left-[909px] top-[141px] md:top-[50px] pointer-events-none z-0"
        >
          <img src={img5} alt="Event Decor" loading="lazy" decoding="async" />
        </div>

        <div className="sticky top-[180px] md:top-[250px] z-10 flex flex-col items-center">
          <h2 className="w-full max-w-[353px] md:w-[1260px] md:max-w-[calc(100%-2rem)] text-[#FFFFFF] text-[24px] md:text-[48px] lg:text-[96px] leading-[1] md:leading-[1.24] text-center font-malgin drop-shadow-sm px-4 reveal-heading">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                Every celebration <br className="block md:hidden" />
              </span>
            </span>
            <span className="hidden md:inline">
              <br />
            </span>
            <span className="reveal-wrapper">
              <span className="reveal-text">deserves its own feeling.</span>
            </span>
          </h2>

          <p className="mt-[20px] md:mt-8 w-full max-w-[353px] md:w-[522px] md:max-w-[calc(100%-2rem)] text-[#FFFFFF] opacity-90 md:opacity-100 text-[14px] md:text-[16px] leading-[150%] text-center drop-shadow-sm px-4 reveal-on-scroll font-['Poppins'] md:font-sans">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.body ??
                  'Want a professional to handle your event end to end? Fill the form and let our in-house planners plan it with you.'}
              </span>
            </span>
          </p>

          <span className="mt-[32px] md:mt-10 reveal-wrapper reveal-on-scroll">
            <span className="reveal-text">
              <Link
                to={s.cta_url ?? '/book-consultation'}
                className="w-[181px] md:w-[213px] h-[33.5px] md:h-[44px] group flex items-center justify-between bg-[#FAFAFA] md:bg-[#FFFFFF] rounded-[42.7px] md:rounded-[56px] pl-[18.3px] md:pl-[24px] pr-[3px] md:pr-[4px] py-[3px] md:py-[4px] hover:bg-[#F2F2F2] transition-colors shadow-lg"
              >
                <span className="text-[#CDB17E] text-[12px] md:text-[16px] font-medium leading-[1.5] tracking-wide font-['Poppins'] md:font-sans">
                  <span className="md:hidden">{s.cta_label ?? 'Book a consultation'}</span>
                  <span className="hidden md:inline">{s.cta_label ?? 'Plan with Elewen'}</span>
                </span>
                <div className="w-[27.4px] h-[27.4px] md:w-[36px] md:h-[36px] bg-[#CDB17E] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border-[1.1px] md:border-[1.5px] border-[#FAFAFA] md:border-[#FFFFFF]">
                  <svg
                    className="transition-transform duration-300 ease-out group-hover:rotate-45 w-[15.25px] h-[15.25px] md:w-[20px] md:h-[20px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FAFAFA"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </div>
              </Link>
            </span>
          </span>
        </div>
      </div>
    </section>
  )
}

const PLANNING_GUIDES_UI_KEY = 'elewen:planning-guides-ui'

function readPlanningGuidesUi() {
  if (typeof window === 'undefined') return { category: null, page: 0 }

  try {
    const raw = sessionStorage.getItem(PLANNING_GUIDES_UI_KEY)
    if (!raw) return { category: null, page: 0 }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { category: null, page: 0 }

    return {
      category: typeof parsed.category === 'string' ? parsed.category : null,
      page: Number.isFinite(parsed.page) ? Math.max(0, Number(parsed.page)) : 0,
    }
  } catch {
    return { category: null, page: 0 }
  }
}

function writePlanningGuidesUi(next) {
  if (typeof window === 'undefined') return

  try {
    const current = readPlanningGuidesUi()
    sessionStorage.setItem(
      PLANNING_GUIDES_UI_KEY,
      JSON.stringify({
        category: next.category !== undefined ? next.category : current.category,
        page: next.page !== undefined ? next.page : current.page,
      })
    )
  } catch {
    // Ignore quota / private-mode failures.
  }
}

const PlanningGuidesSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.blogs_intro ?? {}
  const lenisRef = useLenis()

  // CMS: Strapi `blogs` published posts + derived categories
  const { data: categories = [] } = useBlogCategories()
  const { data: allBlogs = [] } = useBlogs({ limit: 50 })

  const safeCategories = Array.isArray(categories) ? categories : []
  const safeAllBlogs = Array.isArray(allBlogs) ? allBlogs : []

  const [selectedCategory, setSelectedCategory] = useState(() => readPlanningGuidesUi().category)
  const [page, setPage] = useState(() => readPlanningGuidesUi().page)
  const [isMobile, setIsMobile] = useState(false)
  const [carouselViewportWidth, setCarouselViewportWidth] = useState(0)
  const [isCarouselSliding, setIsCarouselSliding] = useState(false)
  const [slideDirection, setSlideDirection] = useState('next')

  // Track window size to toggle cards per page natively
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const activeCategory =
    (selectedCategory && safeCategories.includes(selectedCategory) ? selectedCategory : null) ??
    safeCategories[0] ??
    null

  // Drop a stale restored category if CMS categories changed.
  useEffect(() => {
    if (!selectedCategory || safeCategories.length === 0) return
    if (safeCategories.includes(selectedCategory)) return
    setSelectedCategory(null)
    writePlanningGuidesUi({ category: null, page: 0 })
  }, [safeCategories, selectedCategory])

  const filteredBlogs = activeCategory
    ? safeAllBlogs.filter(b => b?.category === activeCategory)
    : safeAllBlogs

  // Re-run reveal when placeholder blogs swap to Strapi identities (length alone is not enough).
  const cardRevealSignature = filteredBlogs
    .map(blog => `${blog.slug ?? ''}:${blog.id ?? ''}:${blog.cover_image ?? ''}`)
    .join('|')

  // Dynamic pagination: 1 card on mobile, CARDS_PER_PAGE (e.g. 3) on desktop
  const currentCardsPerPage = isMobile
    ? 1
    : typeof CARDS_PER_PAGE !== 'undefined'
      ? CARDS_PER_PAGE
      : 3
  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / currentCardsPerPage))
  const safePage = Math.min(page, totalPages - 1)
  const mobileCardWidth = 289
  const mobileCardGap = 16
  const edgeFadeMask =
    slideDirection === 'prev'
      ? 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 9%, black 22%, black 86%, rgba(0,0,0,0.5) 95%, transparent 100%)'
      : 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 5%, black 14%, black 78%, rgba(0,0,0,0.3) 91%, transparent 100%)'

  useEffect(() => {
    if (page === safePage) return
    setPage(safePage)
    writePlanningGuidesUi({ page: safePage })
  }, [page, safePage])

  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setSlideDirection('next')
    setPage(0)
    writePlanningGuidesUi({ category: cat, page: 0 })
  }
  const goToPrevPage = () => {
    setSlideDirection('prev')
    setPage(p => {
      const next = Math.max(0, p - 1)
      writePlanningGuidesUi({ page: next })
      return next
    })
  }
  const goToNextPage = () => {
    setSlideDirection('next')
    setPage(p => {
      const next = Math.min(totalPages - 1, p + 1)
      writePlanningGuidesUi({ page: next })
      return next
    })
  }
  const goToPage = nextPage => {
    if (nextPage === safePage) return
    setSlideDirection(nextPage < safePage ? 'prev' : 'next')
    const next = Math.min(nextPage, totalPages - 1)
    setPage(next)
    writePlanningGuidesUi({ page: next })
  }

  const sectionRef = useRef(null)
  const carouselViewportRef = useRef(null)
  const resolvedMobileCardWidth = getResolvedMobileCardWidth(carouselViewportWidth, mobileCardWidth)

  useEffect(() => {
    const viewport = carouselViewportRef.current
    if (!viewport) return

    const updateWidth = () => setCarouselViewportWidth(viewport.clientWidth)

    const ro = new ResizeObserver(updateWidth)
    ro.observe(viewport)
    updateWidth()

    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (page === 0) return
    const frameId = requestAnimationFrame(() => setIsCarouselSliding(true))
    const timer = setTimeout(() => setIsCarouselSliding(false), 560)
    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timer)
    }
  }, [page])

  useEffect(() => {
    const root = sectionRef.current
    if (!root) return

    const cards = Array.from(root.querySelectorAll('.card-reveal')).filter(
      el => !el.classList.contains('is-visible')
    )
    if (cards.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0, rootMargin: '0px' }
    )

    cards.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [cardRevealSignature, page, activeCategory])

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-auto bg-[#F2F2F2] md:bg-[#F4F4F2] flex flex-col overflow-hidden font-sans lg:min-h-screen"
    >
      {/* Header Info */}
      <div className="w-full max-w-[1440px] mx-auto pt-10 md:pt-24 pb-8 md:pb-12 px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center md:items-center relative z-10">
        <h2
          className="font-display text-[28px] md:text-[61px] leading-[1.1] md:leading-[1] text-[#364022] md:text-[#3D4035] font-normal tracking-normal text-center md:text-left mb-5 md:mb-0 reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading_1 ?? 'Planning Guides &'} <br className="hidden md:block" />{' '}
              {s.heading_2 ?? 'Celebration Ideas'}
            </span>
          </span>
        </h2>

        <div className="max-w-[353px] md:max-w-[340px] flex flex-col items-center md:items-start">
          <p className="text-[#727355] md:text-[#3D4035]/70 text-[14px] md:text-[15px] leading-[150%] md:leading-relaxed mb-0 md:mb-6 font-normal md:font-medium text-center md:text-left font-['Poppins'] reveal-on-scroll">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.body ??
                  'Helpful tips, inspiration, and practical guides to make planning your next celebration simpler.'}
              </span>
            </span>
          </p>

          <span className="!hidden md:!inline-flex reveal-wrapper reveal-on-scroll">
            <span className="reveal-text">
              <Link
                to="/blogs"
                className="flex items-center pl-6 pr-1.5 py-1.5 bg-[#D4BA8E] rounded-full hover:bg-[#C6AB7F] transition-colors group w-fit"
              >
                <span className="text-white font-medium text-[15px] mr-5">
                  {s.cta_label ?? 'View All'}
                </span>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg
                    className="w-[20px] h-[20px] text-[#D4BA8E] group-hover:text-[#C6AB7F] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.83301 5.83337H14.1663M14.1663 5.83337V14.1667M14.1663 5.83337L5.83301 14.1667"
                      stroke="#CDB17E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            </span>
          </span>
        </div>
      </div>

      <div className="hidden md:block relative left-1/2 -translate-x-1/2 w-screen h-[1px] z-10 reveal-border-x">
        <div className="absolute top-0 left-0 w-full h-full bg-[#3D4035]/15 border-fill-x"></div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1 relative z-10 mb-10">
        {/* Categories Bar */}
        <aside className="w-full lg:w-[320px] pt-8 pb-0 md:pt-8 md:pb-4 lg:py-20 px-4 md:px-8 lg:px-16 flex flex-col items-center lg:items-start shrink-0 border-b-0 relative reveal-border-y">
          <div className="hidden lg:block absolute right-0 top-0 w-[1px] h-full bg-[#3D4035]/15 border-fill-y"></div>
          <div className="hidden lg:block absolute left-[-64px] bottom-0 w-[calc(100%+64px)] h-[1px] reveal-border-x">
            <div className="absolute top-0 left-0 w-full h-full bg-[#3D4035]/15 border-fill-x"></div>
          </div>
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-[12px] md:gap-5 lg:gap-8 flex-wrap justify-center w-full">
            {safeCategories.map((cat, index) => {
              const isActive = cat === activeCategory
              return (
                <React.Fragment key={cat}>
                  <div
                    className="cursor-pointer group relative w-fit flex flex-col pb-1.5 reveal-on-scroll"
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <span
                      className={`font-['Poppins'] text-[14px] md:text-[16px] transition-colors font-medium tracking-wide ${
                        isActive
                          ? 'text-[#364022] md:text-[#3D4035] md:font-bold'
                          : 'text-[#364022] md:text-[#A3A3A3] group-hover:text-[#3D4035]'
                      }`}
                    >
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{cat}</span>
                      </span>
                    </span>

                    {/* Animated Underline */}
                    <span
                      className={`absolute bottom-0 left-0 h-[1.5px] bg-[#3D4035] transition-all duration-300 ease-out ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </div>
                  {/* Vertical Separator for Mobile/Tablet */}
                  {index < safeCategories.length - 1 && (
                    <div className="block lg:hidden w-[1px] h-[20px] bg-[#1C1C1C]"></div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </aside>

        <div className="flex-1 py-4 md:py-8 lg:py-16 px-6 md:px-8 lg:px-8">
          {/* Cards Carousel Area */}
          <div className="flex-1 py-0 md:py-6 lg:py-16 px-0 md:px-0 lg:px-8 w-full overflow-x-hidden md:overflow-visible md:overflow-hidden">
            <div className={MOBILE_CAROUSEL_STAGE_CLASS}>
              <div className="hidden pointer-events-none absolute top-1/2 left-0 z-20 -translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={goToPrevPage}
                  disabled={safePage === 0}
                  className={MOBILE_CAROUSEL_ARROW_BTN_LEFT}
                  aria-label="Previous card"
                >
                  <MobileCarouselPrevIcon />
                </button>
              </div>

              <div
                ref={carouselViewportRef}
                className={MOBILE_CAROUSEL_VIEWPORT_CLASS}
                style={{
                  maskImage: isCarouselSliding ? edgeFadeMask : 'none',
                  WebkitMaskImage: isMobile ? 'none' : isCarouselSliding ? edgeFadeMask : 'none',
                  transition:
                    'mask-image 420ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-mask-image 420ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div
                  className={`${MOBILE_CAROUSEL_TRACK_CLASS} md:gap-6`}
                  style={
                    isMobile
                      ? undefined
                      : {
                          transform: `translateX(-${safePage * carouselViewportWidth}px)`,
                        }
                  }
                >
                  {filteredBlogs.map((blog, i) => (
                    <Link
                      key={blog.slug ?? blog.documentId ?? blog.id ?? blog.title}
                      to={`/blogs/${blog.slug}`}
                      onClick={() => {
                        // Persist active tab + scroll so browser Back restores this exact view.
                        if (activeCategory) {
                          writePlanningGuidesUi({ category: activeCategory, page: safePage })
                        }
                        rememberHomeScroll(lenisRef?.current)
                      }}
                      className="snap-center bg-white p-[10px] md:p-2.5 rounded-[10px] md:rounded-[24px] shadow-sm flex flex-col h-[394px] md:h-[460px] group cursor-pointer relative card-reveal plan-event-card shrink-0"
                      style={{
                        '--delay': `${0.04 + i * 0.03}s`,
                        width: isMobile
                          ? `${resolvedMobileCardWidth}px`
                          : `calc((100% - ${(currentCardsPerPage - 1) * 24}px) / ${currentCardsPerPage})`,
                      }}
                    >
                      <div className="flex-1 rounded-[8px] md:rounded-t-[16px] md:rounded-b-none bg-[#FFFFFF] relative overflow-hidden h-full md:min-h-0">
                        <img
                          src={
                            blog.cover_image ??
                            CARD_LOCAL_IMAGES[blog.id % CARD_LOCAL_IMAGES.length]
                          }
                          alt={blog.title}
                          className="w-full h-full object-cover object-center plan-event-card-image transition-transform duration-500 ease-out group-hover:scale-110"
                        />
                      </div>

                      <div className="absolute bottom-[15px] left-[15px] right-[15px] md:my-2 md:bottom-0 md:left-0 md:right-0 md:static bg-[#727355] md:bg-[#787A5E] rounded-[8px] md:rounded-[16px] px-[16px] py-[16px] md:px-6 md:py-5 lg:p-7 h-[120px] md:h-[158px] lg:h-[170px] flex flex-col justify-center transition-colors duration-300 plan-event-card-content group-hover:bg-[#4F533D]">
                        {' '}
                        <h3
                          className="text-white font-medium md:font-semibold text-[15px] md:text-[17px] mb-1.5 md:mb-2.5 tracking-wide font-['Poppins'] line-clamp-2 md:line-clamp-none"
                          style={{ fontFamily: 'Poppins' }}
                        >
                          {blog.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden pointer-events-none absolute top-1/2 right-0 z-20 translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={safePage >= totalPages - 1}
                  className={MOBILE_CAROUSEL_ARROW_BTN_RIGHT}
                  aria-label="Next card"
                >
                  <MobileCarouselNextIcon />
                </button>
              </div>
            </div>

            {/* Desktop Pagination Block */}
            <div className="hidden md:flex w-[611px] max-w-[90vw] h-[48px] mt-16 mx-auto justify-between items-center gap-[25px]">
              <button
                onClick={goToPrevPage}
                disabled={safePage === 0}
                className="w-12 h-12 rounded-[96px] bg-[#E6DCC6] flex items-center justify-center text-[#BEB09B] hover:bg-[#957960] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-[4px] justify-center">
                {[...Array(totalPages)].map((_, i) => (
                  <div
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`cursor-pointer rounded-[8px] transition-all ${
                      i === safePage
                        ? 'w-[52px] h-[8px] bg-[#D4BA8E]'
                        : 'w-[8px] h-[8px] bg-[#D4D4D4]'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={goToNextPage}
                disabled={safePage >= totalPages - 1}
                className="w-12 h-12 rounded-[96px] bg-[#E6DCC6] flex items-center justify-center text-[#BEB09B] hover:bg-[#957960] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12H19M19 12L12 19M19 12L12 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile Pagination Dots — hidden; mobile uses horizontal scroll */}
            <div className="hidden items-center justify-center gap-[4px] mt-6 mb-8">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`cursor-pointer rounded-[12px] transition-all ${
                    i === safePage
                      ? 'w-[20px] h-[4px] bg-[#CDB17E]'
                      : 'w-[8px] h-[4px] bg-[#BFBFBF]'
                  }`}
                />
              ))}
            </div>

            {/* Mobile View All Button */}
            <div className="flex md:hidden justify-center pb-12 reveal-on-scroll">
              <span className="reveal-wrapper reveal-wrapper--overflow-visible !pb-1">
                <span className="reveal-text">
                  <Link
                    to="/blogs"
                    className="flex items-center pl-[18px] pr-[3px] py-[3px] bg-[#CDB17E] rounded-[42px] hover:bg-[#C6AB7F] transition-colors group"
                  >
                    <span className="text-[#FAFAFA] font-medium text-[12px] mr-[12px] font-['Poppins']">
                      {s.cta_label ?? 'View All'}
                    </span>
                    <div className="w-[27px] h-[27px] bg-[#FAFAFA] rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        className="w-[15px] h-[15px] text-[#D4BA8E] group-hover:text-[#C6AB7F] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.83301 5.83337H14.1663M14.1663 5.83337V14.1667M14.1663 5.83337L5.83301 14.1667"
                          stroke="#CDB17E"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </Link>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const TestimonialsSection = () => {
  const { data: cms = {} } = useLandingPage()
  const testimonialsHeading =
    cms.testimonials_intro?.heading ?? 'Real celebrations. Real experiences.'

  const sectionRef = useRef(null)
  const swiperRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Track window size to toggle dimensions dynamically
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // CMS: Strapi `testimonials` featured + sorted by date
  const { data: testimonialsData } = useTestimonials()

  const safeTestimonials = useMemo(
    () => (Array.isArray(testimonialsData) ? testimonialsData : []),
    [testimonialsData]
  )
  const SLIDE_COUNT = safeTestimonials.length || 1
  const shouldLoopTestimonials = safeTestimonials.length > 1
  const TESTIMONIAL_LOOP_GROUPS = 21
  const testimonialLoopStartGroup = Math.floor(TESTIMONIAL_LOOP_GROUPS / 2)
  const carouselStartIndex = shouldLoopTestimonials ? testimonialLoopStartGroup * SLIDE_COUNT : 0
  const slides = useMemo(() => {
    if (!shouldLoopTestimonials) {
      return safeTestimonials.map((item, index) => ({
        ...item,
        _renderIndex: index,
        _sourceIndex: index,
      }))
    }

    return Array.from({ length: TESTIMONIAL_LOOP_GROUPS }, (_, groupIndex) =>
      safeTestimonials.map((item, sourceIndex) => ({
        ...item,
        _renderIndex: groupIndex * SLIDE_COUNT + sourceIndex,
        _sourceIndex: sourceIndex,
      }))
    ).flat()
  }, [SLIDE_COUNT, safeTestimonials, shouldLoopTestimonials])

  const normalizeTestimonialLoopPosition = swiper => {
    if (!shouldLoopTestimonials || SLIDE_COUNT <= 1) return

    const sourceIndex = swiper.activeIndex % SLIDE_COUNT
    const middleIndex = testimonialLoopStartGroup * SLIDE_COUNT + sourceIndex

    if (swiper.activeIndex < SLIDE_COUNT * 2) {
      swiper.slideTo(middleIndex, 0, false)
      return
    }

    if (swiper.activeIndex >= SLIDE_COUNT * (TESTIMONIAL_LOOP_GROUPS - 2)) {
      swiper.slideTo(middleIndex, 0, false)
    }
  }

  const getNearestTestimonialIndex = sourceIndex => {
    const swiper = swiperRef.current
    if (!swiper || !shouldLoopTestimonials) return sourceIndex

    const candidateIndexes = slides
      .filter(item => item._sourceIndex === sourceIndex)
      .map(item => item._renderIndex)

    return candidateIndexes.reduce((nearestIndex, candidateIndex) =>
      Math.abs(candidateIndex - swiper.activeIndex) < Math.abs(nearestIndex - swiper.activeIndex)
        ? candidateIndex
        : nearestIndex
    )
  }

  const handlePrevTestimonial = () => {
    const swiper = swiperRef.current
    if (!swiper || SLIDE_COUNT <= 1) return
    swiper.slideTo(swiper.activeIndex - 1)
  }

  const handleNextTestimonial = () => {
    const swiper = swiperRef.current
    if (!swiper || SLIDE_COUNT <= 1) return
    swiper.slideTo(swiper.activeIndex + 1)
  }

  const handleTestimonialCardClick = (targetIndex, { isActive, isPrev, isNext }) => {
    const swiper = swiperRef.current
    if (!swiper || SLIDE_COUNT <= 1 || isActive) return

    if (isPrev) {
      swiper.slideTo(swiper.activeIndex - 1)
      return
    }

    if (isNext) {
      swiper.slideTo(swiper.activeIndex + 1)
      return
    }

    swiper.slideTo(getNearestTestimonialIndex(targetIndex))
  }

  useEffect(() => {
    const root = sectionRef.current
    if (!root) return

    const cards = Array.from(root.querySelectorAll('.testimonial-card-reveal')).filter(
      el => !el.classList.contains('is-visible')
    )
    if (cards.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0, rootMargin: '0px' }
    )

    cards.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [slides.length])

  // Avoid initializing Swiper with empty/undefined data.
  if (safeTestimonials.length === 0) {
    return (
      <section
        data-nav-theme="dark"
        className="relative w-full min-h-[479px] md:min-h-[757px] bg-[#364022] overflow-x-hidden font-sans flex flex-col items-center"
      >
        <h2
          className="text-[#FFFFFF] text-[24px] md:text-[61px] leading-[1] text-center font-serif mt-[40px] md:mt-[80px] z-10 px-4 reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{testimonialsHeading}</span>
          </span>
        </h2>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      data-nav-theme="dark"
      className="relative w-full min-h-[479px] md:min-h-[757px] bg-[#364022] overflow-x-hidden font-sans flex flex-col items-center"
    >
      <h2
        className="text-[#FAFAFA] md:text-[#FFFFFF] text-[24px] md:text-[61px] leading-[1] text-center font-serif mt-[40px] md:mt-[80px] w-[353px] md:w-auto z-10 px-4 reveal-heading"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        <span className="reveal-wrapper">
          <span className="reveal-text">{testimonialsHeading}</span>
        </span>
      </h2>

      <div className="w-full max-w-[1377.5px] mt-[40px] md:mt-[80px]">
        <Swiper
          centeredSlides={true}
          centerInsufficientSlides={true}
          watchOverflow={true}
          slidesPerView="auto"
          watchSlidesProgress={true}
          allowTouchMove={SLIDE_COUNT > 1}
          speed={820}
          className="flex items-center !overflow-visible px-4 pb-4 md:px-6 lg:px-0"
          breakpoints={{
            320: { spaceBetween: 12 },
            768: { spaceBetween: 20 },
            1200: { spaceBetween: 28 },
          }}
          onSwiper={swiper => {
            swiperRef.current = swiper
          }}
          onSlideChange={swiper => setActiveIndex(swiper.activeIndex % SLIDE_COUNT)}
          onSlideChangeTransitionEnd={normalizeTestimonialLoopPosition}
          onInit={swiper => {
            swiper.slideTo(carouselStartIndex, 0, false)
            setActiveIndex(carouselStartIndex % SLIDE_COUNT)
          }}
        >
          {slides.map((item, index) => (
            <SwiperSlide
              key={`${item.id ?? item._sourceIndex ?? index}-${item._renderIndex ?? index}`}
              className="!h-auto !w-auto flex items-center justify-center py-4 md:py-6"
            >
              {({ isActive, isPrev, isNext }) => (
                <div
                  className={`bg-[#FFFFFF] flex flex-col items-start cursor-pointer origin-center
                    testimonial-card-reveal
                    transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0
                    rounded-[6.7px] md:rounded-[12px]
                    w-[289px] md:w-[517.5px]
                    h-[251px] md:h-[367.82px] 
                    p-[20px] md:p-[30px] 
                    gap-[20px] md:gap-[36px]
                    ${
                      isActive
                        ? 'z-10 opacity-100 shadow-[0_24px_60px_rgba(0,0,0,0.16)] scale-[1.02] md:scale-[1.06]'
                        : isPrev || isNext
                          ? 'opacity-65 md:opacity-80 scale-[0.92] md:scale-[0.88]'
                          : 'opacity-40 md:opacity-55 scale-[0.84] md:scale-[0.78]'
                    }
                  `}
                  style={{ '--delay': `${0.04 + (index % 4) * 0.06}s` }}
                  onClick={() =>
                    handleTestimonialCardClick(item._sourceIndex ?? index, {
                      isActive,
                      isPrev,
                      isNext,
                    })
                  }
                >
                  {/* Stars */}
                  <div className="flex justify-between w-[100px] md:w-[151.5px] h-[17px] md:h-[25.82px]">
                    {[...Array(Number(item?.stars) || 0)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-[18px] md:w-[27.55px] h-[17px] md:h-[25.82px]"
                        viewBox="0 0 28 26"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14 0L17.1432 9.67376H27.3148L19.0858 15.6525L22.229 25.3262L14 19.3475L5.77101 25.3262L8.9142 15.6525L0.685208 9.67376H10.8568L14 0Z"
                          fill="#CDB17E"
                        />
                      </svg>
                    ))}
                  </div>

                  {/* Category */}
                  <div className="text-[#787575] font-normal font-['Poppins'] md:font-sans w-[249px] md:w-[275px] h-[18px] md:h-[24px] text-[12px] md:text-[16px] leading-[18px] md:leading-[24px]">
                    {item.category}
                  </div>

                  {/* Testimonial Text */}
                  <div className="text-[#2D2D2D] font-normal font-['Poppins'] md:font-sans w-[249px] md:w-[457.5px] h-[102px] md:h-[125px] text-[14px] md:text-[21px] leading-[17px] md:leading-[25px]">
                    &quot;{item.text}&quot;
                  </div>

                  {/* Author */}
                  <div className="text-[#787575] font-medium font-['Poppins'] md:font-sans w-[249px] md:w-[457.5px] h-[14px] md:h-[25px] text-[12px] md:text-[21px] leading-[14px] md:leading-[25px]">
                    {item.author}
                  </div>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Navigation Controls (Arrows + Dots) */}
      <div className="relative z-30 w-[289px] md:w-[611px] h-[40px] md:h-[48px] mt-[20px] md:mt-[40px] flex justify-between items-center gap-[14.44px] md:gap-[25px]">
        {/* Previous Button */}
        <span className="reveal-on-scroll reveal-wrapper">
          <span className="reveal-text reveal-text-x-left">
            <button
              type="button"
              onClick={handlePrevTestimonial}
              aria-label="Previous testimonial"
              className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] bg-[#CDB17E] rounded-[55px] md:rounded-[96px] flex items-center justify-center hover:bg-[#bfa06b] transition-colors shrink-0"
            >
              <svg
                className="w-[20px] h-[20px] md:w-[22px] md:h-[22px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={isMobile ? '1.5' : '2'}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </button>
          </span>
        </span>

        {/* Pagination Dots */}
        <span className="reveal-on-scroll reveal-wrapper">
          <span className="reveal-text">
            <div className="flex items-center gap-[4px] w-[80px] md:w-[100px] h-[4px] md:h-[8px] justify-center mx-auto">
              {safeTestimonials.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-[4px] md:h-[8px] rounded-[12px] md:rounded-[8px] transition-all duration-300 ${activeIndex === idx ? 'w-[20px] md:w-[52px] bg-[#CDB17E]' : 'w-[8px] bg-[#BFBFBF] md:bg-[#C8C8C8]'}`}
                />
              ))}
            </div>
          </span>
        </span>

        {/* Next Button */}
        <span className="reveal-on-scroll reveal-wrapper">
          <span className="reveal-text reveal-text-x-right">
            <button
              type="button"
              onClick={handleNextTestimonial}
              aria-label="Next testimonial"
              className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] bg-[#CDB17E] rounded-[55px] md:rounded-[96px] flex items-center justify-center hover:bg-[#bfa06b] transition-colors shrink-0"
            >
              <svg
                className="w-[20px] h-[20px] md:w-[22px] md:h-[22px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={isMobile ? '1.5' : '2'}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </span>
        </span>
      </div>
    </section>
  )
}

const SPLIT_INFO_TRANSITION =
  'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'

const getSplitRevealStyle = (isVisible, { delay = 0, fromY = 0, fromX = 0 } = {}) => ({
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'translate3d(0, 0, 0)' : `translate3d(${fromX}px, ${fromY}px, 0)`,
  transition: SPLIT_INFO_TRANSITION,
  transitionDelay: isVisible ? `${delay}s` : '0s',
  willChange: isVisible ? 'auto' : 'transform, opacity',
})

const SplitInfoSection = () => {
  const { data: cms = {} } = useLandingPage()
  const ig = cms.instagram_section ?? {}
  const vp = cms.vendor_partner ?? {}
  const [isSplitVisible, setIsSplitVisible] = useState(false)

  const sectionRef = usePreloadOnApproach([inspirationImg, img2], '200% 0px')

  useEffect(() => {
    const root = sectionRef.current
    if (!root) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsSplitVisible(true)
        io.disconnect()
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
    )

    io.observe(root)
    return () => io.disconnect()
  }, [sectionRef])

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#FFFFFF] font-sans overflow-x-clip overflow-y-hidden"
    >
      <div className="w-full min-w-0 flex flex-col lg:flex-row overflow-x-clip">
        {/* LEFT SECTION - Inspiration */}
        <div
          className="w-full lg:w-[61.111111%] bg-[#FFFFFF] flex flex-row items-start justify-between gap-4 px-[20px] py-[40px] lg:pl-[100px] lg:pr-[40px] lg:py-[80px] overflow-x-clip"
          style={getSplitRevealStyle(isSplitVisible, { delay: 0 })}
        >
          <div
            className="flex flex-col items-start text-left w-[55%] lg:w-[400px] shrink-0"
            style={getSplitRevealStyle(isSplitVisible, { delay: 0, fromY: 28 })}
          >
            <h2
              className="text-[#2D2D2D] text-[20px] md:text-[27px] leading-[100%] w-full font-serif m-0"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              {ig.heading ?? 'Behind the Scenes'}
            </h2>

            <p className="text-[#2D2D2D] opacity-50 text-[12px] md:text-[16px] leading-[150%] w-full lg:w-[339px] mt-[12px] lg:mt-[20px] font-sans m-0 font-['Poppins'] lg:font-sans">
              {ig.body ??
                'Follow along for real celebrations, styling ideas, and behind-the-scenes moments from the events we love creating.'}
            </p>

            <button className="mt-[20px] lg:mt-[16px] box-border flex flex-row items-center justify-center px-[12px] lg:px-[16px] py-[6px] lg:py-[8px] gap-[6px] lg:gap-[16px] border border-[#591902] rounded-[25px] lg:rounded-[56px] bg-transparent text-[#591902] hover:bg-[#591902] hover:text-white transition-colors group">
              <span className="text-[#591902] group-hover:text-white transition-colors font-medium text-[12px] leading-[150%] font-['Poppins'] lg:font-sans text-center lg:text-left">
                {ig.cta_label ?? 'Join Our Instagram'}
              </span>
              <svg
                className="w-[16px] h-[16px] lg:w-[20px] lg:h-[20px] shrink-0 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </button>
          </div>

          <img
            src={inspirationImg}
            alt="Behind the scenes setup"
            className="w-[40%] max-w-[156px] lg:max-w-[240px] h-[229px] lg:h-[351px] rounded-[3.57px] lg:rounded-[8px] object-cover object-[20%_center]"
            style={getSplitRevealStyle(isSplitVisible, { delay: 0, fromY: 32 })}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* RIGHT SECTION - Partner */}
        <div
          className="w-full lg:w-[38.888889%] bg-[#591902] flex flex-col items-center lg:items-start px-[20px] py-[40px] lg:p-[40px] overflow-x-clip"
          style={getSplitRevealStyle(isSplitVisible, { fromX: 56 })}
        >
          <div
            className="w-full max-w-[353px] lg:max-w-[420px] h-[152px] lg:h-[210px] bg-[#FFFFFF] rounded-[8px] overflow-hidden shrink-0"
            style={getSplitRevealStyle(isSplitVisible, { delay: 0, fromY: 24 })}
          >
            <img
              src={img2}
              alt="Vendor partnership"
              className="w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div
            className="flex flex-col items-start w-full max-w-[353px] lg:max-w-[420px] mt-[32px] lg:mt-[40px]"
            style={getSplitRevealStyle(isSplitVisible, { delay: 0, fromY: 28 })}
          >
            <h2
              className="text-[#FFFFFF] text-[20px] md:text-[27px] leading-[100%] w-full font-serif m-0"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              {vp.heading ?? 'Partner with Elewen'}
            </h2>

            <div className="flex flex-col items-start gap-[16px] mt-[20px] w-full lg:w-[420px]">
              <p className="text-[#FFFFFF] opacity-50 text-[16px] leading-[150%] w-full lg:w-[420px] font-sans m-0">
                {vp.body ??
                  "Great events are never created alone. We work with a trusted circle of florists, decorators, caterers, bartenders, and production houses who help bring celebrations to life. If you'd like to be part of our vendor network, we'd love to hear from you."}
              </p>

              <Link
                to={vp.cta_url ?? '/vendor-registration'}
                className="mt-[32px] lg:mt-[16px] box-border flex flex-row items-center justify-between pl-[18px] lg:pl-[24px] pr-[4px] lg:pr-[4px] py-0 lg:py-[4px] gap-[12px] lg:gap-[16px] w-max lg:w-[228px] min-h-[36px] h-[36px] lg:h-[44px] bg-[#CDB17E] rounded-[42px] lg:rounded-[56px] hover:bg-[#bfa06b] transition-colors group"
              >
                <span className="text-[#FAFAFA] font-medium text-[12px] lg:text-[16px] leading-[150%] font-['Poppins'] lg:font-sans text-left">
                  {vp.cta_label ?? 'Apply as Vendor'}
                </span>

                <div className="flex items-center justify-center w-[36px] h-[36px] bg-[#FAFAFA] rounded-[60px] p-[8px] shrink-0 transition-transform group-hover:scale-105">
                  <svg
                    className="transition-transform duration-300 ease-out group-hover:rotate-45"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#CDB17E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const rootRef = useRef(null)
  const queryClient = useQueryClient()
  const landingQuery = useLandingPage()
  const isStrapiLoading = useStrapiPageLoading(landingQuery)

  const { data: cmsData } = landingQuery

  // When Strapi CMS data loads after mount, new .reveal-text spans are created
  // inside elements that the global IO already marked .is-visible. Those new spans
  // never get the class. This pass finds them and makes them visible immediately.
  useEffect(() => {
    if (isStrapiLoading || !cmsData) return
    if (!rootRef.current) return
    rootRef.current.querySelectorAll('.is-visible').forEach(parent => {
      parent.querySelectorAll('.reveal-text:not(.is-visible)').forEach(span => {
        span.style.animationDelay = '0s'
        span.classList.add('is-visible')
      })
    })
  }, [cmsData, isStrapiLoading])

  // ── Tiered asset preloading ───────────────────────────────────────────────
  // Tier 1 (on mount, during preloader): scallop bulbs + logo — same set HeroSection waits for.
  // Tier 2 (hero-preloader-done): checklist illustrations, first 3
  //   package images, and the centre logo - sections 3-5.
  // Tier 3: IntersectionObserver hooks inside SplitInfoSection handle
  //   inspirationImg 2 viewports ahead.
  // All remaining img tags carry loading="lazy" so the browser fetches them
  //   when they naturally scroll into range.
  useEffect(() => {
    preloadImages(HOME_TIER1_IMAGE_URLS)
    queryClient.prefetchQuery({
      queryKey: ['how-it-works-landing-page'],
      queryFn: fetchHowItWorksLandingPage,
      staleTime: 5 * 60 * 1000,
    })

    const onPreloaderDone = () =>
      preloadImages([
        imgScrolling,
        imgCalls,
        imgVendors,
        imgDecisions,
        pkgImg1,
        pkgImg2,
        pkgImg3,
        img1,
        img2,
        img3,
        img4,
        img5,
        centerLogo,
        inspirationImg,
        img2,
      ])

    window.addEventListener('hero-preloader-done', onPreloaderDone, { once: true })
    return () => window.removeEventListener('hero-preloader-done', onPreloaderDone)
  }, [queryClient])

  useEffect(() => {
    if (isStrapiLoading) return

    const root = rootRef.current
    if (!root || typeof window === 'undefined') return

    const targets = Array.from(
      root.querySelectorAll(
        '.reveal-heading, .reveal-on-scroll, .reveal-border-x, .reveal-border-y'
      )
    )
    if (targets.length === 0) return

    const animated = new Set()
    const pending = new Set()

    const revealElement = (el, observer) => {
      if (animated.has(el) || pending.has(el)) return
      pending.add(el)

      const tryReveal = (attempt = 0) => {
        const opacity = window.getComputedStyle(el).opacity
        if (opacity === '0') {
          if (attempt < 20) {
            setTimeout(() => tryReveal(attempt + 1), 80)
          }
          return
        }

        pending.delete(el)
        animated.add(el)
        el.classList.add('is-visible')

        const revealSpans = [
          ...(el.classList.contains('reveal-text') ? [el] : []),
          ...Array.from(el.querySelectorAll('.reveal-text')),
        ]
        revealSpans.forEach((span, i) => {
          const isTimelineReveal = !!el.closest('.step-item')
          const baseDelay = isTimelineReveal ? 0 : 0.5
          const stagger = isTimelineReveal ? 0 : i * 0.04
          span.style.animationDelay = `${baseDelay + stagger}s`
          span.classList.add('is-visible')
        })

        observer?.unobserve(el)
      }

      tryReveal()
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          revealElement(entry.target, observer)
        })
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -60px 0px',
      }
    )

    targets.forEach(el => {
      const rect = el.getBoundingClientRect()
      const isAlreadyInView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0
      if (isAlreadyInView) {
        requestAnimationFrame(() => revealElement(el, observer))
      } else {
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [isStrapiLoading])

  return (
    <div ref={rootRef} className="relative">
      <HeroSection />
      <DiscountBannerCarousel />
      <PlanEventSection />
      <WhatToPlanSection />
      <ChecklistSection />
      <PackagesSection />
      <CelebrationFeelingSection />
      <PlanningGuidesSection />
      <TestimonialsSection />
      <SplitInfoSection />
    </div>
  )
}
