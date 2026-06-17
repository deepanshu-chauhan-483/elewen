import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBlogCategories, useBlogs } from '../hooks/useBlogs'
import { useScrollToTop } from '../hooks/useScrollToTop'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import heroLeft from '../assets/images/IMG_3001.jpg'
import heroRight from '../assets/images/IMG_7025.jpg'
import blogImg1 from '../assets/images/IMG_0658.jpg'
import blogImg2 from '../assets/images/outdoor-party-setup-with-balloons-and-decorations-2026-03-18-09-29-30-utc.jpg'
import blogImg3 from '../assets/images/IMG_3148.jpg'

const fallbackImagesByCategory = {
  'Planning Tips': blogImg3,
  'Decor Inspiration': blogImg1,
  'Hosting Guide': blogImg2,
  'Food & Catering': blogImg2,
}

const resolveCoverImage = post =>
  post?.cover_image || fallbackImagesByCategory[post?.category] || blogImg1

const formatPublishedDate = value => {
  if (!value) return 'Elewen Journal'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Elewen Journal'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const RevealLine = ({ children, delay, className = '' }) => (
  <span className={`reveal-wrapper block ${className}`.trim()}>
    <span className="reveal-text" style={delay ? { animationDelay: delay } : undefined}>
      {children}
    </span>
  </span>
)

function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? '' : 'rotate-180'

  return (
    <svg
      className={`h-[20px] w-[20px] md:w-[36px] md:h-[36px] ${rotationClass}`}
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

const buildPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (currentPage <= 3) return [1, 2, 3, 'ellipsis', totalPages]

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', currentPage, 'ellipsis', totalPages]
}

const BlogPage = () => {
  const pageRef = useRef(null)
  const blogListTopRef = useRef(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const blogCategoriesQuery = useBlogCategories()
  const blogsQuery = useBlogs({ limit: 50 })
  const { data: blogCategories = [] } = blogCategoriesQuery
  const { data: blogPosts = [] } = blogsQuery
  const isStrapiLoading = useStrapiPageLoading(blogCategoriesQuery, blogsQuery)

  const blogsPerPage = 3

  const categories = useMemo(() => {
    const fetchedCategories = Array.isArray(blogCategories) ? blogCategories : []
    const postCategories = Array.isArray(blogPosts)
      ? blogPosts.map(post => post?.category).filter(Boolean)
      : []

    return ['All', ...new Set([...fetchedCategories, ...postCategories])]
  }, [blogCategories, blogPosts])

  const visiblePosts = useMemo(() => {
    if (activeCategory === 'All') return blogPosts
    return blogPosts.filter(post => post.category === activeCategory)
  }, [activeCategory, blogPosts])

  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / blogsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginationItems = useMemo(
    () => buildPaginationItems(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  )

  const paginatedPosts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * blogsPerPage
    return visiblePosts.slice(startIndex, startIndex + blogsPerPage)
  }, [blogsPerPage, safeCurrentPage, visiblePosts])

  useScrollToTop(safeCurrentPage)

  useEffect(() => {
    if (!blogListTopRef.current) return

    blogListTopRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [activeCategory])

  useEffect(() => {
    const page = pageRef.current
    if (!page) return

    const targets = Array.from(
      page.querySelectorAll(
        '.reveal-on-scroll, .reveal-wrapper, .anim-element, .card-reveal, .reveal-border-y'
      )
    ).filter(el => {
      if (el.classList.contains('is-visible')) return false
      if (el.classList.contains('reveal-wrapper') && el.closest('.reveal-on-scroll')) return false
      return true
    })

    const reveal = el => {
      if (
        el.classList.contains('anim-element') ||
        el.classList.contains('card-reveal') ||
        el.classList.contains('reveal-border-y')
      ) {
        el.classList.add('is-visible')
      }

      if (el.classList.contains('reveal-wrapper') || el.classList.contains('reveal-on-scroll')) {
        Array.from(el.querySelectorAll('.reveal-text')).forEach(text => {
          text.style.animationDelay = '1s'
          text.classList.add('is-visible')
        })
      }
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          reveal(entry.target)
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -12% 0px' }
    )

    targets.forEach(el => {
      const rect = el.getBoundingClientRect()
      const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0
      if (inView) reveal(el)
      else observer.observe(el)
    })

    return () => observer.disconnect()
  }, [activeCategory])

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  return (
    <main ref={pageRef} className="blog-page min-h-screen text-[#202716]">
      <section
        data-nav-theme="glass"
        data-nav-surface="transparent"
        className="bg-[#CBB9A7] px-6 pb-16 pt-24 sm:pt-26 md:px-10 md:pt-28 lg:px-[96px] lg:pb-24 lg:pt-10 xl:pt-12"
      >
        <div className="mx-auto max-w-[1720px]">
          <div className="mt-14 md:mt-20 lg:mt-24">
            <div className="mx-auto max-w-[720px] text-center md:max-w-[820px] lg:max-w-[920px] xl:max-w-[980px] reveal-on-scroll">
              <h1
                className="mx-auto max-w-[980px] text-center text-[44px] leading-[1] text-[#6D2005] sm:text-[52px] md:text-[64px] lg:text-[80px]"
                style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
              >
                <RevealLine>Ideas, Guides &amp;</RevealLine>
                <RevealLine delay="0.06s">Real Celebrations</RevealLine>
              </h1>
            </div>

            <div className="mx-auto mt-12 grid max-w-[1280px] gap-6 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:items-start md:justify-center lg:gap-4">
              <div className="anim-element slide-from-bottom h-[320px] overflow-hidden md:h-[420px] lg:h-[380px]">
                <img
                  src={heroLeft}
                  alt="Celebration moment"
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div
                className="anim-element slide-from-bottom h-[220px] overflow-hidden self-start md:h-[260px] lg:h-[260px]"
                style={{ '--delay': '0s' }}
              >
                <img
                  src={heroRight}
                  alt="Decorated event space"
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FFFFFF]">
        <div className="mx-auto grid max-w-[1720px] gap-10 px-5 pt-10 pb-5 md:relative md:grid-cols-[220px_minmax(0,1fr)] md:gap-16 md:px-10 md:py-20 lg:px-[96px]">
          <div className="absolute bottom-0 left-[252px] top-0 hidden w-px bg-[#A7AE98] md:block" />

          <aside className="self-start border-b border-[#A7AE98] px-[10px] pb-5 md:sticky md:top-28 md:border-b-0 md:pb-0 md:pr-10 md:px-0">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-[12px] md:block md:space-y-8 md:text-[16px]">
              {categories.map((category, index) => {
                const active = activeCategory === category
                return (
                  <div key={category} className="flex items-center md:block">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(category)
                        setCurrentPage(1)
                      }}
                      className={`relative text-left text-[16px] leading-[1.5] md:w-full ${
                        active ? 'text-[#202716]' : 'text-[#9B9A92]'
                      }`}
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        letterSpacing: '0',
                      }}
                    >
                      <span className="relative inline-block md:pb-[8px]">
                        {category}
                        <span
                          className={`absolute bottom-0 left-0 h-px bg-[#A7AE98] transition-all duration-300 ease-out ${
                            active ? 'w-full opacity-100' : 'w-0 opacity-0'
                          }`}
                        />
                      </span>
                    </button>

                    {index < categories.length - 1 ? (
                      <span className="ml-4 text-[#202716] md:hidden">|</span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </aside>

          <div>
            <div ref={blogListTopRef} />

            {visiblePosts.length === 0 ? (
              <div className="border-b border-[#DDD7CE] py-10">
                <p
                  className="max-w-[640px] text-[16px] leading-[1.5] text-[#9B9A92]"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    letterSpacing: '0',
                  }}
                >
                  No posts are available in this category yet.
                </p>
              </div>
            ) : null}

            {paginatedPosts.map((post, index) => (
              <article
                key={post.title}
                className={`grid gap-8 border-b border-[#DDD7CE] pt-2 pb-8 md:items-start md:gap-10 md:py-10 ${
                  index % 2 === 0
                    ? 'md:grid-cols-[minmax(0,1fr)_276px]'
                    : 'md:grid-cols-[276px_minmax(0,1fr)]'
                }`}
              >
                {index % 2 === 1 && (
                  <div className="order-2 h-[256px] w-full overflow-hidden md:order-1 md:w-[276px]">
                    <img
                      src={resolveCoverImage(post)}
                      alt={post.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}

                <div className={index % 2 === 1 ? 'order-1 md:order-2' : ''}>
                  <p
                    className="text-[16px] leading-[1.5] text-[#A77B45]"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      letterSpacing: '0',
                    }}
                  >
                    {formatPublishedDate(post.post_published_at)}
                  </p>

                  <Link to={`/blogs/${post.slug}`} className="block">
                    <h2
                      className="mt-3 max-w-[760px] text-[32px] leading-[1] text-[#171717] transition-colors duration-300 hover:text-[#6D2005] md:text-[36px]"
                      style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
                    >
                      {post.title}
                    </h2>
                  </Link>

                  <p
                    className="mt-5 max-w-[760px] text-[16px] leading-[1.5] text-[#9B9A92]"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      letterSpacing: '0',
                    }}
                  >
                    {post.excerpt}
                  </p>

                  <Link
                    to={`/blogs/${post.slug}`}
                    className="group mt-7 inline-flex w-fit items-center rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5 transition-colors hover:bg-[#C6AB7F]"
                  >
                    <span
                      className="mr-5 text-[15px] text-white"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        letterSpacing: '0',
                      }}
                    >
                      Read more
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                      <svg
                        className="h-[20px] w-[20px] text-[#D4BA8E] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
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

                {index % 2 === 0 && (
                  <div className="h-[256px] w-full overflow-hidden md:w-[276px]">
                    <img
                      src={resolveCoverImage(post)}
                      alt={post.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
              </article>
            ))}

            {visiblePosts.length > 0 ? (
              <div className="mt-12 flex items-center justify-center gap-4 text-[#8C3B11] md:mt-16 md:gap-8">
                <button
                  type="button"
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="flex h-[48px] w-[48px] md:h-[64px] md:w-[64px] items-center justify-center rounded-full bg-[#7A2606] text-white transition-colors hover:bg-[#8f3210] disabled:opacity-40"
                  aria-label="Previous blog page"
                >
                  <ArrowIcon direction="left" />
                </button>

                <div className="flex items-center gap-4 text-[18px] md:gap-8">
                  {paginationItems.map((item, index) => {
                    if (item === 'ellipsis') {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="text-[20px] font-medium text-[#B89F92]"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          ...
                        </span>
                      )
                    }

                    const isActive = item === safeCurrentPage

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`min-w-[20px] text-center text-[18px] transition-colors ${
                          isActive ? 'font-semibold text-[#7A2606]' : 'font-medium text-[#B89F92]'
                        }`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="flex h-[48px] w-[48px] md:h-[64px] md:w-[64px] items-center justify-center rounded-full bg-[#7A2606] text-white transition-colors hover:bg-[#8f3210] disabled:opacity-40"
                  aria-label="Next blog page"
                >
                  <ArrowIcon direction="right" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

export default BlogPage
