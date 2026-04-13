import { Link } from 'react-router-dom'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'

const FLOW_STEPS = [
  { id: 1, label: 'Category' },
  { id: 2, label: 'Event' },
  { id: 3, label: 'Service' },
  { id: 4, label: ' ' },
]

const CATEGORY_OPTIONS = [
  {
    id: 'social',
    title: 'Social',
    description: 'Birthdays, parties & more',
    badge: 'S',
  },
  {
    id: 'religious',
    title: 'Religious',
    description: 'Puja, ceremonies & rituals',
    badge: 'R',
  },
  {
    id: 'corporate',
    title: 'Corporate',
    description: 'Conferences, launches & more',
    badge: 'C',
  },
]

function CategoryArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CategoryPage() {
  return (
    <EventFlowLayout
      title="What are you planning?"
      subtitle="Choose your event category to get started"
      currentStep={1}
      steps={FLOW_STEPS}
    >
      <div className="flex h-[40svh] w-full items-start mt-2 md:h-[50svh] lg:h-[60svh]">

        {/* ✅ FIXED WRAPPER (same system as other pages) */}
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          
          <div className="mx-auto w-full max-w-[1280px] px-[clamp(16px,2vw,40px)]">
            
            <div className="flex w-full flex-col gap-4 md:flex-row md:gap-5">
              {CATEGORY_OPTIONS.map(category => (
                <Link
                  key={category.id}
                  to={`/event-flow/event?category=${category.id}`}
                  className="group flex w-full max-w-[325px] max-h-[82px] items-center justify-between rounded-[24px] border border-[#E0D0BE] bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-[#D3B38A] hover:shadow-[0_16px_38px_rgba(111,76,43,0.08)] sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EFE4D2] text-[24px]">
                      <span className="text-[16px] font-semibold text-[#8C4A22]">
                        {category.badge}
                      </span>
                    </span>

                    <div className="min-w-0 w-full max-w-[203px] max-h-[42px] overflow-hidden">
                      <h2 className="text-[16px] leading-[1.1] text-[#2D2D2D]">
                        {category.title}
                      </h2>
                      <p className="mt-1 text-[12px] leading-[1.45] text-[#8F8B86]">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#2D2D2D] transition-transform group-hover:translate-x-1">
                    <CategoryArrow />
                  </span>
                </Link>
              ))}
            </div>

          </div>
        </div>

      </div>
    </EventFlowLayout>
  )
}