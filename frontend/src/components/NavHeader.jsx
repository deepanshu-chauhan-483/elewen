import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import navLogo from '../assets/images/navbar.png'

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'In-House Planner', to: '/in-house-planner' },
]

const NavHeader = () => {
  const [open, setOpen] = useState(false)
  // On home page, stay hidden until preloader fires the event.
  // On other pages, show immediately.
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  // On home: always start hidden; show only after preloader is done (event fires).
  // On other pages: show immediately.
  const [entered, setEntered] = useState(!isHome)
  const [hidden, setHidden] = useState(false) // hide on scroll-down, reveal on scroll-up
  const lastScrollY = useRef(0)

  // Show navbar only after preloader finishes (home) or immediately (other pages)
  useEffect(() => {
    if (!isHome) return
    const onDone = () => setEntered(true)
    window.addEventListener('hero-preloader-done', onDone, { once: true })
    return () => window.removeEventListener('hero-preloader-done', onDone)
  }, [isHome])

  // Hide on scroll-down, reveal on scroll-up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 10) {
        setHidden(false)
      } else if (y > lastScrollY.current + 8) {
        setHidden(true)
      } else if (y < lastScrollY.current - 8) {
        setHidden(false)
      }
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close sidebar and reset on route change
  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(false)
      setHidden(false)
    }, 0)
    lastScrollY.current = 0
    window.scrollTo(0, 0)
    return () => clearTimeout(t)
  }, [pathname])

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isAbout = pathname === '/about'

  // On home/about: white icons (dark bg behind).
  // On other pages: dark brown icons (light page bg behind).
  const iconColor = isHome || isAbout ? '#FAFAFA' : '#591902'

  // During preloader: fully hidden (invisible + no pointer events).
  // After preloader: visible; hide on scroll-down with -translate-y-full.
  const visibilityClass = !entered ? 'invisible pointer-events-none' : ''
  const transformClass = !entered
    ? '-translate-y-4'
    : hidden
      ? '-translate-y-full'
      : 'translate-y-0'

  return (
    <>
      {/* ── Fixed header bar (hidden during preloader) ──────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 w-full flex items-center justify-between px-4 md:px-8 py-2 md:py-8 z-[60] h-16.5 md:h-25 bg-transparent transition-all duration-[600ms] ease-[cubic-bezier(0.32,0,0.15,1)] ${visibilityClass} ${transformClass}`}
      >
        {/* Left: hamburger (mobile) / search bar (desktop) */}
        <div className="flex items-center w-14 md:w-65 shrink-0">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex flex-col space-y-1.25 group cursor-pointer p-1.5 md:hidden"
          >
            <div className="w-6 h-0.5" style={{ backgroundColor: iconColor }} />
            <div className="w-4 h-0.5" style={{ backgroundColor: iconColor }} />
          </button>

          <div className="hidden md:flex items-center bg-white/50 backdrop-blur-lg rounded-full p-1.5 w-65 cursor-text transition-all hover:bg-white/60">
            <div className="w-9.5 h-9.5 bg-[#591902] rounded-full flex items-center justify-center shrink-0 shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <span className="text-[#2B2D30] text-[15px] ml-4 font-medium tracking-wide">
              Search
            </span>
          </div>
        </div>

        {/* Center: logo */}
        <div className="flex justify-center items-center flex-1 min-w-0 h-full">
          <Link to="/" className="w-100 h-35.5 md:w-120 md:h-63.5 flex items-center justify-center">
            <img
              src={navLogo}
              alt="Elewen"
              className="w-full h-full object-contain"
              style={{ filter: isHome || isAbout ? 'brightness(0) invert(1)' : 'none' }}
            />
          </Link>
        </div>

        {/* Right: search icon (mobile) / hamburger (desktop) */}
        <div className="flex justify-end items-center w-14 md:w-65 shrink-0">
          <button className="md:hidden p-1.5" aria-label="Search">
            <svg className="w-5 h-5" fill="none" stroke={iconColor} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </button>

          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="hidden md:flex flex-col space-y-2 group cursor-pointer p-2"
          >
            <div
              className="w-10 h-0.5 transition-transform origin-right group-hover:scale-x-90"
              style={{ backgroundColor: iconColor }}
            />
            <div
              className="w-10 h-0.5 transition-transform origin-right group-hover:scale-x-75"
              style={{ backgroundColor: iconColor }}
            />
          </button>
        </div>
      </header>

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-70 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ── Sidebar drawer (slides in from right) ─────────────────────────── */}
      <aside
        className={`fixed top-0 right-0 h-full w-75 md:w-90 bg-[#1a0a05] z-80 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0,0.15,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Close button */}
        <div className="flex justify-end px-6 pt-6 pb-4">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Logo in sidebar */}
        <div className="px-8 pb-8 border-b border-white/10">
          <img
            src={navLogo}
            alt="Elewen"
            className="h-8 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Nav links */}
        <nav className="flex flex-col px-8 pt-8 gap-1 flex-1">
          {LINKS.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              className={`group flex items-center justify-between py-4 border-b border-white/10 last:border-0 transition-colors hover:text-[#CDB17E] ${pathname === l.to ? 'text-[#CDB17E]' : 'text-white/80'}`}
            >
              <span
                className="text-[22px] md:text-[26px] font-normal tracking-wide"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                {l.label}
              </span>
              <span className="text-[11px] text-white/30 mr-1 font-mono">0{i + 1}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom tagline */}
        <div className="px-8 py-8">
          <p className="text-white/30 text-[12px] leading-relaxed tracking-wider uppercase">
            Plan differently.
            <br />
            Elewen.
          </p>
        </div>
      </aside>
    </>
  )
}

export default NavHeader
