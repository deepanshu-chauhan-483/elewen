import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../Footer'
import NavHeader from '../NavHeader'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
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
  onBack = null,
  showNextButton = false,
  nextTo = null,
  showPagination = false,
  paginationCount = 0,
  activePaginationIndex = 0,
  mobilePaginationWindow = null,
  afterPagination = null,
}) {
  const navigate = useNavigate()
  const mobileWindowSize =
    typeof mobilePaginationWindow === 'number' && mobilePaginationWindow > 0
      ? Math.floor(mobilePaginationWindow)
      : null
  const mobileWindowStart =
    mobileWindowSize && paginationCount > mobileWindowSize
      ? Math.max(
          0,
          Math.min(
            activePaginationIndex - Math.floor(mobileWindowSize / 2),
            paginationCount - mobileWindowSize
          )
        )
      : 0
  const mobileWindowEnd = mobileWindowSize ? mobileWindowStart + mobileWindowSize : paginationCount

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack()
      return
    }

    // Explicit previous flow step only — never history(-1) (that returns to home hero).
    if (backTo) {
      navigate(backTo)
    }
  }

  const canShowBack = Boolean(showBackButton && (onBack || backTo))

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevHtmlScrollbarGutter = html.style.scrollbarGutter
    const prevBodyScrollbarGutter = body.style.scrollbarGutter

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.scrollbarGutter = 'auto'
    body.style.scrollbarGutter = 'auto'

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      html.style.scrollbarGutter = prevHtmlScrollbarGutter
      body.style.scrollbarGutter = prevBodyScrollbarGutter
    }
  }, [])

  return (
    <main className="bg-[#F8F4ED] text-[#2D2D2D] ">
      <NavHeader />

      <div className="flex h-[100svh] flex-col overflow-hidden pt-10 min-[540px]:pt-8 md:pt-10 ">
        <section
          className="event-flow-scroll hide-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#F8F4ED]"
          data-lenis-prevent
        >
          <div className="p-6 sm:px-6 sm:py-4 md:py-5">
            <div className="mx-auto flex w-full md:w-[calc(100%-100px)] lg:w-[calc(100%-200px)] lg:max-w-none flex-col">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex w-full flex-col gap-[12px] md:max-w-[440px] md:pt-20">
                  {' '}
                  <h1
                    className="text-[28px] leading-[1] text-[#2D2D2D] sm:text-[32px] md:text-[36px] "
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="text-[14px] leading-[1.4] text-[#8F8B86] sm:text-[16px]">
                      {subtitle}
                    </p>
                  ) : null}
                </div>

                {showSearch ? (
                  <label className="flex w-full max-w-[300px] items-center gap-2.5 rounded-full bg-[#EFE8DE] px-2.5 py-1.5 text-[#A19B94]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8B1A8] text-[#FAFAFA]">
                      <span className="h-3.5 w-3.5">
                        <SearchIcon />
                      </span>
                    </span>
                    <input
                      type="text"
                      value={searchValue}
                      onChange={onSearchChange}
                      placeholder={searchPlaceholder}
                      className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
                    />
                  </label>
                ) : null}
              </div>

              <div className="relative mt-5 flex w-full flex-col items-center justify-start py-1">
                <div className="flex w-full items-center justify-center px-0 md:px-0">
                  {children}
                </div>

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
                    const isOutsideMobileWindow =
                      mobileWindowSize != null &&
                      paginationCount > mobileWindowSize &&
                      (index < mobileWindowStart || index >= mobileWindowEnd)

                    return (
                      <span
                        key={index}
                        className={`h-2.5 rounded-full transition-all ${
                          isActive ? 'w-10 bg-[#7A341C]' : 'w-2.5 bg-[#D0C7BE]'
                        } ${isOutsideMobileWindow ? 'hidden md:inline-flex' : 'inline-flex'}`}
                      />
                    )
                  })}
                </div>
              ) : null}

              {afterPagination ? (
                <div className="mt-4 flex justify-center">{afterPagination}</div>
              ) : null}
            </div>
          </div>

          <Footer />
        </section>

        {/* ✅ ONLY FIX HERE */}
        <section className="min-h-[64px] shrink-0 bg-[#591902] py-2 sm:h-[70px] sm:min-h-0 sm:py-0 fix bottom-0">
          <div className="h-full px-6 sm:px-6">
            <div className="mx-auto flex h-full w-full items-end justify-between gap-3 md:w-[calc(100%-100px)] lg:w-[calc(100%-200px)] lg:max-w-none sm:items-center sm:gap-6">
              {steps.length > 0 ? (
                <div className="flex flex-wrap items-start gap-x-0 gap-y-1.5 sm:gap-y-3">
                  {steps.map((step, index) => {
                    const isActive = step.id === currentStep
                    const isCompleted = step.id < currentStep
                    const isPlaceholderStep = !step.label?.trim()

                    const isLastStep = index === steps.length - 1
                    const nextStep = steps[index + 1]
                    const nextIsPlaceholder = !nextStep?.label?.trim()

                    // ✅ Show connector if:
                    // 1. Not last step
                    // 2. OR next step is placeholder (for trailing dashed line)
                    const showConnector = !isLastStep || isPlaceholderStep

                    return (
                      <div key={step.id} className="flex flex-col items-start">
                        <div className="flex items-start">
                          {/* STEP CIRCLE */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[14px] font-medium transition-colors ${
                              isActive
                                ? 'border-white bg-white text-[#8C4A22]'
                                : isCompleted
                                  ? 'border-[#CBAA78] bg-white text-[#8C4A22]'
                                  : 'border-[#C7AB98] bg-[#C7AB98] text-[#8C4A22]'
                            }`}
                          >
                            {isPlaceholderStep ? '' : step.id}
                          </div>

                          {/* CONNECTOR */}
                          {showConnector && (
                            <div
                              className={`mt-[16px] h-px border-t border-dashed border-[#A46A4A]
                ${
                  nextIsPlaceholder
                    ? 'w-[20px] sm:w-[40px] md:w-[57px] opacity-60'
                    : 'w-[20px] sm:w-[40px] md:w-[57px]'
                }`}
                            />
                          )}
                        </div>

                        {/* LABEL */}
                        <span className="mt-1 block w-8 text-center text-[9px] leading-[1.15] text-[#E8CDB8] sm:mt-1.5 sm:text-[11px]">
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {canShowBack ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FAFAFA33] px-3 py-2 text-[11px] leading-none text-white transition-colors hover:bg-[#FAFAFA4D] sm:mr-2 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-[14px]"
                >
                  <ArrowIcon direction="left" />
                  <span className="whitespace-nowrap">Previous</span>
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
