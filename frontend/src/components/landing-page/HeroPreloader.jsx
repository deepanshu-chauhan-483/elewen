/**
 * HeroPreloader — modular intro overlay.
 * Swap this file to change the preloader look entirely.
 *
 * Exposes two DOM refs via imperative handle:
 *   ref.current.containerEl()  — the overlay root (opacity-animated)
 *   ref.current.imgEl()        — the logo image (transform-animated)
 */
import { useRef, forwardRef, useImperativeHandle } from 'react'
import navLogo from '../../assets/images/navbar.png'

const HeroPreloader = forwardRef(function HeroPreloader(_, ref) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)

  useImperativeHandle(ref, () => ({
    containerEl: () => containerRef.current,
    imgEl: () => imgRef.current,
  }))

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <img
        ref={imgRef}
        src={navLogo}
        alt="Elewen"
        style={{
          width: '380px',
          height: 'auto',
          objectFit: 'contain',
          filter: 'brightness(0) invert(1) drop-shadow(0 18px 16px rgba(89,25,2,0.5))',
          willChange: 'transform',
        }}
      />
    </div>
  )
})

export default HeroPreloader
