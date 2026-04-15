import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import EventFlowLayout from '../components/event-flow/EventFlowLayout'
import { useDecorThemeOptions } from '../hooks/useEventTypes'

import themeImg1 from '../assets/images/IMG_3903.jpg'
import themeImg2 from '../assets/images/IMG_7768.jpg'
import themeImg3 from '../assets/images/IMG_0749.jpg'
import themeImg4 from '../assets/images/IMG_0658.jpg'

const FLOW_STEPS = [
  { id: 1, label: 'Category' },
  { id: 2, label: 'Event' },
  { id: 3, label: 'Service' },
  { id: 4, label: 'Theme' },
  { id: 5, label: 'Package' },
]

const FALLBACK_THEME_IMAGES = [themeImg1, themeImg2, themeImg3, themeImg4]

function ThemeArrow({ direction = 'left' }) {
  const rotationClass = direction === 'right' ? '' : 'rotate-180'

  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-7 w-7 ${rotationClass}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ThemeCard({ categoryId, eventId, serviceSlug, serviceId, theme, image }) {
  const params = new URLSearchParams()
  params.set('category', categoryId)
  params.set('event', eventId)
  params.set('service', serviceSlug)
  if (serviceId) params.set('serviceId', serviceId)
  params.set('theme', theme.slug)

  return (
    <Link
      to={`/packages/decor-levels?${params.toString()}`}
      className="group flex max-h-[384px] w-full max-w-[298px] flex-col overflow-hidden rounded-[18px] border border-[#F0E6DA] bg-white p-[8px] shadow-[0_10px_24px_rgba(117,72,33,0.05)] transition-transform hover:-translate-y-1"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[12px] bg-[#F4EEE6]">
        <img src={image} alt={theme.label} className="h-full w-full object-cover" />
      </div>
      <div className="mt-2 flex h-[40px] items-center rounded-[10px] bg-[#7E8061] px-3 text-white md:h-[44px] md:px-3.5">
        <h2 className="text-[14px] font-medium leading-[1.2] md:text-[15px]">{theme.label}</h2>
      </div>
    </Link>
  )
}

export default function DecorThemePage() {
  const [searchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState('')

  const categoryId = searchParams.get('category')?.toLowerCase() ?? ''
  const eventId = searchParams.get('event')?.toLowerCase() ?? ''
  const serviceSlug = searchParams.get('service')?.toLowerCase() ?? 'decor'
  const serviceId = searchParams.get('serviceId') ?? ''

  const { data: themes = [] } = useDecorThemeOptions(serviceId)

  const filteredThemes = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return themes
    return themes.filter(theme => (theme.label ?? '').toLowerCase().includes(query))
  }, [searchValue, themes])

  const backTo = useMemo(() => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (eventId) params.set('event', eventId)
    if (searchParams.get('eventId')) params.set('eventId', searchParams.get('eventId'))
    return `/event-flow/service?${params.toString()}`
  }, [categoryId, eventId, searchParams])

  const skipToPackages = useMemo(() => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (eventId) params.set('event', eventId)
    if (searchParams.get('eventId')) params.set('eventId', searchParams.get('eventId'))
    params.set('service', serviceSlug)
    if (serviceId) params.set('serviceId', serviceId)
    return `/packages/decor-levels?${params.toString()}`
  }, [categoryId, eventId, serviceSlug, serviceId, searchParams])

  if (!categoryId || !eventId) {
    return <Navigate to="/event-flow/category" replace />
  }

  return (
    <EventFlowLayout
      title="Choose a theme"
      subtitle="Pick a visual theme that sets the mood for your event"
      currentStep={4}
      steps={FLOW_STEPS}
      showSearch
      searchPlaceholder="Search Theme Name"
      searchValue={searchValue}
      onSearchChange={e => setSearchValue(e.target.value)}
      showBackButton
      backTo={backTo}
      showPagination
      paginationCount={Math.max(filteredThemes.length, 1)}
      activePaginationIndex={0}
      afterPagination={
        <Link
          to={skipToPackages}
          className="my-5 flex items-center gap-3 rounded-full bg-[#1F1F1F] px-5 py-2.5 text-[11px] font-medium text-white transition-colors hover:bg-black md:text-[12px]"
        >
          <span>Skip to Package Listing</span>
          <ThemeArrow direction="right" />
        </Link>
      }
    >
      <div className="flex h-full w-full flex-col justify-between gap-3 overflow-visible">
        <div className="relative flex flex-1 items-center overflow-visible">
          <div className="mx-auto flex w-full flex-col">
            <div className="flex w-full flex-col gap-3 md:gap-4">
              <div className="grid w-full grid-cols-1 justify-items-center gap-3 py-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
                {filteredThemes.map((theme, index) => (
                  <ThemeCard
                    key={theme.id ?? theme.slug ?? index}
                    categoryId={categoryId}
                    eventId={eventId}
                    serviceSlug={serviceSlug}
                    serviceId={serviceId}
                    theme={theme}
                    image={
                      theme.preview_image ||
                      FALLBACK_THEME_IMAGES[index % FALLBACK_THEME_IMAGES.length]
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-screen -translate-x-1/2 md:block">
            <button
              type="button"
              className="pointer-events-auto absolute left-0 top-1/2 z-20 flex h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-r-full bg-[#E6DDD3] pl-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5]"
              aria-label="Previous themes"
            >
              <ThemeArrow direction="left" />
            </button>

            <button
              type="button"
              className="pointer-events-auto absolute right-0 top-1/2 z-20 flex h-[104px] w-[52px] -translate-y-1/2 items-center justify-center rounded-l-full bg-[#E6DDD3] pr-2 text-[#7C7065] transition-colors hover:bg-[#ddd1c5]"
              aria-label="Next themes"
            >
              <ThemeArrow direction="right" />
            </button>
          </div>
        </div>
      </div>
    </EventFlowLayout>
  )
}
