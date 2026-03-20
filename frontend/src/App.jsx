import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavHeader from './components/NavHeader'
import LandingPage from './pages/LandingPage'
import InHousePlannerPage from './pages/InHousePlannerPage'
import About from './pages/About'

export default function App() {
  return (
    <BrowserRouter>
      <NavHeader />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/in-house-planner" element={<InHousePlannerPage />} />
      </Routes>
    </BrowserRouter>
  )
}
