import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useLenis } from './useLenis'
import NavHeader from './components/NavHeader'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import InHousePlannerPage from './pages/InHousePlannerPage'
import About from './pages/About'

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

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <NavHeader />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/in-house-planner" element={<InHousePlannerPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
