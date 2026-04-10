import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../Footer'
import NavHeader from '../NavHeader'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? 'rotate-180' : ''

  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${rotationClass}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 12h12" strokeLinecap="round" />
      <path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function EventFlowLayout({
  title,
  subtitle,
  currentStep = 1,
  steps = [],
  children,
  showSearch = false,
  searchPlaceholder = 'Search',
  searchValue = '',
  onSearchChange,
  showBackButton = false,
  backTo = null,
  showNextButton = false,
  nextTo = null,
  showPagination = false,
  paginationCount = 0,
  activePaginationIndex = 0,
  afterPagination = null,
}) {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  return (
    <main className="bg-[#F8F4ED] text-[#2D2D2D]">
      <NavHeader />

      <div className="flex h-[100svh] flex-col overflow-hidden pt-16 min-[540px]:pt-18 md:pt-20">
        <section
          className="event-flow-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#F8F4ED]"
          data-lenis-prevent
        >
          <div className="mx-auto flex w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-6 md:px-12 md:py-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex max-w-[640px] flex-col gap-2">
                <h1
                  className="text-[28px] leading-[0.96] text-[#2D2D2D] sm:text-[32px] md:text-[36px]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-[14px] leading-[1.45] text-[#8F8B86] sm:text-[16px]">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              {showSearch ? (
                <label className="flex h-11 w-full max-w-[300px] items-center gap-2.5 rounded-full bg-[#EFE8DE] px-4 text-[#A19B94]">
                  <span className="h-4.5 w-4.5 shrink-0">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent text-[14px] text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
                  />
                </label>
              ) : null}
            </div>

            <div className="relative mt-5 flex w-full flex-col items-center justify-start py-1">
              <div className="flex w-full items-center justify-center px-0">{children}</div>

              {showNextButton && nextTo ? (
                <Link
                  to={nextTo}
                  className="absolute right-0 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#E6DDD3] text-[#7C7065] transition-colors hover:bg-[#ddd1c5] md:flex"
                  aria-label="Go next"
                >
                  <ArrowIcon direction="right" />
                </Link>
              ) : null}
            </div>

            {showPagination && paginationCount > 0 ? (
              <div className="mt-5 flex items-center justify-center gap-2">
                {Array.from({ length: paginationCount }).map((_, index) => {
                  const isActive = index === activePaginationIndex

                  return (
                    <span
                      key={index}
                      className={`h-2.5 rounded-full transition-all ${
                        isActive ? 'w-10 bg-[#7A341C]' : 'w-2.5 bg-[#D0C7BE]'
                      }`}
                    />
                  )
                })}
              </div>
            ) : null}

            {afterPagination ? (
              <div className="mt-4 flex justify-center">{afterPagination}</div>
            ) : null}
          </div>

          <Footer />
        </section>

        <section className="h-[84px] shrink-0 bg-[#591902] sm:h-[92px] fix bottom-0">
          <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8 md:px-12">
            {steps.length > 0 ? (
              <div className="flex flex-wrap items-start gap-x-0 gap-y-3">
                {steps.map((step, index) => {
                  const isActive = step.id === currentStep
                  const isCompleted = step.id < currentStep
                  const showConnector = index < steps.length - 1

                  return (
                    <div key={step.id} className="flex items-start">
                      <div className="flex min-w-[40px] flex-col items-center gap-1.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-[14px] font-medium transition-colors ${
                            isActive
                              ? 'border-white bg-white text-[#8C4A22]'
                              : isCompleted
                                ? 'border-[#CBAA78] bg-white text-[#8C4A22]'
                                : 'border-[#C7AB98] bg-[#C7AB98] text-[#8C4A22]'
                          }`}
                        >
                          {step.id}
                        </div>
                        <span className="text-[10px] leading-[1.2] text-[#E8CDB8] sm:text-[11px]">
                          {step.label}
                        </span>
                      </div>

                      {showConnector ? (
                        <div className="mt-[16px] ml-[-2px] hidden h-px w-12 border-t border-dashed border-[#A46A4A] sm:block md:ml-[-3px] md:w-16" />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}

            {showBackButton && backTo ? (
              <Link
                to={backTo}
                className="items-center gap-2 rounded-full bg-[#FAFAFA33] px-4 py-2.5 text-[14px] leading-none text-white transition-colors hover:bg-[#9a5530] md:flex"
              >
                <ArrowIcon direction="left" />
                <span>Previous</span>
              </Link>
            ) : null}
          </div>
        </section>
      </div>

      {/* <Footer /> */}
    </main>
  )
}
