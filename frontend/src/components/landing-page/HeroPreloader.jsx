import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { gsap } from 'gsap'
import navLogo from '../../assets/images/navbar.png'

function createWavePath(phase, radius = 54, amplitude = 4, frequency = 12) {
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
  const counterRef = useRef(null)
  const waveBgRef = useRef(null)
  const waveFillRef = useRef(null)
  const barRef = useRef(null)
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

    const counter = counterRef.current
    const bar = barRef.current
    const waveBg = waveBgRef.current
    const waveFill = waveFillRef.current
    const logo = imgRef.current

    let phase = 0
    const updateWaves = progress => {
      phase += 0.04
      const bgPath = createWavePath(phase, 54, 4, 12)
      const fillPath = createWavePath(phase, 54, 4, 12)
      if (waveBg) waveBg.setAttribute('d', bgPath)
      if (waveFill) {
        waveFill.setAttribute('d', fillPath)
        const len = waveFill.getTotalLength()
        waveFill.style.strokeDasharray = len
        waveFill.style.strokeDashoffset = len * (1 - progress / 100)
      }
    }

    updateWaves(0)

    const obj = { val: 0 }
    gsap.to(obj, {
      val: 100,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate() {
        const v = Math.round(obj.val)
        progressRef.current = v
        if (counter) counter.textContent = v
        if (bar) bar.style.width = `${v}%`
        updateWaves(v)
      },
    })

    const ticker = () => {
      updateWaves(progressRef.current)
    }
    gsap.ticker.add(ticker)

    if (logo) {
      gsap.fromTo(
        logo,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
      )
    }

    if (counter) {
      gsap.fromTo(
        counter,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, delay: 0.15, ease: 'power2.out' }
      )
    }

    return () => {
      gsap.ticker.remove(ticker)
    }
  }, [initiallyHidden])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-[99999] overflow-hidden ${
        initiallyHidden ? 'opacity-0 invisible' : ''
      }`}
    >
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#bfac9b]" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#bfac9b]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg
            className="absolute h-[160px] w-[160px] md:h-[190px] md:w-[190px] -rotate-90"
            viewBox="0 0 120 120"
          >
            <path ref={waveBgRef} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <path
              ref={waveFillRef}
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <img
            ref={imgRef}
            src={navLogo}
            alt="Elewen"
            className="relative z-10 w-[90px] md:w-[110px] object-contain brightness-0 invert opacity-0"
          />
        </div>

        <span
          ref={counterRef}
          className="relative z-10 mt-6 text-[42px] md:text-[56px] font-light text-white/80 tabular-nums tracking-wider opacity-0"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          0
        </span>
      </div>

      <div className="absolute bottom-[12vh] left-1/2 -translate-x-1/2 z-10 w-[min(180px,45vw)]">
        <div className="h-[1px] w-full bg-white/20 rounded-full overflow-hidden">
          <div
            ref={barRef}
            className="h-full bg-white/70 rounded-full"
            style={{ width: '0%', transition: 'none' }}
          />
        </div>
      </div>
    </div>
  )
})

export default HeroPreloader
