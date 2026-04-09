import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

const nextSteps = [
  {
    number: '1',
    title: 'We review your details',
    desc: 'Our planner reads through your event info and requirements carefully.',
  },
  {
    number: '2',
    title: 'We contact you',
    desc: 'You receive a call or message from our planning team.',
  },
  {
    number: '3',
    title: 'Call is scheduled',
    desc: 'A focused planning session is booked at a time that works for you.',
  },
  {
    number: '4',
    title: 'Planning begins',
    desc: 'We build your event roadmap together, step by step.',
  },
]

const actionCards = [
  {
    eyebrow: 'While you wait',
    title: 'Explore our packages',
    desc: 'Browse curated event packages to get a sense of what we offer.',
    cta: 'Browse Packages',
    to: '/packages',
  },
  {
    eyebrow: 'Done for now?',
    title: 'Back to Home',
    desc: 'Return to the Elewen homepage anytime.',
    cta: 'Go to Home',
    to: '/',
  },
]

const RevealLine = ({ children, delay, className = '' }) => (
  <span className={`reveal-wrapper block ${className}`.trim()}>
    <span className="reveal-text" style={delay ? { animationDelay: delay } : undefined}>
      {children}
    </span>
  </span>
)

const ConsultationConfirmation = () => {
  const pageRef = useRef(null)
  const { state } = useLocation()

  useEffect(() => {
    const page = pageRef.current
    if (!page) return

    const targets = Array.from(
      page.querySelectorAll('.reveal-on-scroll, .reveal-wrapper, .anim-element, .card-reveal')
    )

    const reveal = el => {
      if (el.classList.contains('anim-element') || el.classList.contains('card-reveal')) {
        el.classList.add('is-visible')
      }

      if (el.classList.contains('reveal-wrapper') || el.classList.contains('reveal-on-scroll')) {
        Array.from(el.querySelectorAll('.reveal-text')).forEach((text, index) => {
          if (!text.style.animationDelay) text.style.animationDelay = `${index * 0.05}s`
          text.classList.add('is-visible')
        })
      }
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          reveal(entry.target)
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -12% 0px' }
    )

    targets.forEach(el => {
      const rect = el.getBoundingClientRect()
      const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0
      if (inView) {
        reveal(el)
      } else {
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [])

  return (
    <main
      ref={pageRef}
      className="consultation-page min-h-screen bg-[#F7F4EE] font-sans text-[#202716]"
    >
      <section
        data-nav-theme="light"
        data-nav-surface="transparent"
        className="px-6 pb-20 pt-24 md:px-10 md:pb-24 md:pt-28 lg:px-[96px] lg:pb-28 lg:pt-32"
      >
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(520px,1fr)_448px] lg:items-center lg:gap-16">
          <div className="max-w-[760px] reveal-on-scroll">
            <div className="anim-element slide-from-bottom mb-7 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#EADEC8] md:mb-8 md:h-[72px] md:w-[72px]">
              <svg
                className="h-7 w-7 text-[#6D2005]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12.5l4 4L18 7.5" />
              </svg>
            </div>

            <p
              className="mb-3 text-[13px] leading-[1.5] text-[#D1A45A] md:text-[14px]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
            >
              Request Received
            </p>

            <h1
              className="max-w-[760px] text-[52px] leading-[1] text-[#171717] md:text-[64px] lg:text-[80px]"
              style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
            >
              <RevealLine>Your consultation</RevealLine>
              <RevealLine delay="0.06s">request is in.</RevealLine>
            </h1>

            <p
              className="mt-7 max-w-[760px] text-[16px] leading-[1.5] text-[#7A7A7A]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
            >
              Our in-house planner will review your details and get back to you within 24 hours.
            </p>

            {state?.eventType || state?.location ? (
              <div className="mt-7 flex flex-wrap gap-3 text-[13px] text-[#6D2005]">
                {state?.eventType ? (
                  <span className="inline-flex rounded-full bg-[#EADEC8] px-4 py-2">
                    {state.eventType}
                  </span>
                ) : null}
                {state?.location ? (
                  <span className="inline-flex rounded-full bg-[#EADEC8] px-4 py-2">
                    {state.location}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-7 inline-flex rounded-full bg-[#EADEC8] px-4 py-2">
              <span
                className="text-[13px] leading-[1.5] text-[#9F7A3A]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              >
                You will hear back within 24 hours
              </span>
            </div>
          </div>

          <div
            className="card-reveal rounded-[28px] bg-[#EADEC8] px-6 py-7 md:px-8 md:py-8 lg:px-8 lg:py-9"
            style={{ '--delay': '0.1s' }}
          >
            <p
              className="mb-8 text-[14px] leading-[1.5] text-[#B9874E]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
            >
              What Happens Next
            </p>

            <div className="relative">
              <div className="absolute left-[15px] top-[26px] bottom-[26px] border-l border-dashed border-[#D6B27A]" />

              <div className="space-y-7">
                {nextSteps.map((step, index) => (
                  <div
                    key={step.number}
                    className="anim-element slide-from-bottom relative flex items-start gap-5"
                    style={{ '--delay': `${0.08 + index * 0.06}s` }}
                  >
                    <div className="relative z-10 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full border border-[#D0A76B] bg-[#F7F4EE]">
                      <span
                        className="text-[16px] leading-none text-[#9E7337]"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 400,
                          letterSpacing: '0',
                        }}
                      >
                        {step.number}
                      </span>
                    </div>

                    <div className="pt-0.5">
                      <h2
                        className="text-[16px] leading-[1.5] text-[#202716]"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 500,
                          letterSpacing: '0',
                        }}
                      >
                        {step.title}
                      </h2>
                      <p
                        className="mt-1 max-w-[290px] text-[12px] leading-[1.5] text-[#8A7D6A]"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 400,
                          letterSpacing: '0',
                        }}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#591902] px-6 py-14 md:px-10 md:py-16 lg:px-[96px] lg:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-2 lg:gap-10">
          {actionCards.map((card, index) => (
            <div
              key={card.title}
              className="card-reveal rounded-[28px] bg-[#F7F4EE] px-7 py-8 md:px-9 md:py-9 lg:px-10 lg:py-10"
              style={{ '--delay': `${0.12 + index * 0.08}s` }}
            >
              <p
                className="text-[14px] leading-[1.5] text-[#9B9A92]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              >
                {card.eyebrow}
              </p>

              <h2
                className="mt-2 text-[21px] leading-[1.2] text-[#202716]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, letterSpacing: '0' }}
              >
                {card.title}
              </h2>

              <p
                className="mt-3 max-w-[540px] text-[16px] leading-[1.5] text-[#9B9A92]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              >
                {card.desc}
              </p>

              <Link
                to={card.to}
                className="mt-7 inline-flex rounded-full border border-[#7A3216] px-5 py-3 text-[#7A3216] transition-colors hover:bg-[#7A3216] hover:text-white"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, letterSpacing: '0' }}
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default ConsultationConfirmation
