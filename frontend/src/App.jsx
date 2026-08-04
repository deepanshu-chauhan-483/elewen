import { useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom'
import { useLenis } from './useLenis'
import NavHeader from './components/NavHeader'
import Footer from './components/Footer'
import CmsPageLoader from './components/common/CmsPageLoader'
import { CompactViewportSync } from './hooks/useCompactViewport'
import GoogleAnalytics from './components/common/GoogleAnalytics'
import {
  getLocationScrollKey,
  readLocationScroll,
  scrollPageTo,
  scrollPageToTop,
  usePersistLocationScroll,
} from './hooks/useScrollToTop'
import {
  applyHomeScrollRestore,
  confirmHomeScrollRestore,
  consumePendingHomeScroll,
  finishHomeScrollRestore,
  markHomeScrollRestoring,
  peekPendingHomeScroll,
  readRememberedHomeScroll,
  getWindowScrollY,
  shouldPreserveHomeScroll,
} from './lib/homeReturnScroll'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const InHousePlannerPage = lazy(() => import('./pages/InHousePlannerPage'))
const About = lazy(() => import('./pages/About'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const NewPasswordPage = lazy(() => import('./pages/NewPasswordPage'))
const BookConsultationPage = lazy(() => import('./pages/BookConsultation'))
const ConsultationConfirmation = lazy(() => import('./pages/ConsultationConfirmation'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const SingleBlogPage = lazy(() => import('./pages/SingleBlogPage'))
const HowItWorkPage = lazy(() => import('./pages/HowItWorkPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const EventPage = lazy(() => import('./pages/EventPage'))
const ServicePage = lazy(() => import('./pages/ServicePage'))
const DecorThemePage = lazy(() => import('./pages/DecorThemePage'))
const CateringLevelsPage = lazy(() => import('./pages/CateringLevelsPage'))
const PackageListingPage = lazy(() => import('./pages/PackageListingPage'))
const DecorLevelsPage = lazy(() => import('./pages/DecorLevelsPage'))
const DecorPackagesPage = lazy(() => import('./pages/DecorPackagesPage'))
const RentalFurniturePackagesPage = lazy(() => import('./pages/RentalFurniturePackagesPage'))
const CateringPackagesPage = lazy(() => import('./pages/CateringPackagesPage'))
const BartendingPackagesPage = lazy(() => import('./pages/BartendingPackagesPage'))
const SheeshaPackagesPage = lazy(() => import('./pages/SheeshaPackagesPage'))
const BartendingLevelsPage = lazy(() => import('./pages/BartendingLevelsPage'))
const PackageDetailsPage = lazy(() => import('./pages/PackageDetailsPage'))
const DecorSinglePackagePage = lazy(() => import('./pages/DecorSinglePackagePage'))
const SheeshaSinglePackagePage = lazy(() => import('./pages/SheeshaSinglePackagePage'))
const BartendingSinglePackagePage = lazy(() => import('./pages/BartendingSinglePackagePage'))
const CateringSinglePackagePage = lazy(() => import('./pages/CateringSinglePackagePage'))
const BartendingAddonDetailPage = lazy(() => import('./pages/BartendingAddonDetailPage'))
const SinglePackageCheckout = lazy(() => import('./pages/SinglePackageCheckout'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'))
const CartPage = lazy(() => import('./pages/CartPage'))
const SampleTasteBooking = lazy(() => import('./pages/SampleTestBooking'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Terms = lazy(() => import('./pages/LegalPages'))
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'))
const VendorRegistration = lazy(() => import('./pages/VendorRegistrationForm'))
const FallbackPage = lazy(() => import('./pages/FallbackScreen'))
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'))
const ActiveBookings = lazy(() => import('./pages/dashboard/ActiveBookings'))
const BookingTimeline = lazy(() => import('./pages/dashboard/BookingTimeline'))
const BookingDetails = lazy(() => import('./pages/dashboard/BookingDetails'))
const MessagesUpdates = lazy(() => import('./pages/dashboard/MessagesUpdates'))
const PreviousBookings = lazy(() => import('./pages/dashboard/PreviousBookings'))
const SavedPackages = lazy(() => import('./pages/dashboard/SavedPackages'))
const SupportHelp = lazy(() => import('./pages/dashboard/SupportHelp'))
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'))

function PageLoader() {
  if (window.location.pathname === '/') {
    return <div className="fixed inset-0 z-[99999] bg-[#bfac9b]" />
  }
  return <CmsPageLoader label="Loading" />
}

function GoogleAuthRedirectBridge() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const hashValue = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
    const hashParams = new URLSearchParams(hashValue)
    const accessToken = searchParams.get('access_token') || hashParams.get('access_token')
    const error = searchParams.get('error') || hashParams.get('error')
    const errorDescription =
      searchParams.get('error_description') || hashParams.get('error_description')

    if (!accessToken && !error && !errorDescription) {
      return
    }

    if (location.pathname === '/auth/callback') {
      return
    }

    const nextParams = new URLSearchParams()
    if (accessToken) nextParams.set('access_token', accessToken)
    if (error) nextParams.set('error', error)
    if (errorDescription) nextParams.set('error_description', errorDescription)

    navigate(`/auth/callback?${nextParams.toString()}`, { replace: true })
  }, [location, navigate])

  return null
}

function ScrollToTop() {
  const { pathname, search } = useLocation()
  const navigationType = useNavigationType()
  const lenisRef = useLenis()
  const locationKey = getLocationScrollKey(pathname, search)
  const homeRestoredRef = useRef(false)

  const getScrollY = () => getWindowScrollY(lenisRef?.current)

  usePersistLocationScroll(locationKey, getScrollY)

  // Apply home scroll before paint so the disco-ball hero never flashes.
  useLayoutEffect(() => {
    homeRestoredRef.current = false

    if (pathname !== '/') return undefined

    const lenis = lenisRef?.current
    let savedY = null
    let shouldRestore = false

    if (peekPendingHomeScroll() != null) {
      savedY = consumePendingHomeScroll() ?? 0
      shouldRestore = true
    } else if (navigationType === 'POP') {
      const persisted = readLocationScroll(locationKey) ?? 0
      const remembered = readRememberedHomeScroll()
      savedY = Math.max(persisted, remembered)
      shouldRestore = savedY >= 80
    }

    if (!shouldRestore) {
      finishHomeScrollRestore()
      return undefined
    }

    homeRestoredRef.current = true
    markHomeScrollRestoring()
    applyHomeScrollRestore(savedY, lenis)

    if (confirmHomeScrollRestore(savedY, lenis)) {
      return undefined
    }

    let attempts = 0
    const retryTimer = window.setInterval(() => {
      attempts += 1
      const done = confirmHomeScrollRestore(savedY, lenisRef?.current)
      if (done || attempts >= 24) {
        if (!done) finishHomeScrollRestore()
        window.clearInterval(retryTimer)
      }
    }, 50)

    return () => window.clearInterval(retryTimer)
  }, [locationKey, navigationType, lenisRef, pathname])

  useEffect(() => {
    const lenis = lenisRef?.current

    if (pathname === '/' && (shouldPreserveHomeScroll() || homeRestoredRef.current)) {
      homeRestoredRef.current = false
      return undefined
    }

    if (pathname === '/' && navigationType === 'POP') {
      const persisted = readLocationScroll(locationKey) ?? 0
      const remembered = readRememberedHomeScroll()
      const savedY = Math.max(persisted, remembered)
      if (savedY >= 80) {
        const restore = () => applyHomeScrollRestore(savedY, lenis)
        const timers = [50, 150].map(delay => window.setTimeout(restore, delay))
        return () => timers.forEach(timer => window.clearTimeout(timer))
      }
    }

    if (navigationType === 'POP') {
      const savedY = readLocationScroll(locationKey) ?? 0
      if (savedY > 0) {
        const restore = () => scrollPageTo(savedY, lenis)
        restore()
        const timers = [50, 150].map(delay => window.setTimeout(restore, delay))
        return () => timers.forEach(timer => window.clearTimeout(timer))
      }
      return undefined
    }

    const scrollTop = () => scrollPageToTop(lenis)
    scrollTop()
    const t = window.setTimeout(scrollTop, 150)
    return () => window.clearTimeout(t)
  }, [locationKey, navigationType, lenisRef, pathname])

  return null
}

function AppLayout() {
  const { pathname } = useLocation()
  const hideGlobalChrome =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/new-password' ||
    pathname === '/reset-password' ||
    pathname === '/auth/callback' ||
    pathname === '/event-flow/category' ||
    pathname === '/event-flow/event' ||
    pathname === '/event-flow/service' ||
    pathname === '/event-flow/decor-theme' ||
    pathname === '/event-flow/catering-levels' ||
    pathname === '/event-flow/bartending-levels' ||
    pathname === '/package-listing' ||
    pathname === '/packages/decor-levels' ||
    pathname.startsWith('/packages/') ||
    pathname.startsWith('/user-dashboard')

  return (
    <>
      <GoogleAuthRedirectBridge />
      <GoogleAnalytics />
      <ScrollToTop />
      <CompactViewportSync />
      {!hideGlobalChrome && <NavHeader />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/in-house-planner" element={<InHousePlannerPage />} />
          <Route path="/how-it-work" element={<HowItWorkPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/new-password" element={<NewPasswordPage />} />
          <Route path="/book-consultation" element={<BookConsultationPage />} />
          <Route path="/consultation-confirmation" element={<ConsultationConfirmation />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/single-package-cart" element={<SinglePackageCheckout />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/sample-test-booking" element={<SampleTasteBooking />} />
          <Route path="/blogs" element={<BlogPage />} />
          <Route path="/blogs/:slug" element={<SingleBlogPage />} />
          <Route path="/event-flow/category" element={<CategoryPage />} />
          <Route path="/event-flow/event" element={<EventPage />} />
          <Route path="/event-flow/service" element={<ServicePage />} />
          <Route path="/event-flow/decor-theme" element={<DecorThemePage />} />
          <Route path="/event-flow/catering-levels" element={<CateringLevelsPage />} />
          <Route path="/event-flow/bartending-levels" element={<BartendingLevelsPage />} />
          <Route path="/package-listing" element={<PackageListingPage />} />
          <Route path="/packages/decor-levels" element={<DecorLevelsPage />} />
          <Route path="/packages/decor" element={<DecorPackagesPage />} />
          <Route path="/packages/rental-furniture" element={<RentalFurniturePackagesPage />} />
          <Route path="/packages/catering" element={<CateringPackagesPage />} />
          <Route path="/packages/bartending" element={<BartendingPackagesPage />} />
          <Route path="/packages/sheesha" element={<SheeshaPackagesPage />} />
          <Route path="/packages/decor-single/:packageId" element={<DecorSinglePackagePage />} />
          <Route
            path="/packages/bartending-single/:packageId"
            element={<BartendingSinglePackagePage />}
          />
          <Route
            path="/packages/bartending-addon/:packageId/:addonId"
            element={<BartendingAddonDetailPage />}
          />
          <Route
            path="/packages/sheesha-single/:packageId"
            element={<SheeshaSinglePackagePage />}
          />
          <Route
            path="/packages/catering-single/:packageId"
            element={<CateringSinglePackagePage />}
          />
          <Route path="/packages/:service/:packageId" element={<PackageDetailsPage />} />
          <Route path="/faqs" element={<FAQ />} />
          <Route path="/legalpages" element={<Terms />} />
          <Route path="/privacy" element={<Terms documentType="privacy" />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/vendor-registration" element={<VendorRegistration />} />
          <Route path="/fallback-screen" element={<FallbackPage />} />

          <Route path="/user-dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="active-booking" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="active-booking" element={<ActiveBookings />} />
            <Route path="timeline" element={<BookingTimeline />} />
            <Route path="details" element={<BookingDetails />} />
            <Route path="messages" element={<MessagesUpdates />} />
            <Route path="previous" element={<PreviousBookings />} />
            <Route path="saved" element={<SavedPackages />} />
            <Route path="support" element={<SupportHelp />} />
          </Route>
        </Routes>
      </Suspense>
      {!hideGlobalChrome && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
