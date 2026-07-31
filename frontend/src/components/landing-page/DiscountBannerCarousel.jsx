import { useDiscountBanners } from '../../hooks/useDiscountBanners'

function formatBannerLabel(banner) {
  const code = String(banner?.code ?? '').toUpperCase()
  const value = Number(banner?.discount_value ?? 0)
  const discount =
    banner?.discount_type === 'percentage'
      ? `${value}% OFF`
      : `₹${value.toLocaleString('en-IN')} OFF`

  if (banner?.title?.trim()) {
    return `${banner.title.trim()} · ${code} · ${discount}`
  }
  return `${code} · ${discount}`
}

/**
 * Infinite discount ticker between hero and Plan Your Event.
 * Renders nothing when admin has not shared any banners.
 */
export default function DiscountBannerCarousel() {
  const { data: banners = [] } = useDiscountBanners()

  if (!banners.length) return null

  const labels = banners.map(formatBannerLabel)
  // Duplicate for seamless CSS loop
  const track = [...labels, ...labels]

  return (
    <section
      aria-label="Discount offers"
      className="discount-banner-carousel w-full overflow-hidden bg-[#F8F4ED] border-y border-[#E8DFD4]"
    >
      <div className="discount-banner-track">
        {track.map((label, index) => (
          <span key={`${label}-${index}`} className="discount-banner-item">
            <span className="discount-banner-star" aria-hidden="true">
              ★
            </span>
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}
