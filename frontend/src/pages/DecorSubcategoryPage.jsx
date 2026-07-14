import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { buildServiceSelectionBackTo, SERVICES_FLOW_KEY } from '../lib/serviceFlow'
import { normalizeServiceSlug } from '../lib/packageFilters'
import { preventWidow, stripMojibake } from '../lib/textFormat'

const EVENT_FLOW_STEPS = [
  { id: 1, label: 'Event' },
  { id: 2, label: 'Service' },
  { id: 3, label: 'Decor' },
  { id: 4, label: ' ' },
]

const SERVICES_FLOW_STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Category' },
  { id: 3, label: 'Decor' },
  { id: 4, label: ' ' },
]

const DECOR_SUBCATEGORIES = [
  {
    id: 'decor-setups',
    name: 'Decor Setups',
    description: 'Themes, backdrops, and styled setups for your celebration.',
    serviceSlug: 'decor',
    path: '/event-flow/decor-theme',
  },
  {
    id: 'furniture',
    name: 'Furniture',
    description: 'Seating, tables, lounges, and setup pieces for smooth hosting.',
    serviceSlug: 'rental-furniture',
    path: '/packages/rental-furniture',
  },
]

function SubcategoryCard({ categorySlug, eventSlug, eventId, serviceId, flow, item }) {
  const params = new URLSearchParams()
  if (categorySlug) params.set('category', categorySlug)
  if (eventSlug) params.set('event', eventSlug)
  if (eventId) params.set('eventId', eventId)
  params.set('service', item.serviceSlug)
  if (serviceId && item.serviceSlug === 'decor') params.set('serviceId', serviceId)
  if (flow) params.set('flow', flow)

  return (
    <Link
      to={`${item.path}?${params.toString()}`}
      className="group flex h-[340px] w-full max-w-[280px] min-w-0 flex-col justify-end overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-auto md:max-h-[384px]"
    >
      <div className="relative mb-2 min-h-0 flex-1 overflow-hidden rounded-[12px] bg-[#E7DDCF]">
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-[18px] font-semibold uppercase tracking-[0.08em] text-[#8C4A22] text-pretty">
          {preventWidow(stripMojibake(item.name))}
        </div>
      </div>
      <div className="flex h-[88px] flex-col rounded-[10px] bg-[#7E8061] px-3 py-3 text-white md:px-4 md:py-3.5">
        <h2
          className="text-[15px] font-medium leading-[1.2] text-pretty md:text-[16px]"
          style={{ fontFamily: "'Poppins'" }}
        >
          {preventWidow(stripMojibake(item.name))}
        </h2>
        <p className="mt-1.5 min-h-0 flex-1 overflow-y-auto pr-1 text-[12px] leading-[1.38] text-white/75 text-pretty [&::-webkit-scrollbar]:hidden md:text-[13px]">
          {preventWidow(stripMojibake(item.description))}
        </p>
      </div>
    </Link>
  )
}

export default function DecorSubcategoryPage() {
  const [searchParams] = useSearchParams()
  const flow = searchParams.get('flow') ?? ''
  const isServicesFlow = flow === SERVICES_FLOW_KEY
  const categorySlug = searchParams.get('category')?.toLowerCase() ?? ''
  const eventSlug = searchParams.get('event')?.toLowerCase() ?? ''
  const eventId = searchParams.get('eventId') ?? ''
  const serviceSlug = normalizeServiceSlug(searchParams.get('service') ?? 'decor')
  const serviceId = searchParams.get('serviceId') ?? ''

  const backTo = useMemo(
    () =>
      buildServiceSelectionBackTo({
        categorySlug,
        eventSlug,
        eventId,
        serviceSlug: 'decor',
        serviceId,
        flow,
      }),
    [categorySlug, eventId, eventSlug, flow, serviceId]
  )

  if (!isServicesFlow && (!categorySlug || !eventSlug)) {
    return <Navigate to="/event-flow/category" replace />
  }

  if (serviceSlug && serviceSlug !== 'decor') {
    return <Navigate to={backTo} replace />
  }

  return (
    <EventFlowLayout
      title="Choose a Decor option"
      subtitle="Pick Decor Setups or Furniture to continue"
      currentStep={3}
      steps={isServicesFlow ? SERVICES_FLOW_STEPS : EVENT_FLOW_STEPS}
      showBackButton
      backTo={backTo}
    >
      <div className="flex h-full w-full justify-center">
        <div className="mx-auto flex w-full max-w-[720px] flex-wrap justify-center gap-4 md:gap-6">
          {DECOR_SUBCATEGORIES.map(item => (
            <SubcategoryCard
              key={item.id}
              categorySlug={categorySlug}
              eventSlug={eventSlug}
              eventId={eventId}
              serviceId={serviceId}
              flow={flow}
              item={item}
            />
          ))}
        </div>
      </div>
    </EventFlowLayout>
  )
}
