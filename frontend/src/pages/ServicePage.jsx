import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import serviceImg1 from '../assets/images/citroen.png'
import serviceImg2 from '../assets/images/danube.jpg'
import serviceImg3 from '../assets/images/guns.jpg'
import serviceImg4 from '../assets/images/usha.jpg'
import serviceImg5 from '../assets/images/moksha_portrait.jpg'

const FLOW_STEPS = [
  { id: 1, label: 'Event' },
  { id: 2, label: 'Service' },
  { id: 3, label: ' ' },
]

const SERVICE_OPTIONS = [
  {
    id: 'decor',
    title: 'Decor',
    description: 'Thoughtful visual styling designed around your event mood and format.',
    image: serviceImg1,
  },
  {
    id: 'rental-furniture',
    title: 'Rental Furniture',
    description: 'Flexible seating, tables, lounges, and setup pieces for smooth hosting.',
    image: serviceImg2,
  },
  {
    id: 'catering',
    title: 'Catering',
    description: 'Curated food formats and service planning for gatherings of every scale.',
    image: serviceImg3,
  },
  {
    id: 'bartending',
    title: 'Bartending',
    description: 'Bar setup, staff, and beverage service designed for seamless guest flow.',
    image: serviceImg4,
  },
  {
    id: 'sheesha',
    title: 'Sheesha',
    description: 'Relaxed lounge experiences with managed setup and guest-ready presentation.',
    image: serviceImg5,
  },
]

const SERVICE_ROUTE_MAP = {
  decor: '/event-flow/decor-theme',
  'rental-furniture': '/packages/rental-furniture',
  catering: '/event-flow/catering-levels',
  bartending: '/event-flow/bartending-levels',
  sheesha: '/packages/sheesha',
}

function ServiceCard({ categoryId, eventId, service }) {
  return (
    <Link
      to={`${SERVICE_ROUTE_MAP[service.id] ?? '/package-listing'}?category=${categoryId}&event=${eventId}&service=${service.id}`}
      className="group flex h-full max-h-[340px] w-full max-w-[235px] min-w-0 flex-col justify-end overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-[340px]"
    >
      {/* <div className="relative mb-2 min-h-0 flex-1 overflow-hidden rounded-[12px] bg-[#F4EEE6]">
        <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
      </div> */}
      <div className="flex h-[88px] flex-col rounded-[10px] bg-[#7E8061] px-3 py-3 text-white md:h-[96px] md:px-4 md:py-3.5">
        <h2 className="text-[15px] font-medium leading-[1.2] text-white md:text-[16px]">
          {service.title}
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
  const categoryId = searchParams.get('category')?.toLowerCase() ?? ''
  const eventId = searchParams.get('event')?.toLowerCase() ?? ''

  const backTo = useMemo(() => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (eventId) params.set('event', eventId)
    return `/event-flow/category${params.toString() ? `?${params.toString()}` : ''}`
  }, [categoryId, eventId])

  if (!categoryId || !eventId) {
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
      <div className="flex h-full w-full items-center">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5 md:gap-4">
          {SERVICE_OPTIONS.map(service => (
            <ServiceCard
              key={service.id}
              categoryId={categoryId}
              eventId={eventId}
              service={service}
            />
          ))}
        </div>
      </div>
    </EventFlowLayout>
  )
}
