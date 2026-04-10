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
}) {
  return (
    <main className="min-h-screen bg-white text-white">
      <NavHeader />

      <div className="px-4 pb-0 pt-20 sm:px-6 md:pt-24 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1220px] flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p
              className="text-[22px] leading-none text-black/65"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              {totalCount} Total Packages
            </p>

            <label className="flex w-full max-w-[180px] items-center justify-end sm:w-auto">
              <select
                value={sortValue}
                onChange={onSortChange}
                className="h-9 w-full rounded-full bg-[#D9D9D9] px-4 text-[12px] text-[#2D2D2D] outline-none ring-1 ring-black/10"
              >
                <option value="price-asc">Sort Price Low-High</option>
                <option value="price-desc">Sort Price High-Low</option>
                <option value="title-asc">Sort Title A-Z</option>
              </select>
            </label>
          </div>

          <div className="mt-8">{children}</div>

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
        </div>
      </div>

      <section className="mt-16 flex w-full justify-center bg-[#591902] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="flex w-full max-w-[1000px] flex-col items-center text-center">
          <h2
            className="max-w-[760px] text-[34px] leading-[0.95] text-white sm:text-[48px] lg:text-[72px]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            {ctaTitle}
          </h2>

          <Link
            to={ctaButtonTo}
            className="mt-8 flex items-center gap-4 rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5 text-white transition-colors hover:bg-[#C9AD7F]"
          >
            <span className="text-[16px] font-medium">{ctaButtonText}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#D4BA8E]">
              <ArrowIcon direction="right" />
            </span>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
