import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useLenis } from './useLenis'
import NavHeader from './components/NavHeader'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import InHousePlannerPage from './pages/InHousePlannerPage'
import About from './pages/About'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NewPasswordPage from './pages/NewPasswordPage'
import BookConsultationPage from './pages/BookConsultation'
import ConsultationConfirmation from './pages/ConsultationConfirmation'
import BlogPage from './pages/BlogPage'
import SingleBlogPage from './pages/SingleBlogPage'
import HowItWorkPage from './pages/HowItWorkPage'
import CategoryPage from './pages/CategoryPage'
import EventPage from './pages/EventPage'
import ServicePage from './pages/ServicePage'
import DecorThemePage from './pages/DecorThemePage'
import CateringLevelsPage from './pages/CateringLevelsPage'
import PackageListingPage from './pages/PackageListingPage'
import DecorLevelsPage from './pages/DecorLevelsPage'
import DecorPackagesPage from './pages/DecorPackagesPage'
import RentalFurniturePackagesPage from './pages/RentalFurniturePackagesPage'
import CateringPackagesPage from './pages/CateringPackagesPage'
import BartendingPackagesPage from './pages/BartendingPackagesPage'
import SheeshaPackagesPage from './pages/SheeshaPackagesPage'
import BartendingLevelsPage from './pages/BartendingLevelsPage'
import PackageDetailsPage from './pages/PackageDetailsPage'
import DecorSinglePackagePage from './pages/DecorSinglePackagePage'
import SheeshaSinglePackagePage from './pages/SheeshaSinglePackagePage'

function ScrollToTop() {
  const { pathname } = useLocation()
  const lenisRef = useLenis()

  useEffect(() => {
    const scrollTop = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      const lenis = lenisRef?.current
      if (lenis) lenis.scrollTo(0, { immediate: true })
    }

    scrollTop()
    const t = setTimeout(scrollTop, 150)
    return () => clearTimeout(t)
  }, [pathname, lenisRef])

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
    pathname.startsWith('/packages/')

  return (
    <>
      <ScrollToTop />
      {!hideGlobalChrome && <NavHeader />}
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
        <Route path="/packages/sheesha-single/:packageId" element={<SheeshaSinglePackagePage />} />
        <Route path="/packages/:service/:packageId" element={<PackageDetailsPage />} />
      </Routes>
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
