import { useEffect, useRef, useState } from 'react'

const footerNav = [
  {
    label: 'LEGAL',
    labelWidth: 'w-[40px] md:w-[46px]',
    links: ['Terms & Conditions', 'Cancellation Policy'],
  },
  {
    label: 'COMMUNITY',
    labelWidth: 'w-[85px] md:w-[97px]',
    links: ['Vendor Registration', 'Instagram'],
  },
  {
    label: 'HELP',
    labelWidth: 'w-[32px] md:w-[36px]',
    links: ['Contact Us', "FAQ's", 'Order Updates'],
  },
  {
    label: 'SHOP BY',
    labelWidth: 'w-[58px] md:w-[66px]',
    links: ['Events', 'Services'],
  },
]

const Footer = () => {
  const footerRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize() // init
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
      className="w-full flex justify-center bg-[#F2F2F2] overflow-hidden font-sans"
    >
      {/* Container: 339px tall on mobile, 645px tall on desktop */}
      <div className="relative w-full max-w-[1440px] h-[339px] md:h-[645px] shrink-0 py-0 md:py-0">
        {/* ELEWEN Title */}
        <h1
          className="absolute left-1/2 -translate-x-1/2 top-[20px] w-full px-2 text-center text-[#2D2D2D] leading-[1] md:top-[80px] md:w-[1434px]"
          style={{
            fontFamily: "'Malgin', serif",
            // Use clamp to ensure it scales down perfectly on smaller phones but never exceeds the Figma 93.46px
            fontSize: isMobile ? 'clamp(40px, 23.5vw, 93.46px)' : 'clamp(56px, 24vw, 361px)',
          }}
        >
          <span className="reveal-wrapper block">
            <span className="reveal-text">ELEWEN</span>
          </span>
        </h1>

        {/* Links & About Text Container */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[133px] w-[347px] flex flex-col gap-[16px] md:mt-0 md:left-[100px] md:top-[401px] md:right-[100px] md:translate-x-0 md:w-auto md:flex-row md:items-start md:justify-between md:gap-10">
          <div className="flex flex-col gap-[16px] md:gap-4">
            {footerNav.map((row, i) => (
              <div
                key={row.label}
                className="flex items-center pl-2 md:pl-0 md:items-start lg:items-center gap-[5px] md:gap-[60px]"
              >
                <span
                  className={`anim-element slide-from-left ${row.labelWidth} text-[#2D2D2D] text-[14px] md:text-[16px] leading-[150%] md:leading-[1.5] shrink-0 font-['Poppins'] md:font-sans`}
                  style={{ '--delay': `${i * 0.06}s` }}
                >
                  {row.label}
                </span>
                <div className="flex flex-wrap items-center gap-[16px] md:gap-x-7 md:gap-y-2 opacity-50">
                  {row.links.map(link => (
                    <a
                      key={link}
                      href="#"
                      className="text-[#2D2D2D] text-[14px] md:text-[16px] leading-[150%] md:leading-[1.5] hover:text-[#591902] transition-colors font-['Poppins'] md:font-sans"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Only Text */}
          <p className="hidden md:block md:w-[611px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5]">
            <span className="reveal-wrapper block">
              <span className="reveal-text" style={{ '--delay': '0.1s' }}>
                Elewen simplifies event planning with curated décor, catering, and personal
                coordination. From intimate gatherings to meaningful celebrations, we bring
                everything together so you can focus on the moment.
              </span>
            </span>
          </p>
        </div>

        {/* Divider Line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[305px] w-[353px] border-t border-[rgba(0,0,0,0.2)] md:left-auto md:translate-x-0 md:right-[0px] md:top-[493px] md:w-[720px] md:border-[#000000] md:opacity-20" />

        {/* Copyright */}
        <p className="absolute right-[20px] top-[313px] text-[#2D2D2D] opacity-50 text-[12px] leading-[150%] font-['Poppins'] md:right-[100px] md:top-[513px] md:leading-[1.5] md:font-sans">
          © 2025 Elewen. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
