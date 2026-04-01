import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import CelebrationDoor from '../components/landing-page/CelebrationDoor'
import HeroSection from '../components/landing-page/HeroSection'
import { usePackages } from '../hooks/usePackages'
import { useEventCategories, useEventCards, useServiceCards } from '../hooks/useEventTypes'
import { useTestimonials } from '../hooks/useTestimonials'
import { useBlogs, useBlogCategories } from '../hooks/useBlogs'
import { useLandingPage } from '../hooks/useCmsPages'

import { preloadImages, usePreloadOnApproach } from '../utils/preloadAssets'
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

const PlanEventSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.plan_event_intro ?? {}

  // CMS: Strapi `events` top-level categories + featured sub-type cards
  const { data: categories = [] } = useEventCategories()
  const { data: eventCards = [] } = useEventCards()

  const safeCategories = Array.isArray(categories) ? categories : []
  const safeEventCards = Array.isArray(eventCards) ? eventCards : []

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [page, setPage] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Track window size to toggle cards per page natively
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Derive active category — default to first category once loaded
  const activeCategory = selectedCategory ?? safeCategories[0] ?? null

  // Filter cards by selected category
  const filteredCards = activeCategory
    ? safeEventCards.filter(c => c?.category === activeCategory)
    : safeEventCards

  // Dynamic pagination: 1 card on mobile, CARDS_PER_PAGE (e.g. 3) on desktop
  const currentCardsPerPage = isMobile
    ? 1
    : typeof CARDS_PER_PAGE !== 'undefined'
      ? CARDS_PER_PAGE
      : 3
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / currentCardsPerPage))
  const visibleCards = filteredCards.slice(
    page * currentCardsPerPage,
    (page + 1) * currentCardsPerPage
  )

  // Reset page when category changes
  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setPage(0)
  }

  const scallopCount = [...Array(15)]

  const sectionRef = useRef(null)

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
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    cards.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [visibleCards, page, activeCategory])

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen bg-[#F2F2F2] pt-[40px] md:pt-52 flex flex-col overflow-hidden font-sans"
    >
      {/* Background Decor (Desktop predominantly) */}
      <div className="absolute top-0 left-0 w-full hidden md:flex pointer-events-none z-0">
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
                  animationDelay: `${(i % 5) * 0.2}s`,
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

      {/* Header Info */}
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 pb-8 md:pb-12 flex flex-col md:flex-row justify-between items-center md:items-end relative z-10">
        <h1
          className="text-[24px] md:text-[61px] leading-[1] text-[#364022] md:text-[#3D4035] font-normal tracking-normal text-center md:text-left reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading ?? (
                <>
                  Plan Your Event, <br className="hidden md:block" /> Differently.
                </>
              )}
            </span>
          </span>
        </h1>

        <div className="relative max-w-[353px] md:max-w-[340px] mt-5 md:mt-4 md:top-4 flex flex-col items-center md:items-start">
          <p className="text-[#727355] md:text-[#3D4035]/70 text-[14px] md:text-[15px] leading-[150%] md:leading-relaxed mb-0 md:mb-6 font-normal md:font-medium text-center md:text-left font-['Poppins'] reveal-on-scroll">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.description ??
                  'Choose your event type and explore curated décor and catering packages designed to simplify planning.'}
              </span>
            </span>
          </p>

          <span className="!hidden md:!inline-flex reveal-wrapper reveal-on-scroll">
            <span className="reveal-text">
              <button className="flex items-center pl-6 pr-1.5 py-1.5 bg-[#D4BA8E] rounded-full hover:bg-[#C6AB7F] transition-colors group w-fit">
                <span className="text-white font-medium text-[15px] mr-5">
                  {s.cta_label ?? 'View All'}
                </span>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg
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
                  </svg>
                </div>
              </button>
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
        <aside className="w-full md:w-[320px] pt-8 pb-0 md:py-20 px-4 md:px-16 flex flex-col items-center md:items-start shrink-0 relative reveal-border-y">
          <div className="hidden md:block absolute right-0 top-0 w-[1px] h-full bg-[#3D4035]/15 border-fill-y"></div>
          <div className="flex flex-row md:flex-col items-center md:items-start gap-[12px] md:gap-8 flex-wrap justify-center w-full">
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
                    <div className="block md:hidden w-[1px] h-[20px] bg-[#1C1C1C]"></div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </aside>

        <div className="flex-1 py-4 md:py-16 px-6 md:px-12 lg:px-8">
          {/* Cards Carousel Area */}
          <div className="flex-1 py-0 md:py-16 px-0 md:px-12 lg:px-8 w-full overflow-visible md:overflow-hidden">
            <div className="relative -mx-6 md:-mx-12 lg:mx-0 min-h-[400px] md:min-h-0">
              {/* Mobile Left Navigation Arrow — full-bleed row, vertically centered on card */}
              <div className="absolute top-[200px] -translate-y-1/2 left-0 z-20 md:hidden pointer-events-none">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="pointer-events-auto w-[34px] h-[68px] rounded-r-full bg-[#ECE7DC] flex items-center justify-center border-y border-r border-[#CDB17E] disabled:opacity-40 transition-opacity"
                >
                  <svg
                    className="w-[24px] h-[24px] rotate-90 text-[#CDB17E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex justify-center md:block">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-[289px] max-w-[min(289px,calc(100vw-2rem))] md:max-w-none md:w-auto relative">
                  {visibleCards.map((card, i) => (
                    <div
                      key={card.id ?? card.title}
                      style={{ '--delay': `${0.08 + i * 0.06}s` }}
                      className="bg-white p-0 md:p-2.5 rounded-[8px] md:rounded-[24px] shadow-sm flex flex-col h-[400px] md:h-[460px] group cursor-pointer relative card-reveal"
                    >
                      <div className="flex-1 rounded-t-[8px] md:rounded-t-[16px] rounded-b-[8px] md:rounded-b-none bg-[#E8E4DC] relative overflow-hidden h-full md:min-h-0">
                        <img
                          src={card.image ?? CARD_LOCAL_IMAGES[card.id % CARD_LOCAL_IMAGES.length]}
                          alt={card.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="absolute bottom-[12px] md:bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-[265px] md:w-auto md:static bg-[#727355] md:bg-[#787A5E] rounded-[8px] md:rounded-[16px] px-[12px] py-[16px] md:p-7 h-[92px] md:h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                        <h3 className="text-white font-medium md:font-semibold text-[16px] md:text-[17px] mb-1 md:mb-2.5 tracking-wide uppercase font-['Poppins']">
                          {card.title}
                        </h3>
                        <p className="text-white/50 md:text-white/80 text-[12px] md:text-[13px] leading-[150%] md:leading-relaxed font-normal md:font-light font-['Poppins']">
                          {card.tagline}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Right Navigation Arrow */}
              <div className="absolute top-[200px] -translate-y-1/2 right-0 z-20 md:hidden pointer-events-none">
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="pointer-events-auto w-[34px] h-[68px] rounded-l-full bg-[#ECE7DC] flex items-center justify-center border-y border-l border-[#CDB17E] disabled:opacity-40 transition-opacity"
                >
                  <svg
                    className="w-[24px] h-[24px] -rotate-90 text-[#CDB17E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Pagination Controls */}

            {/* Desktop Pagination Block */}
            <div className="hidden md:flex w-[611px] max-w-[90vw] h-[48px] mt-16 mx-auto justify-between items-center gap-[25px]">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-12 h-12 rounded-[96px] bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-[4px] justify-center">
                {[...Array(totalPages)].map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setPage(i)}
                    className={`cursor-pointer rounded-[8px] transition-all ${
                      i === page ? 'w-[52px] h-[8px] bg-[#D4BA8E]' : 'w-[8px] h-[8px] bg-[#D4D4D4]'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-12 h-12 rounded-[96px] bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Mobile Pagination Dots */}
            <div className="flex md:hidden items-center justify-center gap-[4px] mt-6 mb-8">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  onClick={() => setPage(i)}
                  className={`cursor-pointer rounded-[12px] transition-all ${
                    i === page ? 'w-[20px] h-[4px] bg-[#CDB17E]' : 'w-[8px] h-[4px] bg-[#BFBFBF]'
                  }`}
                />
              ))}
            </div>

            {/* Mobile View All Button */}
            <div className="flex md:hidden justify-center pb-12 reveal-on-scroll">
              <span className="reveal-wrapper reveal-wrapper--overflow-visible !pb-1">
                <span className="reveal-text">
                  <button className="flex items-center pl-[18px] pr-[3px] py-[3px] bg-[#CDB17E] rounded-[42px] hover:bg-[#C6AB7F] transition-colors group">
                    <span className="text-[#FAFAFA] font-medium text-[12px] mr-[12px] font-['Poppins']">
                      {s.cta_label ?? 'View All'}
                    </span>
                    <div className="w-[27px] h-[27px] bg-[#FAFAFA] rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        className="w-[15px] h-[15px] text-[#CDB17E] group-hover:rotate-45 transition-transform"
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
                      </svg>
                    </div>
                  </button>
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

  // Track window size to toggle cards per page natively
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024) // Using 1024px since original code uses lg: for sidebar
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Derive categories from service cards
  const categories = [...new Set(safeServiceCards.map(s => s?.category).filter(Boolean))]
  const activeCategory = selectedCategory ?? categories[0] ?? null

  const filteredCards = activeCategory
    ? safeServiceCards.filter(s => s?.category === activeCategory)
    : safeServiceCards

  // Dynamic pagination: 1 card on mobile, CARDS_PER_PAGE (e.g. 3) on desktop
  const currentCardsPerPage = isMobile
    ? 1
    : typeof CARDS_PER_PAGE !== 'undefined'
      ? CARDS_PER_PAGE
      : 3
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / currentCardsPerPage))
  const visibleCards = filteredCards.slice(
    page * currentCardsPerPage,
    (page + 1) * currentCardsPerPage
  )

  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setPage(0)
  }

  const sectionRef = useRef(null)

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
          Array.from(el.querySelectorAll('.reveal-text')).forEach((span, i) => {
            span.style.animationDelay = `${0.08 + i * 0.04}s`
            span.classList.add('is-visible')
          })

          io.unobserve(el)
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    targets.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [categories.length, visibleCards.length, page, activeCategory])

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen bg-[#F2F2F2] flex flex-col overflow-hidden font-sans"
    >
      {/* Header Info */}
      <div className="w-full max-w-[1440px] mx-auto pt-10 md:pt-24 pb-8 md:pb-12 px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center md:items-center">
        <div className="max-w-[353px] md:max-w-[340px] order-last md:order-first mt-5 md:mt-0 flex flex-col items-center md:items-start">
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
              <button className="flex items-center pl-6 pr-1.5 py-1.5 bg-[#D4BA8E] rounded-full hover:bg-[#C6AB7F] transition-colors group w-fit">
                <span className="text-white font-medium text-[15px] mr-5">
                  {s.cta_label ?? 'View All'}
                </span>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg
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
                  </svg>
                </div>
              </button>
            </span>
          </span>
        </div>

        <h2
          className="font-display text-[28px] md:text-[61px] leading-[1] md:leading-[1] text-[#364022] md:text-[#3D4035] font-normal tracking-normal text-center md:text-left order-first md:order-last reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading ?? (
                <>
                  What Would You <br className="hidden md:block" /> Like To{' '}
                  <br className="block md:hidden" /> Plan?
                </>
              )}
            </span>
          </span>
        </h2>
      </div>

      <div className="hidden md:block relative left-1/2 -translate-x-1/2 w-screen h-[1px] reveal-border-x">
        <div className="absolute top-0 left-0 w-full h-full bg-[#3D4035]/15 border-fill-x"></div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1">
        <div className="flex-1 order-last lg:order-none py-4 md:py-16 px-6 md:px-12 lg:px-8 relative reveal-border-y">
          <div className="hidden lg:block absolute right-0 top-0 w-[1px] h-full bg-[#3D4035]/15 border-fill-y"></div>
          {/* Cards Carousel Area */}
          <div className="flex-1 order-last lg:order-none py-0 md:py-16 px-0 md:px-12 lg:px-8 w-full overflow-visible lg:overflow-hidden">
            <div className="relative -mx-6 md:-mx-12 lg:mx-0 min-h-[400px] lg:min-h-0">
              {/* Mobile Left Navigation Arrow */}
              <div className="absolute top-[200px] -translate-y-1/2 left-0 z-20 lg:hidden pointer-events-none">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="pointer-events-auto w-[34px] h-[68px] rounded-r-full bg-[#ECE7DC] flex items-center justify-center border-y border-r border-[#CDB17E] disabled:opacity-40 transition-opacity"
                >
                  <svg
                    className="w-[24px] h-[24px] rotate-90 text-[#CDB17E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex justify-center lg:block">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-[289px] max-w-[min(289px,calc(100vw-2rem))] lg:max-w-none lg:w-auto relative">
                  {visibleCards.map((card, i) => (
                    <div
                      key={card.id ?? card.title}
                      className="bg-white p-0 md:p-2.5 rounded-[8px] md:rounded-[24px] shadow-sm flex flex-col h-[400px] md:h-[460px] group cursor-pointer relative card-reveal"
                      style={{ '--delay': `${0.08 + i * 0.06}s` }}
                    >
                      <div className="flex-1 rounded-t-[8px] md:rounded-t-[16px] rounded-b-[8px] md:rounded-b-none bg-[#E8E4DC] relative overflow-hidden h-full md:min-h-0">
                        <img
                          src={card.image ?? CARD_LOCAL_IMAGES[card.id % CARD_LOCAL_IMAGES.length]}
                          alt={card.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="absolute bottom-[12px] md:bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-[265px] md:w-auto md:static bg-[#727355] md:bg-[#787A5E] rounded-[8px] md:rounded-[16px] px-[12px] py-[16px] md:p-7 h-[100px] md:h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                        <h3 className="text-white font-medium md:font-semibold text-[16px] md:text-[17px] mb-1 md:mb-2.5 tracking-wide font-['Poppins']">
                          {card.title}
                        </h3>
                        <p className="text-white/60 md:text-white/80 text-[12px] md:text-[13px] leading-[150%] md:leading-relaxed font-normal md:font-light pr-2 font-['Poppins']">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Right Navigation Arrow */}
              <div className="absolute top-[200px] -translate-y-1/2 right-0 z-20 lg:hidden pointer-events-none">
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="pointer-events-auto w-[34px] h-[68px] rounded-l-full bg-[#ECE7DC] flex items-center justify-center border-y border-l border-[#CDB17E] disabled:opacity-40 transition-opacity"
                >
                  <svg
                    className="w-[24px] h-[24px] -rotate-90 text-[#CDB17E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Desktop Pagination Block */}
            <div className="hidden lg:flex w-[611px] max-w-[90vw] h-[48px] mt-12 md:mt-16 mx-auto justify-between items-center gap-[25px]">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-12 h-12 rounded-[96px] bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-[4px] justify-center">
                {[...Array(totalPages)].map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setPage(i)}
                    className={`cursor-pointer rounded-[8px] transition-all ${
                      i === page ? 'w-[52px] h-[8px] bg-[#D4BA8E]' : 'w-[8px] h-[8px] bg-[#D4D4D4]'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-12 h-12 rounded-[96px] bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Mobile Pagination Dots */}
            <div className="flex lg:hidden items-center justify-center gap-[4px] mt-6 mb-8">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  onClick={() => setPage(i)}
                  className={`cursor-pointer rounded-[12px] transition-all ${
                    i === page ? 'w-[20px] h-[4px] bg-[#CDB17E]' : 'w-[8px] h-[4px] bg-[#BFBFBF]'
                  }`}
                />
              ))}
            </div>

            {/* Mobile View All Button */}
            <div className="flex md:hidden justify-center pb-12 reveal-on-scroll">
              <span className="reveal-wrapper reveal-wrapper--overflow-visible !pb-1">
                <span className="reveal-text">
                  <button className="flex items-center pl-[18px] pr-[3px] py-[3px] bg-[#CDB17E] rounded-[42px] hover:bg-[#C6AB7F] transition-colors group">
                    <span className="text-[#FAFAFA] font-medium text-[12px] mr-[12px] font-['Poppins']">
                      {s.cta_label ?? 'View All'}
                    </span>
                    <div className="w-[27px] h-[27px] bg-[#FAFAFA] rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        className="w-[15px] h-[15px] text-[#CDB17E] group-hover:rotate-45 transition-transform"
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
                      </svg>
                    </div>
                  </button>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <aside className="w-full lg:w-[320px] order-first lg:order-none pt-8 pb-0 lg:py-20 px-4 md:px-16 flex flex-col items-center lg:items-start shrink-0 lg:border-none border-[#3D4035]/15">
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-[12px] md:gap-8 flex-wrap justify-center w-full">
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

                    {/* Animated Underline */}
                    <span
                      className={`absolute bottom-0 left-0 h-[1.5px] bg-[#3D4035] transition-all duration-300 ease-out ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </div>
                  {/* Vertical Separator for Mobile */}
                  {index < categories.length - 1 && (
                    <div className="block lg:hidden w-[1px] h-[20px] bg-[#1C1C1C]"></div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </aside>
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

const howSteps = [
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
    desc: "Leave us a note, ask a question, or pitch your wild idea — we'll align, curate, and make your party effortless.",
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

    // Variable to ensure the line only grows and never shrinks
    let maxProgress = 0

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

        const currentProgress =
          range > 0 ? Math.max(0, Math.min(1, (center - firstCenter) / range)) : 1

        // Lock the maximum progress so the line doesn't reverse
        maxProgress = Math.max(maxProgress, currentProgress)

        progressLine.style.transform = `translateX(-50%) scaleY(${maxProgress})`
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

      // Heading reveal ("HOW 11 WORKS")
      ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          container.querySelectorAll('h2 .reveal-text').forEach((t, i) => {
            t.style.animationDelay = `${i * 0.05}s`
            t.classList.add('is-visible')
          })
        },
      })

      stepElements.forEach(step => {
        const leftContent = step.querySelector('.left-content')
        const rightContent = step.querySelector('.right-content')

        // 1. Tighter trigger point for mobile (52% waits until it hits the line)
        const syncTrigger = window.innerWidth < 768 ? 'top 52%' : 'top 60%'

        // 2. Text Reveal Trigger
        ScrollTrigger.create({
          trigger: step,
          start: syncTrigger,
          once: true,
          onEnter: () => {
            const texts = step.querySelectorAll('.reveal-text')
            texts.forEach((span, index) => {
              if (!span.classList.contains('is-visible')) {
                // ADDED: 0.2s base delay so it waits a split second after the line connects
                span.style.animationDelay = `${0.2 + index * 0.04}s`
                span.classList.add('is-visible')
              }
            })
          },
        })

        // 3. Containers — matched the 0.2s delay here as well
        if (leftContent) {
          gsap.fromTo(
            leftContent,
            { x: -40, opacity: 0 },
            {
              scrollTrigger: {
                trigger: step,
                start: syncTrigger,
                once: true,
              },
              x: 0,
              opacity: 1,
              duration: 0.55,
              delay: 0.2, // Matches the text delay
              ease: 'power2.out',
            }
          )
        }

        if (rightContent) {
          gsap.fromTo(
            rightContent,
            { x: 40, opacity: 0 },
            {
              scrollTrigger: {
                trigger: step,
                start: syncTrigger,
                once: true,
              },
              x: 0,
              opacity: 1,
              duration: 0.55,
              delay: 0.2, // Matches the text delay
              ease: 'power2.out',
            }
          )
        }
      })
    }, container)

    updateStepHighlights()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    ScrollTrigger.addEventListener('refresh', updateStepHighlights)

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            ScrollTrigger.refresh()
            requestAnimationFrame(updateStepHighlights)
          }
        })
      },
      { threshold: 0, rootMargin: '100px' }
    )
    observer.observe(container)

    ScrollTrigger.refresh()
    updateStepHighlights()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ScrollTrigger.removeEventListener('refresh', updateStepHighlights)
      if (rafId != null) cancelAnimationFrame(rafId)
      highlightTrigger?.kill()
      ctx.revert()
      observer.disconnect()
    }
  }, [disableScrollAnimations, isVisible])

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#591902] py-40 overflow-hidden font-sans text-white"
      style={{ scrollMarginTop: '100px' }}
    >
      <h2 className="text-[24px] md:text-[61px] text-center mb-32 tracking-wide font-serif font-display reveal-heading">
        <span className="reveal-wrapper">
          <span className="reveal-text">HOW 11 WORKS</span>
        </span>
      </h2>

      <div
        ref={stepsWrapRef}
        className="relative w-full max-w-[1000px] mx-auto flex flex-col items-center px-4 md:px-0"
      >
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white opacity-20 -translate-x-1/2" />

        <div
          className="progress-line absolute top-0 bottom-0 left-1/2 w-[2px] bg-white -translate-x-1/2 z-30"
          style={{
            transformOrigin: 'top center',
            boxShadow: '0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(205,177,126,0.5)',
          }}
        />

        {howSteps.map(step => {
          const IconComponent = step.icon
          return (
            <div
              key={step.id}
              className="step-item relative w-full flex items-start justify-between mb-[140px] last:mb-0"
            >
              {step.side === 'right' ? (
                <>
                  <div className="left-content w-1/2 pr-4 md:pr-20 flex justify-end items-start mt-8 step-reveal opacity-0 min-w-0">
                    <span className="reveal-wrapper">
                      <span className="reveal-text reveal-text-x-left">
                        <IconComponent />
                      </span>
                    </span>
                  </div>
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
                    <h3 className="w-full text-[16px] md:text-[27px] font-serif font-display mb-3 leading-[1.1] opacity-100 step-reveal">
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{step.title}</span>
                      </span>
                    </h3>
                    <p className="w-full text-[12px] md:text-[16px] leading-[1.5] max-w-[342px] font-light opacity-100 step-reveal">
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{step.desc}</span>
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <>
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
                    <h3 className="w-full text-[16px] md:text-[27px] font-serif font-display mb-3 leading-[1.1] opacity-100 step-reveal">
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{step.title}</span>
                      </span>
                    </h3>
                    <p className="w-full text-[12px] md:text-[16px] leading-[1.5] max-w-[342px] font-light opacity-100 step-reveal">
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{step.desc}</span>
                      </span>
                    </p>
                  </div>
                  <div className="right-content w-1/2 min-w-0 pl-4 md:pl-20 flex justify-start items-start mt-8 step-reveal opacity-0">
                    <span className="reveal-wrapper">
                      <span className="reveal-text reveal-text-x-right">
                        <IconComponent />
                      </span>
                    </span>
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

const CTASection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.consultation_cta ?? {}

  return (
    <section className="w-full flex justify-center bg-[#591902] font-sans">
      <div className="w-full max-w-[1440px] h-[360px] flex flex-col items-center py-[80px] px-6">
        <h2
          className="text-[#FFFFFF] text-[24px] md:text-[36px] font-normal leading-none text-center font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading ?? 'Confused, Excited or somewhere in between?'}
            </span>
          </span>
        </h2>

        <p className="text-[#FFFFFF] opacity-50 text-[12px] md:text-[16px] font-normal leading-[1.5] text-center max-w-[723px] mt-[32px] reveal-on-scroll">
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.body ??
                "Drop your details, and we'll get in touch. You're just one call away from turning the confusion into a clear, sorted plan."}
            </span>
          </span>
        </p>

        <span className="mt-[40px] reveal-wrapper reveal-wrapper--overflow-visible reveal-on-scroll">
          <span className="reveal-text">
            <button className="group flex flex-row justify-center items-center gap-[12.2px] bg-[#CDB17E] rounded-[42.6878px] w-[180.98px] min-h-[36px] h-[36px] pl-[18.2948px] pr-[3.04913px] py-0 md:rounded-[56px] md:w-[243px] md:h-[44px] md:min-h-0 md:pl-[24px] md:pr-[4px] md:py-[4px] hover:bg-[#bfa06b] transition-colors">
              <span className="text-[#FAFAFA] text-[12px] md:text-[16px] font-medium leading-[150%] tracking-wide w-[120px] h-[18px] md:w-auto md:h-auto whitespace-nowrap">
                {s.cta_label ?? 'Book a Consultation'}
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
            </button>
          </span>
        </span>
      </div>
    </section>
  )
}

const BetterWaySection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.better_way ?? {}

  const scallopCount = [...Array(15)]

  return (
    <section className="w-full flex justify-center bg-[#F2F2F2] md:bg-[#F7F7F5] overflow-hidden font-sans relative">
      <div className="relative w-full max-w-[1440px] mx-auto h-[841px] md:h-[1171px] shrink-0">
        {/* --- SCALLOP / BULB SECTION (Untouched) --- */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-max flex pointer-events-none z-10">
          {scallopCount.map((_, i) => (
            <div
              key={i}
              className="relative shrink-0 w-[65.5px] h-[40.94px] md:w-[144px] md:h-[90px]"
            >
              <div
                className="absolute top-0 left-0 w-[65.5px] h-[40.94px] md:w-[144px] md:h-[90px] bg-[#CDB17E]"
                style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
              ></div>
              <div
                className="absolute top-0 left-0 w-[65.5px] h-[32.75px] md:w-[144px] md:h-[72px] bg-[#591902]"
                style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
              ></div>

              {i !== scallopCount.length - 1 && (
                <div
                  className="absolute top-0 right-0 flex flex-col items-center z-20 animate-swing"
                  style={{
                    animationDuration: `${3.5 + (i % 3) * 0.5}s`,
                    animationDelay: `${(i % 5) * 0.2}s`,
                  }}
                >
                  <div
                    className={`w-[1px] ${i % 2 === 0 ? 'h-[-10px] md:h-[-14px]' : 'h-[-4px] md:h-[-5px]'} bg-[#591902]/40`}
                  ></div>
                  <div className="relative flex flex-col items-center -mt-3 md:-mt-4">
                    <img
                      src={i % 2 === 0 ? bulb1 : bulb2}
                      alt="Light"
                      className="w-[20px] md:w-[32px] h-auto relative z-10"
                    />
                    <div
                      className={`absolute left-1/2 top-full -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] opacity-40 pointer-events-none animate-beam ${
                        i % 2 === 0
                          ? 'md:w-[76px] md:h-[78px] blur-[6px] md:blur-[8px]'
                          : 'md:w-[76px] md:h-[59px] blur-[4px] md:blur-[4px]'
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

        {/* --- HEADINGS --- */}
        <div className="absolute w-[353px] md:w-[809px] max-w-[calc(100%-2rem)] left-1/2 -translate-x-1/2 top-[179px] md:top-[253px] flex flex-col items-center gap-[20px] md:gap-[10px] md:static md:block md:w-full md:max-w-none md:translate-x-0">
          <h2
            className="w-full text-[#2D2D2D] text-[24px] md:text-[61px] leading-[1] text-center font-serif reveal-heading md:absolute md:w-[679px] md:left-1/2 md:-translate-x-1/2 md:top-[253px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            {s.heading ? (
              <span className="reveal-wrapper">
                <span className="reveal-text">{s.heading}</span>
              </span>
            ) : (
              <>
                <span className="reveal-wrapper">
                  <span className="reveal-text">A Better Way Between </span>
                </span>
                <br className="hidden md:block" />
                <span className="reveal-wrapper">
                  <span className="reveal-text">Event and DIY</span>
                </span>
              </>
            )}
          </h2>

          <p className="w-full text-[#2D2D2D] opacity-50 text-[14px] md:text-[16px] leading-[150%] md:leading-[1.5] text-center reveal-on-scroll md:absolute md:w-[809px] md:left-1/2 md:-translate-x-1/2 md:top-[403px] font-['Poppins'] md:font-sans">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                Event planners can feel expensive and overwhelming. Doing everything yourself can
                quickly become stressful. Elewen brings the best of both, thoughtful styling without
                the chaos.
              </span>
            </span>
          </p>
        </div>

        {/* --- VENN DIAGRAM (MOBILE & DESKTOP) --- */}
        {/* Desktop Version */}
        <div className="hidden md:block absolute w-[723px] max-w-[calc(100%-2rem)] h-[422px] left-1/2 -translate-x-1/2 top-[531px]">
          <svg
            width="723"
            height="422"
            viewBox="0 0 723 422"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <clipPath id="intersectClipDesktop">
                <circle cx="211" cy="211" r="211" />
              </clipPath>
            </defs>
            <circle cx="211" cy="211" r="211" fill="#CDB17E" />
            <circle cx="512" cy="211" r="211" fill="#591902" />
            <circle
              cx="512"
              cy="211"
              r="211"
              fill="#FFFFFF"
              clipPath="url(#intersectClipDesktop)"
            />
          </svg>
        </div>

        {/* Mobile Version */}
        <div className="block md:hidden absolute w-[353px] h-[206.04px] left-1/2 -translate-x-1/2 top-[371px]">
          <svg
            width="353"
            height="207"
            viewBox="0 0 353 207"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <clipPath id="intersectClipMobile">
                <circle cx="103.02" cy="103.02" r="103.02" />
              </clipPath>
            </defs>
            <circle cx="103.02" cy="103.02" r="103.02" fill="#CDB17E" />
            <circle cx="249.98" cy="103.02" r="103.02" fill="#591902" />
            <circle
              cx="249.98"
              cy="103.02"
              r="103.02"
              fill="#FFFFFF"
              clipPath="url(#intersectClipMobile)"
            />
          </svg>
        </div>

        {/* --- DIAGRAM TEXTS --- */}
        <h5
          className="absolute left-[calc(50%-73px)] md:left-[calc(50%-150.5px)] top-[474px] md:top-[742px] w-[95.31px] md:w-[185px] -translate-x-1/2 -translate-y-1/2 text-left md:text-center text-[#591902] text-[24.7px] md:text-[27px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {s.left_label ?? 'Event Planner'}
        </h5>

        <h5
          className="absolute left-[calc(50%+130px)] md:left-[calc(50%+150.5px)] top-[474px] md:top-[742px] w-[46px] md:w-[80px] -translate-x-1/2 -translate-y-1/2 text-left md:text-center text-[#CDB17E] text-[24.7px] md:text-[27px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {s.right_label ?? 'DIY'}
        </h5>

        {/* --- LOGO --- */}
        <div className="absolute left-1/2 top-[474px] md:top-[742px] w-[37.71px] md:w-[320px] h-[44px] md:h-[320px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <img
            src={centerLogo}
            alt="11 Logo"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>

        {/* --- MOBILE DASHED LINE --- */}
        <div className="block md:hidden absolute left-1/2 top-[558px] -translate-x-1/2 w-[1px] h-[145px] border-l-[0.5px] border-dashed border-[#000000]"></div>

        {/* --- DESKTOP DASHED LINE --- */}
        <div className="hidden md:block absolute left-1/2 top-[900px] -translate-x-1/2 w-[1px] h-[145px] border-l-[1px] border-dashed border-[#000000]/30"></div>

        {/* --- SUB TEXTS --- */}
        <p className="absolute w-[120px] md:w-[200px] left-[20px] md:left-[30px] top-[597px] md:top-[688px] text-[#957960] text-[12px] leading-[150%] md:leading-[1.5] font-['Poppins'] md:font-sans">
          <span className="hidden md:inline">
            {s.left_body ??
              'Full-service planning often comes with high costs and long coordination cycles. You rely on large teams, multiple approvals, and a process that can feel heavier than the event itself.'}
          </span>
          <span className="md:hidden">Costly and slow, with too many layers.</span>
        </p>

        <p className="absolute w-[120px] md:w-[200px] right-[20px] md:right-[30px] top-[597px] md:top-[688px] text-[#591902] text-[12px] leading-[150%] md:leading-[1.5] text-right font-['Poppins'] md:font-sans">
          <span className="hidden md:inline">
            {s.right_body ??
              'Planning everything yourself means juggling vendors, comparing prices, managing logistics, and making countless decisions. It quickly turns a celebration into a checklist.'}
          </span>
          <span className="md:hidden">
            Too many vendors, too many choices, DIY planning turns joy into work.
          </span>
        </p>

        <p className="absolute w-[200px] md:w-[285px] left-1/2 -translate-x-1/2 top-[711px] md:top-[993px] text-[#2D2D2D] text-[12px] leading-[150%] md:leading-[1.5] text-center font-['Poppins'] md:font-sans">
          <span className="hidden md:inline">
            {s.center_body ??
              'The balance between structure and simplicity. You get curated décor, trusted vendors, and guided planning, without the pressure or the price of full-scale event management.'}
          </span>
          <span className="md:hidden">
            The perfect balance of structure and simplicity. curated décor, trusted vendors, guided
            planning, without the cost or pressure.
          </span>
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
  const chaosItems = s.chaos_items ?? [
    { title: 'Too much scrolling.' },
    { title: 'Too many calls.' },
    { title: 'Too many vendors.' },
    { title: 'Too many decisions.' },
  ]
  const reliefItems = s.relief_items ?? [
    "You don't manage people",
    "You don't manage logistics",
    'No chasing vendors',
    'No waiting anxiously!',
  ]

  const scallopCount = [...Array(15)]
  const sectionRef = useRef(null)
  const [howItWorksVisible, setHowItWorksVisible] = useState(false)
  const [isLayoutVisible, setIsLayoutVisible] = useState(false)
  const gateAreaRef = useRef(null)
  const gateRef = useRef(null)
  const howItWorksRef = useRef(null)
  const layoutWrapRef = useRef(null)
  const [layoutScale, setLayoutScale] = useState(1)

  useEffect(() => {
    const wrap = layoutWrapRef.current
    if (!wrap) return

    const resize = () => {
      const available = wrap.clientWidth
      const isMobile = window.innerWidth < 768
      const mobileBoost = isMobile ? 1.62 : 1
      const scale = Math.min((available / LAYOUT_W) * mobileBoost, 1)
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
      { threshold: 0.2 }
    )

    observer.observe(wrap)
    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const gateArea = gateAreaRef.current
    const gate = gateRef.current
    const howItWorks = howItWorksRef.current
    if (!gateArea || !gate || !howItWorks) return

    const doorFill = gate.querySelector('#door-fill')
    const doorTable = gate.querySelector('#door-table')
    const doorLights = gate.querySelector('#door-lights')
    const doorCurvedText = gate.querySelector('#door-curved-text')

    const isMobile = window.innerWidth < 768

    const scaleEnd = isMobile ? 3.6 : 4
    const gateLiftY = isMobile ? -260 : -220
    const scrollEnd = isMobile ? 1300 : 1500
    const scrubVal = isMobile ? 1 : 1

    const getMobileStartTrigger = () => {
      if (!gate) return 'bottom bottom'
      // The door is scaled by 2.8 on mobile from the center.
      // This means it extends 0.9 * height below its bounding box.
      // We want to trigger when the visual bottom reaches the viewport bottom.
      const extraHeight = gate.offsetHeight * 0.9
      return `bottom+=${extraHeight}px bottom`
    }
    const startTrigger = isMobile ? getMobileStartTrigger : 'bottom bottom'

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: gate,
        start: startTrigger,
        end: `+=${scrollEnd}`,
        scrub: scrubVal,
        pin: gateArea,
        pinSpacing: true,
        invalidateOnRefresh: true,
      },
    })

    tl.to(gate, { scale: scaleEnd, y: gateLiftY, ease: 'power2.in', duration: 1 }, 0)
    if (doorTable) tl.to(doorTable, { x: 120, ease: 'power2.in', duration: 1 }, 0)
    if (doorLights) tl.to(doorLights, { y: -60, ease: 'power2.in', duration: 1 }, 0)
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
          duration: 1,
        },
        0
      )

    if (doorFill) tl.to(doorFill, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.78)
    tl.to(gate, { opacity: 0, duration: 0.15, ease: 'power2.out' }, 0.88)

    tl.to(
      howItWorks,
      {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          const hSection = howItWorksRef.current
          if (hSection) {
            let delay = 0
            hSection.querySelectorAll('.reveal-wrapper').forEach(wrapper => {
              wrapper.querySelectorAll('.reveal-text').forEach(t => {
                if (!t.classList.contains('is-visible')) {
                  t.style.animationDelay = `${delay}s`
                  t.classList.add('is-visible')
                  delay += 0.04
                }
              })
            })
          }
          setHowItWorksVisible(true)
        },
      },
      0.85
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="checklist-section relative w-full min-h-screen bg-white overflow-x-clip flex flex-col items-center pb-0"
    >
      <div
        className="absolute hidden md:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
        style={{ left: '-10%', top: '5%', transform: 'rotate(-37.82deg)' }}
      />
      <div
        className="absolute hidden md:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
        style={{ right: '5%', top: '30%', transform: 'rotate(-37.82deg)' }}
      />

      {/* Lightbulbs */}
      <div className="absolute top-0 left-0 w-full h-[300px] overflow-hidden pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-full flex">
          {scallopCount.map((_, i) => {
            return (
              <div
                key={i}
                className="relative shrink-0 w-[65.5px] md:w-[144px] h-[40.94px] md:h-[90px]"
              >
                <div
                  className="absolute top-0 left-0 w-full h-[40.94px] md:h-[72px] bg-[#CDB17E]"
                  style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
                ></div>
                <div
                  className="absolute top-0 left-0 w-full h-[32.75px] md:h-[60px] bg-[#F2F2F2]"
                  style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
                ></div>

                {i !== scallopCount.length - 1 && (
                  <div
                    className="absolute top-0 right-0 flex flex-col items-center z-20 animate-swing"
                    style={{
                      animationDuration: `${3.5 + (i % 3) * 0.5}s`,
                      animationDelay: `${(i % 5) * 0.2}s`,
                    }}
                  >
                    <div
                      className={`w-[1px] ${
                        i % 2 === 0 ? 'h-[-10px] md:h-[-15px]' : 'h-[-4px] md:h-[-5px]'
                      } bg-[#591902]/40`}
                    ></div>
                    <div className="relative flex flex-col items-center -mt-3 md:-mt-4">
                      <img
                        src={i % 2 === 0 ? bulb1 : bulb2}
                        alt="Light"
                        className="w-[20px] md:w-[32px] h-auto relative z-10"
                        loading="lazy"
                      />
                      <div
                        className={`absolute left-1/2 top-full -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] opacity-40 pointer-events-none animate-beam ${
                          i % 2 === 0
                            ? 'md:w-[76px] md:h-[78px] blur-[6px] md:blur-[8px]'
                            : 'md:w-[76px] md:h-[59px] blur-[4px] md:blur-[4px]'
                        }`}
                        style={{
                          animationDuration: `${4 + (i % 3) * 0.75}s`,
                          animationDelay: `${(i % 5) * 0.2}s`,
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
            )
          })}
        </div>
      </div>

      <h2
        className="text-[24px] md:text-[61px] leading-[1.1] md:leading-[1] text-center text-[#591902] font-normal tracking-normal mt-[110px] md:mt-[260px] px-4 relative z-10 reveal-heading"
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

      <div
        ref={layoutWrapRef}
        className="w-full max-w-[1034px] mx-auto mt-6 md:mt-24 mb-8 md:mb-32 z-10 font-sans"
      >
        <div
          className="relative w-full overflow-hidden mx-auto"
          style={{
            maxWidth: `${LAYOUT_W}px`,
            height: `${LAYOUT_H * layoutScale}px`,
          }}
        >
          <div
            className="absolute top-0 left-[calc(50%+18px)] md:left-1/2"
            style={{
              width: `${LAYOUT_W}px`,
              height: `${LAYOUT_H}px`,
              transform: `translateX(-50%) scale(${layoutScale})`,
              transformOrigin: 'top center',
            }}
          >
            {/* STEP 1 */}
            <div className="absolute left-[283px] top-[19px] w-[211px] h-[211px]">
              <div
                className={`anim-element slide-from-left ${isLayoutVisible ? 'is-visible' : ''} absolute inset-0 bg-[#BFAC9B] rounded-tl-full z-0`}
                style={{
                  '--delay': '0s',
                  boxShadow:
                    '8px 12px 28px rgba(109, 57, 8, 0.22), 3px 4px 12px rgba(109, 57, 8, 0.14)',
                }}
              ></div>
              <img
                src={imgScrolling}
                className={`anim-element slide-from-bottom ${isLayoutVisible ? 'is-visible' : ''} absolute bottom-0 right-[-40px] h-[250px] w-auto max-w-none object-contain object-bottom z-10 pointer-events-none`}
                alt="Scrolling"
                style={{
                  '--delay': '0.15s',
                  filter:
                    'drop-shadow(12px 16px 18px rgba(68, 33, 4, 0.22)) drop-shadow(2px 4px 8px rgba(68, 33, 4, 0.18))',
                }}
                loading="lazy"
              />
            </div>
            <div
              className={`anim-element slide-from-left ${isLayoutVisible ? 'is-visible' : ''} absolute left-[196px] top-[170px] w-[113px] text-right z-20`}
              style={{ '--delay': '0.25s' }}
            >
              <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">
                {chaosItems[0]?.title ?? 'Too much scrolling.'}
              </h3>
            </div>
            <div
              className={`anim-element slide-from-left ${isLayoutVisible ? 'is-visible' : ''} absolute left-[0px] top-[232px] w-[273px] text-right z-20`}
              style={{ '--delay': '0.3s' }}
            >
              <p className="hidden md:block text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                What was once simple now means endless scrolling — and still no confidence.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="absolute left-[510px] top-[1px] w-[524px] h-[229px] z-10">
              <div
                className={`anim-element slide-from-right ${isLayoutVisible ? 'is-visible' : ''} absolute left-[0px] top-[18px] w-[211px] h-[211px] bg-[#BFAC9B] rounded-tr-full z-0`}
                style={{
                  '--delay': '0.5s',
                  boxShadow:
                    '8px 12px 28px rgba(109, 57, 8, 0.22), 3px 4px 12px rgba(109, 57, 8, 0.14)',
                }}
              ></div>
              <img
                src={imgCalls}
                alt="Calls"
                className={`anim-element slide-from-bottom ${isLayoutVisible ? 'is-visible' : ''} absolute left-[13px] top-[0px] w-[231px] h-[229px] object-cover object-top z-10 pointer-events-none`}
                style={{
                  '--delay': '0.65s',
                  filter:
                    'drop-shadow(12px 16px 18px rgba(68, 33, 4, 0.22)) drop-shadow(2px 4px 8px rgba(68, 33, 4, 0.18))',
                }}
                loading="lazy"
              />
              <div
                className={`anim-element slide-from-right ${isLayoutVisible ? 'is-visible' : ''} absolute left-[157px] top-[83px] w-[113px] text-left z-20`}
                style={{ '--delay': '0.8s' }}
              >
                <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2] font-sans">
                  {chaosItems[1]?.title ?? 'Too many calls.'}
                </h3>
              </div>
              <div
                className={`anim-element slide-from-right ${isLayoutVisible ? 'is-visible' : ''} absolute left-[251px] top-[145px] w-[273px] text-left z-20`}
                style={{ '--delay': '0.85s' }}
              >
                <p className="hidden md:block text-[12px] text-[#591902] opacity-50 leading-[1.5] font-sans">
                  Follow-ups, confirmations, negotiations, and last-minute checks — your phone turns
                  into a coordination hub, and excitement becomes stress.
                </p>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="absolute left-[510px] top-[246px] w-[211px] h-[211px]">
              <div
                className={`anim-element slide-from-left ${isLayoutVisible ? 'is-visible' : ''} absolute inset-0 bg-[#BFAC9B] z-0`}
                style={{
                  '--delay': '1.0s',
                  boxShadow:
                    '8px 12px 28px rgba(109, 57, 8, 0.22), 3px 4px 12px rgba(109, 57, 8, 0.14)',
                }}
              ></div>
              <img
                src={imgVendors}
                className={`anim-element slide-from-bottom ${isLayoutVisible ? 'is-visible' : ''} absolute bottom-0 left-1/2 -translate-x-1/2 h-[280px] w-auto max-w-[400px] object-contain object-bottom z-10 pointer-events-none`}
                alt="Vendors"
                style={{
                  '--delay': '1.15s',
                  filter:
                    'drop-shadow(12px 16px 18px rgba(68, 33, 4, 0.22)) drop-shadow(2px 4px 8px rgba(68, 33, 4, 0.18))',
                }}
                loading="lazy"
              />
            </div>
            <div
              className={`anim-element slide-from-left ${isLayoutVisible ? 'is-visible' : ''} absolute left-[400px] top-[337px] w-[113px] text-right z-20`}
              style={{ '--delay': '1.25s' }}
            >
              <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">
                {chaosItems[2]?.title ?? 'Too many vendors.'}
              </h3>
            </div>
            <div
              className={`anim-element slide-from-left ${isLayoutVisible ? 'is-visible' : ''} absolute left-[225px] top-[399px] w-[273px] text-right z-20`}
              style={{ '--delay': '1.3s' }}
            >
              <p className="hidden md:block text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                One decorator, one caterer, one supplier, different prices, different chaos.
                You&apos;re not planning a celebration; you&apos;re managing a team.
              </p>
            </div>

            {/* STEP 4 — outer clip + img as direct child (260×211) matches original positioning */}
            <div className="absolute left-[461px] top-[466px] w-[260px] h-[211px] overflow-hidden rounded-br-full">
              <div
                className={`anim-element slide-from-right ${isLayoutVisible ? 'is-visible' : ''} absolute right-0 top-0 w-[211px] h-full bg-[#BFAC9B] z-0`}
                style={{
                  '--delay': '1.5s',
                  boxShadow:
                    '8px 12px 28px rgba(109, 57, 8, 0.22), 3px 4px 12px rgba(109, 57, 8, 0.14)',
                }}
              ></div>
              <img
                src={imgDecisions}
                alt="Decisions"
                className={`anim-element slide-from-bottom ${isLayoutVisible ? 'is-visible' : ''} absolute bottom-[-50px] left-[-50px] h-[300px] w-auto max-w-none object-cover object-bottom z-10 pointer-events-none`}
                style={{
                  '--delay': '1.65s',
                  filter:
                    'drop-shadow(12px 16px 18px rgba(68, 33, 4, 0.22)) drop-shadow(2px 4px 8px rgba(68, 33, 4, 0.18))',
                }}
                loading="lazy"
              />
            </div>
            <div
              className={`anim-element slide-from-right ${isLayoutVisible ? 'is-visible' : ''} absolute left-[662px] top-[551px] w-[122px] text-left z-20`}
              style={{ '--delay': '1.75s' }}
            >
              <h3 className="text-[21px] font-medium text-[#591902] leading-[1.2]">
                {chaosItems[3]?.title ?? 'Too many decisions.'}
              </h3>
            </div>
            <div
              className={`anim-element slide-from-right ${isLayoutVisible ? 'is-visible' : ''} absolute left-[721px] top-[613px] w-[273px] text-left z-20`}
              style={{ '--delay': '1.8s' }}
            >
              <p className="hidden md:block text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                Color themes, backdrops, menus, endless add-ons — more options don&apos;t mean more
                freedom, just more pressure.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 md:gap-8 mb-20 md:mb-32 z-10 text-center mt-8 md:mt-[40px] px-6">
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

        {/* RESTORED: The missing text block is back! */}
        <h4
          className="text-[20px] md:text-[27px] text-[#591902] leading-[1.2] font-serif mt-8 md:mt-12 px-2 reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.tagline ?? '11 takes the chaos out so you can stay in the moment'}
            </span>
          </span>
        </h4>
      </div>

      {/* CHANGED: Increased the height to min-h-[90vh] so the taller door fits safely */}
      <div className="relative w-full z-10 mt-[80px] md:mt-10 overflow-visible md:overflow-hidden min-h-[90vh] md:min-h-[100vh]">
        <div
          ref={gateAreaRef}
          className="relative w-full h-[90vh] md:h-[100vh] z-20"
          style={{ position: 'relative' }}
        >
          <div className="absolute inset-0 flex justify-center items-start md:items-center pt-16 md:pt-0">
            <div
              ref={gateRef}
              className="w-full max-w-[1200px] px-2 md:px-4"
              style={{ transformOrigin: 'center center', willChange: 'transform' }}
            >
              {/* CHANGED: Increased scale back up to [2.8] for taller door */}
              <div className="scale-[2.8] md:scale-100 origin-center w-full">
                <CelebrationDoor className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>

        <div
          ref={howItWorksRef}
          className="relative z-10 -mt-[50vh] md:-mt-[100vh]"
          style={{ opacity: 0 }}
        >
          <HowItWorksSection isVisible={howItWorksVisible} />
        </div>
      </div>

      <CTASection />
      <BetterWaySection />
    </section>
  )
}

// Local fallback images — used until Strapi media is uploaded
// Order matches PACKAGES_FALLBACK in src/data/packages.js
const PKG_LOCAL_IMAGES = [
  [pkgImg1, pkgImg2, pkgImg3],
  [pkgImg4, pkgImg5, pkgImg6],
  [pkgImg7, pkgImg8, pkgImg9],
  [pkgImg2, pkgImg4, pkgImg7],
  [pkgImg5, pkgImg1, pkgImg8],
]

const PackagesSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.packages_intro ?? {}

  const [virtualIndex, setVirtualIndex] = useState(0)
  const [disableTransition, setDisableTransition] = useState(false)
  const lastDirectionRef = useRef('next')
  const [isMobile, setIsMobile] = useState(false)

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

  // CMS: Strapi `packages` with elements, addons, images
  const { data: cmsPackages = [] } = usePackages()
  // Merge: use Strapi images when available, fall back to local assets
  const packagesData = cmsPackages.map((pkg, i) => ({
    ...pkg,
    desc:
      typeof pkg.description === 'string'
        ? pkg.description
        : typeof pkg.desc === 'string'
          ? pkg.desc
          : '',
    images: pkg.images?.length ? pkg.images : (PKG_LOCAL_IMAGES[i] ?? []),
  }))

  const count = packagesData.length
  const totalCards = count * 3
  /** 3D ring needs ≥2 packages; with 1 CMS item the triple-buffer showed 3 identical cards */
  const usePackageCylinder = count > 1

  const handleTransitionEnd = () => {
    if (count === 0 || !usePackageCylinder) return
    if (virtualIndex >= count * 2) {
      setDisableTransition(true)
      setVirtualIndex(count)
      requestAnimationFrame(() => setDisableTransition(false))
    }
  }

  const handleNext = () => {
    if (count === 0 || !usePackageCylinder) return
    lastDirectionRef.current = 'next'
    setVirtualIndex(prev => Math.min(prev + 1, count * 2))
  }

  const handlePrev = () => {
    if (count === 0 || !usePackageCylinder) return
    lastDirectionRef.current = 'prev'
    setVirtualIndex(prev => (prev <= 0 ? totalCards - 1 : prev - 1))
  }

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

  const effectiveVirtualIndex = count === 1 ? 0 : virtualIndex
  const displayIndex = count > 0 ? effectiveVirtualIndex % count : 0

  const sortedCards = useMemo(() => {
    if (count === 0) return []
    if (count === 1) {
      const pkg = packagesData[0]
      return [{ pkg, index: 0 }]
    }
    const extended = [...packagesData, ...packagesData, ...packagesData]
    return extended
      .map((pkg, index) => ({ pkg, index }))
      .sort((a, b) => {
        if (a.index === effectiveVirtualIndex) return 1
        if (b.index === effectiveVirtualIndex) return -1
        return a.index - b.index
      })
  }, [packagesData, effectiveVirtualIndex, count])

  return (
    <section
      className="relative w-full min-h-auto md:min-h-screen bg-[#F2F2F2] md:bg-[#F4F4F2] pt-10 md:pt-8 pb-10 md:pb-28 md:-mt-4 overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Global Styles for inner Swiper + fix arrow click blocking */}
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
          className="text-[#2D2D2D] text-[24px] md:text-[61px] leading-[1] max-w-[353px] md:max-w-[1050px] mb-[16px] md:mb-6 font-serif reveal-heading"
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
          className="text-[#000000] md:text-[#2D2D2D] text-[20px] md:text-[32px] leading-[1] font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.section_heading ?? 'OUR MOST LOVED PACKAGES'}</span>
          </span>
        </h3>
      </div>

      {/* --- 2. Carousel - 3D cylinder --- */}
      <div className="relative w-full overflow-x-hidden mt-[24px] md:-mt-10">
        {/* Top curved edge (Hidden on mobile to save space, z-0 to stay behind cards) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[1440px] max-w-[100vw] h-[100px] z-0 pointer-events-none hidden md:block"
          style={{
            background: '#F4F4F2',
            borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          }}
        />

        <div
          className="relative min-h-[480px] md:min-h-[790px] w-full grid place-content-center overflow-hidden px-0 z-10"
          style={{
            perspective: isMobile ? '130em' : '80em',
            maskImage: isMobile
              ? 'none'
              : 'linear-gradient(90deg, transparent 0%, black 28%, black 72%, transparent 100%)',
            WebkitMaskImage: isMobile
              ? 'none'
              : 'linear-gradient(90deg, transparent 0%, black 28%, black 72%, transparent 100%)',
          }}
        >
          {/* --- Mobile Only Navigation Arrows (Half Circles on Edges) --- */}
          <div
            className={`absolute inset-y-0 left-0 right-0 md:hidden z-[100] flex items-center justify-between pointer-events-none ${usePackageCylinder ? '' : 'hidden'}`}
          >
            <button
              type="button"
              onClick={handlePrev}
              className="pointer-events-auto w-[34px] h-[68px] bg-[#1C1C1C] hover:bg-black rounded-r-full flex items-center justify-center transition-colors pr-[2px]"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FAFAFA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="pointer-events-auto w-[34px] h-[68px] bg-[#1C1C1C] hover:bg-black rounded-l-full flex items-center justify-center transition-colors pl-[2px]"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FAFAFA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div
            className="grid place-self-center w-full max-w-[100vw] pointer-events-none"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${usePackageCylinder ? -effectiveVirtualIndex * 36 : 0}deg)`,
              transition: disableTransition
                ? 'none'
                : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: disableTransition ? 'auto' : 'transform',
            }}
            onTransitionEnd={handleTransitionEnd}
            onTouchStart={isMobile && usePackageCylinder ? handleTouchStart : undefined}
            onTouchEnd={isMobile && usePackageCylinder ? handleTouchEnd : undefined}
          >
            {sortedCards.map(({ pkg, index }) => {
              const baseAngle = 36
              const halfAngleDeg = baseAngle / 2
              const halfAngleRad = (halfAngleDeg * Math.PI) / 180
              const cardWidth = isMobile ? 289 : 640
              const gap = isMobile ? 12 : 8
              const radius = (cardWidth / 2 + gap / 2) / Math.tan(halfAngleRad)
              const isActive = index === effectiveVirtualIndex
              const imageCount = pkg.images?.length ?? 0
              const useInnerSwiper = imageCount > 1

              return (
                <div
                  key={`pkg-${pkg.id ?? pkg.documentId ?? index}`}
                  onClick={() => usePackageCylinder && !isActive && setVirtualIndex(index)}
                  className={`relative flex flex-col bg-white overflow-hidden pointer-events-auto 
                    ${isActive ? 'cursor-default' : 'cursor-pointer'} 
                    w-[289px] md:w-[640px] h-[474px] md:h-[770px]
                    rounded-[8px] md:rounded-none
                  `}
                  style={{
                    gridArea: '1/1',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    transform: `rotateY(${index * 36}deg) translateZ(${-radius}px)`,
                    boxShadow: isActive
                      ? '0 12px 32px rgba(0,0,0,0.15)'
                      : '0 6px 20px rgba(0,0,0,0.1)',
                    // Mobile: Hide inactive completely. Desktop: 90% opacity for side cards
                    opacity: isActive ? 1 : isMobile ? 0 : 0.9,
                    pointerEvents: isActive ? 'auto' : isMobile ? 'none' : 'auto',
                    zIndex: isActive ? 50 : 0,
                  }}
                >
                  {/* Image area */}
                  <div className="p-[12px] md:px-5 md:pt-5 shrink-0">
                    <div
                      className={`relative w-full h-[240px] md:h-[450px] bg-[#EAEAEA] overflow-hidden rounded-[8px] md:rounded-none ${isActive ? 'card-swiper-active' : ''}`}
                    >
                      {isActive ? (
                        useInnerSwiper ? (
                          <Swiper
                            key={`inner-${pkg.id ?? index}-${imageCount}`}
                            modules={[Navigation, Pagination]}
                            navigation={{
                              prevEl: `.custom-prev-btn-${index}`,
                              nextEl: `.custom-next-btn-${index}`,
                            }}
                            pagination={{ clickable: true }}
                            loop
                            className="inner-card-swiper w-full h-full"
                          >
                            {pkg.images.map((imgSrc, i) => (
                              <SwiperSlide key={i}>
                                <img
                                  src={imgSrc}
                                  alt={`${pkg.title} - view ${i + 1}`}
                                  className="w-full h-full object-cover object-center"
                                  loading="eager"
                                />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        ) : (
                          <img
                            src={pkg.images?.[0] ?? ''}
                            alt={pkg.title}
                            className="w-full h-full object-cover object-center"
                            loading="eager"
                          />
                        )
                      ) : (
                        <img
                          src={pkg.images?.[0] ?? ''}
                          alt={pkg.title}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      )}

                      {/* Inner Arrow overlay (Now visible on Mobile & Desktop) */}
                      <div
                        className={`flex absolute inset-0 pointer-events-none z-[100] items-center justify-between ${useInnerSwiper && isActive ? '' : 'opacity-0 pointer-events-none'}`}
                      >
                        {/* CUSTOM LEFT ARROW */}
                        <button
                          type="button"
                          className={`custom-prev-btn-${index} pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 w-[30px] md:w-[36px] h-[60px] md:h-[56px] bg-white/20 md:bg-[#2D2D2D] backdrop-blur-[42px] md:backdrop-blur-none hover:bg-white/30 md:hover:bg-black rounded-r-full flex items-center justify-center transition-all duration-300 pr-[2px] ${isActive ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                        >
                          <svg
                            width={isMobile ? '20' : '18'}
                            height={isMobile ? '20' : '18'}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth={isMobile ? '1.86' : '3'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 12H5" />
                            <path d="m12 19-7-7 7-7" />
                          </svg>
                        </button>

                        {/* CUSTOM RIGHT ARROW */}
                        <button
                          type="button"
                          className={`custom-next-btn-${index} pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 w-[30px] md:w-[36px] h-[60px] md:h-[56px] bg-white/20 md:bg-[#2D2D2D] backdrop-blur-[42px] md:backdrop-blur-none hover:bg-white/30 md:hover:bg-black rounded-l-full flex items-center justify-center transition-all duration-300 pl-[2px] ${isActive ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                        >
                          <svg
                            width={isMobile ? '20' : '18'}
                            height={isMobile ? '20' : '18'}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth={isMobile ? '1.86' : '3'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Price tag */}
                      {isActive && (
                        <div
                          className="absolute right-[12px] md:right-4 top-[12px] md:top-4 flex items-center justify-center gap-1 bg-white rounded-[22px] md:rounded-[36px] z-10 pointer-events-none"
                          style={{ padding: isMobile ? '2.5px 7.4px' : '4px 12px' }}
                        >
                          <span className="text-[#364022] text-[12px] md:text-[18px] font-medium leading-[150%] font-['Poppins'] md:font-sans">
                            Starting from {pkg.price}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content area */}
                  <div
                    className="flex flex-col items-start flex-1 min-h-0 px-[12px] pb-[14px] md:px-8 md:pb-6 gap-[12px] md:gap-[20px]"
                    style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
                  >
                    <div className="flex flex-col items-start w-full gap-[12px] md:gap-[24px]">
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

                      <div className="flex flex-col items-start w-full gap-[12px] md:gap-[8px]">
                        <p className="text-[#2D2D2D] w-full font-medium text-[16px] md:text-[18px] leading-[150%] font-['Poppins'] md:font-sans">
                          Includes :
                        </p>
                        <div className="flex flex-wrap gap-[2.5px] md:gap-1">
                          {pkg.tags.map((tag, i) => (
                            <div
                              key={i}
                              className="flex justify-center items-center rounded-[29px] md:rounded-[48px]"
                              style={{
                                background: 'rgba(0, 0, 0, 0.05)',
                                padding: isMobile ? '1.2px 7.4px' : '2px 12px',
                              }}
                            >
                              <span className="text-[#2D2D2D] font-medium text-[12px] md:text-[18px] leading-[150%] font-['Poppins'] md:font-sans">
                                {tag}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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
        className={`${usePackageCylinder ? 'hidden md:flex' : 'hidden'} w-[611px] max-w-[90vw] h-[48px] mx-auto justify-between items-center gap-[25px] z-20 relative -mt-20`}
      >
        <button
          type="button"
          onClick={handlePrev}
          className="w-12 h-12 rounded-[96px] flex items-center justify-center transition-all shrink-0 bg-[#2D2D2D] hover:bg-black cursor-pointer"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-[4px] w-[100px] h-[8px] justify-center">
          {packagesData.map((_, idx) => (
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
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Mobile Main Pagination Dots */}
      <div
        className={`${usePackageCylinder ? 'flex md:hidden' : 'hidden'} items-center justify-center gap-[6px] mt-[16px] z-20 relative`}
      >
        {packagesData.map((_, idx) => (
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
  const [isMobile, setIsMobile] = useState(false)
  const revealRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Preload all 5 parallax images 2 viewports before this section scrolls into view
  const preloadRef = usePreloadOnApproach([img1, img2, img3, img4, img5], '200% 0px')

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  // Slightly stronger parallax on both breakpoints.
  // Negative y moves the images upward as the section scrolls.
  const intensity = isMobile ? 1.95 : 1.7
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150 * intensity])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80 * intensity])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -120 * intensity])
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -60 * intensity])
  const y5 = useTransform(scrollYProgress, [0, 1], [0, -200 * intensity])

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
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    )

    imgs.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const imageShadow =
    '-54px 121px 37px rgba(0, 0, 0, 0.01), -34px 77px 34px rgba(0, 0, 0, 0.04), -19px 43px 29px rgba(0, 0, 0, 0.14), -9px 19px 21px rgba(0, 0, 0, 0.24), -2px 5px 12px rgba(0, 0, 0, 0.28)'

  return (
    <section
      ref={el => {
        containerRef.current = el
        preloadRef.current = el
      }}
      className="w-full bg-[#BFAC9B] overflow-hidden flex justify-center font-sans relative h-[700px] md:h-[900px]"
    >
      <div ref={revealRef} className="relative w-[1440px] max-w-full h-full shrink-0">
        {/* Img 1 (Mapped to Figma Rectangle 37 on Mobile) */}
        <motion.img
          style={{ y: y1, boxShadow: imageShadow, '--img-delay': '0.02s' }}
          src={img1}
          alt="Event Decor"
          className="absolute w-[336px] md:w-[347px] h-[271px] md:h-[280px] -left-[103px] md:left-[0px] top-[5px] md:top-[100px] object-cover pointer-events-none z-0 celebration-img-reveal"
          loading="lazy"
        />

        {/* Img 2 (Mapped to Figma Rectangle 38 Bottom-Left on Mobile) */}
        <motion.img
          style={{ y: y2, boxShadow: imageShadow, '--img-delay': '0.10s' }}
          src={img2}
          alt="Event Decor"
          className="absolute w-[246px] md:w-[249px] h-[268px] md:h-[375px] -left-[46px] md:left-[42px] top-[432px] md:top-[450px] object-cover pointer-events-none z-0 celebration-img-reveal"
          loading="lazy"
        />

        {/* Img 3 (Hidden on Mobile, visible on Desktop) */}
        <motion.img
          style={{ y: y3, boxShadow: imageShadow, '--img-delay': '0.18s' }}
          src={img3}
          alt="Event Decor"
          className="absolute hidden md:block w-[290px] h-[316px] left-[497px] top-[700px] object-cover pointer-events-none z-0 celebration-img-reveal"
          loading="lazy"
        />

        {/* Img 4 (Mapped to Figma Rectangle 38 Top-Right on Mobile) */}
        <motion.img
          style={{ y: y4, boxShadow: imageShadow, '--img-delay': '0.26s' }}
          src={img4}
          alt="Event Decor"
          className="absolute w-[158px] md:w-[312px] h-[161px] md:h-[318px] left-[278px] md:left-[1034px] top-[391px] md:top-[400px] object-cover pointer-events-none z-0 celebration-img-reveal"
          loading="lazy"
        />

        {/* Img 5 (Mapped to Figma Rectangle 40 on Mobile) */}
        <motion.img
          style={{ y: y5, boxShadow: imageShadow, '--img-delay': '0.34s' }}
          src={img5}
          alt="Event Decor"
          className="absolute w-[215px] md:w-[505px] h-[113px] md:h-[265px] left-[257px] md:left-[909px] top-[141px] md:top-[50px] object-cover pointer-events-none z-0 celebration-img-reveal"
          loading="lazy"
        />

        <div className="sticky top-[180px] md:top-[250px] z-10 flex flex-col items-center">
          <h2
            className="w-[353px] md:w-[1148px] max-w-[calc(100%-2rem)] text-[#FFFFFF] text-[24px] md:text-[48px] lg:text-[96px] leading-[1] md:leading-[0.9] text-center font-serif drop-shadow-sm px-4 reveal-heading"
            style={{ fontFamily: "'Malgin', serif" }}
          >
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

          <p className="mt-[20px] md:mt-8 w-[353px] md:w-[522px] max-w-[calc(100%-2rem)] text-[#FFFFFF] opacity-90 md:opacity-100 text-[14px] md:text-[16px] leading-[150%] text-center drop-shadow-sm px-4 reveal-on-scroll font-['Poppins'] md:font-sans">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.body ??
                  'Want a professional to handle your event end to end? Fill the form and let our in-house planners plan it with you.'}
              </span>
            </span>
          </p>

          <span className="mt-[32px] md:mt-10 reveal-wrapper reveal-on-scroll">
            <span className="reveal-text">
              <button className="w-[181px] md:w-[213px] h-[33.5px] md:h-[44px] group flex items-center justify-between bg-[#FAFAFA] md:bg-[#FFFFFF] rounded-[42.7px] md:rounded-[56px] pl-[18.3px] md:pl-[24px] pr-[3px] md:pr-[4px] py-[3px] md:py-[4px] hover:bg-[#F2F2F2] transition-colors shadow-lg">
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
              </button>
            </span>
          </span>
        </div>
      </div>
    </section>
  )
}

const PlanningGuidesSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.blogs_intro ?? {}

  // CMS: Strapi `blogs` published posts + derived categories
  const { data: categories = [] } = useBlogCategories()
  const { data: allBlogs = [] } = useBlogs({ limit: 50 })

  const safeCategories = Array.isArray(categories) ? categories : []
  const safeAllBlogs = Array.isArray(allBlogs) ? allBlogs : []

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [page, setPage] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Track window size to toggle cards per page natively
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const activeCategory = selectedCategory ?? safeCategories[0] ?? null

  const filteredBlogs = activeCategory
    ? safeAllBlogs.filter(b => b?.category === activeCategory)
    : safeAllBlogs

  // Dynamic pagination: 1 card on mobile, CARDS_PER_PAGE (e.g. 3) on desktop
  const currentCardsPerPage = isMobile
    ? 1
    : typeof CARDS_PER_PAGE !== 'undefined'
      ? CARDS_PER_PAGE
      : 3
  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / currentCardsPerPage))
  const visibleBlogs = filteredBlogs.slice(
    page * currentCardsPerPage,
    (page + 1) * currentCardsPerPage
  )

  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setPage(0)
  }

  const sectionRef = useRef(null)

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
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    cards.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [visibleBlogs, page, activeCategory])

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen bg-[#F2F2F2] md:bg-[#F4F4F2] flex flex-col overflow-hidden font-sans"
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
              <button className="flex items-center pl-6 pr-1.5 py-1.5 bg-[#D4BA8E] rounded-full hover:bg-[#C6AB7F] transition-colors group w-fit">
                <span className="text-white font-medium text-[15px] mr-5">
                  {s.cta_label ?? 'View All'}
                </span>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg
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
                  </svg>
                </div>
              </button>
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
        <aside className="w-full lg:w-[320px] pt-8 pb-0 md:py-16 lg:py-20 px-4 md:px-12 lg:px-16 flex flex-col items-center lg:items-start shrink-0 border-b-0 relative reveal-border-y">
          <div className="hidden lg:block absolute right-0 top-0 w-[1px] h-full bg-[#3D4035]/15 border-fill-y"></div>
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-[12px] lg:gap-8 flex-wrap justify-center w-full">
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

        <div className="flex-1 py-4 md:py-16 px-12 lg:px-8 flex flex-col">
          {/* Cards Carousel Area */}
          <div className="flex-1 py-0 md:py-16 px-0 md:px-12 lg:px-8 w-full overflow-visible md:overflow-hidden">
            <div className="relative -mx-12 md:mx-0 min-h-[400px] md:min-h-0">
              {/* Mobile Left Navigation Arrow */}
              <div className="absolute top-[200px] -translate-y-1/2 left-0 z-20 md:hidden pointer-events-none">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="pointer-events-auto w-[34px] h-[68px] rounded-r-full bg-[#ECE7DC] flex items-center justify-center border-y border-r border-[#CDB17E] disabled:opacity-40 transition-opacity"
                >
                  <svg
                    className="w-[24px] h-[24px] rotate-90 text-[#CDB17E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex justify-center md:block">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-[289px] max-w-[min(289px,calc(100vw-2rem))] md:max-w-none md:w-auto relative">
                  {visibleBlogs.map((blog, i) => (
                    <div
                      key={blog.id ?? blog.title}
                      className="bg-white p-0 md:p-2.5 rounded-[8px] md:rounded-[24px] shadow-sm flex flex-col h-[400px] md:h-[460px] group cursor-pointer relative card-reveal"
                      style={{ '--delay': `${0.08 + i * 0.06}s` }}
                    >
                      <div className="flex-1 rounded-t-[8px] md:rounded-t-[16px] rounded-b-[8px] md:rounded-b-none bg-[#E8E4DC] relative overflow-hidden h-full md:min-h-0">
                        <img
                          src={
                            blog.cover_image ??
                            CARD_LOCAL_IMAGES[blog.id % CARD_LOCAL_IMAGES.length]
                          }
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="absolute bottom-[12px] md:bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-[265px] md:w-auto md:static bg-[#727355] md:bg-[#787A5E] rounded-[8px] md:rounded-[16px] px-[16px] py-[16px] md:p-7 h-[120px] md:h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                        <h3 className="text-white font-medium md:font-semibold text-[15px] md:text-[17px] mb-1.5 md:mb-2.5 tracking-wide font-['Poppins'] line-clamp-2 md:line-clamp-none">
                          {blog.title}
                        </h3>
                        <p className="text-white/60 md:text-white/80 text-[12px] md:text-[13px] leading-[150%] md:leading-relaxed font-normal md:font-light pr-2 font-['Poppins'] line-clamp-2">
                          {blog.excerpt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Right Navigation Arrow */}
              <div className="absolute top-[200px] -translate-y-1/2 right-0 z-20 md:hidden pointer-events-none">
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="pointer-events-auto w-[34px] h-[68px] rounded-l-full bg-[#ECE7DC] flex items-center justify-center border-y border-l border-[#CDB17E] disabled:opacity-40 transition-opacity"
                >
                  <svg
                    className="w-[24px] h-[24px] -rotate-90 text-[#CDB17E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Desktop Pagination Block */}
            <div className="hidden md:flex w-[611px] max-w-[90vw] h-[48px] mt-16 mx-auto justify-between items-center gap-[25px]">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-12 h-12 rounded-[96px] bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-[4px] justify-center">
                {[...Array(totalPages)].map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setPage(i)}
                    className={`cursor-pointer rounded-[8px] transition-all ${
                      i === page ? 'w-[52px] h-[8px] bg-[#D4BA8E]' : 'w-[8px] h-[8px] bg-[#D4D4D4]'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-12 h-12 rounded-[96px] bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Mobile Pagination Dots */}
            <div className="flex md:hidden items-center justify-center gap-[4px] mt-6 mb-8">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  onClick={() => setPage(i)}
                  className={`cursor-pointer rounded-[12px] transition-all ${
                    i === page ? 'w-[20px] h-[4px] bg-[#CDB17E]' : 'w-[8px] h-[4px] bg-[#BFBFBF]'
                  }`}
                />
              ))}
            </div>

            {/* Mobile View All Button */}
            <div className="flex md:hidden justify-center pb-12 reveal-on-scroll">
              <span className="reveal-wrapper reveal-wrapper--overflow-visible !pb-1">
                <span className="reveal-text">
                  <button className="flex items-center pl-[18px] pr-[3px] py-[3px] bg-[#CDB17E] rounded-[42px] hover:bg-[#C6AB7F] transition-colors group">
                    <span className="text-[#FAFAFA] font-medium text-[12px] mr-[12px] font-['Poppins']">
                      {s.cta_label ?? 'View All'}
                    </span>
                    <div className="w-[27px] h-[27px] bg-[#FAFAFA] rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        className="w-[15px] h-[15px] text-[#CDB17E] group-hover:rotate-45 transition-transform"
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
                      </svg>
                    </div>
                  </button>
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
  const [activeIndex, setActiveIndex] = useState(1)
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

  const safeTestimonials = Array.isArray(testimonialsData) ? testimonialsData : []
  const SLIDE_COUNT = safeTestimonials.length || 1
  const slides = safeTestimonials.length ? [...safeTestimonials, ...safeTestimonials] : []

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
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    cards.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [slides.length])

  // Avoid initializing Swiper with empty/undefined data.
  if (safeTestimonials.length === 0) {
    return (
      <section className="relative w-full min-h-[479px] md:min-h-[757px] bg-[#364022] overflow-x-hidden font-sans flex flex-col items-center">
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
      className="relative w-full min-h-[479px] md:min-h-[757px] bg-[#364022] overflow-x-hidden font-sans flex flex-col items-center"
    >
      <h2
        className="text-[#FAFAFA] md:text-[#FFFFFF] text-[24px] md:text-[61px] leading-[1] text-center font-serif mt-[40px] md:mt-[80px] w-[353px] md:w-auto z-10 px-4 reveal-heading"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        <span className="reveal-wrapper">
          <span className="reveal-text">Real Celebrations. Real Experiences.</span>
        </span>
      </h2>

      <div className="w-full max-w-[1377.5px] mt-[40px] md:mt-[80px]">
        <Swiper
          loop={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          watchSlidesProgress={true}
          className="flex items-center pb-4" // padding bottom prevents box-shadow clipping
          breakpoints={{
            320: { spaceBetween: -24 }, // Negative margin pulls the scaled cards closer, matching Figma perfectly
            768: { spaceBetween: -24 },
            1024: { spaceBetween: -36 },
          }}
          onSwiper={swiper => {
            swiperRef.current = swiper
            setActiveIndex(swiper.realIndex % SLIDE_COUNT)
          }}
          onSlideChange={swiper => setActiveIndex(swiper.realIndex % SLIDE_COUNT)}
          onInit={swiper => swiper.slideToLoop(1, 0)}
        >
          {slides.map((item, index) => (
            <SwiperSlide
              key={`${item.id}-${index}`}
              className="!w-auto flex items-center justify-center"
            >
              {({ isActive }) => (
                <div
                  className={`bg-[#FFFFFF] flex flex-col items-start cursor-pointer origin-center
                    testimonial-card-reveal
                    transition-all duration-500 ease-in-out shrink-0 
                    rounded-[6.7px] md:rounded-[12px]
                    w-[289px] md:w-[517.5px] 
                    h-[251px] md:h-[367.82px] 
                    p-[20px] md:p-[30px] 
                    gap-[20px] md:gap-[36px]
                    ${
                      isActive
                        ? 'opacity-100 shadow-xl scale-100'
                        : 'opacity-50 md:opacity-80 scale-[0.75] md:scale-[0.8]'
                    }
                  `}
                  style={{ '--delay': `${0.04 + (index % 4) * 0.06}s` }}
                  onClick={() => swiperRef.current?.slideToLoop(index)}
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
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous testimonial"
              className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] bg-[#CDB17E] rounded-[55px] md:rounded-[96px] flex items-center justify-center hover:bg-[#bfa06b] transition-colors shrink-0"
            >
              <svg
                className="w-[16.18px] h-[16.18px] md:w-[18px] md:h-[18px]"
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
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next testimonial"
              className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] bg-[#CDB17E] rounded-[55px] md:rounded-[96px] flex items-center justify-center hover:bg-[#bfa06b] transition-colors shrink-0"
            >
              <svg
                className="w-[16.18px] h-[16.18px] md:w-[18px] md:h-[18px]"
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

const SplitInfoSection = () => {
  const { data: cms = {} } = useLandingPage()
  const ig = cms.instagram_section ?? {}
  const vp = cms.vendor_partner ?? {}

  // inspirationImg is 15 MB — preload it 2 viewports ahead so it's ready on arrival
  const sectionRef = usePreloadOnApproach([inspirationImg], '200% 0px')

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
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    cards.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sectionRef])

  return (
    <section
      ref={sectionRef}
      className="w-full flex justify-center bg-[#FFFFFF] font-sans overflow-x-hidden"
    >
      {/* Parent Row: Uses flex-col for mobile, flex-row for desktop. 
        Flexbox naturally stretches both columns to be equal height on desktop. 
      */}
      <div className="w-full max-w-[1440px] min-w-0 flex flex-col lg:flex-row mx-auto">
        {/* LEFT SECTION - Inspiration */}
        <div className="w-full lg:w-[61.111111%] bg-[#FFFFFF] flex flex-row items-start justify-between gap-4 px-[20px] py-[40px] lg:pl-[100px] lg:pr-[40px] lg:py-[80px]">
          {/* Text Content Block */}
          <div className="flex flex-col items-start text-left w-[55%] lg:w-[400px] shrink-0">
            <h2
              className="text-[#2D2D2D] text-[20px] md:text-[27px] leading-[100%] w-full font-serif m-0 reveal-heading"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              <span className="reveal-wrapper">
                <span className="reveal-text">{ig.heading ?? 'Behind the Scenes'}</span>
              </span>
            </h2>

            <p className="text-[#2D2D2D] opacity-50 text-[12px] md:text-[16px] leading-[150%] w-full lg:w-[339px] mt-[12px] lg:mt-[20px] font-sans m-0 reveal-on-scroll font-['Poppins'] lg:font-sans">
              <span className="reveal-wrapper">
                <span className="reveal-text">
                  {ig.body ??
                    'Follow along for real celebrations, styling ideas, and behind-the-scenes moments from the events we love creating.'}
                </span>
              </span>
            </p>

            <span className="mt-[20px] lg:mt-[16px] reveal-wrapper reveal-on-scroll">
              <span className="reveal-text">
                <button className="box-border flex flex-row items-center justify-center px-[12px] lg:px-[16px] py-[6px] lg:py-[8px] gap-[6px] lg:gap-[16px] border border-[#591902] rounded-[25px] lg:rounded-[56px] hover:bg-gray-50 transition-colors">
                  <span className="text-[#591902] font-medium text-[12px] leading-[150%] font-['Poppins'] lg:font-sans text-center lg:text-left">
                    {ig.cta_label ?? 'Join Our Instagram'}
                  </span>
                  <svg
                    className="w-[16px] h-[16px] lg:w-[20px] lg:h-[20px] shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#591902"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </button>
              </span>
            </span>
          </div>

          {/* Image Block */}
          <img
            src={inspirationImg}
            alt="Behind the scenes setup"
            className="w-[40%] max-w-[156px] lg:max-w-[240px] h-[229px] lg:h-[351px] rounded-[3.57px] lg:rounded-[8px] object-cover object-[20%_center] card-reveal"
            style={{ '--delay': '0.08s' }}
            loading="lazy"
          />
        </div>

        {/* RIGHT SECTION - Partner */}
        <div className="w-full lg:w-[38.888889%] bg-[#591902] flex flex-col items-center lg:items-start px-[20px] py-[40px] lg:p-[40px]">
          {/* Placeholder/Top Box */}
          <div
            className="w-full max-w-[353px] lg:max-w-[420px] h-[152px] lg:h-[210px] bg-[#FFFFFF] rounded-[8px] overflow-hidden shrink-0 card-reveal"
            style={{ '--delay': '0.14s' }}
          />

          {/* Text Content Block */}
          <div className="flex flex-col items-start w-full max-w-[353px] lg:max-w-[420px] mt-[32px] lg:mt-[40px]">
            <h2
              className="text-[#FFFFFF] text-[20px] md:text-[27px] leading-[100%] w-full font-serif m-0 reveal-heading"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              <span className="reveal-wrapper">
                <span className="reveal-text">{vp.heading ?? 'Partner with Elewen'}</span>
              </span>
            </h2>

            <div className="flex flex-col items-start gap-[16px] mt-[20px] w-full lg:w-[420px]">
              <p className="text-[#FFFFFF] opacity-50 text-[16px] leading-[150%] w-full lg:w-[420px] font-sans m-0 reveal-on-scroll">
                <span className="reveal-wrapper">
                  <span className="reveal-text">
                    {vp.body ??
                      "Great events are never created alone. We work with a trusted circle of florists, decorators, caterers, bartenders, and production houses who help bring celebrations to life. If you'd like to be part of our vendor network, we'd love to hear from you."}
                  </span>
                </span>
              </p>

              <span className="mt-[32px] lg:mt-[16px] reveal-wrapper reveal-wrapper--overflow-visible !pb-1 reveal-on-scroll">
                <span className="reveal-text">
                  <button className="box-border flex flex-row items-center justify-between pl-[18px] lg:pl-[24px] pr-[4px] lg:pr-[4px] py-0 lg:py-[4px] gap-[12px] lg:gap-[16px] w-max lg:w-[228px] min-h-[36px] h-[36px] lg:h-[44px] bg-[#CDB17E] rounded-[42px] lg:rounded-[56px] hover:bg-[#bfa06b] transition-colors group">
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
                  </button>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const rootRef = useRef(null)

  // ── Tiered asset preloading ───────────────────────────────────────────────
  // Tier 1 (on mount, during 2s preloader): only the images that appear the
  //   instant the preloader fades — the scallop bulbs at the top of section 1.
  // Tier 2 (hero-preloader-done, ~3s in): checklist illustrations, first 3
  //   package images, and the centre logo — sections 3–5.
  // Tier 3: IntersectionObserver hooks inside CelebrationFeelingSection and
  //   SplitInfoSection handle img1-5 and inspirationImg 2 viewports ahead.
  // All remaining img tags carry loading="lazy" so the browser fetches them
  //   when they naturally scroll into range.
  useEffect(() => {
    preloadImages([bulb1, bulb2])

    const onPreloaderDone = () =>
      preloadImages([
        imgScrolling,
        imgCalls,
        imgVendors,
        imgDecisions,
        pkgImg1,
        pkgImg2,
        pkgImg3,
        centerLogo,
      ])

    window.addEventListener('hero-preloader-done', onPreloaderDone, { once: true })
    return () => window.removeEventListener('hero-preloader-done', onPreloaderDone)
  }, [])

  useEffect(() => {
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

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return

          const el = entry.target
          if (animated.has(el)) return
          if (pending.has(el)) return

          // Some sections (like the door/timeline) start with opacity: 0.
          // If we reveal while hidden, it may look like the animation never happened.
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

            // `querySelectorAll` doesn't include the element itself, so if the target IS a `.reveal-text`
            // (e.g. button wrapper), include it manually.
            const revealSpans = [
              ...(el.classList.contains('reveal-text') ? [el] : []),
              ...Array.from(el.querySelectorAll('.reveal-text')),
            ]
            revealSpans.forEach((span, i) => {
              const isTimelineReveal = !!el.closest('.step-item')
              // Base delay so the reveal feels intentional (user-requested),
              // but keep timeline reveals snappy for smoother scroll start.
              const baseDelay = isTimelineReveal ? 0 : 0.5
              const stagger = isTimelineReveal ? 0 : i * 0.04
              span.style.animationDelay = `${baseDelay + stagger}s`
              span.classList.add('is-visible')
            })

            observer.unobserve(el)
          }

          tryReveal()
        })
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -60px 0px',
      }
    )

    targets.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <HeroSection />
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
