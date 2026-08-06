import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import NavHeader from '../NavHeader'
import Footer from '../Footer'
import CustomSelect from '../common/CustomSelect'

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

function formatPriceLabel(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}

function PriceFilterButton({
  minPriceValue = '',
  maxPriceValue = '',
  onMinPriceChange,
  onMaxPriceChange,
  onApplyPriceFilter,
  isActive = false,
  priceBounds = { min: 0, max: 10000 },
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const boundMin = Math.max(0, Number(priceBounds?.min ?? 0) || 0)
  const boundMax = Math.max(boundMin + 1, Number(priceBounds?.max ?? 10000) || 10000)
  const step = boundMax - boundMin > 5000 ? 100 : 50

  const sliderMin = useMemo(() => {
    const parsed = Number(minPriceValue)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.min(boundMax, Math.max(boundMin, parsed))
    }
    return boundMin
  }, [boundMax, boundMin, minPriceValue])

  const sliderMax = useMemo(() => {
    const parsed = Number(maxPriceValue)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.min(boundMax, Math.max(boundMin, parsed))
    }
    return boundMax
  }, [boundMax, boundMin, maxPriceValue])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (minPriceValue === '' && maxPriceValue === '') {
      onMinPriceChange?.(String(boundMin))
      onMaxPriceChange?.(String(boundMax))
    }
  }, [boundMax, boundMin, maxPriceValue, minPriceValue, onMaxPriceChange, onMinPriceChange, open])

  const handleApply = () => {
    onApplyPriceFilter?.()
    setOpen(false)
  }

  const handleMinChange = event => {
    const next = Number(event.target.value)
    const capped = Math.min(next, sliderMax)
    onMinPriceChange?.(String(capped))
  }

  const handleMaxChange = event => {
    const next = Number(event.target.value)
    const capped = Math.max(next, sliderMin)
    onMaxPriceChange?.(String(capped))
  }

  const range = boundMax - boundMin || 1
  const leftPercent = ((sliderMin - boundMin) / range) * 100
  const rightPercent = ((sliderMax - boundMin) / range) * 100

  const buttonLabel =
    isActive && (minPriceValue || maxPriceValue)
      ? `${formatPriceLabel(minPriceValue || boundMin)} – ${formatPriceLabel(maxPriceValue || boundMax)}`
      : 'Price filter'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className={`flex h-[38px] items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors ${
          open || isActive
            ? 'border-[#591902] bg-[#591902] text-white'
            : 'border-[#D9CABB] bg-white text-[#1C1C1C] hover:border-[#591902]/50'
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M3 5h14M5 10h10M7 15h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="max-w-[160px] truncate">{buttonLabel}</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[280px] rounded-[16px] border border-[#E8DFD4] bg-white p-4 text-[#1C1C1C] shadow-[0_12px_32px_rgba(89,25,2,0.12)]"
          role="dialog"
          aria-label="Filter by price"
        >
          <p className="text-[13px] font-semibold text-[#591902]">Filter by base price</p>
          <p className="mt-2 text-[14px] font-medium text-[#1C1C1C]">
            {formatPriceLabel(sliderMin)} – {formatPriceLabel(sliderMax)}
          </p>

          <div className="relative mt-6 mb-2 h-8">
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#E8DFD4]" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#591902]"
              style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
            />
            <input
              type="range"
              min={boundMin}
              max={boundMax}
              step={step}
              value={sliderMin}
              onChange={handleMinChange}
              className="price-range-thumb absolute inset-0 z-[2] h-8 w-full appearance-none bg-transparent"
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={boundMin}
              max={boundMax}
              step={step}
              value={sliderMax}
              onChange={handleMaxChange}
              className="price-range-thumb absolute inset-0 z-[3] h-8 w-full appearance-none bg-transparent"
              aria-label="Maximum price"
            />
          </div>

          <div className="mb-3 flex justify-between text-[11px] text-[#591902]/60">
            <span>{formatPriceLabel(boundMin)}</span>
            <span>{formatPriceLabel(boundMax)}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onMinPriceChange?.('')
                onMaxPriceChange?.('')
                onApplyPriceFilter?.({ clear: true })
                setOpen(false)
              }}
              className="h-[38px] flex-1 rounded-full border border-[#D9CABB] bg-white text-[13px] font-medium text-[#591902] transition-colors hover:border-[#591902]/40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-[38px] flex-1 rounded-full bg-[#591902] text-[13px] font-medium text-white transition-colors hover:bg-[#702103]"
            >
              Go
            </button>
          </div>

          <style>{`
            .price-range-thumb {
              pointer-events: none;
            }
            .price-range-thumb::-webkit-slider-thumb {
              pointer-events: auto;
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              background: #591902;
              border: 2px solid #ffffff;
              box-shadow: 0 1px 4px rgba(89, 25, 2, 0.35);
              cursor: pointer;
            }
            .price-range-thumb::-moz-range-thumb {
              pointer-events: auto;
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              background: #591902;
              border: 2px solid #ffffff;
              box-shadow: 0 1px 4px rgba(89, 25, 2, 0.35);
              cursor: pointer;
            }
            .price-range-thumb::-webkit-slider-runnable-track {
              background: transparent;
              height: 8px;
            }
            .price-range-thumb::-moz-range-track {
              background: transparent;
              height: 8px;
              border: none;
            }
          `}</style>
        </div>
      ) : null}
    </div>
  )
}

export default function PackageListLayout({
  totalCount = 0,
  sortValue = 'price-asc',
  onSortChange,
  minPriceValue = '',
  maxPriceValue = '',
  onMinPriceChange,
  onMaxPriceChange,
  onApplyPriceFilter,
  priceFilterActive = false,
  priceBounds = { min: 0, max: 10000 },
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
}) {
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

            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <PriceFilterButton
                minPriceValue={minPriceValue}
                maxPriceValue={maxPriceValue}
                onMinPriceChange={onMinPriceChange}
                onMaxPriceChange={onMaxPriceChange}
                onApplyPriceFilter={onApplyPriceFilter}
                isActive={priceFilterActive}
                priceBounds={priceBounds}
              />

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
