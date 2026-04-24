import { useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useBlogs } from '../hooks/useBlogs'
import blogImg1 from '../assets/images/IMG_0658.jpg'
import blogImg2 from '../assets/images/outdoor-party-setup-with-balloons-and-decorations-2026-03-18-09-29-30-utc.jpg'
import blogImg3 from '../assets/images/IMG_3148.jpg'

const fallbackImagesByCategory = {
  'Planning Tips': blogImg3,
  'Decor Inspiration': blogImg1,
  'Hosting Guide': blogImg2,
  'Food & Catering': blogImg2,
}

const resolveCoverImage = post => {
  if (post?.cover_image) return post.cover_image
  return fallbackImagesByCategory[post?.category] || blogImg1
}

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

const escapeHtml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const blocksToHtml = blocks => {
  if (!Array.isArray(blocks)) return ''

  return blocks
    .map(block => {
      const text = (block.children ?? [])
        .map(child => child.text ?? '')
        .join('')
        .trim()
      if (!text) return ''

      if (block.type === 'heading') return `<h3>${escapeHtml(text)}</h3>`
      return `<p>${escapeHtml(text)}</p>`
    })
    .filter(Boolean)
    .join('')
}

const getContentHtml = post => {
  if (typeof post?.content === 'string' && post.content.trim()) return post.content
  if (Array.isArray(post?.content)) {
    const html = blocksToHtml(post.content)
    if (html) return html
  }

  const title = post?.title || 'Thoughtful celebrations'
  const excerpt =
    post?.excerpt ||
    'A calm and practical approach to styling, planning, and hosting memorable moments at home.'

  return `<p>${escapeHtml(title)} starts with a simple idea: make the experience feel intentional without making it complicated.</p><p>${escapeHtml(excerpt)}</p>`
}

const RevealLine = ({ children, delay, className = '' }) => (
  <span className={`reveal-wrapper block ${className}`.trim()}>
    <span className="reveal-text" style={delay ? { animationDelay: delay } : undefined}>
      {children}
    </span>
  </span>
)

const SingleBlogPage = () => {
  const pageRef = useRef(null)
  const { slug } = useParams()
  const {
    data: currentBlogData = [],
    isLoading: isCurrentBlogLoading,
    isFetching: isCurrentBlogFetching,
    isFetched: isCurrentBlogFetched,
  } = useBlogs({ limit: 1, slug })
  const { data: allBlogs = [] } = useBlogs({ limit: 50 })

  const currentPost = currentBlogData[0] ?? null

  const relatedPosts = useMemo(() => {
    if (!currentPost) return []

    return allBlogs
      .filter(post => post.slug !== currentPost.slug)
      .sort((a, b) => {
        if (a.category === currentPost.category && b.category !== currentPost.category) return -1
        if (a.category !== currentPost.category && b.category === currentPost.category) return 1
        return 0
      })
      .slice(0, 3)
  }, [allBlogs, currentPost])

  const heroImage = resolveCoverImage(currentPost)
  const publishedDate = formatPublishedDate(currentPost?.post_published_at)
  const contentHtml = useMemo(() => getContentHtml(currentPost), [currentPost])

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
          text.style.animationDelay = '0s'
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
  }, [currentPost])

  if (!slug) return <Navigate to="/blogs" replace />
  if (!currentPost && (isCurrentBlogLoading || isCurrentBlogFetching || !isCurrentBlogFetched)) {
    return (
      <main className="min-h-screen bg-[#F7F4EE] px-6 py-24 text-[#202716] md:px-10 lg:px-[96px]">
        <div className="mx-auto max-w-[1760px]">
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '150%',
              letterSpacing: '0',
            }}
          >
            Loading blog...
          </p>
        </div>
      </main>
    )
  }
  if (isCurrentBlogFetched && !currentPost) return <Navigate to="/blogs" replace />

  return (
    <main ref={pageRef} className="single-blog-page min-h-screen bg-[#F7F4EE] text-[#202716]">
      <section
        data-nav-theme="glass"
        data-nav-surface="transparent"
        className="bg-[#CBB9A7] px-6 pb-14 pt-24 sm:pt-26 md:px-10 md:pt-28 lg:px-[96px] lg:pb-20 lg:pt-10 xl:pt-12"
      >
        <div className="mx-auto max-w-[1760px]">
          <div className="relative mt-14 md:mt-20 lg:mt-24">
            <div className="mx-auto max-w-[860px] text-center lg:absolute lg:left-1/2 lg:top-[-98px] lg:z-10 lg:w-[1080px] lg:max-w-none lg:-translate-x-1/2 reveal-on-scroll">
              <h1
                className="font-display mx-auto max-w-[1080px] text-center text-[46px] leading-[0.95] text-[#6D2005] sm:text-[58px] md:text-[74px] lg:text-[100px]"
                style={{ fontWeight: 400, letterSpacing: '0' }}
              >
                <RevealLine>{currentPost.title}</RevealLine>
              </h1>
            </div>

            <div className="mt-12 lg:mt-[250px]">
              <div className="anim-element slide-from-bottom overflow-hidden bg-white">
                <img
                  src={heroImage}
                  alt={currentPost.title}
                  className="h-[320px] w-full object-cover sm:h-[420px] md:h-[520px] lg:h-[620px]"
                />
              </div>

              <div
                className="anim-element slide-from-bottom mt-5 flex items-center justify-between gap-4 text-white"
                style={{ '--delay': '0s' }}
              >
                <p
                  className="text-[18px] leading-[1.2] sm:text-[22px]"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    letterSpacing: '0',
                  }}
                >
                  {currentPost.author || 'Elewen Studio'}
                </p>
                <p
                  className="text-right text-[18px] leading-[1.2] sm:text-[22px]"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    letterSpacing: '0',
                  }}
                >
                  {publishedDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:px-10 lg:px-[96px] lg:py-24">
        <div className="mx-auto grid max-w-[1760px] gap-14 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-[90px]">
          <aside className="single-blog-sidebar-border reveal-border-y relative order-2 lg:order-1 lg:pr-10">
            <div className="absolute right-0 top-0 hidden h-full w-[1px] bg-[#CDC7BE] lg:block border-fill-y" />
            <h2
              className="reveal-on-scroll text-[#202716]"
              style={{
                fontFamily: "'Malgin', serif",
                fontWeight: 400,
                fontSize: '27px',
                lineHeight: '100%',
                letterSpacing: '0',
              }}
            >
              <RevealLine>You May Also Like</RevealLine>
            </h2>

            <div className="mt-10 space-y-8">
              {relatedPosts.map(post => (
                <article
                  key={post.slug}
                  className="anim-element slide-from-left border-b border-[#CDC7BE] pb-8 last:border-b-0 last:pb-0"
                  style={{ '--delay': '0s' }}
                >
                  <Link to={`/blogs/${post.slug}`} className="block">
                    <p
                      className="text-[#A77B45]"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '150%',
                        letterSpacing: '0',
                        verticalAlign: 'bottom',
                      }}
                    >
                      {formatPublishedDate(post.post_published_at)}
                    </p>

                    <h3
                      className="mt-4 text-[#202716] transition-colors duration-300 hover:text-[#6D2005]"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        fontSize: '21px',
                        lineHeight: '120%',
                        letterSpacing: '0',
                      }}
                    >
                      {post.title}
                    </h3>

                    <p
                      className="mt-4 max-w-[360px] text-[#9B9A92]"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '150%',
                        letterSpacing: '0',
                      }}
                    >
                      {post.excerpt}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </aside>

          <article className="order-1 lg:order-2">
            <h2
              className="reveal-on-scroll max-w-[900px] text-[#202716]"
              style={{
                fontFamily: "'Malgin', serif",
                fontWeight: 400,
                fontSize: 'clamp(34px, 4vw, 47px)',
                lineHeight: '100%',
                letterSpacing: '0',
              }}
            >
              <RevealLine>{currentPost.title}</RevealLine>
            </h2>

            <div
              className="anim-element slide-from-right prose prose-p:my-6 prose-p:max-w-none prose-p:text-[#9B9A92] prose-p:text-[16px] prose-p:leading-[150%] prose-headings:mt-10 prose-headings:text-[#202716] prose-headings:font-normal prose-strong:text-[#202716] mt-8 max-w-none"
              style={{ '--delay': '0s' }}
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </article>
        </div>
      </section>
    </main>
  )
}

export default SingleBlogPage
