import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { gsap } from 'gsap'
import navLogo from '../../assets/images/navbar.png'

function createWavePath(phase, radius = 50, amplitude = 4, frequency = 12) {
  const cx = 60
  const cy = 60
  const points = 120
  let path = ''
  for (let i = 0; i <= points; i++) {
    const angle = (Math.PI * 2 * i) / points
    const r = radius + Math.sin(angle * frequency + phase) * amplitude
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    path += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `
  }
  return `${path}Z`
}

const HeroPreloader = forwardRef(function HeroPreloader({ initiallyHidden = false }, ref) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const waveBgRef = useRef(null)
  const waveFillRef = useRef(null)
  const progressRef = useRef(initiallyHidden ? 100 : 0)

  useImperativeHandle(ref, () => ({
    containerEl: () => containerRef.current,
    imgEl: () => imgRef.current,
    setProgress: value => {
      progressRef.current = Math.max(0, Math.min(100, value))
    },
  }))

  useEffect(() => {
    if (initiallyHidden) return

    const waveBg = waveBgRef.current
    const waveFill = waveFillRef.current
    const logo = imgRef.current

    let phase = 0
    const updateWaves = () => {
      phase += 0.04
      const progress = progressRef.current
      const bgPath = createWavePath(phase, 50, 4, 12)
      const fillPath = createWavePath(phase, 50, 4, 12)
      if (waveBg) waveBg.setAttribute('d', bgPath)
      if (waveFill) {
        waveFill.setAttribute('d', fillPath)
        const len = waveFill.getTotalLength()
        waveFill.style.strokeDasharray = len
        waveFill.style.strokeDashoffset = len * (1 - progress / 100)
      }
    }

    updateWaves()
    gsap.ticker.add(updateWaves)

    if (logo) {
      gsap.fromTo(
        logo,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      )
    }

    return () => {
      gsap.ticker.remove(updateWaves)
    }
  }, [initiallyHidden])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-[99999] overflow-hidden pointer-events-none ${
        initiallyHidden ? 'opacity-0 invisible' : ''
      }`}
    >
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#bfac9b]" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#bfac9b]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg
            className="absolute h-[200px] w-[200px] md:h-[240px] md:w-[240px] -rotate-90"
            viewBox="0 0 120 120"
          >
            <path ref={waveBgRef} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            <path
              ref={waveFillRef}
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>

          <img
            ref={imgRef}
            src={navLogo}
            alt="Elewen"
            className="relative z-10 w-[130px] md:w-[170px] object-contain brightness-0 invert opacity-0"
          />
        </div>
      </div>
    </div>
  )
})

export default HeroPreloader
