import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DateTimePicker from '../components/common/DateTimePicker'
import { getFieldErrors } from '../lib/formErrors'
import { useConsultation } from '../hooks/useConsultation'
import { getDateInputMin } from '../lib/dateInput'

const consultationFeatures = [
  {
    title: 'Personalized guidance',
    desc: 'Tailored plan based on your event type and vision',
  },
  {
    title: 'Structured planning',
    desc: 'A clear, step-by-step roadmap from concept to day-of',
  },
  {
    title: 'Vendor coordination',
    desc: 'We handle sourcing and communication with vendors',
  },
  {
    title: 'Budget clarity',
    desc: 'Full cost breakdown before anything is committed',
  },
]

const RevealLine = ({ children, delay, className = '' }) => (
  <span className={`reveal-wrapper block ${className}`.trim()}>
    <span className="reveal-text" style={delay ? { animationDelay: delay } : undefined}>
      {children}
    </span>
  </span>
)

const BookConsultationPage = () => {
  const pageRef = useRef(null)
  const navigate = useNavigate()
  const { mutate: submitConsultation, isPending, isError, error } = useConsultation()
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    event_type: '',
    event_date: '',
    city: '',
    budget_range: '',
    vision_notes: '',
  })

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
      { threshold: 0.05, rootMargin: '0px 0px -2% 0px' }
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

  const handleChange = event => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
    setFieldErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = event => {
    event.preventDefault()
    const errors = {}
    if (!form.full_name.trim()) errors.full_name = 'Name is required'
    if (!form.phone.trim()) errors.phone = 'Phone number is required'
    if (!form.event_date) errors.event_date = 'Event date is required'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    submitConsultation(form, {
      onSuccess: () => {
        navigate('/consultation-confirmation', {
          state: {
            fullName: form.full_name,
            email: form.email,
            phone: form.phone,
            eventType: form.event_type,
            date: form.event_date,
            location: form.city,
            budget: form.budget_range,
            notes: form.vision_notes,
          },
        })
      },
      onError: submitError => {
        setFieldErrors(getFieldErrors(submitError))
      },
    })
  }

  return (
    <main ref={pageRef} className="consultation-page w-full overflow-hidden bg-[#F8F4ED] font-sans">
      <section
        data-nav-theme="light"
        data-nav-surface="transparent"
        className="bg-[#F5F1E8] px-6 pb-24 pt-32 md:px-16 md:pb-32 md:pt-40 lg:px-[110px] lg:pb-40 lg:pt-[210px]"
      >
        <div className="mx-auto w-full max-w-[1816px]">
          <h1
            className="max-w-[760px] text-[52px] leading-[1] text-[#171717] md:text-[64px] lg:text-[80px]"
            style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
          >
            <RevealLine>Book a</RevealLine> <br />
            <RevealLine delay="0.06s">Consultation</RevealLine>
          </h1>

          <p
            className="reveal-on-scroll mt-8 max-w-[620px] text-[14px] leading-[1.5] text-[#7A7A7A] md:mt-10 md:text-[15px] lg:mt-12 lg:text-[16px]"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
          >
            <RevealLine>
              For events that need more than packages, get personalized planning support.
            </RevealLine>
          </p>
        </div>
      </section>

      <section className="bg-[#364022] px-6 py-16 text-white md:px-12 md:py-20 lg:px-[110px] lg:py-24">
        <div className="mx-auto grid max-w-[1816px] gap-14 lg:grid-cols-[minmax(300px,1.15fr)_minmax(520px,1fr)] lg:gap-20">
          <div className="max-w-[640px] reveal-on-scroll">
            <p className="mb-5 text-[13px] uppercase tracking-[0.02em] text-white/55 md:mb-7 md:text-[14px]">
              WHAT YOU GET
            </p>
            <h2
              className="text-[42px] leading-[1] text-[#F7F4EE] md:text-[52px] lg:text-[61px]"
              style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
            >
              <RevealLine>Everything you</RevealLine>
              <RevealLine delay="0.06s">need to begin</RevealLine>
            </h2>
          </div>

          <div className="grid gap-x-10 gap-y-0 md:grid-cols-2 md:gap-x-12 w-full">
            {consultationFeatures.map((item, index) => (
              <div
                key={item.title}
                className="card-reveal border-t border-[#819452] px-0 py-7 md:py-8"
                style={{ '--delay': `${index * 0.06}s` }}
              >
                <div className="flex items-start gap-4 md:gap-5 ">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6D8245] text-[20px] leading-none text-[#F7F4EE] md:h-14 md:w-14 md:text-[22px]">
                    {index + 1}
                  </div>

                  <div className="pt-1 w-full">
                    <h4
                      className="whitespace-nowrap text-[16px] leading-[1.5] text-[#F7F4EE]"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        letterSpacing: '0',
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      className="mt-2 max-w-[310px] text-[12px] leading-[1.5] text-white/55"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        letterSpacing: '0',
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#BBBCA4] px-6 py-16 md:px-12 md:py-20 lg:px-[110px] lg:py-24">
        <div className="mx-auto grid max-w-[1816px] items-start gap-12 lg:grid-cols-[minmax(320px,0.82fr)_minmax(560px,1.08fr)] lg:gap-20">
          <div className="max-w-[560px] pt-2 lg:pt-0 reveal-on-scroll">
            <p
              className="mb-5 text-[13px] uppercase leading-[1.5] text-[#202716]/55 md:mb-7 md:text-[14px]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
            >
              REQUEST A CONSULTATION
            </p>

            <h2
              className="text-[42px] leading-[1] text-[#202716] md:text-[52px] lg:text-[61px]"
              style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
            >
              <RevealLine>Tell us about</RevealLine>
              <RevealLine delay="0.06s">your event</RevealLine>
            </h2>

            <p
              className="mt-5 max-w-[470px] text-[14px] leading-[1.5] text-[#202716]/60 md:text-[15px] lg:mt-7 lg:text-[16px]"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
            >
              Share a few details and our planner will reach out to understand your vision and build
              a tailored plan.
            </p>

            <ul
              className="mt-10 space-y-5 text-[#202716] lg:mt-14"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
            >
              <li className="flex items-center gap-4 text-[14px] leading-[1.5] md:text-[15px] lg:text-[16px]">
                <span className="h-3 w-3 shrink-0 rounded-full bg-[#202716]" />
                <span>We reply within 24 hours</span>
              </li>
              <li className="flex items-center gap-4 text-[14px] leading-[1.5] md:text-[15px] lg:text-[16px]">
                <span className="h-3 w-3 shrink-0 rounded-full bg-[#202716]" />
                <span>Handled by our in-house planner</span>
              </li>
              <li className="flex items-center gap-4 text-[14px] leading-[1.5] md:text-[15px] lg:text-[16px]">
                <span className="h-3 w-3 shrink-0 rounded-full bg-[#202716]" />
                <span>No commitment required</span>
              </li>
            </ul>
          </div>

          <form
            onSubmit={handleSubmit}
            className="card-reveal rounded-[28px] border-t-[4px] border-[#6D2005] bg-[#F8F4ED] px-6 py-7 md:px-8 md:py-8 lg:px-11 lg:py-11"
            style={{ '--delay': '0.12s' }}
          >
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 lg:gap-x-6 lg:gap-y-6">
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="border-b border-[#1F1F1F]/20 bg-transparent px-1 pb-3 pt-1 text-[16px] leading-[1.5] text-[#2D2D2D] outline-none placeholder:text-[#2D2D2D] placeholder:opacity-90"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              />
              {fieldErrors.full_name ? (
                <p className="mt-2 text-[13px] leading-[1.5] text-[#B3261E]">
                  {fieldErrors.full_name}
                </p>
              ) : null}
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="border-b border-[#1F1F1F]/20 bg-transparent px-1 pb-3 pt-1 text-[16px] leading-[1.5] text-[#2D2D2D] outline-none placeholder:text-[#2D2D2D] placeholder:opacity-90"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              />
              {fieldErrors.email ? (
                <p className="mt-2 text-[13px] leading-[1.5] text-[#B3261E]">{fieldErrors.email}</p>
              ) : null}
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
                className="border-b border-[#1F1F1F]/20 bg-transparent px-1 pb-3 pt-1 text-[16px] leading-[1.5] text-[#2D2D2D] outline-none placeholder:text-[#2D2D2D] placeholder:opacity-90"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              />
              {fieldErrors.phone ? (
                <p className="mt-2 text-[13px] leading-[1.5] text-[#B3261E]">{fieldErrors.phone}</p>
              ) : null}
              <input
                type="text"
                name="event_type"
                value={form.event_type}
                onChange={handleChange}
                placeholder="Event Type"
                className="border-b border-[#1F1F1F]/20 bg-transparent px-1 pb-3 pt-1 text-[16px] leading-[1.5] text-[#2D2D2D] outline-none placeholder:text-[#2D2D2D] placeholder:opacity-90"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              />
              {fieldErrors.event_type ? (
                <p className="mt-2 text-[13px] leading-[1.5] text-[#B3261E]">
                  {fieldErrors.event_type}
                </p>
              ) : null}
              <DateTimePicker
                type="date"
                name="event_date"
                value={form.event_date}
                onChange={handleChange}
                min={getDateInputMin()}
                required
                className="border-b border-[#1F1F1F]/20 bg-transparent px-1 pb-3 pt-1 text-[16px] leading-[1.5] text-[#2D2D2D] outline-none placeholder:text-[#2D2D2D] placeholder:opacity-90"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              />
              {fieldErrors.event_date ? (
                <p className="mt-2 text-[13px] leading-[1.5] text-[#B3261E]">
                  {fieldErrors.event_date}
                </p>
              ) : null}
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City/Location"
                className="border-b border-[#1F1F1F]/20 bg-transparent px-1 pb-3 pt-1 text-[16px] leading-[1.5] text-[#2D2D2D] outline-none placeholder:text-[#2D2D2D] placeholder:opacity-90"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              />
              {fieldErrors.city ? (
                <p className="mt-2 text-[13px] leading-[1.5] text-[#B3261E]">{fieldErrors.city}</p>
              ) : null}
              <input
                type="text"
                name="budget_range"
                value={form.budget_range}
                onChange={handleChange}
                placeholder="Budget Range"
                className="border-b border-[#1F1F1F]/20 bg-transparent px-1 pb-3 pt-1 text-[16px] leading-[1.5] text-[#2D2D2D] outline-none placeholder:text-[#2D2D2D] placeholder:opacity-90"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              />
              {fieldErrors.budget_range ? (
                <p className="mt-2 text-[13px] leading-[1.5] text-[#B3261E]">
                  {fieldErrors.budget_range}
                </p>
              ) : null}
            </div>

            <textarea
              name="vision_notes"
              value={form.vision_notes}
              onChange={e => {
                handleChange(e)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Notes (Optional)"
              rows={1}
              className="mt-5 w-full pt-2 pb-1 resize-none border-b border-[#1F1F1F]/20 bg-transparent px-1 text-[16px] leading-[1.5] text-[#2D2D2D] outline-none placeholder:text-[#2D2D2D] placeholder:opacity-90 overflow-hidden"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
            />
            {fieldErrors.vision_notes ? (
              <p className="mt-2 text-[13px] leading-[1.5] text-[#B3261E]">
                {fieldErrors.vision_notes}
              </p>
            ) : null}

            {isError ? (
              <p
                className="mt-4 text-[13px] leading-[1.5] text-[#B3261E]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              >
                {error?.message || 'We could not submit your request right now. Please try again.'}
              </p>
            ) : null}

            <div className="mt-11 flex flex-col gap-6 md:items-end">
              <button
                type="submit"
                disabled={isPending}
                className="group flex w-full items-center justify-between rounded-full bg-[#D4BA8E] py-1.5 pl-6 pr-1.5 transition-colors hover:bg-[#C6AB7F] md:w-fit"
              >
                <span
                  className="mr-5 whitespace-nowrap text-[15px] text-white"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0',
                  }}
                >
                  {isPending ? 'Submitting...' : 'Request Consultation'}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                  <svg
                    className="h-[20px] w-[20px] text-[#D4BA8E] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.82812 5.83398H14.1615M14.1615 5.83398V14.1673M14.1615 5.83398L5.82812 14.1673"
                      stroke="#CDB17E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>

              <div
                className="space-y-1 text-left text-[#2D2D2D]/40 md:text-right"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0' }}
              >
                <p className="text-[12px] leading-[1.5]">We reply within 24 hours</p>
                <p className="text-[12px] leading-[1.5]">Handled by our in-house planner</p>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

export default BookConsultationPage
