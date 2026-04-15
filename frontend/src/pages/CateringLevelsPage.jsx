import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { useBudgetLevelOptions } from '../hooks/useEventTypes'

const FLOW_STEPS = [
  { id: 1, label: 'Category' },
  { id: 2, label: 'Event' },
  { id: 3, label: 'Service' },
  { id: 4, label: 'Levels' },
  { id: 5, label: 'Package' },
]

function LevelCard({ categoryId, eventId, eventNumericId, serviceSlug, serviceId, level }) {
  const params = new URLSearchParams()
  params.set('category', categoryId)
  params.set('event', eventId)
  if (eventNumericId) params.set('eventId', eventNumericId)
  params.set('service', serviceSlug)
  if (serviceId) params.set('serviceId', serviceId)
  params.set('level', level.slug)

  return (
    <Link
      to={`/packages/${serviceSlug}?${params.toString()}`}
      className="group flex min-h-[160px] flex-1 basis-[240px] flex-col rounded-[12px] border border-[#E2CDB8] bg-white px-4 py-4 text-[#2D2D2D] transition-transform hover:-translate-y-1 hover:border-[#591902] hover:bg-[#591902] hover:text-white md:min-h-[180px] md:px-5 md:py-5"
    >
      <h2
        className="text-[20px] leading-[1] md:text-[28px]"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        {level.label}
      </h2>
      <p className="mt-4 max-w-[280px] text-[14px] leading-[1.45] text-[#8F8B86] transition-colors group-hover:text-white/70 md:text-[16px]">
        {level.description}
      </p>
      <span className="mt-auto pt-5 text-[10px] font-medium text-[#591902] transition-colors group-hover:text-white md:text-[12px]">
        {level.price || 'View packages'}
      </span>
    </Link>
  )
}

export default function CateringLevelsPage() {
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('category')?.toLowerCase() ?? ''
  const eventId = searchParams.get('event')?.toLowerCase() ?? ''
  const eventNumericId = searchParams.get('eventId') ?? ''
  const serviceSlug = searchParams.get('service')?.toLowerCase() ?? 'catering'
  const serviceId = searchParams.get('serviceId') ?? ''

  const { data: levels = [] } = useBudgetLevelOptions(serviceId)

  const backTo = useMemo(() => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (eventId) params.set('event', eventId)
    if (eventNumericId) params.set('eventId', eventNumericId)
    return `/event-flow/service?${params.toString()}`
  }, [categoryId, eventId, eventNumericId])

  if (!categoryId || !eventId) {
    return <Navigate to="/event-flow/category" replace />
  }

  return (
    <EventFlowLayout
      title="Choose your package level"
      subtitle="Select the level that best matches your event scale and experience."
      currentStep={4}
      steps={FLOW_STEPS}
      showBackButton
      backTo={backTo}
    >
      <div className="flex h-[50svh] w-full items-start">
        <div className="flex w-full flex-col gap-4 md:flex-row md:gap-4">
          {levels.map(level => (
            <LevelCard
              key={level.id ?? level.slug}
              categoryId={categoryId}
              eventId={eventId}
              eventNumericId={eventNumericId}
              serviceSlug={serviceSlug}
              serviceId={serviceId}
              level={level}
            />
          ))}
        </div>
      </div>
    </EventFlowLayout>
  )
}
