import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useLenis } from './useLenis'
import NavHeader from './components/NavHeader'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import InHousePlannerPage from './pages/InHousePlannerPage'
import About from './pages/About'
import HowItWorkPage from './pages/HowItWorkPage'
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
    pathname === '/auth/callback'
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
