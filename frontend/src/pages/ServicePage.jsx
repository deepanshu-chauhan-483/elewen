import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { useFilteredServiceOptions } from '../hooks/useEventTypes'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import {
  buildServiceDestination,
  buildServiceFlowParams,
  SERVICE_PAGE_ALLOWED_SLUGS,
  SERVICES_FLOW_KEY,
} from '../lib/serviceFlow'

const EVENT_FLOW_STEPS = [
  { id: 1, label: 'Event' },
  { id: 2, label: 'Service' },
  { id: 3, label: ' ' },
]

const SERVICES_FLOW_STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Category' },
  { id: 3, label: ' ' },
]

function normalizeServiceSlug(slug) {
  const value = (slug ?? '').toLowerCase()
  if (value === 'bar-tending') return 'bartending'
  return value
}

function ServiceCard({ categorySlug, eventSlug, eventId, service, flow }) {
  const resolvedServiceSlug = normalizeServiceSlug(service.slug)
  const destination =
    flow === SERVICES_FLOW_KEY
      ? `/event-flow/category?${buildServiceFlowParams({
          serviceSlug: resolvedServiceSlug,
          serviceId: service.id != null ? String(service.id) : '',
          flow,
        }).toString()}`
      : buildServiceDestination({
          categorySlug,
          eventSlug,
          eventId,
          serviceSlug: resolvedServiceSlug,
          serviceId: service.id != null ? String(service.id) : '',
        })

  return (
    <Link
      to={destination}
      className="group flex h-[340px] max-w-[235px] md:w-full md:max-h-[384px] md:max-w-[235px] min-w-0 flex-col justify-end overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-auto"
    >
      <div className="relative mb-2 min-h-0 flex-1 overflow-hidden rounded-[12px] bg-[#F4EEE6]">
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#E7DDCF] px-6 text-center text-[18px] font-semibold uppercase tracking-[0.08em] text-[#8C4A22]">
            {service.name}
          </div>
        )}
      </div>
      <div className="flex h-[72px] flex-col rounded-[10px] bg-[#7E8061] px-3 py-3 text-white md:h-[88px] md:px-4 md:py-3.5">
        <h2
          className="flex text-[15px] font-medium leading-[1.2] text-white md:text-[16px]"
          style={{ fontFamily: "'Poppins'" }}
        >
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
  const servicesQuery = useFilteredServiceOptions(SERVICE_PAGE_ALLOWED_SLUGS)
  const { data: services = [] } = servicesQuery
  const isStrapiLoading = useStrapiPageLoading(servicesQuery)

  const flow = searchParams.get('flow') ?? ''
  const isServicesFlow = flow === SERVICES_FLOW_KEY
  const categorySlug = searchParams.get('category')?.toLowerCase() ?? ''
  const eventSlug = searchParams.get('event')?.toLowerCase() ?? ''
  const eventId = searchParams.get('eventId') ?? ''

  const backTo = useMemo(() => {
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    return `/event-flow/category${params.toString() ? `?${params.toString()}` : ''}`
  }, [categorySlug])

  if (!isServicesFlow && (!categorySlug || !eventSlug)) {
    return <Navigate to="/event-flow/category" replace />
  }

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  return (
    <EventFlowLayout
      title="What do you need help with?"
      subtitle="Select a service - you can add more services later"
      currentStep={isServicesFlow ? 1 : 2}
      steps={isServicesFlow ? SERVICES_FLOW_STEPS : EVENT_FLOW_STEPS}
      showBackButton={!isServicesFlow}
      backTo={isServicesFlow ? null : backTo}
    >
      <div className="flex h-full w-full justify-center">
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="grid w-full grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 md:grid-cols-5 md:justify-items-stretch md:gap-4">
              {services.map(service => (
                <ServiceCard
                  key={service.id ?? service.slug}
                  categorySlug={categorySlug}
                  eventSlug={eventSlug}
                  eventId={eventId}
                  service={service}
                  flow={flow}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </EventFlowLayout>
  )
}
