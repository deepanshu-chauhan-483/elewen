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
      className="flex min-h-[339px] w-full flex-col bg-[#F2F2F2] font-sans overflow-x-clip md:min-h-[645px]"
    >
      {/* Full-bleed title — not constrained by max-w-[1440px]; scales with viewport width */}
      <div className="w-full min-w-0 shrink-0 px-2 pt-5 md:pt-20">
        <h1
          className="w-full min-w-0 max-w-full text-center leading-none text-[#2D2D2D]"
          style={{
            fontFamily: "'Malgin', serif",
            fontSize: isMobile ? 'clamp(40px, 23.5vw, 93.46px)' : 'clamp(56px, 24vw, 361px)',
          }}
        >
          <span className="reveal-wrapper block w-full max-w-full">
            <span className="reveal-text">ELEWEN</span>
          </span>
        </h1>
      </div>

      {/* Rest of footer: centered column */}
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col px-2 pb-6 pt-8 box-border md:px-[100px] md:pb-12 md:pt-24">
        {/* Nav + about — flex row on desktop, centered column width on mobile */}
        <div className="flex w-full flex-1 flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-10">
          {/* Mobile: full width of column (no 347px cap) so each label+links stays one row */}
          <div className="mx-auto flex w-full min-w-0 flex-col gap-[16px] md:mx-0 md:gap-4">
            {footerNav.map((row, i) => (
              <div
                key={row.label}
                className="flex flex-nowrap items-center gap-[5px] pl-2 md:items-start md:gap-[60px] md:pl-0 lg:items-center"
              >
                <span
                  className={`anim-element slide-from-left ${row.labelWidth} whitespace-nowrap text-[14px] font-['Poppins'] leading-[150%] text-[#2D2D2D] md:font-sans md:text-[16px] md:leading-[1.5]`}
                  style={{ '--delay': `${i * 0.06}s` }}
                >
                  {row.label}
                </span>
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-[16px] overflow-x-auto opacity-50 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:gap-x-7 md:gap-y-2 [&::-webkit-scrollbar]:hidden">
                  {row.links.map((link, linkIndex) => (
                    <a
                      key={link}
                      href="#"
                      className="anim-element slide-from-left shrink-0 whitespace-nowrap text-[14px] font-['Poppins'] leading-[150%] text-[#2D2D2D] transition-colors hover:text-[#591902] md:font-sans md:whitespace-normal md:text-[16px] md:leading-[1.5]"
                      style={{ '--delay': `${i * 0.06 + 0.08 + linkIndex * 0.04}s` }}
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="hidden text-[16px] leading-[1.5] text-[#2D2D2D] opacity-50 md:block md:w-[611px] md:shrink-0">
            <span className="reveal-wrapper block">
              <span className="reveal-text" style={{ '--delay': '0.1s' }}>
                Elewen simplifies event planning with curated décor, catering, and personal
                coordination. From intimate gatherings to meaningful celebrations, we bring
                everything together so you can focus on the moment.
              </span>
            </span>
          </p>
        </div>

        {/* Divider + copyright — pinned to bottom of footer column */}
        <div className="mt-auto flex w-full flex-col items-center gap-2 pt-6 md:items-end md:pt-12">
          <div className="w-full max-w-[353px] border-t border-[rgba(0,0,0,0.2)] md:max-w-[720px] md:border-[#000000] md:opacity-20" />
          <p
            className="anim-element slide-from-bottom w-full max-w-[353px] text-center text-[12px] font-['Poppins'] leading-[150%] text-[#2D2D2D] opacity-50 md:text-right md:max-w-[720px] md:font-sans md:leading-[1.5]"
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