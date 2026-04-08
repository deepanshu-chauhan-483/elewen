import { useEffect, useRef, useState } from 'react'

const footerNav = [
  {
    label: 'LEGAL',
    labelWidth: 'min-w-[46px] shrink-0 md:w-[46px]',
    links: ['Terms & Conditions', 'Cancellation Policy'],
  },
  {
    label: 'COMMUNITY',
    labelWidth: 'min-w-[85px] shrink-0 md:w-[97px]',
    links: ['Vendor Registration', 'Instagram'],
  },
  {
    label: 'HELP',
    labelWidth: 'min-w-[36px] shrink-0 md:w-[36px]',
    links: ['Contact Us', "FAQ's", 'Order Updates'],
  },
  {
    label: 'SHOP BY',
    labelWidth: 'min-w-[58px] shrink-0 md:w-[66px]',
    links: ['Events', 'Services'],
  },
]

const Footer = () => {
  const footerRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const el = entry.target

          if (el.classList.contains('reveal-wrapper')) {
            el.querySelectorAll('.reveal-text').forEach(t => t.classList.add('is-visible'))
          } else {
            el.classList.add('is-visible')
          }

          observer.unobserve(el)
        })
      },
      { threshold: 0.1 }
    )

    footer.querySelectorAll('.reveal-wrapper, .anim-element').forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <footer
      ref={footerRef}
      className="flex min-h-[339px] w-full flex-col bg-[#F2F2F2] font-sans overflow-x-clip lg:min-h-[645px]"
    >
      {/* Title */}
      <div className="w-full px-2 pt-5 lg:pt-20">
        <h1
          className="w-full text-center leading-none text-[#2D2D2D]"
          style={{
            fontFamily: "'Malgin', serif",
            fontSize: isMobile ? 'clamp(40px, 23.5vw, 93px)' : 'clamp(56px, 24vw, 361px)',
          }}
        >
          <span className="reveal-wrapper block">
            <span className="reveal-text">ELEWEN</span>
          </span>
        </h1>
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-2 pb-6 pt-8 lg:px-[100px] lg:pb-12 lg:pt-24">
        {/* NAV */}
        <div className="flex w-full flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          {/* LEFT NAV (tablet = mobile behavior) */}
          <div className="mx-auto flex w-full flex-col gap-[16px] lg:mx-0 lg:gap-4">
            {footerNav.map((row, i) => (
              <div
                key={row.label}
                className="flex flex-nowrap items-start gap-[6px] pl-2 lg:items-center lg:gap-[60px] lg:pl-0"
              >
                <span
                  className={`anim-element slide-from-left ${row.labelWidth} whitespace-nowrap text-[14px] md:text-[14px] lg:text-[16px] text-[#2D2D2D]`}
                  style={{ '--delay': `${i * 0.06}s` }}
                >
                  {row.label}
                </span>

                {/* LINKS */}
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-[12px] overflow-x-auto lg:overflow-visible opacity-50 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-wrap lg:gap-x-7 lg:gap-y-2 [&::-webkit-scrollbar]:hidden">
                  {row.links.map((link, linkIndex) => (
                    <a
                      key={link}
                      href="#"
                      className="anim-element slide-from-left shrink-0 whitespace-nowrap text-[14px] md:text-[14px] lg:text-[16px] text-[#2D2D2D] hover:text-[#591902]"
                      style={{ '--delay': `${i * 0.06 + 0.08 + linkIndex * 0.04}s` }}
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT TEXT (ONLY DESKTOP) */}
          <p className="hidden lg:block lg:w-[611px] text-[16px] text-[#2D2D2D] opacity-50">
            <span className="reveal-wrapper block">
              <span className="reveal-text">
                Elewen simplifies event planning with curated décor, catering, and personal
                coordination. From intimate gatherings to meaningful celebrations, we bring
                everything together so you can focus on the moment.
              </span>
            </span>
          </p>
        </div>

        {/* Divider */}
        <div className="mt-auto flex w-full flex-col items-center gap-2 pt-6 lg:items-end lg:pt-12">
          <div className="w-full border-t border-black/20 lg:max-w-[720px]" />

          <p
            className="anim-element slide-from-bottom w-full text-center text-[12px] text-[#2D2D2D] opacity-50 lg:text-right lg:max-w-[720px]"
            style={{ '--delay': '0.12s' }}
          >
            © 2025 Elewen. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
