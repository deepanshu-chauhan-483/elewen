import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import navLogo from '../assets/images/navbar.png'
import mobilenavlogo from '../assets/images/mobile_nav_logo_light.png'
import ScallopBulbCurtain from './common/ScallopBulbCurtain'
import { authLogout, getStoredJwt } from '../lib/api'
import { useCart } from '../hooks/useCart'
const EVENT_IMAGE = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80'

const BASE_LINKS = [
  { label: 'Events', to: '/event-flow/category' },
  { label: 'Services', to: '/event-flow/service?flow=services' },
  { label: 'How It Work', to: '/how-it-work' },
  { label: 'In-House Event Planner', to: '/in-house-planner' },
  { label: 'Story Behind 11', to: '/about' },
  { label: "FAQ's", to: '/faqs' },
  { label: 'Blogs', to: '/blogs' },
  { label: 'Contact', to: '/contact' },
]

const SOCIALS = ['Instagram', 'Twitter', 'Youtube']

const NAVBAR_THEMES = {
  light: {
    desktop: {
      bgColor: '#FAFAFA',
      bgImage: null,
      iconColor: '#262626',
      searchBg: 'rgba(0,0,0,0.06)',
      searchBorder: 'rgba(0,0,0,0.08)',
      logoMode: 'dark',
    },
    mobile: {
      bgColor: '#FAFAFA',
      bgImage: null,
      iconColor: '#262626',
      logoMode: 'dark',
    },
  },
  dark: {
    desktop: {
      bgColor: '#050505',
      bgImage: null,
      iconColor: '#FAFAFA',
      searchBg: 'rgba(139, 135, 135, 0.18)',
      searchBorder: 'rgba(255,255,255,0.12)',
      logoMode: 'light',
    },
    mobile: {
      bgColor: '#050505',
      bgImage: null,
      iconColor: '#FAFAFA',
      logoMode: 'light',
    },
  },
  glass: {
    desktop: {
      bgColor: 'rgba(250, 250, 250, 0.78)',
      bgImage: null,
      iconColor: '#262626',
      searchBg: 'rgba(255,255,255,0.58)',
      searchBorder: 'rgba(0,0,0,0.06)',
      logoMode: 'dark',
    },
    mobile: {
      bgColor: 'rgba(250,250,250,0.74)',
      bgImage: null,
      iconColor: '#262626',
      logoMode: 'dark',
    },
  },
}

const TRANSPARENT_BG = 'rgba(0, 0, 0, 0)'
const DEFAULT_NAV_SURFACE = 'solid'
const TRANSPARENT_NAV_SURFACE = 'transparent'
const GLASS_BLUR_MOBILE = 'blur(1px)'
const GLASS_BLUR_DESKTOP = 'blur(1px)'
const BLACK_NAV_ACCENT_PATHS = ['/book-consultation', '/consultation-confirmation']

const parseRgb = color => {
  const match = color?.match(/rgba?\(([^)]+)\)/i)
  if (!match) return null

  const [r = 0, g = 0, b = 0, a = 1] = match[1].split(',').map(part => Number(part.trim()))
  return { r, g, b, a: Number.isFinite(a) ? a : 1 }
}

const getLuminance = ({ r, g, b }) => {
  const normalize = value => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b)
}

const resolveNavAppearanceFromPoint = (x, y) => {
  const element = document.elementFromPoint(x, y)
  if (!element) {
    return { themeName: 'light', surface: DEFAULT_NAV_SURFACE }
  }

  const explicitSurface = element.closest('[data-nav-surface]')?.getAttribute('data-nav-surface')
  const surface =
    explicitSurface === TRANSPARENT_NAV_SURFACE ? TRANSPARENT_NAV_SURFACE : DEFAULT_NAV_SURFACE

  const explicitTheme = element.closest('[data-nav-theme]')?.getAttribute('data-nav-theme')
  if (explicitTheme && NAVBAR_THEMES[explicitTheme]) {
    return { themeName: explicitTheme, surface }
  }

  let current = element
  while (current && current !== document.body) {
    const styles = window.getComputedStyle(current)
    const parsed = parseRgb(styles.backgroundColor)
    if (
      parsed &&
      styles.backgroundColor !== TRANSPARENT_BG &&
      styles.backgroundColor !== 'transparent'
    ) {
      // Only semi-transparent section layers should produce the glass navbar.
      // Decorative background images should not override a solid section color.
      if (parsed.a > 0 && parsed.a < 0.92) return { themeName: 'glass', surface }
      if (parsed.a >= 0.92) {
        return { themeName: getLuminance(parsed) < 0.34 ? 'dark' : 'light', surface }
      }
    }

    current = current.parentElement
  }

  return { themeName: 'light', surface }
}

function DashboardIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-2"
    >
      <path
        d="M9 3H4C3.44772 3 3 3.44772 3 4V11C3 11.5523 3.44772 12 4 12H9C9.55228 12 10 11.5523 10 11V4C10 3.44772 9.55228 3 9 3Z"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 3H15C14.4477 3 14 3.44772 14 4V7C14 7.55228 14.4477 8 15 8H20C20.5523 8 21 7.55228 21 7V4C21 3.44772 20.5523 3 20 3Z"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12H15C14.4477 12 14 12.4477 14 13V20C14 20.5523 14.4477 21 15 21H20C20.5523 21 21 20.5523 21 20V13C21 12.4477 20.5523 12 20 12Z"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 16H4C3.44772 16 3 16.4477 3 17V20C3 20.5523 3.44772 21 4 21H9C9.55228 21 10 20.5523 10 20V17C10 16.4477 9.55228 16 9 16Z"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 17.2002C16 18.2611 15.5786 19.2785 14.8284 20.0286C14.0783 20.7788 13.0609 21.2002 12 21.2002C10.9391 21.2002 9.92172 20.7788 9.17157 20.0286C8.42143 19.2785 8 18.2611 8 17.2002M3.103 13.2342H20.897M3.4 12.6672C3.14036 13.0134 3 13.4345 3 13.8672V27.2002C3 27.7306 3.21071 28.2393 3.58579 28.6144C3.96086 28.9895 4.46957 29.2002 5 29.2002H19C19.5304 29.2002 20.0391 28.9895 20.4142 28.6144C20.7893 28.2393 21 27.7306 21 27.2002V13.8672C21 13.4345 20.8596 13.0134 20.6 12.6672L18.6 10.0002C18.4137 9.7518 18.1721 9.5502 17.8944 9.41134C17.6167 9.27249 17.3105 9.2002 17 9.2002H7C6.68951 9.2002 6.38328 9.27249 6.10557 9.41134C5.82786 9.5502 5.58629 9.7518 5.4 10.0002L3.4 12.6672Z"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function CartButton({ count, className }) {
  const navigate = useNavigate()
  const handleClick = () => {
    navigate('/cart')
  }
  return (
    <button
      type="button"
      aria-label="Cart"
      className={`relative ${className}`}
      onClick={handleClick}
    >
      <CartIcon />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D4BA8E] px-1 text-[11px] font-semibold leading-none text-[#111110]">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  )
}
const NavHeader = ({ forcedThemeName = null, backgroundColorOverride = null }) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  // const isAbout = pathname === '/about'
  const lastScrollY = useRef(0)
  const headerRef = useRef(null)

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getStoredJwt())
  const [entered, setEntered] = useState(!isHome)
  const [hidden, setHidden] = useState(false)
  const [navThemeName, setNavThemeName] = useState(isHome ? 'glass' : 'light')
  const [navSurface, setNavSurface] = useState(DEFAULT_NAV_SURFACE)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  const { itemCount } = useCart()
  const useBlackNavAccent = BLACK_NAV_ACCENT_PATHS.includes(pathname)

  useEffect(() => {
    const sync = () => setIsLoggedIn(!!getStoredJwt())
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
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

  useEffect(() => {
    if (forcedThemeName && NAVBAR_THEMES[forcedThemeName]) return undefined

    if (open) return

    let rafId = null

    const updateTheme = () => {
      const header = headerRef.current
      if (!header) return

      const rect = header.getBoundingClientRect()
      const sampleY = Math.min(Math.max(Math.round(rect.bottom + 16), 0), window.innerHeight - 1)
      const samplePoints = [0.2, 0.5, 0.8].map(ratio => ({
        x: Math.round(window.innerWidth * ratio),
        y: sampleY,
      }))

      const appearances = samplePoints.map(point => resolveNavAppearanceFromPoint(point.x, point.y))
      const themes = appearances.map(appearance => appearance.themeName)
      const nextTheme =
        themes.find(theme => theme === 'dark') ??
        themes.find(theme => theme === 'light') ??
        themes[0] ??
        'light'
      const nextSurface = appearances.some(
        appearance => appearance.surface === TRANSPARENT_NAV_SURFACE
      )
        ? TRANSPARENT_NAV_SURFACE
        : DEFAULT_NAV_SURFACE

      setNavThemeName(prev => (prev === nextTheme ? prev : nextTheme))
      setNavSurface(prev => (prev === nextSurface ? prev : nextSurface))
    }

    const scheduleUpdate = () => {
      if (rafId != null) return
      rafId = window.requestAnimationFrame(() => {
        updateTheme()
        rafId = null
      })
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (rafId != null) window.cancelAnimationFrame(rafId)
    }
  }, [forcedThemeName, pathname, open])
  const handleLogout = async () => {
    try {
      await authLogout()
    } catch {
      // Ignore logout API failures and continue clearing local session state.
    }
    localStorage.removeItem('elewen_jwt')
    localStorage.removeItem('accessToken')
    setIsLoggedIn(false)
    setOpen(false)
    window.dispatchEvent(new Event('elewen-auth-change'))
    navigate('/')
  }

  const hasForcedTheme = !!(forcedThemeName && NAVBAR_THEMES[forcedThemeName])
  const resolvedThemeName = hasForcedTheme ? forcedThemeName : navThemeName
  const pageTheme = NAVBAR_THEMES[resolvedThemeName] ?? NAVBAR_THEMES.light
  const desktopTheme = pageTheme.desktop
  const mobileTheme = pageTheme.mobile
  const resolvedNavSurface = hasForcedTheme ? DEFAULT_NAV_SURFACE : navSurface
  const isTransparentNav = resolvedNavSurface === TRANSPARENT_NAV_SURFACE
  const iconColor = isTransparentNav ? '#FAFAFA' : desktopTheme.iconColor
  const mobileIconColor = isTransparentNav ? '#FAFAFA' : mobileTheme.iconColor
  const searchButtonBg = isTransparentNav ? 'rgba(255,255,255,0.22)' : desktopTheme.searchBg
  const searchButtonBorder = isTransparentNav ? 'rgba(255,255,255,0.16)' : desktopTheme.searchBorder
  const isLightSearchText =
    isTransparentNav || resolvedThemeName === 'dark' || resolvedThemeName === 'glass'
  const searchTextColor = isLightSearchText ? 'rgba(255,255,255,0.82)' : 'rgba(38,38,38,0.58)'
  const visibilityClass = !entered ? 'invisible pointer-events-none' : ''
  const transformClass = !entered
    ? '-translate-y-4'
    : hidden
      ? '-translate-y-full'
      : 'translate-y-0'
  const desktopLogoStyle = isTransparentNav
    ? { filter: 'brightness(0) invert(1)' }
    : desktopTheme.logoMode === 'light'
      ? { filter: 'brightness(0) invert(1)' }
      : {}
  const resolvedDesktopLogoStyle = useBlackNavAccent
    ? { filter: 'brightness(0)' }
    : desktopLogoStyle
  const mobileLogoSrc = mobilenavlogo
  const mobileLogoStyle = isTransparentNav
    ? undefined
    : mobileTheme.logoMode === 'dark'
      ? { filter: 'brightness(0)' }
      : undefined
  const resolvedDesktopIconColor = useBlackNavAccent ? '#000000' : iconColor
  const resolvedMobileIconColor = useBlackNavAccent ? '#000000' : mobileIconColor
  const overlayActionClass =
    'flex h-8 w-8 items-center justify-center text-white transition-opacity hover:opacity-70'
  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-[60] overflow-hidden px-6 py-[8px] transition-all duration-[600ms] ease-[cubic-bezier(0.32,0,0.15,1)] md:px-10 md:py-[12px] ${visibilityClass} ${transformClass}`}
      >
        <div
          className="pointer-events-none absolute inset-0 md:hidden"
          style={{
            backgroundColor: isTransparentNav ? TRANSPARENT_BG : mobileTheme.bgColor,
            ...(backgroundColorOverride && !isTransparentNav
              ? { backgroundColor: backgroundColorOverride }
              : {}),
            backgroundImage:
              isTransparentNav || !mobileTheme.bgImage ? 'none' : `url(${mobileTheme.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backdropFilter:
              isTransparentNav || resolvedThemeName !== 'glass' ? 'none' : GLASS_BLUR_MOBILE,
            WebkitBackdropFilter:
              isTransparentNav || resolvedThemeName !== 'glass' ? 'none' : GLASS_BLUR_MOBILE,
            borderBottom:
              isTransparentNav || resolvedThemeName !== 'glass'
                ? 'none'
                : '1px solid rgba(0,0,0,0.05)',
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            backgroundColor: isTransparentNav ? TRANSPARENT_BG : desktopTheme.bgColor,
            ...(backgroundColorOverride && !isTransparentNav
              ? { backgroundColor: backgroundColorOverride }
              : {}),
            backgroundImage:
              isTransparentNav || !desktopTheme.bgImage ? 'none' : `url(${desktopTheme.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backdropFilter:
              isTransparentNav || resolvedThemeName !== 'glass' ? 'none' : GLASS_BLUR_DESKTOP,
            WebkitBackdropFilter:
              isTransparentNav || resolvedThemeName !== 'glass' ? 'none' : GLASS_BLUR_DESKTOP,
            borderBottom:
              isTransparentNav || resolvedThemeName !== 'glass'
                ? 'none'
                : '1px solid rgba(0,0,0,0.05)',
          }}
        />

        <div className="relative z-10 flex w-full items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="md:hidden">
              <img
                src={mobileLogoSrc}
                alt="Elewen"
                className="h-auto w-[min(114px,32vw)] min-w-[92px] object-contain"
                style={mobileLogoStyle}
              />
            </Link>

            <button
              onClick={() => setOpen(true)}
              type="button"
              className="hidden w-[225px] items-center gap-2 rounded-full px-2 py-1 backdrop-blur-md transition-all md:flex"
              style={{
                border: `1px solid ${searchButtonBorder}`,
                background: searchButtonBg,
                boxShadow: isTransparentNav ? '0 8px 20px rgba(89,25,2,0.05)' : 'none',
              }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#591902]">
                <svg
                  className="h-3 w-3"
                  style={{ color: '#FAFAFA' }}
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
              </span>
              <span
                className="text-[13px] font-medium tracking-wide"
                style={{ color: searchTextColor }}
              >
                Search
              </span>
            </button>
          </div>

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
            <Link to="/" className="flex h-26 w-84 items-center justify-center md:h-52 md:w-96">
              <img
                src={navLogo}
                alt="Elewen"
                className="h-full w-full object-contain"
                style={resolvedDesktopLogoStyle}
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-0.5 md:hidden" aria-label="Search" type="button">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke={resolvedMobileIconColor}
                viewBox="0 0 24 24"
              >
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
              className="group flex flex-col gap-1 p-0.5"
              type="button"
            >
              <div
                className="h-0.5 w-6 transition-all duration-300 group-hover:opacity-60 md:w-7"
                style={{
                  backgroundColor: isDesktop ? resolvedDesktopIconColor : resolvedMobileIconColor,
                }}
              />
              <div
                className="h-0.5 w-4 transition-all duration-300 group-hover:w-7 md:w-6 md:group-hover:w-8"
                style={{
                  backgroundColor: isDesktop ? resolvedDesktopIconColor : resolvedMobileIconColor,
                }}
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
          height: isDesktop ? '100vh' : 'auto',
          clipPath: open ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
          transition: 'clip-path 0.72s cubic-bezier(0.32,0,0.15,1), opacity 0.32s ease',
        }}
      >
        <div className="flex items-center justify-between px-6 py-[14px] md:px-10 md:py-[22px]">
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
              className="h-auto w-[min(114px,32vw)] min-w-[92px] object-contain mt-2"
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
          <div className="ml-auto flex items-center gap-3 md:hidden">
            <button type="button" aria-label="Search" className="p-1 text-white">
              <svg className="h-5 w-5 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </button>
            {isLoggedIn ? (
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                aria-label="Dashboard"
                className={overlayActionClass}
              >
                <DashboardIcon />
              </Link>
            ) : null}
            <CartButton count={itemCount} className={overlayActionClass} />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className={overlayActionClass}
              type="button"
            >
              <svg
                className="h-10 w-10 translate-y-[2px] mt-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                xmlns="http://www.w3.org/2000/svg"
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
          <div className="ml-auto hidden items-center  gap-3 md:flex">
            {isLoggedIn ? (
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                aria-label="Dashboard"
                className={overlayActionClass}
              >
                <DashboardIcon />
              </Link>
            ) : null}
            <CartButton count={itemCount} className={overlayActionClass} />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className={overlayActionClass}
              type="button"
            >
              <svg
                className="h-10 w-10 translate-y-[2px] mt-1"
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
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden px-6 pb-0 md:flex-1 md:flex-row md:px-10 md:pb-auto">
          <nav className="relative flex flex-col justify-start pt-8 md:flex-1 md:pt-auto">
            {BASE_LINKS.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`group flex items-end justify-between py-2.5 md:py-1.5 ${
                  pathname === link.to ? 'text-[#CDB17E]' : 'text-white/85 hover:text-white'
                }`}
                style={{
                  transitionDelay: open ? `${index * 50 + 100}ms` : '0ms',
                  transform: open ? 'translateY(0)' : 'translateY(20px)',
                  opacity: open ? 1 : 0,
                  transition: `transform 0.5s cubic-bezier(0.32,0,0.15,1) ${index * 50 + 100}ms, opacity 0.5s ease ${index * 50 + 100}ms, color 0.2s ease`,
                }}
              >
                <span className="inline-block max-w-full md:max-w-[72%]">
                  <span
                    className="inline-block w-auto max-w-none whitespace-nowrap bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat text-[14px] font-normal uppercase leading-[1] tracking-[0em] transition-[background-size] duration-500 ease-out group-hover:bg-[length:100%_1px] md:h-auto md:w-auto md:pb-1 md:leading-none md:text-[clamp(16px,1.25vw,22px)]"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    {link.label}
                  </span>
                </span>
              </Link>
            ))}

            <div
              className="absolute right-0 top-4 mt-0 md:static md:mt-4"
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
              className="mt-8 flex flex-col items-end pb-6 pt-4 text-right md:hidden"
              style={{
                transitionDelay: open ? '340ms' : '0ms',
                transform: open ? 'translateY(0)' : 'translateY(20px)',
                opacity: open ? 1 : 0,
                transition:
                  'transform 0.5s cubic-bezier(0.32,0,0.15,1) 340ms, opacity 0.5s ease 340ms',
              }}
            >
              <p
                className="mb-1 text-[15px] text-white/40"
                style={{ fontFamily: "'Malgin', serif" }}
              >
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
            <div className="h-72 w-full max-w-xl overflow-hidden rounded-2xl lg:h-80">
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
          className="mb-0 flex shrink-0 flex-col-reverse items-start justify-between gap-4 px-6 pb-6 md:flex-row md:items-end md:px-10 md:pb-3"
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

        <div className="pointer-events-none relative hidden h-[76px] overflow-hidden shrink-0 bg-white md:block">
          <ScallopBulbCurtain
            count={12}
            outerColor="#CDB17E"
            innerColor="#111110"
            showBulbs={false}
            fitToWidth
            className="absolute inset-x-0 top-0 flex pointer-events-none z-10"
          />
        </div>
      </div>
    </>
  )
}

export default NavHeader
