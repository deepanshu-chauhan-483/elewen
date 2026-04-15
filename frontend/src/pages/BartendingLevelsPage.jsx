import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'

const FLOW_STEPS = [
  { id: 1, label: 'Category' },
  { id: 2, label: 'Service' },
  { id: 3, label: 'Levels' },
  { id: 4, label: 'Package' },
]

const LEVEL_OPTIONS = [
  {
    id: 'level-1',
    title: 'Level 1',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    price: 'Starting ₹15,000',
  },
  {
    id: 'level-2',
    title: 'Level 2',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    price: 'Starting ₹35,000',
    featured: true,
  },
  {
    id: 'level-3',
    title: 'Level 3',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    price: 'Starting ₹70,000',
  },
  {
    id: 'level-4',
    title: 'Level 4',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    price: 'Starting ₹70,000',
  },
]

function LevelCard({ categoryId, eventId, level }) {
  return (
    <Link
      to={`/packages/bartending?category=${categoryId}&event=${eventId}&service=bartending&level=${level.id}`}
      className="group flex min-h-[160px] flex-1 basis-[240px] flex-col rounded-[12px] border border-[#E2CDB8] bg-white px-4 py-4 text-[#2D2D2D] transition-transform hover:-translate-y-1 hover:border-[#591902] hover:bg-[#591902] hover:text-white md:min-h-[180px] md:px-5 md:py-5"
    >
      <h2
        className="text-[20px] leading-[1] md:text-[28px]"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        {level.title}
      </h2>
      <p className="mt-4 max-w-[280px] text-[14px] leading-[1.45] text-[#8F8B86] transition-colors group-hover:text-white/70 md:text-[16px]">
        {level.description}
      </p>
      <span className="mt-auto pt-5 text-[10px] font-medium text-[#591902] transition-colors group-hover:text-white md:text-[12px]">
        {level.price}
      </span>
    </Link>
  )
}

export default function BartendingLevelsPage() {
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('category')?.toLowerCase() ?? ''
  const eventId = searchParams.get('event')?.toLowerCase() ?? ''

  const backTo = useMemo(() => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (eventId) params.set('event', eventId)
    return `/event-flow/service?${params.toString()}`
  }, [categoryId, eventId])

  if (!categoryId || !eventId) {
    return <Navigate to="/event-flow/category" replace />
  }

  return (
    <EventFlowLayout
      title="Choose your package level"
      subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
      currentStep={3}
      steps={FLOW_STEPS}
      showBackButton
      backTo={backTo}
    >
      <div className="flex h-[50svh] w-full items-start">
        <div className="flex w-full flex-col gap-4 md:flex-row md:gap-4">
          {LEVEL_OPTIONS.map(level => (
            <LevelCard key={level.id} categoryId={categoryId} eventId={eventId} level={level} />
          ))}
        </div>
      </div>
    </EventFlowLayout>
  )
}
