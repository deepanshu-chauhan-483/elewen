import { useEffect, useMemo, useRef, useState } from 'react'
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

  // Derive active category — default to first category once loaded
  const activeCategory = selectedCategory ?? safeCategories[0] ?? null

  // Filter cards by selected category
  const filteredCards = activeCategory
    ? safeEventCards.filter(c => c?.category === activeCategory)
    : safeEventCards

  // Paginate: show CARDS_PER_PAGE at a time
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE))
  const visibleCards = filteredCards.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)

  // Reset page when category changes
  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setPage(0)
  }

  const scallopCount = [...Array(15)]

  return (
    <section className="relative w-full min-h-screen bg-[#F7F7F5] pt-32 md:pt-52 flex flex-col overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full flex pointer-events-none z-0">
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
              <div className="absolute top-0 right-0 translate-x-1/2 flex flex-col items-center z-20">
                <div
                  className={`w-[1px] ${i % 2 === 0 ? 'h-[-10px] md:h-[-15px]' : 'h-[-4px] md:h-[-5px]'} bg-[#3D4035]/60`}
                ></div>

                <div className="relative flex flex-col items-center">
                  <img
                    src={i % 2 === 0 ? bulb1 : bulb2}
                    alt="Pendant Light"
                    className="w-[20px] md:w-[32px] h-auto relative z-10"
                    loading="eager"
                  />

                  <div
                    className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] opacity-40 pointer-events-none ${
                      i % 2 === 0
                        ? 'md:w-[76px] md:h-[78px] blur-[6px] md:blur-[8px]'
                        : 'md:w-[76px] md:h-[59px] blur-[4px] md:blur-[4px]'
                    }`}
                    style={{
                      background:
                        i % 2 === 0
                          ? 'linear-gradient(180deg, #FCD768 0%, #F7F7F5 100%)'
                          : 'linear-gradient(180deg, #FCE6A4 -1.95%, #F7F7F5 100%)',
                      clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 pb-8 md:pb-12 flex flex-col md:flex-row justify-between items-start md:items-end relative z-10">
        <h1
          className="text-[48px] md:text-[61px] leading-[1.1] md:leading-[1] text-[#3D4035] font-normal tracking-normal reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.heading ?? 'Lets Start Planning'}</span>
          </span>
        </h1>

        <div className="max-w-[340px] mt-6 md:mt-0">
          <p className="text-[#3D4035]/70 text-[15px] leading-relaxed mb-6 font-medium reveal-on-scroll">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.description ??
                  'Choose your event type and explore curated décor and catering packages designed to simplify planning.'}
              </span>
            </span>
          </p>

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <hr className="relative left-1/2 -translate-x-1/2 w-screen border-t border-[#3D4035]/15 z-10" />

      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1 relative z-10">
        <aside className="w-full md:w-[320px] py-12 md:py-20 px-6 md:px-16 flex flex-col items-start shrink-0 md:border-r border-[#3D4035]/15">
          <div className="flex flex-col gap-6 md:gap-8">
            {safeCategories.map(cat => {
              const isActive = cat === activeCategory
              return (
                <div
                  key={cat}
                  className={`cursor-pointer group w-fit ${isActive ? 'border-b-[1.5px] border-[#3D4035] pb-1.5' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  <span
                    className={`font-medium text-[16px] tracking-wide transition-colors ${
                      isActive
                        ? 'text-[#3D4035] font-bold'
                        : 'text-[#A3A3A3] group-hover:text-[#3D4035]'
                    }`}
                  >
                    {cat}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>

        <div className="flex-1 py-12 md:py-16 px-6 md:px-12 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {visibleCards.map(card => (
              <div
                key={card.id ?? card.title}
                className="bg-white p-2 md:p-2.5 rounded-[20px] md:rounded-[24px] shadow-sm flex flex-col h-[340px] md:h-[460px] group cursor-pointer"
              >
                <div className="flex-1 rounded-t-[12px] md:rounded-t-[16px] bg-[#E8E4DC] relative overflow-hidden min-h-[140px] md:min-h-0">
                  <img
                    src={card.image ?? CARD_LOCAL_IMAGES[card.id % CARD_LOCAL_IMAGES.length]}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="bg-[#787A5E] rounded-[12px] md:rounded-[16px] p-3 md:p-7 h-[130px] md:h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                  <h3 className="text-white font-semibold text-[15px] md:text-[17px] mb-1.5 md:mb-2.5 tracking-wide">
                    {card.title}
                  </h3>
                  <p className="text-white/80 text-[12px] md:text-[13px] leading-relaxed font-light pr-2">
                    {card.tagline}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="w-[611px] max-w-[90vw] h-[48px] mt-16 mx-auto flex justify-between items-center gap-[25px]">
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

  // Derive categories from service cards
  const categories = [...new Set(safeServiceCards.map(s => s?.category).filter(Boolean))]
  const activeCategory = selectedCategory ?? categories[0] ?? null

  const filteredCards = activeCategory
    ? safeServiceCards.filter(s => s?.category === activeCategory)
    : safeServiceCards

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE))
  const visibleCards = filteredCards.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)

  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setPage(0)
  }

  return (
    <section className="w-full min-h-screen bg-[#F4F4F2] flex flex-col overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto pt-16 md:pt-24 pb-8 md:pb-12 px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="max-w-[340px] order-last md:order-first mb-6 md:mb-0">
          <p className="text-[#3D4035]/70 text-[15px] leading-relaxed mb-6 font-medium reveal-on-scroll">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.description ??
                  'Choose a service category to explore curated packages designed for your event.'}
              </span>
            </span>
          </p>

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
              </svg>
            </div>
          </button>
        </div>

        <h2
          className="font-display text-[40px] md:text-[61px] leading-[1.1] md:leading-[1] text-[#3D4035] font-normal tracking-normal order-first md:order-last reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.heading ?? 'What would you like to plan'}</span>
          </span>
        </h2>
      </div>

      <hr className="relative left-1/2 -translate-x-1/2 w-screen border-t border-[#3D4035]/15" />

      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1">
        <div className="flex-1 order-last lg:order-none py-12 md:py-16 px-6 md:px-12 lg:px-8 lg:border-r border-[#3D4035]/15">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {visibleCards.map(card => (
              <div
                key={card.id ?? card.title}
                className="bg-white p-2 md:p-2.5 rounded-[20px] md:rounded-[24px] shadow-sm flex flex-col h-[340px] md:h-[460px] group cursor-pointer"
              >
                <div className="flex-1 rounded-t-[12px] md:rounded-t-[16px] bg-[#E8E4DC] relative overflow-hidden min-h-[140px] md:min-h-0">
                  <img
                    src={card.image ?? CARD_LOCAL_IMAGES[card.id % CARD_LOCAL_IMAGES.length]}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="bg-[#787A5E] rounded-[12px] md:rounded-[16px] p-3 md:p-7 h-[130px] md:h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                  <h3 className="text-white font-semibold text-[15px] md:text-[17px] mb-1.5 md:mb-2.5 tracking-wide">
                    {card.title}
                  </h3>
                  <p className="text-white/80 text-[12px] md:text-[13px] leading-relaxed font-light pr-2">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="w-[611px] max-w-[90vw] h-[48px] mt-12 md:mt-16 mx-auto flex justify-between items-center gap-[25px]">
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
        </div>

        <aside className="w-full lg:w-[320px] order-first lg:order-none py-12 md:py-20 px-6 md:px-16 flex flex-col items-start shrink-0 border-b lg:border-b-0 border-[#3D4035]/15">
          <div className="flex flex-col gap-6 md:gap-8">
            {categories.map(cat => {
              const isActive = cat === activeCategory
              return (
                <div
                  key={cat}
                  className={`cursor-pointer group w-fit ${isActive ? 'border-b-[1.5px] border-[#3D4035] pb-1.5' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  <span
                    className={`font-medium text-[16px] tracking-wide transition-colors ${
                      isActive
                        ? 'text-[#3D4035] font-bold'
                        : 'text-[#A3A3A3] group-hover:text-[#3D4035]'
                    }`}
                  >
                    {cat}
                  </span>
                </div>
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
    width="80"
    height="80"
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
    width="80"
    height="80"
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
    width="80"
    height="80"
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
    width="80"
    height="80"
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
    width="80"
    height="80"
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
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="40" cy="40" r="24" />
    <circle cx="40" cy="40" r="18" />
    <path d="M40 30V50M36 34H42C44.2091 34 46 35.7909 46 38C46 40.2091 44.2091 42 42 42H38C35.7909 42 34 43.7909 34 46C34 48.2091 35.7909 50 38 50H44" />
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

        // 1. Text Reveal Trigger
        ScrollTrigger.create({
          trigger: step,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            const texts = step.querySelectorAll('.reveal-text')
            texts.forEach((span, index) => {
              if (!span.classList.contains('is-visible')) {
                span.style.animationDelay = `${index * 0.04}s`
                span.classList.add('is-visible')
              }
            })
          },
        })

        // 2. Containers — instant play on enter, no scrub
        if (leftContent) {
          gsap.fromTo(
            leftContent,
            { x: -40, opacity: 0 },
            {
              scrollTrigger: {
                trigger: step,
                start: 'top 82%',
                once: true,
              },
              x: 0,
              opacity: 1,
              duration: 0.55,
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
                start: 'top 82%',
                once: true,
              },
              x: 0,
              opacity: 1,
              duration: 0.55,
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
      <h2 className="text-[61px] text-center mb-32 tracking-wide font-serif font-display reveal-heading">
        <span className="reveal-wrapper">
          <span className="reveal-text">HOW 11 WORKS</span>
        </span>
      </h2>

      <div
        ref={stepsWrapRef}
        className="relative w-full max-w-[1000px] mx-auto flex flex-col items-center"
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
                  <div className="left-content w-1/2 pr-20 flex justify-end items-start mt-8 step-reveal opacity-0">
                    <span className="reveal-wrapper">
                      <span className="reveal-text reveal-text-x-left">
                        <IconComponent />
                      </span>
                    </span>
                  </div>
                  <div className="right-content w-1/2 pl-20 flex flex-col items-start text-left relative z-20 opacity-0">
                    <div
                      className="reveal-wrapper reveal-wrapper-circle step-reveal mb-6"
                      style={{ display: 'inline-flex' }}
                    >
                      <div className="reveal-text reveal-text-x-right reveal-circle-text">
                        <div
                          className="w-[60px] h-[60px] bg-[#CDB17E] rounded-full flex items-center justify-center text-[22px] font-serif"
                          style={{
                            boxShadow:
                              '-25px 18px 12px rgba(0,0,0,0.03), -14px 10px 10px rgba(0,0,0,0.1), -6px 4px 8px rgba(0,0,0,0.16), -2px 1px 4px rgba(0,0,0,0.19)',
                          }}
                        >
                          {step.id}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-[27px] font-serif font-display mb-3 leading-[1.1] opacity-100 step-reveal">
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{step.title}</span>
                      </span>
                    </h3>
                    <p className="text-[16px] leading-[1.5] max-w-[342px] font-light opacity-100 step-reveal">
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{step.desc}</span>
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="left-content w-1/2 pr-20 flex flex-col items-end text-right relative z-20 step-reveal opacity-0">
                    <div
                      className="reveal-wrapper reveal-wrapper-circle step-reveal mb-6"
                      style={{ display: 'inline-flex' }}
                    >
                      <div className="reveal-text reveal-text-x-left reveal-circle-text">
                        <div
                          className="w-[60px] h-[60px] bg-[#CDB17E] rounded-full flex items-center justify-center text-[22px] font-serif"
                          style={{
                            boxShadow:
                              '-25px 18px 12px rgba(0,0,0,0.03), -14px 10px 10px rgba(0,0,0,0.1), -6px 4px 8px rgba(0,0,0,0.16), -2px 1px 4px rgba(0,0,0,0.19)',
                          }}
                        >
                          {step.id}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-[27px] font-serif font-display mb-3 leading-[1.1] opacity-100 step-reveal">
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{step.title}</span>
                      </span>
                    </h3>
                    <p className="text-[16px] leading-[1.5] max-w-[342px] font-light opacity-100 step-reveal">
                      <span className="reveal-wrapper">
                        <span className="reveal-text">{step.desc}</span>
                      </span>
                    </p>
                  </div>
                  <div className="right-content w-1/2 pl-20 flex justify-start items-start mt-8 step-reveal opacity-0">
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
          className="text-[#FFFFFF] text-[36px] font-normal leading-none text-center font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading ?? 'Confused, Excited or somewhere in between?'}
            </span>
          </span>
        </h2>

        <p className="text-[#FFFFFF] opacity-50 text-[16px] font-normal leading-[1.5] text-center max-w-[723px] mt-[32px] reveal-on-scroll">
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.body ??
                "Drop your details, and we'll get in touch. You're just one call away from turning the confusion into a clear, sorted plan."}
            </span>
          </span>
        </p>

        <button className="group mt-[40px] flex items-center justify-between bg-[#CDB17E] rounded-[56px] w-[243px] h-[44px] pl-[24px] pr-[4px] py-[4px] hover:bg-[#bfa06b] transition-colors">
          <span className="text-[#FAFAFA] text-[16px] font-medium leading-[1.5] tracking-wide">
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
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </div>
        </button>
      </div>
    </section>
  )
}

const BetterWaySection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.better_way ?? {}

  const scallopCount = [...Array(15)]

  return (
    <section className="w-full flex justify-center bg-[#F7F7F5] overflow-hidden font-sans">
      <div className="relative w-[1440px] max-w-full min-w-0 mx-auto h-[1171px] shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-max flex pointer-events-none z-10">
          {scallopCount.map((_, i) => (
            <div key={i} className="relative shrink-0 w-[144px] h-[90px]">
              <div
                className="absolute top-0 left-0 w-[144px] h-[90px] bg-[#CDB17E]"
                style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
              ></div>
              <div
                className="absolute top-0 left-0 w-[144px] h-[72px] bg-[#591902]"
                style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
              ></div>

              {i !== scallopCount.length - 1 && (
                <div className="absolute top-0 right-0 translate-x-1/2 flex flex-col items-center z-20">
                  <div
                    className={`w-[1px] ${i % 2 === 0 ? 'h-[-15px]' : 'h-[-5px]'} bg-[#591902]/40`}
                  ></div>
                  <div className="relative flex flex-col items-center">
                    <img
                      src={i % 2 === 0 ? bulb1 : bulb2}
                      alt="Light"
                      className="w-[32px] h-auto relative z-10"
                    />
                    <div
                      className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-2 w-[76px] opacity-40 pointer-events-none ${
                        i % 2 === 0 ? 'h-[78px] blur-[8px]' : 'h-[59px] blur-[4px]'
                      }`}
                      style={{
                        background:
                          i % 2 === 0
                            ? 'linear-gradient(180deg, #FCD768 0%, #F7F7F5 100%)'
                            : 'linear-gradient(180deg, #FCE6A4 -1.95%, #F7F7F5 100%)',
                        clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <h2
          className="absolute w-[679px] max-w-[calc(100%-2rem)] left-1/2 -translate-x-1/2 top-[253px] text-[#2D2D2D] text-[61px] leading-[1] text-center font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.heading ?? 'The Perfect In-Between'}</span>
          </span>
        </h2>

        <p className="absolute w-[809px] max-w-[calc(100%-2rem)] left-1/2 -translate-x-1/2 top-[403px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5] text-center reveal-on-scroll">
          <span className="reveal-wrapper">
            <span className="reveal-text">
              Sometimes all you wanted was help making things look beautiful and knowing which
              vendors to trust. That&apos;s exactly where we come in.
            </span>
          </span>
        </p>

        <div className="absolute w-[723px] max-w-[calc(100%-2rem)] h-[422px] left-1/2 -translate-x-1/2 top-[531px]">
          <svg
            width="723"
            height="422"
            viewBox="0 0 723 422"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <clipPath id="intersectClip">
                <circle cx="211" cy="211" r="211" />
              </clipPath>
            </defs>

            <circle cx="211" cy="211" r="211" fill="#CDB17E" />
            <circle cx="512" cy="211" r="211" fill="#591902" />
            <circle cx="512" cy="211" r="211" fill="#FFFFFF" clipPath="url(#intersectClip)" />
          </svg>
        </div>

        <h5
          className="absolute left-[calc(50%-150.5px)] top-[742px] w-[185px] -translate-x-1/2 -translate-y-1/2 text-center text-[#591902] text-[27px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {s.left_label ?? 'when you hire a Planner'}
        </h5>

        <h5
          className="absolute left-[calc(50%+150.5px)] top-[742px] w-[80px] -translate-x-1/2 -translate-y-1/2 text-center text-[#CDB17E] text-[27px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {s.right_label ?? 'when you DIY'}
        </h5>

        <div className="absolute left-1/2 top-[742px] w-[320px] h-[320px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <img
            src={centerLogo}
            alt="11 Logo"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>

        <p className="absolute w-[200px] left-[30px] top-[688px] text-[#957960] text-[12px] leading-[1.5]">
          {s.left_body ??
            'Sometimes, booking an event planner feels overwhelming. There are layers of decisions, multiple meetings, and a budget that keeps growing with every addition.'}
        </p>

        <p className="absolute w-[200px] right-[30px] top-[688px] text-[#591902] text-[12px] leading-[1.5] text-right">
          {s.right_body ??
            "Doing it yourself sounds simple at first. But soon you're juggling vendor calls, comparing prices, managing deliveries, and trying to style everything the night before the event."}
        </p>

        <p className="absolute w-[285px] left-1/2 -translate-x-1/2 top-[993px] text-[#2D2D2D] text-[12px] leading-[1.5] text-center">
          {s.center_body ??
            'Sometimes the solution is in between. We help you Plan Differently. You stay in control of your celebration.'}
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
  const [isLayoutVisible, setIsLayoutVisible] = useState(false) // Tracks when the grid is in view
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

  // Native Intersection Observer to trigger CSS animations on scroll (run once)
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

    return () => observer.disconnect()
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
    const scaleEnd = isMobile ? 3 : 4
    const scrollEnd = isMobile ? 800 : 1500
    const scrubVal = isMobile ? 1.5 : 1
    const startTrigger = 'top top'

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

    tl.to(gate, { scale: scaleEnd, ease: 'power2.in', duration: 1 }, 0)
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

    if (doorFill) tl.to(doorFill, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.5)
    tl.to(gate, { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0.7)

    tl.to(
      howItWorks,
      {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          // Directly reveal texts in view — bypasses React re-render + GSAP setup delay
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
      className="relative w-full min-h-screen bg-white overflow-x-clip flex flex-col items-center pb-0"
    >
      <div
        className="absolute hidden md:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
        style={{ left: '-10%', top: '5%', transform: 'rotate(-37.82deg)' }}
      />
      <div
        className="absolute hidden md:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
        style={{ right: '5%', top: '30%', transform: 'rotate(-37.82deg)' }}
      />

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
                <div
                  className={`w-[1px] ${i % 2 === 0 ? 'h-[-10px] md:h-[-14px]' : 'h-[-4px] md:h-[-5px]'} bg-[#591902]/40`}
                ></div>
                <div className="relative flex flex-col items-center">
                  <img
                    src={i % 2 === 0 ? bulb1 : bulb2}
                    alt="Light"
                    className="w-[20px] md:w-[32px] h-auto relative z-10"
                    loading="lazy"
                  />
                  <div
                    className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] opacity-40 pointer-events-none ${
                      i % 2 === 0
                        ? 'md:w-[76px] md:h-[78px] blur-[6px] md:blur-[8px]'
                        : 'md:w-[76px] md:h-[59px] blur-[4px] md:blur-[4px]'
                    }`}
                    style={{
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

      <h2
        className="text-[40px] md:text-[61px] leading-[1.1] md:leading-[1] text-center text-[#591902] font-normal tracking-normal mt-[110px] md:mt-[260px] px-4 relative z-10 reveal-heading"
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
          className="w-full overflow-hidden mx-auto"
          style={{ maxWidth: `${LAYOUT_W}px`, aspectRatio: `${LAYOUT_W}/${LAYOUT_H}` }}
        >
          <div
            ref={layoutInnerRef}
            className="relative"
            style={{ width: `${LAYOUT_W}px`, height: `${LAYOUT_H}px`, transformOrigin: 'top left' }}
          >
            {/* STEP 1: Too much scrolling (Starts immediately) */}
            <div className="absolute left-[283px] top-[19px] w-[211px] h-[211px]">
              <div
                className={`anim-element slide-from-left ${isLayoutVisible ? 'is-visible' : ''} absolute inset-0 bg-[#BFAC9B] rounded-tl-full z-0 shadow-sm`}
                style={{ '--delay': '0s' }}
              ></div>
              <img
                src={imgScrolling}
                className={`anim-element slide-from-bottom ${isLayoutVisible ? 'is-visible' : ''} absolute bottom-0 right-[-40px] h-[250px] w-auto max-w-none object-contain object-bottom z-10 pointer-events-none`}
                alt="Scrolling"
                style={{ '--delay': '0.15s' }}
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
              <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                What was once simple now means endless scrolling — and still no confidence.
              </p>
            </div>

            {/* STEP 2: Too many calls (Starts at 1.4s) */}
            <div className="absolute left-[510px] top-[1px] w-[524px] h-[229px] z-10">
              <div
                className={`anim-element slide-from-right ${isLayoutVisible ? 'is-visible' : ''} absolute left-[0px] top-[18px] w-[211px] h-[211px] bg-[#BFAC9B] rounded-tr-full z-0`}
                style={{ '--delay': '0.5s' }}
              ></div>
              <img
                src={imgCalls}
                alt="Calls"
                className={`anim-element slide-from-bottom ${isLayoutVisible ? 'is-visible' : ''} absolute left-[13px] top-[0px] w-[231px] h-[229px] object-cover object-top z-10 pointer-events-none`}
                style={{
                  '--delay': '0.65s',
                  filter:
                    'drop-shadow(33px 41px 32px rgba(109, 57, 8, 0.16)) drop-shadow(15px 18px 24px rgba(109, 57, 8, 0.28)) drop-shadow(4px 5px 13px rgba(109, 57, 8, 0.32))',
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
                <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5] font-sans">
                  Follow-ups, confirmations, negotiations, and last-minute checks — your phone turns
                  into a coordination hub, and excitement becomes stress.
                </p>
              </div>
            </div>

            {/* STEP 3: Too many vendors (Starts at 2.8s) */}
            <div className="absolute left-[510px] top-[246px] w-[211px] h-[211px]">
              <div
                className={`anim-element slide-from-left ${isLayoutVisible ? 'is-visible' : ''} absolute inset-0 bg-[#BFAC9B] z-0 shadow-sm`}
                style={{ '--delay': '1.0s' }}
              ></div>
              <img
                src={imgVendors}
                className={`anim-element slide-from-bottom ${isLayoutVisible ? 'is-visible' : ''} absolute bottom-0 left-1/2 -translate-x-1/2 h-[280px] w-auto max-w-[400px] object-contain object-bottom z-10 pointer-events-none`}
                alt="Vendors"
                style={{ '--delay': '1.15s' }}
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
              <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                One decorator, one caterer, one supplier, different prices, different chaos.
                You&apos;re not planning a celebration; you&apos;re managing a team.
              </p>
            </div>

            {/* STEP 4: Too many decisions (Starts at 4.2s) */}
            <div className="absolute left-[461px] top-[466px] w-[260px] h-[211px] overflow-hidden rounded-br-full">
              <div
                className={`anim-element slide-from-right ${isLayoutVisible ? 'is-visible' : ''} absolute right-0 top-0 w-[211px] h-full bg-[#BFAC9B] z-0 shadow-sm`}
                style={{ '--delay': '1.5s' }}
              ></div>
              <img
                src={imgDecisions}
                alt="Decisions"
                className={`anim-element slide-from-bottom ${isLayoutVisible ? 'is-visible' : ''} absolute bottom-[-50px] left-[-50px] h-[300px] w-auto max-w-none object-cover object-bottom z-10 pointer-events-none`}
                style={{ '--delay': '1.65s' }}
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
              <p className="text-[12px] text-[#591902] opacity-50 leading-[1.5]">
                Color themes, backdrops, menus, endless add-ons — more options don&apos;t mean more
                freedom, just more pressure.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 md:gap-8 mb-8 md:mb-32 z-10 text-center mt-8 md:mt-[40px] px-6">
        <h3
          className="text-[28px] md:text-[36px] text-[#591902] leading-[1] font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.relief_heading ?? 'Stop take a deep breath'}</span>
          </span>
        </h3>

        <div className="flex flex-col items-center gap-2">
          {reliefItems.map((item, i) => (
            <p
              key={i}
              className="text-[17px] md:text-[21px] text-[#591902] opacity-50 font-sans reveal-on-scroll"
            >
              <span className="reveal-wrapper">
                <span className="reveal-text">{item}</span>
              </span>
            </p>
          ))}
        </div>

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

      <div className="relative w-full z-10 mt-0 md:mt-10 overflow-visible md:overflow-hidden min-h-[50vh] md:min-h-[100vh]">
        <div
          ref={gateAreaRef}
          className="relative w-full h-[50vh] md:h-[100vh] z-20"
          style={{ position: 'relative' }}
        >
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

  const handleTransitionEnd = () => {
    if (count === 0) return
    if (virtualIndex >= count * 2) {
      setDisableTransition(true)
      setVirtualIndex(count)
      requestAnimationFrame(() => setDisableTransition(false))
    }
  }

  const handleNext = () => {
    if (count === 0) return
    lastDirectionRef.current = 'next'
    setVirtualIndex(prev => Math.min(prev + 1, count * 2))
  }

  const handlePrev = () => {
    if (count === 0) return
    lastDirectionRef.current = 'prev'
    setVirtualIndex(prev => (prev <= 0 ? totalCards - 1 : prev - 1))
  }

  const displayIndex = count > 0 ? virtualIndex % count : 0

  const sortedCards = useMemo(() => {
    if (count === 0) return []
    const extended = [...packagesData, ...packagesData, ...packagesData]
    return extended
      .map((pkg, index) => ({ pkg, index }))
      .sort((a, b) => {
        if (a.index === virtualIndex) return 1
        if (b.index === virtualIndex) return -1
        return a.index - b.index
      })
  }, [packagesData, virtualIndex, count])

  return (
    <section
      className="relative w-full min-h-screen bg-[#F4F4F2] pt-8 pb-28 -mt-4"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Global Styles for inner Swiper + fix arrow click blocking */}
      <style>{`
        .inner-card-swiper .swiper-pagination-bullet {
          background-color: white;
          opacity: 0.8;
          width: 8px;
          height: 8px;
          transition: all 0.3s ease;
        }
        .inner-card-swiper .swiper-pagination-bullet-active {
          background-color: #CDB17E;
          width: 24px;
          border-radius: 8px;
          opacity: 1;
        }
        /* Swiper container: do not capture clicks - lets arrows receive them */
        .inner-card-swiper { pointer-events: none !important; }
        /* Only the slide area and pagination capture events when card is active */
        .card-swiper-active .inner-card-swiper .swiper-wrapper,
        .card-swiper-active .inner-card-swiper .swiper-pagination { pointer-events: auto; }
      `}</style>

      {/* --- 1. Top Headings --- */}
      <div className="flex flex-col items-center text-center px-6 z-20 relative pt-16">
        <h2
          className="text-[#2D2D2D] text-[48px] md:text-[61px] leading-[1] max-w-[1050px] mb-6 font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.heading ??
                'Somewhere between Moodboards and reality, celebrations lost their feeling.'}
            </span>
          </span>
        </h2>
        <p className="text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5] max-w-[809px] mb-20 reveal-on-scroll">
          <span className="reveal-wrapper">
            <span className="reveal-text">
              {s.body ??
                'They became louder and Bigger, but less personal. Elewen exists to bring that feeling back. Not through more, but through meaning.'}
            </span>
          </span>
        </p>

        <h3
          className="text-[#2D2D2D] text-[32px] leading-[1] font-serif reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.section_heading ?? 'OUR MOST LOVED PACKAGES'}</span>
          </span>
        </h3>
      </div>

      {/* --- 2. Carousel - 3D cylinder --- */}
      <div className="relative w-full overflow-x-hidden -mt-10">
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[1440px] max-w-[100vw] h-[100px] z-10 pointer-events-none"
          style={{
            background: '#F4F4F2',
            borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          }}
        />

        <div
          className="relative min-h-[790px] w-full grid place-content-center overflow-hidden px-0"
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
              transform: `rotateY(${-virtualIndex * 36}deg)`,
              transition: disableTransition
                ? 'none'
                : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: disableTransition ? 'auto' : 'transform',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {sortedCards.map(({ pkg, index }) => {
              const baseAngle = 36
              const halfAngleDeg = baseAngle / 2
              const halfAngleRad = (halfAngleDeg * Math.PI) / 180
              const cardWidth = 640
              const gap = 8
              const radius = (cardWidth / 2 + gap / 2) / Math.tan(halfAngleRad)
              const isActive = index === virtualIndex

              return (
                <div
                  key={`pkg-${index}`}
                  onClick={() => !isActive && setVirtualIndex(index)}
                  className={`w-[640px] relative flex flex-col bg-white overflow-hidden gap-6 pointer-events-auto ${isActive ? 'cursor-default' : 'cursor-pointer'}`}
                  style={{
                    gridArea: '1/1',
                    height: '770px',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    transform: `rotateY(${index * 36}deg) translateZ(${-radius}px)`,
                    boxShadow: isActive
                      ? '0 12px 32px rgba(0,0,0,0.15)'
                      : '0 6px 20px rgba(0,0,0,0.1)',
                    opacity: isActive ? 1 : 0.9,
                    zIndex: isActive ? 50 : 0,
                  }}
                >
                  {/* Image area */}
                  <div className="px-5 pt-5 shrink-0">
                    <div
                      className={`relative w-full h-[450px] bg-[#EAEAEA] overflow-hidden ${isActive ? 'card-swiper-active' : ''}`}
                    >
                      {isActive ? (
                        <Swiper
                          modules={[Navigation, Pagination]}
                          navigation={{
                            prevEl: `.custom-prev-btn-${index}`,
                            nextEl: `.custom-next-btn-${index}`,
                          }}
                          pagination={{ clickable: true }}
                          loop={true}
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
                          loading="lazy"
                        />
                      )}

                      {/* Arrow overlay: pointer-events-none so it doesn't block; buttons have pointer-events-auto */}
                      <div className="absolute inset-0 pointer-events-none z-[100] flex items-center justify-between">
                        {/* CUSTOM LEFT ARROW */}
                        <button
                          type="button"
                          className={`custom-prev-btn-${index} pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 w-[36px] h-[56px] bg-[#2D2D2D] hover:bg-black rounded-r-full flex items-center justify-center transition-all duration-300 pr-[2px] ${isActive ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
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
                          className={`custom-next-btn-${index} pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 w-[36px] h-[56px] bg-[#2D2D2D] hover:bg-black rounded-l-full flex items-center justify-center transition-all duration-300 pl-[2px] ${isActive ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
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
                          className="absolute right-4 top-4 flex items-center justify-center px-3 py-1 gap-1 bg-white rounded-[36px] z-10 pointer-events-none"
                          style={{ padding: '4px 12px' }}
                        >
                          <span className="text-[#364022] text-[18px] font-medium leading-[1.5]">
                            {pkg.price}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content area */}
                  <div
                    className="flex flex-col items-start flex-1 min-h-0 px-8 pb-6"
                    style={{
                      gap: '20px',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                    }}
                  >
                    <div className="flex flex-col items-start w-full" style={{ gap: '24px' }}>
                      <div className="flex flex-col items-start w-full" style={{ gap: '12px' }}>
                        <div className="flex flex-row justify-between items-center w-full gap-1">
                          <h4
                            className="text-[#2D2D2D] truncate"
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 500,
                              fontSize: '28px',
                              lineHeight: '150%',
                            }}
                          >
                            {pkg.title}
                          </h4>
                          <div
                            className="flex justify-center items-center rounded-[48px] shrink-0"
                            style={{ background: 'rgba(0, 0, 0, 0.05)', padding: '2px 12px' }}
                          >
                            <span
                              className="text-[#2D2D2D]"
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 500,
                                fontSize: '18px',
                                lineHeight: '150%',
                              }}
                            >
                              {pkg.category}
                            </span>
                          </div>
                        </div>

                        <p
                          className="text-[#767676] line-clamp-2 w-full"
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 400,
                            fontSize: '18px',
                            lineHeight: '150%',
                          }}
                        >
                          {pkg.desc}
                        </p>
                      </div>

                      <div className="flex flex-col items-start w-full" style={{ gap: '8px' }}>
                        <p
                          className="text-[#2D2D2D] w-full"
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 500,
                            fontSize: '18px',
                            lineHeight: '150%',
                          }}
                        >
                          Includes :
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.tags.map((tag, i) => (
                            <div
                              key={i}
                              className="flex justify-center items-center rounded-[48px]"
                              style={{ background: 'rgba(0, 0, 0, 0.05)', padding: '2px 12px' }}
                            >
                              <span
                                className="text-[#2D2D2D]"
                                style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontWeight: 500,
                                  fontSize: '18px',
                                  lineHeight: '150%',
                                }}
                              >
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
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[1440px] max-w-[100vw] h-[100px] z-10 pointer-events-none"
          style={{
            background: '#F4F4F2',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          }}
        />
      </div>

      {/* --- 3. Bottom Carousel Controls --- */}
      <div className="w-[611px] max-w-[90vw] h-[48px] mx-auto flex justify-between items-center gap-[25px] z-20 relative -mt-20">
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
    </section>
  )
}

const CelebrationFeelingSection = () => {
  const { data: cms = {} } = useLandingPage()
  const s = cms.planner_cta ?? {}

  const containerRef = useRef(null)
  // Preload all 5 parallax images 2 viewports before this section scrolls into view
  const preloadRef = usePreloadOnApproach([img1, img2, img3, img4, img5], '200% 0px')

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -120])
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -60])
  const y5 = useTransform(scrollYProgress, [0, 1], [0, -200])

  const imageShadow =
    '-54px 121px 37px rgba(0, 0, 0, 0.01), -34px 77px 34px rgba(0, 0, 0, 0.04), -19px 43px 29px rgba(0, 0, 0, 0.14), -9px 19px 21px rgba(0, 0, 0, 0.24), -2px 5px 12px rgba(0, 0, 0, 0.28)'

  return (
    <section
      ref={el => {
        containerRef.current = el
        preloadRef.current = el
      }}
      className="w-full bg-[#BFAC9B] overflow-hidden flex justify-center font-sans relative h-[900px]"
    >
      <div className="relative w-[1440px] max-w-full h-full shrink-0">
        <motion.img
          style={{ y: y1, boxShadow: imageShadow }}
          src={img1}
          alt="Event Decor"
          className="absolute left-[0px] top-[100px] w-[347px] h-[280px] object-cover pointer-events-none z-0"
          loading="lazy"
        />

        <motion.img
          style={{ y: y2, boxShadow: imageShadow }}
          src={img2}
          alt="Event Decor"
          className="absolute left-[42px] top-[450px] w-[249px] h-[375px] object-cover pointer-events-none z-0"
          loading="lazy"
        />

        <motion.img
          style={{ y: y3, boxShadow: imageShadow }}
          src={img3}
          alt="Event Decor"
          className="absolute left-[497px] top-[700px] w-[290px] h-[316px] object-cover pointer-events-none z-0"
          loading="lazy"
        />

        <motion.img
          style={{ y: y4, boxShadow: imageShadow }}
          src={img4}
          alt="Event Decor"
          className="absolute left-[1034px] top-[400px] w-[312px] h-[318px] object-cover pointer-events-none z-0"
          loading="lazy"
        />

        <motion.img
          style={{ y: y5, boxShadow: imageShadow }}
          src={img5}
          alt="Event Decor"
          className="absolute left-[909px] top-[50px] w-[505px] h-[265px] object-cover pointer-events-none z-0"
          loading="lazy"
        />

        <div className="sticky top-[250px] z-10 flex flex-col items-center">
          <h2
            className="w-[1148px] max-w-[calc(100%-2rem)] text-[#FFFFFF] text-[48px] md:text-[96px] leading-[0.9] text-center font-serif drop-shadow-sm px-4 reveal-heading"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.heading_1 ?? 'Every celebration deserves its own feeling.'}
              </span>
            </span>
          </h2>

          <p className="mt-8 w-[522px] max-w-[calc(100%-2rem)] text-[#FFFFFF] text-[14px] md:text-[16px] leading-[1.5] text-center drop-shadow-sm px-4 reveal-on-scroll">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.body ??
                  'Want a professional to handle your event end to end? Fill the form and let our in-house planners plan it with you.'}
              </span>
            </span>
          </p>

          <button className="mt-10 w-[213px] h-[44px] group flex items-center justify-between bg-[#FFFFFF] rounded-[56px] pl-[24px] pr-[4px] py-[4px] hover:bg-[#F2F2F2] transition-colors shadow-lg">
            <span className="text-[#CDB17E] text-[16px] font-medium leading-[1.5] tracking-wide">
              {s.cta_label ?? 'Plan with Elewen'}
            </span>
            <div className="w-[36px] h-[36px] bg-[#CDB17E] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border-[1.5px] border-[#FFFFFF]">
              <svg
                className="transition-transform duration-300 ease-out group-hover:rotate-45"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </div>
          </button>
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

  const activeCategory = selectedCategory ?? safeCategories[0] ?? null

  const filteredBlogs = activeCategory
    ? safeAllBlogs.filter(b => b?.category === activeCategory)
    : safeAllBlogs

  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / CARDS_PER_PAGE))
  const visibleBlogs = filteredBlogs.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)

  const handleCategorySelect = cat => {
    setSelectedCategory(cat)
    setPage(0)
  }

  return (
    <section className="w-full min-h-screen bg-[#F4F4F2] flex flex-col overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto pt-24 pb-12 px-12 lg:px-20 flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2
          className="font-display text-[40px] md:text-[61px] leading-[1.1] md:leading-[1] text-[#3D4035] font-normal tracking-normal text-left mb-10 md:mb-0 reveal-heading"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.heading_1 ?? 'Planning Guides &'} </span>
          </span>
          <br />
          <span className="reveal-wrapper">
            <span className="reveal-text">{s.heading_2 ?? 'Celebration Ideas'}</span>
          </span>
        </h2>

        <div className="max-w-[340px]">
          <p className="text-[#3D4035]/70 text-[15px] leading-relaxed mb-6 font-medium reveal-on-scroll">
            <span className="reveal-wrapper">
              <span className="reveal-text">
                {s.body ??
                  'Helpful tips, inspiration, and practical guides to make planning your next celebration simpler.'}
              </span>
            </span>
          </p>

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <hr className="relative left-1/2 -translate-x-1/2 w-screen border-t border-[#3D4035]/15" />

      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1">
        <aside className="w-full lg:w-[320px] py-16 lg:py-20 px-12 lg:px-16 flex flex-col items-start shrink-0 border-b lg:border-b-0 lg:border-r border-[#3D4035]/15">
          <div className="flex flex-col gap-8">
            {safeCategories.map(cat => {
              const isActive = cat === activeCategory
              return (
                <div
                  key={cat}
                  className={`cursor-pointer group w-fit ${isActive ? 'border-b-[1.5px] border-[#3D4035] pb-1.5' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  <span
                    className={`text-[16px] tracking-wide transition-colors ${
                      isActive
                        ? 'text-[#3D4035] font-bold'
                        : 'text-[#A3A3A3] font-medium group-hover:text-[#3D4035]'
                    }`}
                  >
                    {cat}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>

        <div className="flex-1 py-16 px-12 lg:px-8 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleBlogs.map(blog => (
              <div
                key={blog.id ?? blog.title}
                className="bg-white p-2.5 rounded-[24px] shadow-sm flex flex-col h-[460px] group cursor-pointer"
              >
                <div className="flex-1 rounded-t-[16px] bg-[#E8E4DC] relative overflow-hidden">
                  <img
                    src={blog.cover_image ?? CARD_LOCAL_IMAGES[blog.id % CARD_LOCAL_IMAGES.length]}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="bg-[#787A5E] rounded-[16px] p-7 h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                  <h3 className="text-white font-semibold text-[17px] mb-2.5 tracking-wide">
                    {blog.title}
                  </h3>
                  <p className="text-white/80 text-[13px] leading-relaxed font-light pr-2">
                    {blog.excerpt}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="w-[611px] max-w-[90vw] h-[48px] mt-16 mx-auto flex justify-between items-center gap-[25px]">
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
        </div>
      </div>
    </section>
  )
}

const TestimonialsSection = () => {
  const { data: cms = {} } = useLandingPage()
  const testimonialsHeading =
    cms.testimonials_intro?.heading ?? 'Real celebrations. Real experiences.'

  const swiperRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(1)

  // CMS: Strapi `testimonials` featured + sorted by date
  const { data: testimonialsData } = useTestimonials()

  const safeTestimonials = Array.isArray(testimonialsData) ? testimonialsData : []
  const SLIDE_COUNT = safeTestimonials.length || 1
  const slides = safeTestimonials.length ? [...safeTestimonials, ...safeTestimonials] : []

  // Avoid initializing Swiper with empty/undefined data.
  if (safeTestimonials.length === 0) {
    return (
      <section className="relative w-full min-h-[757px] bg-[#364022] overflow-x-hidden font-sans flex flex-col items-center">
        <h2
          className="text-[#FFFFFF] text-[61px] leading-[1] text-center font-serif mt-[80px] z-10 px-4 reveal-heading"
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
    <section className="relative w-full min-h-[757px] bg-[#364022] overflow-x-hidden font-sans flex flex-col items-center">
      <h2
        className="text-[#FFFFFF] text-[61px] leading-[1] text-center font-serif mt-[80px] z-10 px-4 reveal-heading"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        <span className="reveal-wrapper">
          <span className="reveal-text">Real Celebrations. Real Experiences.</span>
        </span>
      </h2>

      <div className="w-full max-w-[1377.5px] mt-[80px]">
        <Swiper
          loop={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          watchSlidesProgress={true}
          className="flex items-center"
          breakpoints={{
            320: { spaceBetween: -16 },
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
                    transition-all duration-500 ease-in-out shrink-0 rounded-[12px]
                    w-[517.5px] h-[367.82px] p-[30px] gap-[36px]
                    ${isActive ? 'opacity-100 shadow-xl scale-100' : 'opacity-80 scale-[0.8]'}
                  `}
                  onClick={() => swiperRef.current?.slideToLoop(index)}
                >
                  <div className="flex justify-between w-[151.5px] h-[25.82px]">
                    {[...Array(Number(item?.stars) || 0)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-[27.55px] h-[25.82px]"
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

                  <div className="text-[#787575] font-normal font-sans w-[275px] h-[24px] text-[16px] leading-[24px]">
                    {item.category}
                  </div>

                  <div className="text-[#2D2D2D] font-normal font-sans w-[457.5px] h-[125px] text-[21px] leading-[25px]">
                    &quot;{item.text}&quot;
                  </div>

                  <div className="text-[#787575] font-medium font-sans w-[457.5px] h-[25px] text-[21px] leading-[25px]">
                    {item.author}
                  </div>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="relative z-30 w-[611px] h-[48px] mt-[40px] flex justify-between items-center gap-[25px]">
        <button
          type="button"
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label="Previous testimonial"
          className="w-[48px] h-[48px] bg-[#CDB17E] rounded-[96px] flex items-center justify-center hover:bg-[#bfa06b] transition-colors shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-[4px] w-[100px] h-[8px] justify-center">
          {safeTestimonials.map((_, idx) => (
            <div
              key={idx}
              className={`h-[8px] rounded-[8px] transition-all duration-300 ${activeIndex === idx ? 'w-[52px] bg-[#CDB17E]' : 'w-[8px] bg-[#C8C8C8]'}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Next testimonial"
          className="w-[48px] h-[48px] bg-[#CDB17E] rounded-[96px] flex items-center justify-center hover:bg-[#bfa06b] transition-colors shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
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

  return (
    <section
      ref={sectionRef}
      className="w-full flex justify-center bg-[#FFFFFF] font-sans overflow-visible"
    >
      <div className="relative w-full max-w-[1440px] h-auto lg:h-[511px] flex flex-col lg:flex-row mx-auto">
        <div className="relative w-full lg:w-[880px] h-auto lg:h-[511px] bg-[#FFFFFF] px-8 py-12 lg:p-0 flex flex-col items-center lg:items-start lg:block">
          <div className="lg:absolute lg:left-[100px] lg:top-[80px] flex flex-col items-start text-left w-full max-w-[400px]">
            <h2
              className="text-[#2D2D2D] text-[27px] leading-[100%] w-full lg:w-[400px] font-serif m-0 reveal-heading"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              <span className="reveal-wrapper">
                <span className="reveal-text">{ig.heading ?? 'Behind the Scenes'}</span>
              </span>
            </h2>

            <p className="text-[#2D2D2D] opacity-50 text-[16px] leading-[150%] w-full lg:w-[339px] mt-[20px] font-sans m-0 reveal-on-scroll">
              <span className="reveal-wrapper">
                <span className="reveal-text">
                  {ig.body ??
                    'Follow along for real celebrations, styling ideas, and behind-the-scenes moments from the events we love creating.'}
                </span>
              </span>
            </p>

            <button className="box-border flex flex-row items-center justify-center pl-[16px] pr-[8px] py-[8px] gap-[16px] w-[177px] h-[36px] mt-[16px] border border-[#591902] rounded-[56px] hover:bg-gray-50 transition-colors">
              <span className="text-[#591902] font-medium text-[12px] leading-[150%] font-sans w-[117px] text-left">
                {ig.cta_label ?? 'Join the instagram fam!'}
              </span>
              <svg
                className="w-[20px] h-[20px] shrink-0"
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
          </div>

          <img
            src={inspirationImg}
            alt="Behind the scenes setup"
            className="w-full max-w-[240px] h-auto lg:w-[240px] lg:h-[351px] rounded-[8px] mt-10 lg:mt-0 lg:absolute lg:left-[540px] lg:top-[80px] object-cover object-[20%_center]"
            loading="lazy"
          />
        </div>

        <div className="relative w-full lg:w-[560px] h-auto lg:h-[511px] bg-[#591902] px-8 py-12 lg:p-0 flex flex-col items-center lg:block">
          <div className="w-full max-w-[420px] lg:absolute lg:w-[420px] h-[210px] lg:left-[40px] lg:top-[40px] bg-[#FFFFFF] rounded-[8px] overflow-hidden" />

          <div className="flex flex-col items-start w-full max-w-[420px] mt-10 lg:mt-0 lg:absolute lg:left-[40px] lg:top-[290px]">
            <h2
              className="text-[#FFFFFF] text-[27px] leading-[100%] w-full lg:w-[420px] font-serif m-0 reveal-heading"
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
                      'Great events are never created alone. We work with a trusted circle of florists, decorators, caterers, bartenders, and production houses who help bring celebrations to life.'}
                  </span>
                </span>
              </p>

              <button className="box-border flex flex-row items-center justify-center pl-[24px] pr-[4px] py-[4px] gap-[16px] w-[228px] h-[44px] bg-[#CDB17E] rounded-[56px] hover:bg-[#bfa06b] transition-colors group">
                <span className="text-[#FAFAFA] font-medium text-[16px] leading-[150%] font-sans w-[148px] text-left">
                  {vp.cta_label ?? 'Apply as a Vendor'}
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

    const targets = Array.from(root.querySelectorAll('.reveal-heading, .reveal-on-scroll'))
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

            Array.from(el.querySelectorAll('.reveal-text')).forEach((span, i) => {
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
