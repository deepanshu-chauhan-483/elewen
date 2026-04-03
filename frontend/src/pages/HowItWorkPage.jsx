import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const HERO_TAGS = [
  'BIRTHDAYS',
  'ANNIVERSARIES',
  'HOUSE PARTIES',
  'BABY SHOWERS',
  'CORPORATE',
  'RELIGIOUS',
]

const orbs = [
  {
    className:
      'anim-element slide-from-left absolute -left-[18%] top-[17%] h-[360px] w-[360px] rounded-full bg-[#BE350440] min-[540px]:-left-[10%] min-[540px]:top-[10%] min-[540px]:h-[660px] min-[540px]:w-[660px]',
  },
  {
    className:
      'anim-element slide-from-right absolute right-[18%] top-[14%] h-[160px] w-[160px] rounded-full bg-[#CDB17E26] min-[540px]:right-[20%] min-[540px]:top-[14%] min-[540px]:h-[280px] min-[540px]:w-[280px]',
  },
  {
    className:
      'anim-element slide-from-right absolute right-[-8%] top-[-8%] h-[220px] w-[220px] rounded-full bg-[#CDB17E26] min-[540px]:h-[430px] min-[540px]:w-[430px]',
  },
  {
    className:
      'anim-element slide-from-right absolute -right-[18%] bottom-[12%] h-[300px] w-[300px] rounded-full bg-[#CDB17E26] min-[540px]:-right-[10%] min-[540px]:bottom-[4%] min-[540px]:h-[560px] min-[540px]:w-[560px]',
  },
]

const HowItWorkPage = () => {
  const pageRef = useRef(null)

  useEffect(() => {
    const page = pageRef.current
    if (!page) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const el = entry.target
          if (el.classList.contains('reveal-wrapper')) {
            el.querySelectorAll('.reveal-text').forEach(text => text.classList.add('is-visible'))
          } else {
            el.classList.add('is-visible')
          }
          observer.unobserve(el)
        })
      },
      { threshold: 0.12 }
    )

    page.querySelectorAll('.reveal-wrapper, .anim-element').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <main ref={pageRef} className="w-full bg-[#591902] font-sans">
      <section
        data-nav-surface="transparent"
        className="relative min-h-screen overflow-hidden bg-[#591902] pt-28 min-[540px]:pt-36"
      >
        <div className="pointer-events-none absolute inset-0">
          {orbs.map(orb => (
            <div key={orb.className} className={orb.className} />
          ))}
        </div>

        <div className="relative z-10 flex min-h-screen flex-col justify-between">
          <div className="w-full px-6 pb-12 min-[540px]:px-10 lg:px-20 xl:px-[100px]">
            <div className="flex min-h-[calc(100vh-180px)] items-center">
              <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex w-full max-w-[760px] gap-4 min-[540px]:gap-6">
                  <div className="anim-element slide-from-bottom mt-1 hidden w-px shrink-0 self-stretch bg-[#CDB17E]/70 min-[540px]:block" />

                  <div className="pt-1">
                    <span className="reveal-wrapper block">
                      <span className="reveal-text w-full max-w-[542px] text-[12px] uppercase leading-[1.5] tracking-[0] text-[#CDB17E]">
                        PLANNING MADE SIMPLE
                      </span>
                    </span>

                    <h1
                      className="mt-3 w-full max-w-[542px] text-white"
                      style={{ fontFamily: "'Malgin', serif" }}
                    >
                      <span className="reveal-wrapper block">
                        <span className="reveal-text text-[48px] leading-[1] min-[540px]:text-[64px] lg:text-[80px]">
                          How It Works
                        </span>
                      </span>
                    </h1>

                    <p className="mt-5 w-full max-w-[253px] text-[16px] leading-[1.5] text-white/60 min-[540px]:mt-6">
                      <span className="reveal-wrapper block">
                        <span className="reveal-text" style={{ animationDelay: '0.08s' }}>
                          From browsing to celebration &mdash;
                        </span>
                      </span>
                      <span className="reveal-wrapper block">
                        <span className="reveal-text" style={{ animationDelay: '0.14s' }}>
                          a few simple steps is all it takes.
                        </span>
                      </span>
                    </p>

                    <span className="mt-8 inline-block reveal-wrapper reveal-wrapper--overflow-visible min-[540px]:mt-10">
                      <span className="reveal-text" style={{ animationDelay: '0.2s' }}>
                        <Link
                          to="/in-house-planner"
                          className="group flex w-fit items-center rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5 transition-colors hover:bg-[#C6AB7F]"
                        >
                          <span className="mr-5 text-[15px] font-medium text-white">
                            Plan with Elewen
                          </span>
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                            <svg
                              className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7 17L17 7M17 7H9M17 7v8"
                              />
                            </svg>
                          </span>
                        </Link>
                      </span>
                    </span>
                  </div>
                </div>

                <div className="w-full lg:flex lg:justify-end">
                  <p
                    className="w-full max-w-[469px] text-left text-[16px] leading-[1] whitespace-nowrap text-[#C08E72] min-[540px]:text-[22px] lg:text-right lg:text-[27px]"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    <span className="reveal-wrapper block lg:text-right">
                      <span className="reveal-text reveal-text-x-right inline-block" style={{ animationDelay: '0.12s' }}>
                        - no chaos, no coordination stress
                      </span>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="anim-element slide-from-bottom relative z-10 border-t border-[#CDB17E]/10 bg-[#6A1F06]/60 px-6 py-5 backdrop-blur-sm min-[540px]:px-10 lg:px-20 xl:px-[100px]">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[#CDB17E] lg:justify-between">
              {HERO_TAGS.map((tag, index) => (
                <div key={tag} className="flex items-center gap-4 lg:gap-7">
                  <span className="text-[13px] uppercase leading-[1.5] tracking-[0.02em] min-[540px]:text-[16px]">
                    {tag}
                  </span>
                  {index < HERO_TAGS.length - 1 && (
                    <span className="hidden text-[#CDB17E]/40 lg:inline-block">.</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HowItWorkPage
