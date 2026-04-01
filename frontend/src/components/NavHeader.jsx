import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import navLogo from '../assets/images/navbar.png'
import mobilenavlogo from "../assets/images/mobile_nav_logo_light.png"
import { authLogout } from '../lib/api'

const EVENT_IMAGE =
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80'

const BASE_LINKS = [
  { label: 'Events', to: '/events' },
  { label: 'Services', to: '/services' },
  { label: 'In-House Event Planner', to: '/in-house-planner' },
  { label: 'Story Behind 11', to: '/about' },
  { label: "FAQ's", to: '/faqs' },
  { label: 'Blogs', to: '/blogs' },
  { label: 'Contact', to: '/contact' },
]

const SOCIALS = ['Instagram', 'Twitter', 'Youtube']

const NAVBAR_THEMES = {
  '/': {
    desktop: {
      bgColor: 'transparent',
      bgImage: null,
      iconColor: '#FAFAFA',
      searchBg: 'rgba(255,255,255,0.2)',
      searchBorder: 'rgba(255,255,255,0.2)',
      logoMode: 'light',
    },
    mobile: {
      bgColor: 'transparent',
      bgImage: null,
      iconColor: '#FAFAFA',
      logoMode: 'light',
    },
  },
  '/about': {
    desktop: {
      bgColor: 'transparent',
      bgImage: null,
      iconColor: '#FAFAFA',
      searchBg: 'rgba(255,255,255,0.2)',
      searchBorder: 'rgba(255,255,255,0.2)',
      logoMode: 'light',
    },
    mobile: {
      bgColor: 'transparent',
      bgImage: null,
      iconColor: '#FAFAFA',
      logoMode: 'light',
    },
  },
  default: {
    desktop: {
      bgColor: 'rgba(255,255,255,0.92)',
      bgImage: null,
      iconColor: '#591902',
      searchBg: 'rgba(89,25,2,0.06)',
      searchBorder: 'rgba(89,25,2,0.08)',
      logoMode: 'dark',
    },
    mobile: {
      bgColor: 'rgba(255,255,255,0.94)',
      bgImage: null,
      iconColor: '#591902',
      logoMode: 'dark',
    },
  },
}

const NavHeader = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isAbout = pathname === '/about'
  const lastScrollY = useRef(0)

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('elewen_jwt'))
  const [entered, setEntered] = useState(!isHome)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const sync = () => setIsLoggedIn(!!localStorage.getItem('elewen_jwt'))
    window.addEventListener('storage', sync)
    window.addEventListener('elewen-auth-change', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('elewen-auth-change', sync)
    }
  }, [])

  useEffect(() => {
    if (!isHome) return
    const onDone = () => setEntered(true)
    window.addEventListener('hero-preloader-done', onDone, { once: true })
    return () => window.removeEventListener('hero-preloader-done', onDone)
  }, [isHome])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 10) setHidden(false)
      else if (y > lastScrollY.current + 8) setHidden(true)
      else if (y < lastScrollY.current - 8) setHidden(false)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(false)
      setHidden(false)
    }, 0)
    lastScrollY.current = 0
    window.scrollTo(0, 0)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleLogout = async () => {
    try {
      await authLogout()
    } catch {}
    localStorage.removeItem('elewen_jwt')
    setIsLoggedIn(false)
    setOpen(false)
    window.dispatchEvent(new Event('elewen-auth-change'))
    navigate('/')
  }

  const pageTheme = NAVBAR_THEMES[pathname] ?? NAVBAR_THEMES.default
  const desktopTheme = pageTheme.desktop
  const mobileTheme = pageTheme.mobile
  const iconColor = desktopTheme.iconColor
  const mobileIconColor = mobileTheme.iconColor
  const visibilityClass = !entered ? 'invisible pointer-events-none' : ''
  const transformClass = !entered ? '-translate-y-4' : hidden ? '-translate-y-full' : 'translate-y-0'
  const desktopLogoStyle =
    desktopTheme.logoMode === 'light' ? { filter: 'brightness(0) invert(1)' } : {}
  const mobileLogoSrc = mobileTheme.logoMode === 'light' ? mobilenavlogo : navLogo

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[60] overflow-hidden px-6 py-4 transition-all duration-[600ms] ease-[cubic-bezier(0.32,0,0.15,1)] md:px-10 md:py-6 ${visibilityClass} ${transformClass}`}
      >
        <div
          className="pointer-events-none absolute inset-0 md:hidden"
          style={{
            backgroundColor: mobileTheme.bgColor,
            backgroundImage: mobileTheme.bgImage ? `url(${mobileTheme.bgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            backgroundColor: desktopTheme.bgColor,
            backgroundImage: desktopTheme.bgImage ? `url(${desktopTheme.bgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className="relative z-10 flex w-full items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="md:hidden">
            <img
              src={mobileLogoSrc}
              alt="Elewen"
              className="h-auto w-[min(114px,32vw)] min-w-[92px] object-contain"
              style={mobileTheme.logoMode === 'dark' ? { filter: 'none' } : undefined}
            />
          </Link>

          <button
            onClick={() => setOpen(true)}
            type="button"
            className="hidden w-64 items-center rounded-full px-4 py-2.5 backdrop-blur-lg transition-all md:flex"
            style={{
              border: `1px solid ${desktopTheme.searchBorder}`,
              background: desktopTheme.searchBg,
            }}
          >
            <svg
              className="mr-3 h-4 w-4 shrink-0"
              style={{ color: iconColor }}
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
            <span className="text-sm font-medium tracking-wide" style={{ color: iconColor }}>
              Search
            </span>
          </button>
        </div>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
          <Link to="/" className="flex h-40 w-110 items-center justify-center md:h-70 md:w-130">
            <img
              src={navLogo}
              alt="Elewen"
              className="h-full w-full object-contain"
              style={desktopLogoStyle}
            />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-1 md:hidden" aria-label="Search" type="button">
            <svg className="h-5 w-5" fill="none" stroke={mobileIconColor} viewBox="0 0 24 24">
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
            className="group flex flex-col gap-1.5 p-1"
            type="button"
          >
            <div
              className="h-0.5 w-7 transition-all duration-300 group-hover:opacity-60 md:w-9"
              style={{ backgroundColor: window.innerWidth >= 768 ? iconColor : mobileIconColor }}
            />
            <div
              className="h-0.5 w-5 transition-all duration-300 group-hover:w-7 md:w-7 md:group-hover:w-9"
              style={{ backgroundColor: window.innerWidth >= 768 ? iconColor : mobileIconColor }}
            />
          </button>
        </div>
        </div>
      </header>

      <div
        className={`fixed inset-x-0 top-0 z-[80] flex flex-col overflow-hidden bg-[#111110] md:inset-0 md:min-h-screen ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{
          clipPath: open ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
          transition: 'clip-path 0.72s cubic-bezier(0.32,0,0.15,1), opacity 0.32s ease',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
          <div className="hidden w-64 items-center rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-lg md:flex">
            <svg
              className="mr-3 h-4 w-4 shrink-0 text-white/60"
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
            <span className="text-sm font-medium tracking-wide text-white/60">Search</span>
          </div>

          <Link to="/" className="md:hidden" onClick={() => setOpen(false)}>
            <img
              src={mobilenavlogo}
              alt="Elewen"
              className="h-auto w-[min(114px,32vw)] min-w-[92px] object-contain"
            />
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 md:flex">
            <Link to="/" className="flex h-40 w-110 items-center justify-center md:h-70 md:w-130">
              <img
                src={navLogo}
                alt="Elewen"
                className="h-full w-full object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-4 md:hidden">
            <button type="button" aria-label="Search" className="p-1 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex flex-col gap-1.5 p-1"
              type="button"
            >
              <span className="block h-0.5 w-8 bg-white" />
              <span className="ml-auto block h-0.5 w-5 bg-white" />
            </button>
          </div>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="ml-auto hidden h-10 w-10 items-center justify-center  transition-colors  md:flex"
            type="button"
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-0 md:flex-row md:px-10 md:pb-6">
          <nav className="relative flex flex-1 flex-col justify-start pt-10 md:justify-center md:pt-0">
            {BASE_LINKS.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`group flex items-end justify-between py-5 md:py-4 ${
                  pathname === link.to ? 'text-[#CDB17E]' : 'text-white/85 hover:text-white'
                }`}
                style={{
                  transitionDelay: open ? `${index * 50 + 100}ms` : '0ms',
                  transform: open ? 'translateY(0)' : 'translateY(20px)',
                  opacity: open ? 1 : 0,
                  transition: `transform 0.5s cubic-bezier(0.32,0,0.15,1) ${index * 50 + 100}ms, opacity 0.5s ease ${index * 50 + 100}ms, color 0.2s ease`,
                }}
              >
                <span className="inline-block max-w-[72%]">
                  <span
                    className="inline-block bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat pb-1 text-[18px] font-normal uppercase leading-none tracking-wide transition-[background-size] duration-500 ease-out group-hover:bg-[length:100%_1px] md:text-2xl lg:text-3xl"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    {link.label}
                  </span>
                </span>
              </Link>
            ))}

            <div
              className="absolute right-0 top-10 mt-0 md:static md:mt-8"
              style={{
                transitionDelay: open ? `${BASE_LINKS.length * 50 + 150}ms` : '0ms',
                transform: open ? 'translateY(0)' : 'translateY(20px)',
                opacity: open ? 1 : 0,
                transition: `transform 0.5s cubic-bezier(0.32,0,0.15,1) ${BASE_LINKS.length * 50 + 150}ms, opacity 0.5s ease ${BASE_LINKS.length * 50 + 150}ms`,
              }}
            >
              {isLoggedIn ? (
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/account"
                    onClick={() => setOpen(false)}
                    className="group flex w-fit items-center rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5 transition-colors hover:bg-[#C6AB7F]"
                  >
                    <span className="mr-5 text-[15px] font-medium text-white">My Account</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                      <svg
                        className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
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
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="group flex w-fit items-center rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5 transition-colors hover:bg-[#C6AB7F]"
                    type="button"
                  >
                    <span className="mr-5 text-[15px] font-medium text-white">Logout</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                      <svg
                        className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
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
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="group flex w-fit items-center rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5 transition-colors hover:bg-[#C6AB7F]"
                >
                  <span className="mr-5 text-[15px] font-medium text-white">Login</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                    <svg
                      className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
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
                </Link>
              )}
            </div>

            <div
              className="mt-auto flex flex-col items-end pb-8 pt-12 text-right md:hidden"
              style={{
                transitionDelay: open ? '340ms' : '0ms',
                transform: open ? 'translateY(0)' : 'translateY(20px)',
                opacity: open ? 1 : 0,
                transition: 'transform 0.5s cubic-bezier(0.32,0,0.15,1) 340ms, opacity 0.5s ease 340ms',
              }}
            >
              <p className="mb-1 text-[15px] text-white/40" style={{ fontFamily: "'Malgin', serif" }}>
                +91 7263587619
              </p>
              <p
                className="w-[min(153px,48vw)] min-w-[128px] text-right text-[clamp(14px,3.8vw,19px)] leading-[1] text-white"
                style={{ fontFamily: "'Malgin', serif", fontWeight: 400 }}
              >
                Hello@Elewen.com
              </p>
            </div>
          </nav>

          <div
            className="hidden w-[45%] shrink-0 items-end justify-end pl-10 md:flex md:flex-col"
            style={{
              transitionDelay: open ? '200ms' : '0ms',
              transform: open ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
              opacity: open ? 1 : 0,
              transition:
                'transform 0.6s cubic-bezier(0.32,0,0.15,1) 200ms, opacity 0.6s ease 200ms',
            }}
          >
            <div className="h-80 w-full max-w-xl overflow-hidden rounded-2xl lg:h-96">
              <img src={EVENT_IMAGE} alt="Elewen Events" className="h-full w-full object-cover" />
            </div>
            <div className="mt-6 flex flex-col items-end">
              <p className="mb-0.5 text-sm text-white/40">+91 7263587619</p>
              <p className="text-lg font-semibold tracking-tight text-white md:text-2xl">
                Hello@Elewen.com
              </p>
            </div>
          </div>
        </div>

        <div
          className="mb-6 flex shrink-0 flex-col-reverse items-start justify-between gap-4 px-6 md:flex-row md:items-end md:px-10"
          style={{
            transitionDelay: open ? '350ms' : '0ms',
            transform: open ? 'translateY(0)' : 'translateY(20px)',
            opacity: open ? 1 : 0,
            transition: 'transform 0.5s cubic-bezier(0.32,0,0.15,1) 350ms, opacity 0.5s ease 350ms',
          }}
        >
          <div className="flex w-full items-center justify-between gap-3 border-t border-white/10 pt-4 md:gap-6 md:pt-6">
            <div className="flex w-full items-center justify-between md:w-auto md:justify-start md:gap-5">
              {SOCIALS.map(label => (
                <a
                  key={label}
                  href={`https://${label.toLowerCase()}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 text-sm font-medium text-white md:text-base"
                >
                  <span className="inline-block bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-out group-hover:bg-[length:100%_1px]">
                    {label}
                  </span>
                  <svg
                    className="h-4.5 w-4.5 text-white transition-transform duration-300 ease-out group-hover:rotate-45"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 17L17 7M17 7H7M17 7v10"
                    />
                  </svg>
                </a>
              ))}
            </div>

            <div className="ml-4 hidden items-center gap-4 text-sm text-white md:flex">
              <a href="/privacy" className="transition-colors">
                Privacy Policy
              </a>
              <span>&bull;</span>
              <a href="/terms" className="transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NavHeader
