import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'
import LenisContext from './LenisContext'

gsap.registerPlugin(ScrollTrigger)

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      anchors: true,
    })

    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)

    lenis.scrollTo(0, { immediate: true })

    const raf = time => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenisRef.current = null
      lenis.destroy()
    }
  }, [])

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>
}
