import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import eventImg1 from '../assets/images/IMG_3903.jpg'
import eventImg2 from '../assets/images/IMG_7768.jpg'
import eventImg3 from '../assets/images/IMG_0749.jpg'
import eventImg4 from '../assets/images/IMG_0658.jpg'

const FLOW_STEPS = [
  { id: 1, label: 'Event' },
  { id: 2, label: 'Service' },
  { id: 3, label: ' ' },
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

const CATEGORY_EVENT_MAP = {
  social: [
    {
      id: 'birthday-celebrations',
      title: 'Birthday Celebrations',
      description: 'Curated decor and catering packages designed for effortless hosting.',
      image: eventImg1,
    },
    {
      id: 'anniversary-evenings',
      title: 'Anniversary Evenings',
      description: 'Warm, elegant setups for intimate dinners and milestone moments.',
      image: eventImg2,
    },
    {
      id: 'baby-showers',
      title: 'Baby Showers',
      description: 'Soft styling, coordinated details, and thoughtful guest experiences.',
      image: eventImg3,
    },
    {
      id: 'house-parties',
      title: 'House Parties',
      description: 'Flexible in-home celebrations with food, styling, and entertainment.',
      image: eventImg4,
    },
    {
      id: 'engagement-parties',
      title: 'Engagement Parties',
      description: 'Polished celebrations with decor styling, food curation, and hosting support.',
      image: eventImg1,
    },
    {
      id: 'cocktail-nights',
      title: 'Cocktail Nights',
      description: 'Evening-ready experiences with ambience design, service, and entertainment.',
      image: eventImg2,
    },
    {
      id: 'brunch-gatherings',
      title: 'Brunch Gatherings',
      description: 'Light, stylish daytime setups planned for guests, food, and flow.',
      image: eventImg3,
    },
    {
      id: 'family-dinners',
      title: 'Family Dinners',
      description: 'Thoughtful hosting support for intimate meals and meaningful celebrations.',
      image: eventImg4,
    },
  ],
  religious: [
    {
      id: 'satyanarayan-puja',
      title: 'Satyanarayan Puja',
      description: 'Traditional arrangements with rituals, seating, and coordinated hosting.',
      image: eventImg4,
    },
    {
      id: 'griha-pravesh',
      title: 'Griha Pravesh',
      description: 'Welcome-home ceremonies planned with pooja essentials and guest flow.',
      image: eventImg3,
    },
    {
      id: 'mundan-ceremony',
      title: 'Mundan Ceremony',
      description: 'Family-focused celebrations with decor, ritual support, and meals.',
      image: eventImg2,
    },
    {
      id: 'festival-gatherings',
      title: 'Festival Gatherings',
      description: 'Seasonal pujas and festive events arranged with decor and hospitality.',
      image: eventImg1,
    },
    {
      id: 'jagran-evening',
      title: 'Jagran Evening',
      description: 'Prayer-focused gatherings coordinated with stage, seating, and guest comfort.',
      image: eventImg4,
    },
    {
      id: 'havans',
      title: 'Havans',
      description: 'Sacred setups managed with ritual planning, materials, and venue flow.',
      image: eventImg3,
    },
    {
      id: 'naming-ceremony',
      title: 'Naming Ceremony',
      description: 'Family celebrations with ritual decor, meals, and coordinated hospitality.',
      image: eventImg2,
    },
    {
      id: 'community-bhoj',
      title: 'Community Bhoj',
      description: 'Larger religious meals organized with service teams and guest movement.',
      image: eventImg1,
    },
  ],
  corporate: [
    {
      id: 'product-launch',
      title: 'Product Launch',
      description: 'High-impact launches with stage design, branding, and guest coordination.',
      image: eventImg2,
    },
    {
      id: 'team-offsite',
      title: 'Team Offsite',
      description: 'Well-organized offsites with logistics, food, and activity support.',
      image: eventImg1,
    },
    {
      id: 'awards-night',
      title: 'Awards Night',
      description: 'Polished formal experiences with production, seating, and program flow.',
      image: eventImg4,
    },
    {
      id: 'conference-meet',
      title: 'Conference Meet',
      description: 'Structured event planning for speakers, schedules, and attendee comfort.',
      image: eventImg3,
    },
    {
      id: 'brand-showcase',
      title: 'Brand Showcase',
      description: 'Immersive branded experiences built for launches, demos, and media presence.',
      image: eventImg2,
    },
    {
      id: 'annual-day',
      title: 'Annual Day',
      description: 'End-to-end event planning for teams, awards, entertainment, and staging.',
      image: eventImg1,
    },
    {
      id: 'press-briefing',
      title: 'Press Briefing',
      description: 'Clean, controlled media events with branding, seating, and production support.',
      image: eventImg4,
    },
    {
      id: 'client-mixer',
      title: 'Client Mixer',
      description: 'Relationship-building formats with elegant setup, food, and smooth hosting.',
      image: eventImg3,
    },
  ],
}

const DESKTOP_CARDS_PER_PAGE = 4

function CategoryArrow({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? 'rotate-180' : ''

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-6 w-6 ${rotationClass}`}
    >
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EventCard({ categoryId, event }) {
  return (
    <Link
      to={`/event-flow/service?category=${categoryId}&event=${event.id}`}
      className="group flex h-full max-h-[424px] w-full max-w-[298px] min-w-0 flex-col justify-end overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[10px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1 md:h-[424px]"
    >
      <div className="relative mb-2 min-h-0 flex-1 overflow-hidden rounded-[12px] bg-[#F4EEE6]">
        <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
      </div>
      <div className="flex h-[76px] flex-col rounded-[10px] bg-[#7E8061] px-3 py-2.5 text-white md:h-[84px] md:px-3.5 md:py-3">
        <h2 className="text-[15px] font-semibold uppercase leading-[1.2] tracking-[0.01em] md:text-[16px]">
          {event.title}
        </h2>
        <p className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1 text-[12px] leading-[1.38] text-white/75 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:text-[13px]">
          {event.description}
        </p>
      </div>
    </Link>
  )
}

export default function CategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategoryId = searchParams.get('category')?.toLowerCase() ?? CATEGORY_OPTIONS[0].id
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId)
  const [searchValue, setSearchValue] = useState('')
  const [touchStartX, setTouchStartX] = useState(null)
  const paginationKey = `${selectedCategoryId}:${searchValue.trim().toLowerCase()}`
  const [paginationState, setPaginationState] = useState({
    key: paginationKey,
    pageIndex: 0,
  })

  const filteredEvents = useMemo(() => {
    const events = CATEGORY_EVENT_MAP[selectedCategoryId] ?? []
    const query = searchValue.trim().toLowerCase()
    if (!query) return events

    return events.filter(
      event =>
        event.title.toLowerCase().includes(query) || event.description.toLowerCase().includes(query)
    )
  }, [searchValue, selectedCategoryId])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / DESKTOP_CARDS_PER_PAGE))
  const activePageIndex = paginationState.key === paginationKey ? paginationState.pageIndex : 0
  const safePageIndex = Math.min(activePageIndex, totalPages - 1)
  const visibleEvents = filteredEvents.slice(
    safePageIndex * DESKTOP_CARDS_PER_PAGE,
    safePageIndex * DESKTOP_CARDS_PER_PAGE + DESKTOP_CARDS_PER_PAGE
  )

  const selectCategory = categoryId => {
    setSelectedCategoryId(categoryId)
    setPaginationState({ key: `${categoryId}:${searchValue.trim().toLowerCase()}`, pageIndex: 0 })
    setSearchParams(prevParams => {
      const nextParams = new URLSearchParams(prevParams)
      nextParams.set('category', categoryId)
      nextParams.delete('event')
      return nextParams
    })
  }

  const goPrev = () =>
    setPaginationState(current => {
      const currentPageIndex = current.key === paginationKey ? current.pageIndex : 0
      return { key: paginationKey, pageIndex: Math.max(0, currentPageIndex - 1) }
    })

  const goNext = () =>
    setPaginationState(current => {
      const currentPageIndex = current.key === paginationKey ? current.pageIndex : 0
      return { key: paginationKey, pageIndex: Math.min(totalPages - 1, currentPageIndex + 1) }
    })

  const handleTouchStart = e => {
    setTouchStartX(e.changedTouches[0]?.clientX ?? null)
  }

  const handleTouchEnd = e => {
    if (touchStartX == null) return

    const endX = e.changedTouches[0]?.clientX ?? touchStartX
    const deltaX = endX - touchStartX
    const swipeThreshold = 40

    if (deltaX > swipeThreshold) goPrev()
    if (deltaX < -swipeThreshold) goNext()

    setTouchStartX(null)
  }

  return (
    <EventFlowLayout
      title="What are you planning?"
      subtitle="Choose your event category to get started"
      currentStep={1}
      steps={FLOW_STEPS}
      showSearch
      searchPlaceholder="Search Event Name"
      searchValue={searchValue}
      onSearchChange={e => {
        setSearchValue(e.target.value)
        setPaginationState({
          key: `${selectedCategoryId}:${e.target.value.trim().toLowerCase()}`,
          pageIndex: 0,
        })
      }}
      showPagination
      paginationCount={totalPages}
      activePaginationIndex={safePageIndex}
    >
      <div className="flex h-full w-full flex-col justify-between gap-6 overflow-visible">
        <div className="flex w-full flex-col gap-2 md:flex-row md:gap-2 my-7">
          {CATEGORY_OPTIONS.map(category => {
            const isActive = category.id === selectedCategoryId

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className={`group flex max-w-[325px] items-center justify-between rounded-[24px] border px-5 py-4 text-left transition-all hover:-translate-y-0.5 sm:px-6 ${
                  isActive
                    ? 'border-[#7A2B08] bg-[#591902] text-white shadow-[0_16px_38px_rgba(111,76,43,0.14)]'
                    : 'border-[#E0D0BE] bg-white text-[#2D2D2D] hover:border-[#D3B38A] hover:shadow-[0_16px_38px_rgba(111,76,43,0.08)]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[24px] ${
                      isActive ? 'bg-white/15' : 'bg-[#EFE4D2]'
                    }`}
                  >
                    <span
                      className={`text-[16px] font-semibold ${
                        isActive ? 'text-white' : 'text-[#8C4A22]'
                      }`}
                    >
                      {category.badge}
                    </span>
                  </span>
                  <div className="min-w-0 max-w-[203px]">
                    <h2 className="text-[16px] leading-[1.1]">{category.title}</h2>
                    <p
                      className={`mt-1 text-[12px] leading-[1.45] ${isActive ? 'text-white/75' : 'text-[#8F8B86]'}`}
                    >
                      {category.description}
                    </p>
                  </div>
                </div>

                <span className="flex h-6 w-6 shrink-0 items-center justify-center transition-transform group-hover:translate-x-1">
                  <CategoryArrow />
                </span>
              </button>
            )
          })}
        </div>

        <div
          className="relative flex flex-1 items-center overflow-visible"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto flex w-full flex-col">
            <div className="flex w-full flex-col gap-3 md:gap-4">
              <div className="grid w-full grid-cols-1 justify-items-center gap-3 py-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
                {visibleEvents.map(event => (
                  <EventCard key={event.id} categoryId={selectedCategoryId} event={event} />
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-screen -translate-x-1/2 md:block">
            <button
              type="button"
              onClick={goPrev}
              disabled={safePageIndex === 0}
              className="pointer-events-auto absolute left-0 top-1/2 z-20 flex h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-r-full bg-[#E6DDD3] pl-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Previous cards"
            >
              <CategoryArrow direction="left" />
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={safePageIndex >= totalPages - 1}
              className="pointer-events-auto absolute right-0 top-1/2 z-20 flex h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-l-full bg-[#E6DDD3] pr-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Next cards"
            >
              <CategoryArrow direction="right" />
            </button>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="flex min-h-[220px] w-full items-center justify-center rounded-[24px] border border-dashed border-[#D9CABB] bg-white/70 p-8 text-center text-[16px] leading-[1.6] text-[#857A70]">
            No events match your search. Try a different keyword.
          </div>
        ) : null}
      </div>
    </EventFlowLayout>
  )
}
