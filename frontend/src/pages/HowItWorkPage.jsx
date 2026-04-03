import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import bulb1 from '../assets/lightbulb_images/bulb1.png'
import bulb2 from '../assets/lightbulb_images/bulb2.png'
import plannerPortrait from '../assets/images/moksha_portrait.jpg'

const HERO_TAGS = [
  'BIRTHDAYS',
  'ANNIVERSARIES',
  'HOUSE PARTIES',
  'BABY SHOWERS',
  'CORPORATE',
  'RELIGIOUS',
]

const ORBS = [
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

const IDEA_TO_CELEBRATION_STEPS = [
  {
    number: '1',
    title: 'Choose Your Event & Services',
    description:
      'Browse by event type — birthdays, anniversaries, house parties, and more. Select from curated decor, catering, and add-on services.',
  },
  {
    number: '2',
    title: 'Pick a Package & Customize',
    description:
      'Choose a package that suits your scale and vision. Add, swap, or adjust elements to make it truly yours — no package is one-size-fits-all.',
  },
  {
    number: '3',
    title: 'Review & Pay Advance',
    description:
      'Review your full order summary — pricing, timelines, inclusions. Confirm with a small advance payment to lock in your date and package.',
  },
  {
    number: '4',
    title: 'Elewen Reviews & Confirms',
    description:
      'Our team reviews your booking, coordinates with vendors, and sends you a confirmation within 24 hours. You’re kept in the loop at every step.',
  },
  {
    number: '5',
    title: 'Event Execution',
    description:
      'Sit back and celebrate. Our in-house planners and vetted vendors execute everything on the day — from setup to teardown.',
  },
]

const IDEA_TO_CELEBRATION_LAYOUT = [
  {
    stepIndex: 0,
    rowClass: 'justify-center md:pl-24 lg:pl-32',
    lineClass: 'left-[10%] right-[20%]',
  },
  {
    stepIndex: 1,
    rowClass: 'justify-start md:pl-10 lg:pl-14',
    lineClass: 'left-[6%] right-[8%]',
  },
  {
    stepIndex: 2,
    rowClass: 'justify-center md:pl-8 lg:pl-16',
    lineClass: 'left-[10%] right-[14%]',
  },
  {
    stepIndex: 3,
    rowClass: 'justify-start md:pl-16 lg:pl-24',
    lineClass: 'left-[6%] right-[22%]',
  },
  {
    stepIndex: 4,
    rowClass: 'justify-start',
    lineClass: 'left-[6%] right-[42%]',
  },
]

const DASHBOARD_FEATURES = [
  {
    title: 'Order Tracking',
    description: 'Real-time status of every vendor and service in your package.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 3h6" strokeLinecap="round" />
        <rect x="5" y="4.5" width="14" height="16" rx="2" />
        <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Live Updates',
    description: 'Instant notifications on confirmations, changes, and reminders.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          d="M9.5 18h5m-8-2h11l-1.2-1.7a4 4 0 0 1-.7-2.28V10a4.6 4.6 0 1 0-9.2 0v2.02c0 .8-.24 1.59-.7 2.28L6.5 16Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Direct Communication',
    description: 'Message our team or your planner directly from the dashboard.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 6.5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4.5 3v-3H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
        <path d="M8.5 10h7M8.5 13.5h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '24/7 Support',
    description: 'Need help? Our team is reachable before, during, and after your event.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          d="M4.5 12a7.5 7.5 0 0 1 15 0v5a2 2 0 0 1-2 2h-1.5v-6H20m-16 0h4v6H6.5a2 2 0 0 1-2-2v-5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

const DASHBOARD_BULBS = Array.from({ length: 10 })
const PLANNER_TAGS = ['Dedicated Planner', 'Pre-event Briefing', 'Day-of Coordination']
const HOW_IT_WORK_FAQS = [
  {
    question: 'How is pricing determined?',
    answer:
      'Pricing depends on your event type, selected services, and chosen package. Every package displays a clear starting price, and any add-ons are shown before you confirm. No hidden charges.',
  },
  {
    question: 'Can I customise a package after booking?',
    answer:
      'Yes. Depending on timelines and availability, our team can help you adjust services, decor elements, and package selections after your initial booking.',
  },
  {
    question: 'How do I reach support during the event?',
    answer:
      'You can reach your assigned planner directly through your event dashboard, and our support team remains available for urgent coordination needs throughout the event.',
  },
  {
    question: 'Are vendors pre-vetted by Elewen?',
    answer:
      'Yes. Elewen works with vetted vendor partners so quality, timing, and reliability are maintained across your celebration.',
  },
  {
    question: 'What happens if a vendor cancels last-minute?',
    answer:
      'If a last-minute issue comes up, our team steps in immediately to coordinate an alternative from our vendor network and keep the event on track.',
  },
  {
    question: 'What is the cancellation policy?',
    answer:
      'Cancellation terms depend on the booking stage and vendor commitments. Your planner will walk you through the applicable policy before confirmation.',
  },
]

const IdeaToCelebrationSection = () => {
  return (
    <section className="relative flex w-full justify-center overflow-hidden bg-[#E7E0DA] px-6 py-16 min-[540px]:px-10 min-[540px]:py-20 lg:px-20 xl:px-[100px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
        <div className="absolute left-[-10%] top-[-6%] h-[260px] w-[420px] rotate-[-38deg] rounded-[48px] border border-[#D9C9BC]/45" />
        <div className="absolute right-[-8%] top-[8%] h-[320px] w-[480px] rotate-[-38deg] rounded-[56px] border border-[#D9C9BC]/35" />
        <div className="absolute left-[18%] top-[28%] h-[520px] w-[180px] rotate-[-38deg] rounded-[40px] bg-white/10" />
        <div className="absolute left-[45%] top-[26%] h-[520px] w-[180px] rotate-[-38deg] rounded-[40px] bg-white/10" />
      </div>

      <div className="relative flex w-full max-w-[1180px] flex-col items-center">
        <div className="flex w-full max-w-[760px] flex-col items-center text-center">
          <h2
            className="text-[40px] leading-[1] text-[#7A341C] min-[540px]:text-[52px] lg:text-[61px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            From Idea to Celebration.
          </h2>
          <p className="mx-auto mt-5 max-w-[760px] text-[14px] leading-[1.6] text-[#9A7A67] min-[540px]:text-[15px] lg:text-[16px]">
            Choose your event, explore curated options, and move through each step with
            clarity — from planning to final setup.
          </p>
        </div>

        <div className="relative mt-14 flex w-full max-w-[980px] flex-col gap-8 md:gap-12">
          <div className="flex flex-col gap-8 md:hidden">
            {IDEA_TO_CELEBRATION_STEPS.map(step => (
              <div key={step.number} className="relative flex pl-8">
                <div className="absolute bottom-0 left-0 top-0 w-px bg-[#D8B29B]" />
                <div className="absolute left-0 top-5 h-px w-6 bg-[#D8B29B]" />
                <StepCard step={step} />
              </div>
            ))}
          </div>

          <div className="hidden md:flex md:flex-col md:gap-10 lg:gap-12">
            {IDEA_TO_CELEBRATION_LAYOUT.map((item, index) => {
              const step = IDEA_TO_CELEBRATION_STEPS[item.stepIndex]
              const showLine = index < IDEA_TO_CELEBRATION_LAYOUT.length - 1

              return (
                <div key={step.number} className="relative flex flex-col">
                  <div className={`relative flex min-h-[140px] w-full ${item.rowClass}`}>
                    <div className="relative flex w-full max-w-[320px] flex-col">
                      <div className="absolute left-[18px] top-[-22px] h-[22px] w-px bg-[#D8B29B]" />
                      <StepCard step={step} />
                    </div>
                  </div>

                  {showLine ? (
                    <div
                      className={`relative mt-3 h-px bg-[#D8B29B] ${item.lineClass}`}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

const EventDashboardSection = () => {
  return (
    <section className="relative flex w-full justify-center overflow-hidden bg-[#FAFAFA] px-6 pb-16 pt-0 min-[540px]:px-10 min-[540px]:pb-20 lg:px-20 xl:px-[100px]">
      <div className="absolute inset-x-0 top-0 flex w-full pointer-events-none">
        {DASHBOARD_BULBS.map((_, index) => (
          <div key={index} className="relative flex h-[92px] flex-1 justify-center overflow-visible">
            <div
              className="absolute left-0 top-0 h-[62px] w-full bg-[#6C2205]"
              style={{ borderRadius: '0 0 999px 999px / 0 0 100% 100%' }}
            />
            <div
              className="absolute left-0 top-0 h-[52px] w-full bg-[#E9E2DA]"
              style={{ borderRadius: '0 0 999px 999px / 0 0 100% 100%' }}
            />
            <div className="absolute top-[40px] flex flex-col items-center">
              <div className="h-[18px] w-px bg-[#6C2205]/40" />
              <img
                src={index % 2 === 0 ? bulb1 : bulb2}
                alt=""
                className="mt-[-2px] h-auto w-[22px]"
              />
              <div
                className="mt-[-2px] h-[74px] w-[78px] opacity-55 blur-[8px]"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(252,214,112,0.9) 0%, rgba(252,214,112,0) 100%)',
                  clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex w-full max-w-[1180px] flex-col gap-12 pt-[132px] lg:flex-row lg:items-center lg:gap-14 lg:pt-[170px]">
        <div className="flex w-full flex-col lg:max-w-[410px]">
          <h2
            className="max-w-[420px] text-[48px] leading-[0.95] text-[#6C2205] min-[540px]:text-[60px] lg:text-[72px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Your Dashboard. Everything in One Place.
          </h2>

          <p className="mt-8 max-w-[396px] text-[16px] leading-[1.5] text-[#B29078] min-[540px]:text-[18px]">
            Once your booking is confirmed, you get access to your personal event
            dashboard — where everything lives, from order details to vendor updates.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              'Zero missed updates',
              'Vendor coordination handled',
              'Dedicated event planner assigned',
              'Full timeline visibility',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E3E5D9] text-[#70805B]">
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m3.5 8.5 2.5 2.5 6-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[14px] leading-[1.4] text-[#4F4F4F] min-[540px]:text-[15px]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-1">
          <div className="flex w-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(117,72,33,0.12)]">
            <div className="flex min-h-[72px] items-center rounded-t-[22px] bg-[#3E4E22] px-7 py-5">
              <span className="text-[18px] font-medium leading-[1.3] text-[#FAFAFA] min-[540px]:text-[20px]">
                My Event Dashboard
              </span>
            </div>

            <div className="flex w-full flex-col gap-3 p-4 min-[540px]:p-5 lg:grid lg:grid-cols-2 lg:gap-4 lg:p-7">
              {DASHBOARD_FEATURES.map(feature => (
                <div
                  key={feature.title}
                  className="flex min-h-[170px] flex-col rounded-[14px] bg-[#F4EEE6] p-5 min-[540px]:min-h-[182px] min-[540px]:p-6"
                >
                  <div className="h-9 w-9 text-[#7A341C]">{feature.icon}</div>
                  <h3 className="mt-5 text-[20px] font-medium leading-[1.15] text-[#7A341C]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-[250px] text-[14px] leading-[1.5] text-[#C0A48E] min-[540px]:text-[15px]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const InHousePlannerHighlightSection = () => {
  return (
    <section className="flex w-full justify-center bg-[#F8F4ED] px-6 py-16 min-[540px]:px-10 min-[540px]:py-20 lg:px-20 xl:px-[100px]">
      <div className="flex w-full max-w-[1180px] flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="flex w-full justify-center lg:w-auto lg:justify-start">
          <div className="flex h-[360px] w-[300px] items-center justify-center rounded-[999px] bg-[#EAD9B8] p-6 min-[540px]:h-[460px] min-[540px]:w-[380px] lg:h-[540px] lg:w-[450px]">
            <div className="h-full w-full overflow-hidden rounded-[999px]">
              <img
                src={plannerPortrait}
                alt="In-house event planner"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-[620px] flex-col items-start">
          <h2
            className="max-w-[620px] text-[44px] leading-[0.96] text-[#6C2205] min-[540px]:text-[56px] lg:text-[72px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Your Own In-house Event Planner.
          </h2>

          <p className="mt-8 max-w-[620px] text-[18px] leading-[1.5] text-[#A78974]">
            Every booking comes with a dedicated in-house planner — a real person who
            knows your event inside-out. They coordinate with vendors, manage timelines,
            and are available for last-minute questions.
          </p>

          <p className="mt-6 max-w-[620px] text-[18px] leading-[1.5] text-[#A78974]">
            No bots. No generic helplines. Just focused, human support.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {PLANNER_TAGS.map(tag => (
              <span
                key={tag}
                className="rounded-full bg-[#EAD9B8] px-5 py-2.5 text-[14px] font-medium leading-[1.3] text-[#8A5B35]"
              >
                {tag}
              </span>
            ))}
          </div>

          <Link
            to="/in-house-planner"
            className="group mt-14 flex min-h-[56px] w-full max-w-[280px] items-center justify-between rounded-full bg-[#D4BA8E] pl-6 pr-2 text-white transition-colors hover:bg-[#c9ad7f]"
          >
            <span className="text-[16px] font-medium leading-[1.3]">
              Book an In-House Planner
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#D4BA8E]">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7 17L17 7M17 7H9M17 7v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

const NeedToKnowSection = () => {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="flex w-full justify-center bg-[#FAFAFA] px-6 py-16 min-[540px]:px-10 min-[540px]:py-20 lg:px-20 xl:px-[100px]">
      <div className="flex w-full max-w-[1180px] flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <div className="flex w-full max-w-[360px] flex-col">
          <h2
            className="text-[48px] leading-[0.95] text-[#6C2205] min-[540px]:text-[56px] lg:text-[72px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Everything You Need to Know.
          </h2>

          <p className="mt-8 max-w-[280px] text-[18px] leading-[1.45] text-[#A78974]">
            Still unsure? Here are the answers to the most common questions.
          </p>
        </div>

        <div className="flex w-full flex-1">
          <div className="flex w-full flex-col rounded-[24px] bg-white p-5 shadow-[0_24px_70px_rgba(117,72,33,0.12)] min-[540px]:p-6 lg:p-7">
            {HOW_IT_WORK_FAQS.map((faq, index) => {
              const isOpen = openIndex === index

              return (
                <div
                  key={faq.question}
                  className={`${index > 0 ? 'border-t border-[#E7D6C8]' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left min-[540px]:py-6"
                  >
                    <div className="flex flex-col">
                      <h3
                        className="text-[24px] leading-[1.08] text-[#6C2205] min-[540px]:text-[32px]"
                        style={{ fontFamily: "'Malgin', serif" }}
                      >
                        {faq.question}
                      </h3>

                      {isOpen ? (
                        <p className="mt-5 max-w-[760px] text-[16px] leading-[1.5] text-[#B29078] min-[540px]:text-[18px]">
                          {faq.answer}
                        </p>
                      ) : null}
                    </div>

                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-[#6C2205]">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        {isOpen ? (
                          <path d="M6 12h12" strokeLinecap="round" />
                        ) : (
                          <>
                            <path d="M6 12h12" strokeLinecap="round" />
                            <path d="M12 6v12" strokeLinecap="round" />
                          </>
                        )}
                      </svg>
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

const FinalCtaSection = () => {
  return (
    <section className="relative flex w-full justify-center overflow-hidden bg-[#591902] px-6 py-20 min-[540px]:px-10 min-[540px]:py-24 lg:px-20 xl:px-[100px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-22%] h-[320px] w-[320px] rounded-full bg-[#7B2A07] min-[540px]:h-[440px] min-[540px]:w-[440px] lg:h-[560px] lg:w-[560px]" />
        <div className="absolute bottom-[-18%] right-[-10%] h-[260px] w-[260px] rounded-full bg-[#7B2A07] min-[540px]:h-[340px] min-[540px]:w-[340px] lg:h-[420px] lg:w-[420px]" />
      </div>

      <div className="relative flex w-full max-w-[980px] flex-col items-center text-center">
        <div className="flex flex-col items-center">
          <div className="h-px w-20 bg-[#D4BA8E]" />
          <span className="mt-4 text-[16px] uppercase leading-[1.3] tracking-[0.04em] text-[#D4BA8E]">
            READY WHEN YOU ARE
          </span>
        </div>

        <h2
          className="mt-6 max-w-[980px] text-[48px] leading-[0.96] text-white min-[540px]:text-[64px] lg:text-[86px]"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Your Celebration Is Just a Few Steps Away.
        </h2>

        <p className="mt-8 max-w-[760px] text-[18px] leading-[1.55] text-[#D6B8A7] min-[540px]:text-[22px]">
          No stress. No juggling. Just a beautiful, well-planned event — handled by
          people who care about getting it right.
        </p>

        <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 min-[540px]:flex-row">
          <Link
            to="/login"
            className="group flex min-h-[56px] w-full max-w-[280px] items-center justify-between rounded-full bg-[#D4BA8E] pl-8 pr-2 text-white transition-colors hover:bg-[#c9ad7f]"
          >
            <span className="text-[16px] font-medium leading-[1.3]">Start Booking</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#D4BA8E]">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7 17L17 7M17 7H9M17 7v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>

          <Link
            to="/contact"
            className="flex min-h-[56px] w-full max-w-[280px] items-center justify-center rounded-full bg-white px-8 text-[16px] font-medium leading-[1.3] text-[#C89F5D] transition-colors hover:bg-[#f5f0e8]"
          >
            Book a Consultation
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-3 text-center text-[16px] leading-[1.4] text-[#B89074]">
          <span className="text-[#C89F5D]">✦</span>
          <span>Trusted by 500+ hosts across Jaipur, Delhi &amp; Mumbai</span>
          <span className="text-[#C89F5D]">✦</span>
        </div>
      </div>
    </section>
  )
}

const StepCard = ({ step, align = 'left' }) => {
  return (
    <article
      className={`max-w-[270px] md:max-w-[320px] ${
        align === 'right' ? 'md:mr-auto' : 'md:ml-auto'
      }`}
    >
      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#CDA25C] text-[16px] font-semibold leading-none text-[#7A341C]">
        {step.number}
      </div>
      <h3
        className="mt-4 text-[26px] leading-[1.08] text-[#D05D3C] min-[540px]:text-[29px]"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        {step.title}
      </h3>
      <p className="mt-3 max-w-[270px] text-[14px] leading-[1.55] text-[#9A7A67] min-[540px]:text-[15px]">
        {step.description}
      </p>
    </article>
  )
}

const HowItWorkHeroSection = () => {
  return (
    <section
      data-nav-surface="transparent"
      className="relative min-h-screen overflow-hidden bg-[#591902] pt-28 min-[540px]:pt-36"
    >
      <div className="pointer-events-none absolute inset-0">
        {ORBS.map(orb => (
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
                    <span
                      className="reveal-text reveal-text-x-right inline-block"
                      style={{ animationDelay: '0.12s' }}
                    >
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
  )
}

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
      <HowItWorkHeroSection />

      <IdeaToCelebrationSection />

      <EventDashboardSection />

      <section className="flex w-full justify-center bg-[#364022] px-6 py-5 min-[540px]:px-10 min-[540px]:py-6 lg:px-20 xl:px-[100px]">
        <div className="flex w-full max-w-[1180px] items-center justify-center">
          <p
            className="text-center text-[20px] leading-[1.2] text-[#D4BA8E] min-[540px]:text-[23px] lg:text-[27px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Plan with clarity. Celebrate with ease.
          </p>
        </div>
      </section>

      <InHousePlannerHighlightSection />

      <NeedToKnowSection />

      <FinalCtaSection />
    </main>
  )
}

export default HowItWorkPage
