import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScallopBulbCurtain from '../components/common/ScallopBulbCurtain'
import { useHowItWorkPage } from '../hooks/useCmsPages'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import { preventWidow, stripMojibake } from '../lib/textFormat'

const FAQ_URL_SPLIT_REGEX = /(https?:\/\/[^\s<]+)/g

function renderFaqAnswerWithLinks(answer) {
  const text = String(answer ?? '')
  const parts = text.split(FAQ_URL_SPLIT_REGEX)

  return parts.map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return part

    const href = part.replace(/[),.;!?]+$/g, '')
    const trailing = part.slice(href.length)

    try {
      const url = new URL(href)
      const host = url.hostname.replace(/^www\./i, '').toLowerCase()
      const isElewenHost = host === 'elewen.co.in' || host.endsWith('.elewen.co.in')

      if (isElewenHost) {
        const to = `${url.pathname}${url.search}${url.hash}` || '/'
        return (
          <span key={`${href}-${index}`}>
            <Link to={to} className="underline underline-offset-2 hover:text-[#6C2205]">
              {href}
            </Link>
            {trailing}
          </span>
        )
      }
    } catch {
      // Fall through to external anchor.
    }

    return (
      <span key={`${href}-${index}`}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-[#6C2205]"
        >
          {href}
        </a>
        {trailing}
      </span>
    )
  })
}

const HERO_TAGS = [
  'BIRTHDAYS',
  'ANNIVERSARIES',
  'HOUSE PARTIES',
  'BABY SHOWERS',
  'CORPORATE',
  'RELIGIOUS',
]

// const ORBS = [
//   {
//     className:
//       'anim-element slide-from-left absolute -left-[18%] top-[17%] h-[360px] w-[360px] rounded-full bg-[#BE350440] min-[540px]:-left-[10%] min-[540px]:top-[10%] min-[540px]:h-[660px] min-[540px]:w-[660px]',
//   },
//   {
//     className:
//       'anim-element slide-from-right absolute right-[18%] top-[14%] h-[160px] w-[160px] rounded-full bg-[#CDB17E26] min-[540px]:right-[20%] min-[540px]:top-[14%] min-[540px]:h-[280px] min-[540px]:w-[280px]',
//   },
//   {
//     className:
//       'anim-element slide-from-right absolute right-[-8%] top-[-8%] h-[220px] w-[220px] rounded-full bg-[#CDB17E26] min-[540px]:h-[430px] min-[540px]:w-[430px]',
//   },
//   {
//     className:
//       'anim-element slide-from-right absolute -right-[18%] bottom-[12%] h-[300px] w-[300px] rounded-full bg-[#CDB17E26] min-[540px]:-right-[10%] min-[540px]:bottom-[4%] min-[540px]:h-[560px] min-[540px]:w-[560px]',
//   },
// ]

const IDEA_TO_CELEBRATION_STEPS = [
  {
    number: '1',
    title: 'Choose Your Event & Services',
    description:
      'Browse by event type - birthdays, anniversaries, house parties, and more. Select from curated Decor, catering, and add-on services.',
  },
  {
    number: '2',
    title: 'Pick a Package & Customize',
    description:
      'Choose a package that suits your scale and vision. Add, swap, or adjust elements to make it truly yours - no package is one-size-fits-all.',
  },
  {
    number: '3',
    title: 'Review & Pay Advance',
    description:
      'Review your full order summary - pricing, timelines, inclusions. Confirm with a small advance payment to lock in your date and package.',
  },
  {
    number: '4',
    title: 'Elewen Reviews & Confirms',
    description:
      'Our team reviews your booking, coordinates with vendors, and sends confirmation within 24 hours so you stay in the loop.',
  },
  {
    number: '5',
    title: 'Event Execution',
    description:
      'Sit back and celebrate. Our in-house planners and vetted vendors execute everything on the day - from setup to teardown.',
  },
]

const IDEA_TO_CELEBRATION_CARDS = [
  {
    stepIndex: 0,
    left: '29.5%',
    top: '1.5%',
    width: '34%',
    maxWidth: '380px',
  },
  {
    stepIndex: 1,
    left: '12.5%',
    top: '23.5%',
    width: '34%',
    maxWidth: '360px',
  },
  {
    stepIndex: 2,
    left: '37.5%',
    top: '46.5%',
    width: '33%',
    maxWidth: '345px',
  },
  {
    stepIndex: 3,
    left: '18%',
    top: '70.5%',
    width: '34%',
    maxWidth: '360px',
  },
  {
    stepIndex: 4,
    left: '0%',
    top: '92%',
    width: '31%',
    maxWidth: '320px',
  },
]

const IDEA_TO_CELEBRATION_CONNECTORS = {
  horizontals: [
    { top: '19.5%', left: '0%', right: '8%' },
    { top: '41.5%', left: '8%', right: '0%', inverse: true },
    { top: '66.5%', left: '0%', right: '10%' },
    { top: '89.5%', left: '0%', right: '12%' },
  ],
  verticals: [
    { left: '28.5%', top: '4%', height: '15.5%' },
    { left: '9%', top: '24%', height: '17.5%' },
    { left: '56.5%', bottom: '66.5%', height: '14%', inverse: true },
    { left: '78.5%', top: '41.7%', height: '10%' },
    { left: '36.5%', top: '46%', height: '20.5%' },
    { left: '15.5%', bottom: '14.5%', height: '19%', inverse: true },
    { left: '60%', bottom: '21.5%', height: '12%', inverse: true },
    { left: '48.5%', bottom: '0%', height: '10.5%', inverse: true },
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

// const PLANNER_TAGS = ['Dedicated Planner', 'Pre-event Briefing', 'Day-of Coordination']
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

const RevealLine = ({
  children,
  className = '',
  textClassName = '',
  delay,
  overflowVisible = false,
}) => (
  <span
    className={`reveal-wrapper block ${overflowVisible ? 'reveal-wrapper--overflow-visible' : ''} ${className}`.trim()}
  >
    <span
      className={`reveal-text ${textClassName}`.trim()}
      style={delay ? { animationDelay: delay } : undefined}
    >
      {children}
    </span>
  </span>
)

const IdeaToCelebrationSection = ({ section }) => {
  const steps = (Array.isArray(section?.steps) ? section.steps : IDEA_TO_CELEBRATION_STEPS).map(
    step => ({
      ...step,
      title: preventWidow(stripMojibake(step.title)),
      description: preventWidow(stripMojibake(step.description)),
    })
  )

  return (
    <section className="relative flex w-full justify-center overflow-hidden bg-[#E7E0DA] px-6 py-16 min-[540px]:px-10 min-[540px]:py-20 lg:px-20 xl:px-[100px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
        <div className="absolute left-[-10%] top-[-6%] h-[260px] w-[420px] rotate-[-38deg] rounded-[48px] border border-[#D9C9BC]/45" />
        <div className="absolute right-[-8%] top-[8%] h-[320px] w-[480px] rotate-[-38deg] rounded-[56px] border border-[#D9C9BC]/35" />
        <div className="absolute left-[18%] top-[28%] h-[520px] w-[180px] rotate-[-38deg] rounded-[40px] bg-white/10" />
        <div className="absolute left-[45%] top-[26%] h-[520px] w-[180px] rotate-[-38deg] rounded-[40px] bg-white/10" />
      </div>

      <div className="relative flex w-full max-w-[1180px] flex-col items-center pb-5">
        <div className="flex w-full max-w-[760px] flex-col items-center text-center reveal-on-scroll">
          <h2
            className="text-[40px] leading-[1] text-[#7A341C] min-[540px]:text-[52px] lg:text-[61px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            <RevealLine>{section?.heading ?? 'From Idea to Celebration.'}</RevealLine>
          </h2>
          <p className="mx-auto mt-5 max-w-[760px] text-[14px] leading-[1.6] text-[#9A7A67] min-[540px]:text-[15px] lg:text-[16px]">
            <RevealLine>{section?.description}</RevealLine>
          </p>
        </div>

        <div className="relative mt-14 flex w-full max-w-[980px] flex-col gap-8 md:gap-12">
          <div className="flex flex-col gap-8 md:hidden">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex pl-8 card-reveal"
                style={{ '--delay': `${index * 0.08}s` }}
              >
                <div
                  className="draw-line draw-line-y absolute bottom-0 left-0 top-0 w-px bg-[#D8B29B]"
                  style={{ '--draw-delay': `${0.08 + index * 0.08}s` }}
                />
                <div
                  className="draw-line draw-line-x absolute left-0 top-5 h-px w-6 bg-[#D8B29B]"
                  style={{ '--draw-delay': `${0.14 + index * 0.08}s` }}
                />
                <StepCard step={step} />
              </div>
            ))}
          </div>

          <div className="hidden md:block w-full mb-10">
            <div className="relative mx-auto h-[1360px] w-full max-w-[1120px] lg:h-[1240px] xl:h-[1360px]">
              {IDEA_TO_CELEBRATION_CONNECTORS.horizontals.map((line, index) => (
                <div
                  key={`h-line-${index}`}
                  className={`draw-line draw-line-x absolute h-0 border-t-[1.5px] border-transparent ${line.inverse ? 'draw-line-from-end' : ''}`}
                  style={{
                    '--draw-delay': `${0.1 + index * 0.12}s`,
                    top: line.top,
                    left: line.left,
                    right: line.right,
                    borderImage:
                      index === 1
                        ? 'linear-gradient(90deg, #E7E0DA 0%, #727355 100%) 1'
                        : line.inverse
                          ? 'linear-gradient(90deg, #E7E0DA 0%, #C73E0C 100%) 1'
                          : index % 2 === 0
                            ? 'linear-gradient(90deg, #C73E0C 0%, #E7E0DA 100%) 1'
                            : 'linear-gradient(270deg, #C73E0C 0%, #E7E0DA 100%) 1',
                  }}
                />
              ))}

              {IDEA_TO_CELEBRATION_CONNECTORS.verticals.map((line, index) => (
                <div
                  key={`v-line-${index}`}
                  className={`draw-line draw-line-y absolute w-0 border-l-[1.5px] border-transparent ${line.inverse ? 'draw-line-from-end' : ''}`}
                  style={{
                    '--draw-delay': `${0.22 + index * 0.08}s`,
                    left: line.left,
                    top: line.top,
                    bottom: line.bottom,
                    height: line.height,
                    borderImage: line.inverse
                      ? 'linear-gradient(180deg, #C73E0C 0%, #E7E0DA 100%) 1'
                      : 'linear-gradient(180deg, #E7E0DA 0%, #C73E0C 100%) 1',
                  }}
                />
              ))}

              {IDEA_TO_CELEBRATION_CARDS.map(card => {
                const step = steps[card.stepIndex]
                if (!step) return null
                return (
                  <div
                    key={step.number}
                    className="absolute card-reveal"
                    style={{
                      '--delay': `${card.stepIndex * 0.08}s`,
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

const EventDashboardSection = ({ section }) => {
  const highlights = Array.isArray(section?.highlights)
    ? section.highlights
    : [
        'Zero missed updates',
        'Vendor coordination handled',
        'Dedicated event planner assigned',
        'Full timeline visibility',
      ]
  const features = Array.isArray(section?.features) ? section.features : DASHBOARD_FEATURES

  return (
    <section className="relative flex w-full justify-center overflow-hidden bg-[#FAFAFA] px-6 py-16 pt-0 min-[540px]:px-10 min-[540px]:py-20 lg:px-20 xl:px-[100px] -mt-px md:mt-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] bg-[#E9E2DA] md:hidden" />
      <ScallopBulbCurtain
        count={10}
        mobileCount={6}
        outerColor="#6C2205"
        innerColor="#E9E2DA"
        wireColorClass="bg-[#6C2205]/40"
        fitToWidth
        className="absolute inset-x-0 md:top-0 -top-px flex w-full pointer-events-none z-10"
      />

      <div className="relative flex w-full max-w-[1180px] flex-col gap-3 pt-[132px] lg:flex-row lg:items-center lg:gap-6 lg:pt-[170px]">
        <div className="flex w-full flex-col lg:max-w-[496px] reveal-on-scroll pl-3 md:pl-0">
          <h2
            className="max-w-[420px] text-[48px] leading-[0.95] text-[#6C2205] min-[540px]:text-[61px] lg:text-[61px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            <RevealLine>{section?.heading_line_1 ?? 'Your Dashboard.'}</RevealLine>
            <RevealLine delay="0.06s">
              {section?.heading_line_2 ?? 'Everything in One Place.'}
            </RevealLine>
          </h2>

          <p className="mt-8 max-w-[396px] text-[12px] leading-[1.5] text-[#B29078] min-[540px]:text-[16px]">
            <RevealLine delay="0.12s">{section?.description}</RevealLine>
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {highlights.map((item, index) => (
              <div
                key={item}
                className="anim-element slide-from-left flex items-center gap-3"
                style={{ '--delay': `${0.12 + index * 0.06}s` }}
              >
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
                <span className="text-[10px] leading-[1.4] text-[#4F4F4F] min-[540px]:text-[14px]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-1 mt-5 md:mt-0">
          <div
            className="card-reveal flex w-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(117,72,33,0.12)]"
            style={{ '--delay': '0.14s' }}
          >
            <div className="flex min-h-[72px] items-center rounded-full bg-[#3E4E22] px-7 py-5">
              <span className="text-[12px] font-medium leading-[1.3] text-[#FAFAFA] min-[540px]:text-[16px]">
                {section?.dashboard_title ?? 'My Event Dashboard'}
              </span>
            </div>

            <div className="flex w-full flex-col gap-3 p-4 min-[540px]:p-5 lg:grid lg:grid-cols-2 lg:gap-4 lg:p-7">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex min-h-[170px] flex-col rounded-[14px] bg-[#F4EEE6] p-5 min-[540px]:min-h-[182px] min-[540px]:p-6"
                >
                  <div className="h-9 w-9 text-[#7A341C]">{DASHBOARD_FEATURES[index]?.icon}</div>
                  <h3
                    className="mt-5 text-[12px] min-[540px]:text-[16px] font-medium leading-[1.15] text-[#7A341C]"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-[250px] text-[10px] leading-[1.5] text-[#C0A48E] min-[540px]:text-[14px]">
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

const NeedToKnowSection = ({ section }) => {
  const [openIndex, setOpenIndex] = useState(0)
  const faqs = Array.isArray(section?.faqs) ? section.faqs : HOW_IT_WORK_FAQS

  return (
    <section className="flex w-full justify-center bg-[#FAFAFA] px-6 py-16 min-[540px]:px-10 min-[540px]:py-20 lg:px-20 xl:px-[100px]">
      <div className="flex w-full max-w-[1180px] flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-3">
        <div className="flex w-full max-w-[496px] flex-col reveal-on-scroll pl-3 md:pl-0">
          <h2
            className="text-[30px] leading-[1.08] text-[#6C2205] min-[540px]:text-[41px] lg:text-[61px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            <RevealLine>{section?.heading_line_1 ?? 'Everything You'}</RevealLine>
            <RevealLine delay="0.06s">{section?.heading_line_2 ?? 'Need to Know.'}</RevealLine>
          </h2>

          <p className="mt-8 max-w-[280px] text-[18px] leading-[1.45] text-[#A78974]">
            <RevealLine delay="0.12s">{section?.description}</RevealLine>
          </p>
        </div>

        <div className="flex w-full flex-1 mt-5 md:mt-0">
          <div
            className="card-reveal flex w-full flex-col rounded-[24px] bg-white px-5 shadow-[0_24px_70px_rgba(117,72,33,0.12)] min-[540px]:px-6 lg:px-7"
            style={{ '--delay': '0.12s' }}
          >
            {faqs.map((faq, index) => {
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
                        className="text-[18px] leading-[1.08] text-[#6C2205] min-[540px]:text-[27px]"
                        style={{ fontFamily: "'Malgin', serif" }}
                      >
                        {faq.question}
                      </h3>
                    </div>

                    <span
                      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-[#6C2205] transition-transform duration-300 ease-out"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
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

                  <div
                    className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.32,0,0.15,1)]"
                    style={{
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      opacity: isOpen ? 1 : 0.55,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[760px] pb-5 text-[12px] leading-[1.5] text-[#B29078] min-[540px]:pb-6 min-[540px]:text-[16px]">
                        {renderFaqAnswerWithLinks(faq.answer)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

const FinalCtaSection = ({ section }) => {
  return (
    <section className="relative flex w-full justify-center overflow-hidden bg-[#591902] px-6 pt-14 pb-4 min-[540px]:px-10 min-[540px]:pt-16 min-[540px]:pb-6 lg:px-20 xl:px-[100px]">
      <div className="relative flex w-full max-w-[980px] flex-col items-center text-center reveal-on-scroll">
        <div className="flex flex-col items-center">
          <div className="anim-element slide-from-bottom h-px w-20 bg-[#D4BA8E]" />
          <span className="mt-4 text-[12px] uppercase leading-[1.3] tracking-[0.04em] text-[#D4BA8E]">
            <RevealLine delay="0.05s">{section?.eyebrow ?? 'READY WHEN YOU ARE'}</RevealLine>
          </span>
        </div>

        <h2
          className="mt-5 max-w-[980px] text-[30px] leading-[0.96] text-white min-[540px]:text-[41px] lg:text-[61px]"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          <RevealLine delay="0.08s">
            {section?.heading_line_1 ?? 'Still confused, excited, or'}
          </RevealLine>
          <RevealLine delay="0.14s">
            {section?.heading_line_2 ?? 'somewhere in between?'}
          </RevealLine>
        </h2>

        <p className="mt-6 max-w-[760px] text-[12px] leading-[1.55] text-[#D6B8A7] min-[540px]:text-[16px]">
          <RevealLine delay="0.18s">{section?.description}</RevealLine>
        </p>

        <div
          className="anim-element slide-from-bottom mt-8 flex w-full flex-col items-center justify-center gap-4 min-[540px]:flex-row"
          style={{ '--delay': '0.24s' }}
        >
          <Link
            to={section?.primary_cta_url ?? '/login'}
            className="group flex min-h-[56px] w-full max-w-[280px] items-center justify-between rounded-full bg-[#D4BA8E] pl-8 pr-2 text-white transition-colors hover:bg-[#c9ad7f]"
          >
            <span className="text-[16px] font-medium leading-[1.3]">
              {section?.primary_cta_label ?? 'Start Booking'}
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
              <svg
                className="h-[20px] w-[20px] text-[#CDB17E] transition-transform duration-300 group-hover:rotate-45"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5.83203 5.83301H14.1654M14.1654 5.83301V14.1663M14.1654 5.83301L5.83203 14.1663"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>

          <Link
            to={section?.secondary_cta_url ?? '/book-consultation'}
            className="flex min-h-[56px] w-full max-w-[280px] items-center justify-center rounded-full bg-white px-8 text-[16px] font-medium leading-[1.3] text-[#C89F5D] transition-colors "
          >
            {section?.secondary_cta_label ?? 'Book a Consultation'}
          </Link>
        </div>

        <div
          className="anim-element slide-from-bottom mt-15 flex items-center justify-center gap-3 text-center text-[12px] leading-[1.4] text-[#B89074]"
          style={{ '--delay': '0.3s' }}
        >
          <span className="text-[#C89F5D]">✦</span>
          <span>
            {section?.footer_note ?? 'Trusted by 500+ hosts across Jaipur, Delhi & Mumbai'}
          </span>
          <span className="text-[#C89F5D]">✦</span>
        </div>
      </div>
    </section>
  )
}

const StepCard = ({ step, align = 'left' }) => {
  return (
    <article
      className={`max-w-[290px] mx-auto md:max-w-[360px] ${
        align === 'right' ? 'md:mr-auto' : 'md:ml-auto'
      }`}
    >
      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#CDA25C] text-[16px] font-semibold leading-none text-[#7A341C]">
        {step.number}
      </div>
      <h3
        className="mt-4 text-[26px] leading-[1.08] text-[#D05D3C] min-[540px]:text-[29px] text-pretty"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        {step.title}
      </h3>
      <p className="mt-3 max-w-full text-[14px] leading-[1.55] text-[#9A7A67] min-[540px]:text-[15px] text-pretty">
        {step.description}
      </p>
    </article>
  )
}

const HowItWorkHeroSection = ({ section }) => {
  const heroTags = Array.isArray(section?.hero_tags) ? section.hero_tags : HERO_TAGS

  return (
    <section
      data-nav-surface="transparent"
      className="relative flex h-[100dvh] h-[var(--door-viewport-height)] w-full flex-col overflow-hidden bg-[#591902] pt-[5.5rem] min-[540px]:pt-[clamp(5rem,12vh,105px)] lg:pt-[clamp(5.5rem,14vh,120px)]"
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col min-[540px]:justify-between">
        <div className="flex flex-1 flex-col justify-center w-full px-5 pb-2 min-[540px]:flex-none min-[540px]:justify-start min-[540px]:px-10 min-[540px]:pb-4 md:px-20 lg:pb-6 xl:px-[100px]">
          <div className="flex w-full flex-col items-start pt-0 min-[540px]:pt-6 lg:pt-10 min-[540px]:block min-[540px]:p-0">
            <div className="flex items-center">
              <div className="flex w-full max-w-[760px] gap-4 min-[540px]:gap-6">
                <div className="anim-element slide-from-bottom mt-1 hidden w-px shrink-0 self-stretch bg-[#CDB17E]/70 min-[540px]:block" />

                <div className="py-4">
                  <span className="reveal-wrapper block">
                    <span className="reveal-text w-full max-w-[542px] text-[12px] uppercase leading-[1.5] tracking-[0] text-[#CDB17E]">
                      {section?.eyebrow ?? 'PLANNING MADE SIMPLE'}
                    </span>
                  </span>

                  <h1
                    className="mt-3 w-full max-w-[542px] text-white"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    <span className="reveal-wrapper block">
                      <span className="reveal-text text-[clamp(2rem,10vw,3rem)] leading-[1] min-[540px]:text-[64px] lg:text-[80px]">
                        {section?.heading ?? 'How It Works'}
                      </span>
                    </span>
                  </h1>

                  <p className="mt-[clamp(0.75rem,2.5vh,1.25rem)] w-full max-w-[253px] text-[16px] leading-[1.5] text-white/60 min-[540px]:mt-[clamp(1rem,3vh,1.5rem)]">
                    <span className="reveal-wrapper block">
                      <span className="reveal-text" style={{ animationDelay: '0.08s' }}>
                        {section?.description_line_1 ?? 'From browsing to celebration —'}
                      </span>
                    </span>
                    <span className="reveal-wrapper block">
                      <span className="reveal-text" style={{ animationDelay: '0.14s' }}>
                        {section?.description_line_2 ?? 'a few simple steps is all it takes.'}
                      </span>
                    </span>
                  </p>

                  <span className="mt-[clamp(1rem,3vh,2rem)] inline-block reveal-wrapper reveal-wrapper--overflow-visible min-[540px]:mt-[clamp(1.25rem,4vh,2.5rem)]">
                    <span className="reveal-text" style={{ animationDelay: '0.2s' }}>
                      <Link
                        to={section?.cta_url ?? '/book-consultation'}
                        className="group flex w-fit items-center rounded-full bg-[#FFFFFF] pl-6 pr-1.5 py-1.5 transition-colors hover:bg-[#FFFFFF]"
                      >
                        <span className="mr-5 text-[15px] font-medium text-[#CDB17E]">
                          {section?.cta_label ?? 'Plan with Elewen'}
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CDB17E]  shadow-sm">
                          <svg
                            className="h-[20px] w-[20px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5.83203 5.83301H14.1654M14.1654 5.83301V14.1663M14.1654 5.83301L5.83203 14.1663"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </Link>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-[clamp(0.5rem,2vh,1rem)] flex w-full justify-start min-[540px]:mt-[clamp(0.75rem,3vh,1.5rem)] md:mt-[clamp(1rem,4vh,3.75rem)] md:justify-end">
              <p
                className="w-full max-w-[469px] text-left text-[clamp(0.875rem,4vw,1rem)] leading-[1.2] whitespace-normal text-[#C08E72] min-[540px]:text-[22px] min-[540px]:whitespace-nowrap md:text-right md:text-[27px]"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                <span className="reveal-wrapper block md:text-right">
                  <span
                    className="reveal-text reveal-text-x-right inline-block"
                    style={{ animationDelay: '0.12s' }}
                  >
                    {section?.bottom_note ?? '- no chaos, no coordination stress'}
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="anim-element slide-from-bottom is-visible relative z-10 bg-[#6A1F06]/60 px-5 py-2 backdrop-blur-sm min-[540px]:px-10 min-[540px]:py-2.5 md:px-20 xl:px-[100px]">
          <div className="flex flex-nowrap items-center justify-center min-[540px]:justify-start text-[#CDB17E] w-full gap-x-[clamp(0.25rem,1vw,0.75rem)] md:gap-x-[clamp(0.5rem,1.5vw,3rem)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {heroTags.map((tag, index) => (
              <div
                key={tag}
                className="flex shrink-0 items-center h-7 min-[540px]:h-8 whitespace-nowrap gap-[clamp(0.25rem,0.8vw,1.5rem)]"
              >
                <span className="text-[11px] uppercase leading-none tracking-[0.02em] min-[540px]:text-[clamp(11px,1.11vw,16px)]">
                  {tag}
                </span>
                {index < heroTags.length - 1 && (
                  <svg
                    width="4"
                    height="4"
                    viewBox="0 0 4 4"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0"
                  >
                    <circle cx="2" cy="2" r="2" fill="#CDB17E" fillOpacity="0.5" />
                  </svg>
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
  const cmsQuery = useHowItWorkPage()
  const { data: cms = {} } = cmsQuery
  const isStrapiLoading = useStrapiPageLoading(cmsQuery)

  useEffect(() => {
    if (isStrapiLoading) return

    const page = pageRef.current
    if (!page) return

    let observer
    const rafIds = []

    const targets = Array.from(
      page.querySelectorAll(
        '.reveal-on-scroll, .reveal-wrapper, .anim-element, .card-reveal, .draw-line'
      )
    ).filter(el => {
      if (el.classList.contains('is-visible')) return false
      if (el.classList.contains('reveal-wrapper') && el.closest('.reveal-on-scroll')) return false
      return true
    })

    const revealTarget = el => {
      if (
        el.classList.contains('anim-element') ||
        el.classList.contains('card-reveal') ||
        el.classList.contains('draw-line')
      ) {
        el.classList.add('is-visible')
      }

      if (el.classList.contains('reveal-wrapper') || el.classList.contains('reveal-on-scroll')) {
        Array.from(el.querySelectorAll('.reveal-text')).forEach((text, index) => {
          if (!text.style.animationDelay) {
            text.style.animationDelay = `${index * 0.05}s`
          }
          text.classList.add('is-visible')
        })
      }

      observer?.unobserve(el)
    }

    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          revealTarget(entry.target)
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -2% 0px' }
    )

    targets.forEach(el => {
      const rect = el.getBoundingClientRect()
      const isAlreadyInView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0
      if (isAlreadyInView) {
        rafIds.push(window.requestAnimationFrame(() => revealTarget(el)))
        return
      }
      observer.observe(el)
    })

    return () => {
      rafIds.forEach(id => window.cancelAnimationFrame(id))
      observer?.disconnect()
    }
  }, [isStrapiLoading])

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  return (
    <main ref={pageRef} className="how-it-work-page w-full bg-[#591902]">
      <HowItWorkHeroSection section={cms.hero} />

      <IdeaToCelebrationSection section={cms.idea_to_celebration} />

      <EventDashboardSection section={cms.dashboard} />

      <section className="flex w-full justify-center bg-[#364022] px-6 py-5 min-[540px]:px-10 min-[540px]:py-6 lg:px-20 xl:px-[100px]">
        <div className="flex w-full max-w-[1180px] items-center justify-center">
          <p
            className="text-center text-[20px] leading-[1.2] text-[#D4BA8E] min-[540px]:text-[23px] lg:text-[27px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            <RevealLine>{cms.banner?.text ?? 'Plan with clarity. Celebrate with ease.'}</RevealLine>
          </p>
        </div>
      </section>

      <NeedToKnowSection section={cms.faq} />

      <FinalCtaSection section={cms.final_cta} />
    </main>
  )
}

export default HowItWorkPage
