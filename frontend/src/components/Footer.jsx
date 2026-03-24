import { useEffect, useRef } from 'react'

const footerNav = [
  {
    label: 'LEGAL',
    labelWidth: 'w-[46px]',
    links: ['Terms & Conditions', 'Cancellation Policy'],
  },
  {
    label: 'COMMUNITY',
    labelWidth: 'w-[97px]',
    links: ['Vendor Registration', 'Instagram'],
  },
  {
    label: 'HELP',
    labelWidth: 'w-[36px]',
    links: ['Contact Us', "FAQ's", 'Order Updates'],
  },
  {
    label: 'SHOP BY',
    labelWidth: 'w-[66px]',
    links: ['Events', 'Services'],
  },
]

const Footer = () => {
  const footerRef = useRef(null)

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
      <div className="relative w-full max-w-[1440px] md:h-[645px] shrink-0 px-6 md:px-0 py-12 md:py-0">
        <h1
          className="text-center text-[#2D2D2D] leading-[1] md:absolute md:left-1/2 md:-translate-x-1/2 md:top-[80px] md:w-[1434px]"
          style={{
            fontFamily: "'Malgin', serif",
            fontSize: 'clamp(72px, 18vw, 341px)',
          }}
        >
          <span className="reveal-wrapper block">
            <span className="reveal-text">ELEWEN</span>
          </span>
        </h1>

        <div className="mt-10 md:mt-0 md:absolute md:left-[100px] md:top-[401px] md:right-[100px] md:flex md:items-start md:justify-between md:gap-10">
          <div className="flex flex-col gap-4">
            {footerNav.map((row, i) => (
              <div key={row.label} className="flex items-start md:items-center gap-6 md:gap-[60px]">
                <span
                  className={`anim-element slide-from-left ${row.labelWidth} text-[#2D2D2D] text-[16px] leading-[1.5] shrink-0`}
                  style={{ '--delay': `${i * 0.06}s` }}
                >
                  {row.label}
                </span>
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2 opacity-50">
                  {row.links.map(link => (
                    <a
                      key={link}
                      href="#"
                      className="text-[#2D2D2D] text-[16px] leading-[1.5] hover:text-[#591902] transition-colors"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 md:mt-0 md:w-[611px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5]">
            <span className="reveal-wrapper block">
              <span className="reveal-text" style={{ '--delay': '0.1s' }}>
                Elewen simplifies event planning with curated décor, catering, and personal
                coordination. From intimate gatherings to meaningful celebrations, we bring
                everything together so you can focus on the moment.
              </span>
            </span>
          </p>
        </div>

        <div className="mt-10 md:mt-0 md:absolute md:right-[0px] md:top-[493px] md:w-[720px] border-t border-[#000000] opacity-20" />

        <p className="mt-5 md:mt-0 md:absolute md:right-[100px] md:top-[513px] text-[#2D2D2D] opacity-50 text-[12px] leading-[1.5]">
          © 2025 Elewen. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
