import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScallopBulbCurtain from '../components/common/ScallopBulbCurtain'

const HERO_TAGS = [
  'BIRTHDAYS',
  'ANNIVERSARIES',
  'HOUSE PARTIES',
  'BABY SHOWERS',
  'CORPORATE',
  'RELIGIOUS',
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

const IDEA_TO_CELEBRATION_CARDS = [
  {
    stepIndex: 0,
    left: '50%',
    top: '5%',
    width: '32%',
    maxWidth: '320px',
    translateX: '-50%',
  },
  {
    stepIndex: 1,
    left: '8%',
    top: '24%',
    width: '27%',
    maxWidth: '270px',
  },
  {
    stepIndex: 2,
    left: '43%',
    top: '46%',
    width: '30%',
    maxWidth: '290px',
  },
  {
    stepIndex: 3,
    left: '17%',
    top: '67%',
    width: '29%',
    maxWidth: '280px',
  },
  {
    stepIndex: 4,
    left: '2%',
    top: '87%',
    width: '27%',
    maxWidth: '260px',
  },
]

const IDEA_TO_CELEBRATION_CONNECTORS = {
  horizontals: [
    { top: '17.8%', left: '8%', right: '9%' },
    { top: '38.6%', left: '8%', right: '6%' },
    { top: '58.3%', left: '8%', right: '18%' },
    { top: '79.4%', left: '8%', right: '38%' },
  ],
  verticals: [
    { left: '42%', top: '10.7%', height: '7.1%' },
    { left: '12.3%', top: '31.4%', height: '7.2%' },
    { left: '58.5%', top: '52.3%', height: '6%' },
    { left: '18.7%', top: '72.2%', height: '7.2%' },
    { left: '50.5%', top: '84.4%', height: '5.5%' },
  ],
}

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
            Choose your event, explore curated options, and move through each step with clarity —
            from planning to final setup.
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

          <div className="hidden md:block w-full">
            <div className="relative mx-auto w-full max-w-[1040px] h-[min(120vw,1203px)] min-h-[920px]">
              {IDEA_TO_CELEBRATION_CONNECTORS.horizontals.map((line, index) => (
                <div
                  key={`h-line-${index}`}
                  className="absolute h-0 border-t border-transparent"
                  style={{
                    top: line.top,
                    left: line.left,
                    right: line.right,
                    borderImage: 'linear-gradient(270deg, #C73E0C 0%, #E7E0DA 100%) 1',
                  }}
                />
              ))}

              {IDEA_TO_CELEBRATION_CONNECTORS.verticals.map((line, index) => (
                <div
                  key={`v-line-${index}`}
                  className="absolute w-0 border-l border-transparent"
                  style={{
                    left: line.left,
                    top: line.top,
                    height: line.height,
                    borderImage: 'linear-gradient(180deg, #E7E0DA 0%, #C73E0C 100%) 1',
                  }}
                />
              ))}

              {IDEA_TO_CELEBRATION_CARDS.map(card => {
                const step = IDEA_TO_CELEBRATION_STEPS[card.stepIndex]
                return (
                  <div
                    key={step.number}
                    className="absolute"
                    style={{
                      left: card.left,
                      top: card.top,
                      width: card.width,
                      maxWidth: card.maxWidth,
                      transform: card.translateX ? `translateX(${card.translateX})` : undefined,
                    }}
                  >
                    <StepCard step={step} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const EventDashboardSection = () => {
  return (
    <section className="relative flex w-full justify-center overflow-hidden bg-[#FAFAFA] px-6 py-16 pt-0 min-[540px]:px-10 min-[540px]:py-20 lg:px-20 xl:px-[100px]">
      <ScallopBulbCurtain
        count={10}
        outerColor="#6C2205"
        innerColor="#E9E2DA"
        wireColorClass="bg-[#6C2205]/40"
        fitToWidth
        className="absolute inset-x-0 top-0 flex w-full pointer-events-none z-10"
      />

      <div className="relative flex w-full max-w-[1180px] flex-col gap-12 pt-[132px] lg:flex-row lg:items-center lg:gap-14 lg:pt-[170px]">
        <div className="flex w-full flex-col lg:max-w-[410px]">
          <h2
            className="max-w-[420px] text-[48px] leading-[0.95] text-[#6C2205] min-[540px]:text-[61px] lg:text-[61px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Your Dashboard. Everything in One Place.
          </h2>

          <p className="mt-8 max-w-[396px] text-[16px] leading-[1.5] text-[#B29078] min-[540px]:text-[18px]">
            Once your booking is confirmed, you get access to your personal event dashboard — where
            everything lives, from order details to vendor updates.
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
            <div className="flex min-h-[72px] items-center rounded-full bg-[#3E4E22] px-7 py-5">
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

const NeedToKnowSection = () => {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="flex w-full justify-center bg-[#FAFAFA] px-6 py-16 min-[540px]:px-10 min-[540px]:py-20 lg:px-20 xl:px-[100px]">
      <div className="flex w-full max-w-[1180px] flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <div className="flex w-full max-w-[360px] flex-col">
          <h2
            className="text-[48px] leading-[0.95] text-[#6C2205] min-[540px]:text-[61px] lg:text-[61px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Everything You Need to Know.
          </h2>

          <p className="mt-8 max-w-[280px] text-[18px] leading-[1.45] text-[#A78974]">
            Still unsure? Here are the answers to the most common questions.
          </p>
        </div>

        <div className="flex w-full flex-1">
          <div className="flex w-full flex-col rounded-[24px] bg-white px-5 shadow-[0_24px_70px_rgba(117,72,33,0.12)] min-[540px]:px-6 lg:px-7">
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
    <section className="relative flex w-full justify-center overflow-hidden bg-[#591902] px-6 py-14 min-[540px]:px-10 min-[540px]:py-16 lg:px-20 xl:px-[100px]">
      <div className="relative flex w-full max-w-[980px] flex-col items-center text-center">
        <div className="flex flex-col items-center">
          <div className="h-px w-20 bg-[#D4BA8E]" />
          <span className="mt-4 text-[12px] uppercase leading-[1.3] tracking-[0.04em] text-[#D4BA8E]">
            READY WHEN YOU ARE
          </span>
        </div>

        <h2
          className="mt-5 max-w-[980px] text-[48px] leading-[0.96] text-white min-[540px]:text-[61px] lg:text-[72px]"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Your Celebration Is Just a Few Steps Away.
        </h2>

        <p className="mt-6 max-w-[760px] text-[16px] leading-[1.55] text-[#D6B8A7] min-[540px]:text-[22px]">
          No stress. No juggling. Just a beautiful, well-planned event — handled by people who care
          about getting it right.
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 min-[540px]:flex-row">
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

        <div className="mt-10 flex items-center justify-center gap-3 text-center text-[16px] leading-[1.4] text-[#B89074]">
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
      className="relative min-h-screen overflow-hidden bg-[#591902] pt-24 min-[540px]:pt-28 lg:pt-32"
    >
      <div className="relative z-10 flex min-h-[80svh] flex-col justify-between">
        <div className="w-full px-6 pb-4 min-[540px]:px-10 min-[540px]:pb-6 lg:px-20 lg:pb-8 xl:px-[100px]">
          <div className="flex flex-col pt-4 min-[540px]:pt-6 lg:pt-10">
            <div className="flex items-center">
              <div className="flex w-full max-w-[760px] gap-4 min-[540px]:gap-6">
                <div className="anim-element slide-from-bottom mt-1 hidden w-px shrink-0 self-stretch bg-[#CDB17E]/70 min-[540px]:block" />

                <div className="py-4">
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
            </div>

            <div className="mt-6 flex w-full justify-start lg:mt-8 lg:justify-end">
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

        <div className="anim-element slide-from-bottom relative z-10 border-t border-[#CDB17E]/10 bg-[#6A1F06]/60 px-6 py-3 backdrop-blur-sm min-[540px]:px-10 min-[540px]:py-4 lg:px-20 xl:px-[100px]">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[#CDB17E] lg:justify-between">
            {HERO_TAGS.map((tag, index) => (
              <div key={tag} className="flex items-center gap-4 lg:gap-7">
                <span className="text-[13px] uppercase leading-[1.5] tracking-[0.02em] min-[540px]:text-[16px]">
                  {tag}
                </span>
                {index < HERO_TAGS.length - 1 && (
                  <span className="hidden lg:flex lg:items-center lg:justify-center lg:self-center text-[#CDB17E]/40 leading-none">
                    .
                  </span>
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
    <main ref={pageRef} className="w-full bg-[#591902]">
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

      <NeedToKnowSection />

      <FinalCtaSection />
    </main>
  )
}

export default HowItWorkPage
