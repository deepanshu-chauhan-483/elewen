import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const footerNav = [
  {
    label: 'LEGAL',
    labelWidth: 'min-w-[46px] shrink-0',
    links: [
      { label: 'Terms & Conditions', to: '/legalpages' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Cancellation Policy', to: '/legalpages' },
    ],
  },
  {
    label: 'COMMUNITY',
    labelWidth: 'min-w-[85px] shrink-0',
    links: [
      { label: 'Vendor Registration', to: '/vendor-registration' },
      { label: 'Instagram', href: 'https://www.instagram.com/' },
    ],
  },
  {
    label: 'HELP',
    labelWidth: 'min-w-[36px] shrink-0',
    links: [
      { label: 'Contact Us', to: '/contact' },
      { label: "FAQ's", to: '/faqs' },
      { label: 'Order Updates', to: '/user-dashboard/active-booking' },
    ],
  },
  {
    label: 'SHOP BY',
    labelWidth: 'min-w-[58px] shrink-0',
    links: [
      { label: 'Events', to: '/event-flow/category' },
      { label: 'Services', to: '/event-flow/service?flow=services' },
    ],
  },
]

const footerLinkClass =
  'anim-element slide-from-left shrink-0 whitespace-nowrap bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat pb-[2px] text-[14px] lg:text-[16px] text-[#2D2D2D] transition-[background-size,color] duration-500 ease-out hover:bg-[length:100%_1px] hover:text-[#591902]'

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
      { threshold: 0.05 }
    )

    footer.querySelectorAll('.reveal-wrapper, .anim-element').forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <footer
      ref={footerRef}
      className="flex min-h-[339px] w-full flex-col bg-[#F2F2F2] font-sans overflow-x-clip md:min-h-[645px]"
    >
      {/* Title — mobile: small centered | tablet + desktop: large centered */}
      <div className="w-full px-2 pt-5 md:pt-20">
        <h1
          className="w-full text-center leading-none text-[#2D2D2D] text-[clamp(40px,23.5vw,93px)] md:text-[clamp(56px,24vw,361px)]"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <span className="reveal-wrapper block">
            <span className="reveal-text">ELEWEN</span>
          </span>
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-2 pb-6 pt-8 md:px-8 md:pb-10 md:pt-16 lg:px-[clamp(2.5rem,7vw,100px)] lg:pb-12 lg:pt-24">
        {/* Tablet (md): stacked full-width nav + description | Desktop (lg): two columns */}
        <div className="flex w-full flex-1 flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_min(611px,42%)] lg:items-start lg:gap-x-[clamp(2rem,5vw,5rem)]">
          <div className="mx-auto flex w-full flex-col gap-[16px] md:mx-0 md:gap-5 md:w-full lg:gap-6">
            {footerNav.map((row, i) => (
              <div
                key={row.label}
                className="flex flex-nowrap items-start gap-[6px] pl-2 md:grid md:grid-cols-[97px_1fr] md:items-center md:gap-x-[60px] md:pl-0"
              >
                <span
                  className={`anim-element slide-from-left whitespace-nowrap text-[14px] text-[#2D2D2D] lg:text-[16px] ${row.labelWidth} md:min-w-0 md:shrink-0`}
                  style={{ '--delay': `${i * 0.03}s` }}
                >
                  {row.label}
                </span>

                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-[12px] overflow-x-auto opacity-50 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible md:gap-x-7 md:gap-y-2 [&::-webkit-scrollbar]:hidden">
                  {row.links.map((link, linkIndex) => {
                    const animationStyle = {
                      '--delay': `${i * 0.03 + 0.04 + linkIndex * 0.02}s`,
                    }

                    if (link.href) {
                      return (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className={footerLinkClass}
                          style={animationStyle}
                        >
                          {link.label}
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={link.label}
                        to={link.to}
                        className={footerLinkClass}
                        style={animationStyle}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Tablet: full-width below nav | Desktop: right column */}
          <p className="hidden md:block md:max-w-full md:text-[14px] md:leading-[150%] lg:w-[611px] lg:max-w-none lg:text-[16px] text-[#2D2D2D] opacity-50">
            <span className="reveal-wrapper block">
              <span className="reveal-text">
                Elewen simplifies event planning with curated décor, catering, and personal
                coordination. From intimate gatherings to meaningful celebrations, we bring
                everything together so you can focus on the moment.
              </span>
            </span>
          </p>
        </div>

        <div className="mt-auto flex w-full flex-col items-center gap-2 pt-6 lg:items-end lg:pt-12">
          <div className="w-full border-t border-black/20 lg:max-w-[720px]" />

          <p
            className="anim-element slide-from-bottom w-full text-center text-[12px] text-[#2D2D2D] opacity-50 lg:max-w-[720px] lg:text-right"
            style={{ '--delay': '0.12s' }}
          >
            © 2025 Elewen. All rights reserved.
          </p>
          <p
            className="anim-element slide-from-bottom w-full text-center text-[12px] text-[#2D2D2D] opacity-50 lg:max-w-[720px] lg:text-right"
            style={{ '--delay': '0.14s' }}
          >
            A unit of Mevo Events and Planners LLP
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
