import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBlogCategories, useBlogs } from '../hooks/useBlogs'
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

const fallbackDates = [
  'April 3, 2026',
  'March 28, 2026',
  'March 19, 2026',
  'March 8, 2026',
  'February 24, 2026',
  'February 10, 2026',
]

const resolveCoverImage = post =>
  post?.cover_image || fallbackImagesByCategory[post?.category] || blogImg1

const resolvePublishedDate = index => fallbackDates[index % fallbackDates.length]

const RevealLine = ({ children, delay, className = '' }) => (
  <span className={`reveal-wrapper block ${className}`.trim()}>
    <span className="reveal-text" style={delay ? { animationDelay: delay } : undefined}>
      {children}
    </span>
  </span>
)

const BlogPage = () => {
  const pageRef = useRef(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const { data: blogCategories = [] } = useBlogCategories()
  const { data: blogPosts = [] } = useBlogs({ limit: 50 })

  const categories = useMemo(
    () => ['All', ...(Array.isArray(blogCategories) ? blogCategories : [])],
    [blogCategories]
  )

  const visiblePosts = useMemo(() => {
    if (activeCategory === 'All') return blogPosts
    return blogPosts.filter(post => post.category === activeCategory)
  }, [activeCategory, blogPosts])

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

  return (
    <main ref={pageRef} className="blog-page min-h-screen bg-[#F7F4EE] font-sans text-[#202716]">
      <section
        data-nav-theme="glass"
        data-nav-surface="transparent"
        className="bg-[#CBB9A7] px-6 pb-16 pt-24 sm:pt-26 md:px-10 md:pt-28 lg:px-[96px] lg:pb-24 lg:pt-10 xl:pt-12"
      >
        <div className="mx-auto max-w-[1720px]">
          <div className="relative mt-14 md:mt-20 lg:mt-24">
            <div className="mx-auto max-w-[720px] text-center md:max-w-[820px] lg:absolute lg:left-1/2 lg:top-[-120px] lg:z-10 lg:w-[920px] lg:max-w-none lg:-translate-x-1/2 xl:w-[980px] reveal-on-scroll">
              <h1
                className="mx-auto max-w-[980px] text-center text-[44px] leading-[1] text-[#6D2005] sm:text-[52px] md:text-[64px] lg:text-[80px]"
                style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
              >
                <RevealLine>Ideas, Guides &amp;</RevealLine>
                <RevealLine delay="0.06s">Real Celebrations</RevealLine>
              </h1>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-[1.08fr_0.92fr] lg:mt-[250px] lg:grid-cols-[664px_560px] lg:items-start lg:justify-start lg:gap-4 lg:pl-[100px]">
              <div className="anim-element slide-from-bottom h-[320px] overflow-hidden md:h-[480px] lg:h-[380px] lg:w-[664px]">
                <img
                  src={heroLeft}
                  alt="Celebration moment"
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className="anim-element slide-from-bottom h-[220px] overflow-hidden self-start md:mt-16 md:h-[300px] lg:mt-0 lg:h-[260px] lg:w-[560px]"
                style={{ '--delay': '0s' }}
              >
                <img
                  src={heroRight}
                  alt="Decorated event space"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className=" md:px-10 lg:px-[96px] lg:py-20">
        <div className="mx-auto grid max-w-[1720px] gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="reveal-border-y relative border-b border-[#A7AE98] pb-5 lg:border-b-0 lg:pb-0 lg:pr-10">
            <div className="absolute right-0 top-0 hidden h-full w-[1px] bg-[#A7AE98] lg:block border-fill-y" />
            <div className="flex flex-wrap gap-x-8 gap-y-4 lg:block lg:space-y-8">
              {categories.map(category => {
                const active = activeCategory === category
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`reveal-on-scroll relative text-left text-[16px] w-full leading-[1.5] ${
                      active ? 'text-[#202716]' : 'text-[#9B9A92]'
                    }`}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0',
                    }}
                  >
                    <RevealLine delay="0s">{category}</RevealLine>
                    {active && <span className="mt-2 block h-[1px] w-[42px] bg-[#A7AE98]" />}
                  </button>
                )
              })}
            </div>
          </aside>

          <div>
            {visiblePosts.length === 0 ? (
              <div className="anim-element slide-from-bottom border-b border-[#DDD7CE] py-10">
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

            {visiblePosts.map((post, index) => (
              <article
                key={post.title}
                className={`grid gap-8 border-b border-[#DDD7CE] py-8 md:py-10 lg:items-start lg:gap-10 ${
                  index % 2 === 0
                    ? 'lg:grid-cols-[minmax(0,1fr)_276px]'
                    : 'lg:grid-cols-[276px_minmax(0,1fr)]'
                }`}
              >
                {index % 2 === 1 && (
                  <div
                    className="anim-element slide-from-left order-2 h-[256px] w-full overflow-hidden lg:order-1 lg:w-[276px]"
                    style={{ '--delay': '0s' }}
                  >
                    <img
                      src={resolveCoverImage(post)}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`anim-element slide-from-right ${index % 2 === 1 ? 'order-1 lg:order-2' : ''}`}
                  style={{ '--delay': '0s' }}
                >
                  <p
                    className="text-[16px] leading-[1.5] text-[#A77B45]"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      letterSpacing: '0',
                    }}
                  >
                    {resolvePublishedDate(index)}
                  </p>

                  <Link to={`/blogs/${post.slug}`} className="block">
                    <h2
                      className="mt-3 max-w-[760px] text-[32px] leading-[1] text-[#171717] transition-colors duration-300 hover:text-[#6D2005] lg:text-[36px]"
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
                        className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </div>
                  </Link>
                </div>

                {index % 2 === 0 && (
                  <div
                    className="anim-element slide-from-right h-[256px] w-full overflow-hidden lg:w-[276px]"
                    style={{ '--delay': '0.5s' }}
                  >
                    <img
                      src={resolveCoverImage(post)}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default BlogPage
