import { useState } from 'react'
import { useDiscountBanners } from '../../hooks/useDiscountBanners'

function formatDiscount(banner) {
  const value = Number(banner?.discount_value ?? 0)
  if (banner?.discount_type === 'percentage') {
    return `${value}% OFF`
  }
  return `₹${value.toLocaleString('en-IN')} OFF`
}

function CouponPromoCard({ banner }) {
  const code = String(banner?.code ?? '').toUpperCase()
  const discount = formatDiscount(banner)
  const title = banner?.title?.trim() || 'Special Offer'
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
      // ignore clipboard failures
    }
  }

  return (
    <article className="discount-banner-card">
      <div className="discount-banner-card-glow" aria-hidden="true" />
      <p className="discount-banner-eyebrow">{title}</p>
      <p className="discount-banner-discount">{discount}</p>
      <div className="discount-banner-code-row">
        <span className="discount-banner-code" title="Coupon code">
          {code}
        </span>
        <button
          type="button"
          className="discount-banner-copy"
          onClick={handleCopy}
          aria-label={`Copy coupon code ${code}`}
        >
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <p className="discount-banner-hint">Use at checkout for instant savings</p>
    </article>
  )
}

/**
 * Infinite discount promo strip between hero and Plan Your Event.
 * Renders nothing when admin has not shared any banners.
 */
export default function DiscountBannerCarousel() {
  const { data: banners = [] } = useDiscountBanners()

  if (!banners.length) return null

  // Enough duplicates for a seamless long track even with 1–2 offers
  const loop = banners.length === 1 ? [...banners, ...banners, ...banners, ...banners] : [...banners, ...banners]
  const track = [...loop, ...loop]

  return (
    <section aria-label="Discount offers" className="discount-banner-carousel">
      <div className="discount-banner-inner">
        <div className="discount-banner-track">
          {track.map((banner, index) => (
            <CouponPromoCard key={`${banner.id ?? banner.code}-${index}`} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  )
}
