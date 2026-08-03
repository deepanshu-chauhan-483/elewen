import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import NavHeader from '../NavHeader'
import Footer from '../Footer'
import CustomSelect from '../common/CustomSelect'
import { CUSTOM_SELECT_MENU_Z } from '../common/customSelectPresets'

function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? '' : 'rotate-180'

  return (
    <svg
      className={`h-6 w-6 ${rotationClass}`}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28.5 18H7.5M7.5 18L18 28.5M7.5 18L18 7.5"
        stroke="#FAFAFA"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatPriceLabel(value) {
  const amount = Number(value) || 0
  return `₹${amount.toLocaleString('en-IN')}`
}

function formatPriceCompact(value) {
  const amount = Number(value) || 0
  if (amount >= 100000) {
    const lakhs = amount / 100000
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `₹${Math.round(amount / 1000)}K`
  }
  return formatPriceLabel(value)
}

function PriceFilterButton({
  boundMin = 0,
  boundMax = 0,
  priceMin = '',
  priceMax = '',
  onPriceMinChange,
  onPriceMaxChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const hasBounds = boundMax > boundMin
  const currentMin =
    priceMin === '' || Number.isNaN(Number(priceMin)) ? boundMin : Number(priceMin)
  const currentMax =
    priceMax === '' || Number.isNaN(Number(priceMax)) ? boundMax : Number(priceMax)

  const safeMin = hasBounds
    ? Math.min(Math.max(currentMin, boundMin), currentMax)
    : boundMin
  const safeMax = hasBounds
    ? Math.max(Math.min(currentMax, boundMax), safeMin)
    : boundMax
  const span = hasBounds ? boundMax - boundMin || 1 : 1
  const step = Math.max(1, Math.round(span / 100))
  const leftPercent = hasBounds ? ((safeMin - boundMin) / span) * 100 : 0
  const rightPercent = hasBounds ? ((safeMax - boundMin) / span) * 100 : 100
  const isFiltered = hasBounds && (safeMin > boundMin || safeMax < boundMax)
  const buttonLabel = isFiltered
    ? `${formatPriceCompact(safeMin)} – ${formatPriceCompact(safeMax)}`
    : 'Min–Max'

  useEffect(() => {
    if (!isOpen || !hasBounds) return undefined

    const updateMenuPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return

      setMenuStyle({
        top: rect.bottom + 6,
        left: rect.right - 220,
        width: 220,
      })
    }

    updateMenuPosition()

    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen, hasBounds])

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = event => {
      if (!wrapperRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = event => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleMinChange = event => {
    const next = Number(event.target.value)
    const capped = Math.min(next, safeMax)
    onPriceMinChange?.(String(capped))
  }

  const handleMaxChange = event => {
    const next = Number(event.target.value)
    const capped = Math.max(next, safeMin)
    onPriceMaxChange?.(String(capped))
  }

  if (!hasBounds) return null

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[130px] sm:w-[130px]">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Filter by price range"
        onClick={() => setIsOpen(open => !open)}
        className="flex h-9 w-full min-w-0 items-center rounded-full bg-[#F7F0E6] pl-3.5 pr-8 text-left text-[12px] text-[#7A2B08] outline-none ring-1 ring-[#7A2B08]/15"
      >
        <span className="truncate">{buttonLabel}</span>
      </button>

      <svg
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#7A2B08]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="m2.5 4.5 3.5 3 3.5-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {isOpen && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              className={`fixed ${CUSTOM_SELECT_MENU_Z} rounded-[12px] border border-[#E8E0D6] bg-white p-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)]`}
              style={menuStyle}
              role="dialog"
              aria-label="Price range filter"
            >
              <div className="mb-1.5 flex items-center justify-between gap-1 text-[10px] leading-tight text-[#1C1C1C]">
                <span>
                  <span className="mr-0.5 font-semibold uppercase text-[#8C3B11]">Min</span>
                  {formatPriceLabel(safeMin)}
                </span>
                <span className="text-[#A89080]">to</span>
                <span>
                  <span className="mr-0.5 font-semibold uppercase text-[#8C3B11]">Max</span>
                  {formatPriceLabel(safeMax)}
                </span>
              </div>

              <div className="relative h-5 w-full">
                <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#EFE7DC]" />
                <div
                  className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#CDB17E]"
                  style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
                />

                <input
                  type="range"
                  min={boundMin}
                  max={boundMax}
                  step={step}
                  value={safeMin}
                  onChange={handleMinChange}
                  aria-label={`Minimum price ${formatPriceLabel(safeMin)}`}
                  className="price-range-thumb price-range-thumb--compact absolute inset-0 z-[2] h-5 w-full appearance-none bg-transparent"
                />
                <input
                  type="range"
                  min={boundMin}
                  max={boundMax}
                  step={step}
                  value={safeMax}
                  onChange={handleMaxChange}
                  aria-label={`Maximum price ${formatPriceLabel(safeMax)}`}
                  className="price-range-thumb price-range-thumb--compact absolute inset-0 z-[3] h-5 w-full appearance-none bg-transparent"
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

export default function PackageListLayout({
  totalCount = 0,
  sortValue = 'price-asc',
  onSortChange,
  children,
  page = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  onPageSelect,
  ctaTitle = 'Not sure which package is right for you?',
  ctaButtonText = 'Book a Consultation',
  ctaButtonTo = '/contact',
  showPagination = true,
  heroContent = null,
  showPriceFilter = true,
  priceMin = '',
  priceMax = '',
  priceBounds = { min: 0, max: 0 },
  onPriceMinChange,
  onPriceMaxChange,
}) {
  const boundMin = Number(priceBounds?.min) || 0
  const boundMax = Number(priceBounds?.max) || 0
  const hasPriceBounds = boundMax > boundMin

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-white">
      <NavHeader forcedThemeName="dark" backgroundColorOverride="#591902" />

      {heroContent ? <div className="pt-8 md:pt-10">{heroContent}</div> : null}
      <div className="px-4 pb-0 pt-20 sm:px-6 md:pt-24">
        <div className="mx-auto flex w-full flex-col lg:w-[calc(100%-200px)] lg:max-w-none">
          <div className="relative z-40 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p
              className="text-[27px] leading-none text-[#1C1C1C]"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              {totalCount} Total Packages
            </p>

            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              {showPriceFilter && hasPriceBounds ? (
                <PriceFilterButton
                  boundMin={boundMin}
                  boundMax={boundMax}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  onPriceMinChange={onPriceMinChange}
                  onPriceMaxChange={onPriceMaxChange}
                />
              ) : null}

              <label className="relative flex w-full max-w-[180px] items-center justify-end sm:w-auto">
                <CustomSelect
                  variant="sort"
                  value={sortValue}
                  onChange={onSortChange}
                  options={[
                    { value: 'price-asc', label: 'Sort Price Low-High' },
                    { value: 'price-desc', label: 'Sort Price High-Low' },
                    { value: 'title-asc', label: 'Sort Title A-Z' },
                  ]}
                  ariaLabel="Sort packages"
                />
              </label>
            </div>
          </div>

          <div className="mt-8">{children}</div>

          {showPagination && (
            <div className="mt-10 flex items-center justify-center gap-4 text-[#8C3B11]">
              <button
                type="button"
                onClick={onPrevPage}
                disabled={page <= 1}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#591902] text-white transition-colors hover:bg-[#702103] disabled:opacity-40"
              >
                <ArrowIcon direction="left" />
              </button>

              <div className="flex items-center gap-5 text-[14px]">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1
                  const isActive = pageNumber === page

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => onPageSelect?.(pageNumber)}
                      className={
                        isActive
                          ? 'text-[#A94618] font-semibold'
                          : 'text-[#A94618]/80 font-semibold'
                      }
                    >
                      {pageNumber}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={onNextPage}
                disabled={page >= totalPages}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#591902] text-white transition-colors hover:bg-[#702103] disabled:opacity-40"
              >
                <ArrowIcon direction="right" />
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 flex w-full justify-center bg-[#591902] px-[clamp(16px,2vw,40px)] py-16 sm:py-20 lg:py-24">
        <div className="flex w-full max-w-[1000px] flex-col items-center text-center">
          <h2
            className="max-w-[760px] text-[30px] leading-[0.95] text-white sm:text-[44px] lg:text-[61px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            {ctaTitle}
          </h2>

          <Link
            to={ctaButtonTo}
            className="group mt-8 flex w-fit items-center rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5 transition-colors hover:bg-[#C6AB7F]"
          >
            <span className="mr-5 text-[15px] font-medium text-white">{ctaButtonText}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
              <svg
                className="h-[20px] w-[20px] text-[#CDB17E] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.82812 5.83398H14.1615M14.1615 5.83398V14.1673M14.1615 5.83398L5.82812 14.1673"
                  stroke="#CDB17E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
