import { useState } from 'react'
import { useDiscountBanners } from '../../hooks/useDiscountBanners'

function formatDiscount(banner) {
  const value = Number(banner?.discount_value ?? 0)
  if (banner?.discount_type === 'percentage') {
    return `${value}% OFF`
  }
  return `₹${value.toLocaleString('en-IN')} OFF`
}

function OfferMarqueeItem({ banner }) {
  const code = String(banner?.code ?? '').toUpperCase()
  const discount = formatDiscount(banner)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!code) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        const input = document.createElement('textarea')
        input.value = code
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <span className="offer-marquee-item">
      <span className="offer-marquee-discount">{discount}</span>
      <span className="offer-marquee-dot" aria-hidden="true">
        ·
      </span>
      <span className="offer-marquee-code">{code}</span>
      <button type="button" className="offer-marquee-copy" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <span className="offer-marquee-sep" aria-hidden="true">
        ✦
      </span>
    </span>
  )
}

/** Continuous offer ticker — no cards. Hidden when nothing is shared. */
export default function DiscountBannerCarousel() {
  const { data: banners = [] } = useDiscountBanners()

  if (!banners.length) return null

  const loop =
    banners.length < 3
      ? [...banners, ...banners, ...banners, ...banners, ...banners, ...banners]
      : [...banners, ...banners, ...banners]
  const track = [...loop, ...loop]

  return (
    <section aria-label="Discount offers" className="offer-marquee">
      <div className="offer-marquee-track">
        {track.map((banner, index) => (
          <OfferMarqueeItem key={`${banner.id ?? banner.code}-${index}`} banner={banner} />
        ))}
      </div>
    </section>
  )
}
