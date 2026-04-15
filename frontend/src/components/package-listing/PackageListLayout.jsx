import { Link } from 'react-router-dom'
import NavHeader from '../NavHeader'
import Footer from '../Footer'

function ArrowIcon({ direction = 'left' }) {
  const rotationClass = direction === 'right' ? '' : 'rotate-180'

  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${rotationClass}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="m13 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-white">
      <NavHeader />

      {heroContent ? <div className="pt-18 md:pt-22">{heroContent}</div> : null}
      <div className="px-4 pb-0 pt-20 sm:px-6 md:pt-24">
        <div className="mx-auto flex w-full flex-col lg:w-[calc(100%-200px)] lg:max-w-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p
              className="text-[27px] leading-none text-[#1C1C1C]"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              {totalCount} Total Packages
            </p>

            <label className="relative flex w-full max-w-[180px] items-center justify-end sm:w-auto">
              <select
                value={sortValue}
                onChange={onSortChange}
                className="h-9 w-full appearance-none rounded-full bg-[#D9D9D9] pl-4 pr-9 text-[12px] text-[#2D2D2D] outline-none ring-1 ring-black/10"
              >
                <option value="price-asc">Sort Price Low-High</option>
                <option value="price-desc">Sort Price High-Low</option>
                <option value="title-asc">Sort Title A-Z</option>
              </select>

              <svg
                viewBox="0 0 12 12"
                className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#2D2D2D]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m2.5 4.5 3.5 3 3.5-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
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
                      className={isActive ? 'text-[#A94618]' : 'text-[#A94618]/80'}
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
                className="h-[18px] w-[18px] text-[#D4BA8E] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
