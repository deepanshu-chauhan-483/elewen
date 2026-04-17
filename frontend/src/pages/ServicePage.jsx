import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { useServiceOptions } from '../hooks/useEventTypes'

const FLOW_STEPS = [
  { id: 1, label: 'Event' },
  { id: 2, label: 'Service' },
  { id: 3, label: ' ' },
]

const SERVICE_ROUTE_MAP = {
  decor: '/event-flow/decor-theme',
  'rental-furniture': '/packages/rental-furniture',
  catering: '/event-flow/catering-levels',
  bartending: '/event-flow/bartending-levels',
  'bar-tending': '/event-flow/bartending-levels',
  sheesha: '/packages/sheesha',
}

function normalizeServiceSlug(slug) {
  const value = (slug ?? '').toLowerCase()
  if (value === 'bar-tending') return 'bartending'
  return value
}

function ServiceCard({ categorySlug, eventSlug, eventId, service }) {
  const resolvedServiceSlug = normalizeServiceSlug(service.slug)
  const params = new URLSearchParams()
  params.set('category', categorySlug)
  params.set('event', eventSlug)
  if (eventId) params.set('eventId', eventId)
  params.set('service', resolvedServiceSlug)
  if (service.id != null) params.set('serviceId', String(service.id))

  return (
    <Link
      to={`${SERVICE_ROUTE_MAP[service.slug] ?? SERVICE_ROUTE_MAP[resolvedServiceSlug] ?? '/package-listing'}?${params.toString()}`}
      className="group flex h-full max-h-[340px] w-full max-w-[235px] min-w-0 flex-col justify-end overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-[340px]"
    >
      <div className="flex h-[88px] flex-col rounded-[10px] bg-[#7E8061] px-3 py-3 text-white md:h-[96px] md:px-4 md:py-3.5">
        <h2 className="text-[15px] font-medium leading-[1.2] text-white md:text-[16px]">
          {service.name}
        </h2>
        <p className="mt-1.5 min-h-0 flex-1 overflow-y-auto pr-1 text-[12px] leading-[1.38] text-white/75 [&::-webkit-scrollbar]:hidden md:text-[13px]">
          {service.description}
        </p>
      </div>
    </Link>
  )
}

export default function ServicePage() {
  const [searchParams] = useSearchParams()
  const { data: services = [] } = useServiceOptions()

  const categorySlug = searchParams.get('category')?.toLowerCase() ?? ''
  const eventSlug = searchParams.get('event')?.toLowerCase() ?? ''
  const eventId = searchParams.get('eventId') ?? ''

  const backTo = useMemo(() => {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    return `/event-flow/event${params.toString() ? `?${params.toString()}` : ''}`
  }, [categorySlug])

  if (!categorySlug || !eventSlug) {
    return <Navigate to="/event-flow/category" replace />
  }

  return (
    <EventFlowLayout
      title="What do you need help with?"
      subtitle="Select a service - you can add more services later"
      currentStep={2}
      steps={FLOW_STEPS}
      showBackButton
      backTo={backTo}
    >
      <div className="flex h-full w-full justify-center">
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5 md:gap-4">
              {services.map(service => (
                <ServiceCard
                  key={service.id ?? service.slug}
                  categorySlug={categorySlug}
                  eventSlug={eventSlug}
                  eventId={eventId}
                  service={service}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </EventFlowLayout>
  )
}
