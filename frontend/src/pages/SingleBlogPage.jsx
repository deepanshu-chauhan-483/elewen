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

const fallbackDates = [
  'April 3, 2026',
  'March 28, 2026',
  'March 19, 2026',
  'March 8, 2026',
  'February 24, 2026',
  'February 10, 2026',
]

const localBlogPagePosts = [
  {
    id: 100,
    title: '5 Simple Decor Ideas for Small Gatherings',
    slug: '5-simple-decor-ideas-for-small-gatherings',
    excerpt: 'Easy styling ideas that make your space feel celebration-ready without overdoing it.',
    category: 'Decor Inspiration',
    cover_image: blogImg1,
  },
  {
    id: 101,
    title: 'What to Include in a Catering Menu for House Parties',
    slug: 'what-to-include-in-a-catering-menu-for-house-parties',
    excerpt: 'A practical breakdown of food, portions, and service styles for smooth hosting.',
    category: 'Food & Catering',
    cover_image: blogImg2,
  },
  {
    id: 102,
    title: 'Behind a Birthday Setup: From Planning to Execution',
    slug: 'behind-a-birthday-setup-from-planning-to-execution',
    excerpt: 'A look at how a simple birthday celebration comes together step by step.',
    category: 'Planning Tips',
    cover_image: blogImg3,
  },
]

const textOnlyArticleSlugs = new Set(['behind-a-birthday-setup-from-planning-to-execution'])

const buildArticleBlocks = post => {
  if (!post) return []

  const title = post.title || 'Thoughtful celebrations'
  const category = post.category || 'Celebration Guide'
  const excerpt =
    post.excerpt ||
    'A calm and practical approach to styling, planning, and hosting memorable moments at home.'
  const coverImage = resolveCoverImage(post)

  if (textOnlyArticleSlugs.has(post.slug)) {
    return [
      {
        type: 'text',
        paragraphs: [
          `${title} starts with a simple idea: make the experience feel intentional without making it complicated. In ${category.toLowerCase()}, the strongest details are usually the ones that support the mood quietly, from the first visual impression to the final guest touchpoint.`,
          `${excerpt} When the layout, decor, and hosting flow work together, the whole celebration feels more personal and more polished. That balance is what turns a pretty setup into a space people genuinely enjoy being in.`,
          `A strong setup does not need too many moving parts. Repeating a few materials, keeping the palette consistent, and giving one focal element room to stand out can make the event feel elevated while still staying easy to manage.`,
          `The goal is not to fill every corner. It is to make the room feel considered. Once the key visual moments are in place, the rest of the experience becomes lighter, smoother, and easier for everyone involved.`,
          `Thoughtful styling, comfortable flow, and well-placed visual moments are often what make a celebration feel complete. When those parts work together, the experience becomes memorable without ever feeling overloaded.`,
        ],
      },
    ]
  }

  return [
    {
      type: 'image-full',
      image: coverImage,
      alt: title,
    },
    {
      type: 'text',
      paragraphs: [
        `${title} starts with a simple idea: make the experience feel intentional without making it complicated. In ${category.toLowerCase()}, the strongest details are usually the ones that support the mood quietly, from the first visual impression to the final guest touchpoint.`,
        `${excerpt} When the layout, decor, and hosting flow work together, the whole celebration feels more personal and more polished. That balance is what turns a pretty setup into a space people genuinely enjoy being in.`,
      ],
    },
    {
      type: 'image-grid',
      images: [
        {
          src: coverImage,
          alt: `${title} detail one`,
        },
        {
          src: fallbackImagesByCategory[category] || blogImg2,
          alt: `${title} detail two`,
        },
      ],
    },
    {
      type: 'text',
      paragraphs: [
        `A strong setup does not need too many moving parts. Repeating a few materials, keeping the palette consistent, and giving one focal element room to stand out can make the event feel elevated while still staying easy to manage.`,
        `The goal is not to fill every corner. It is to make the room feel considered. Once the key visual moments are in place, the rest of the experience becomes lighter, smoother, and easier for everyone involved.`,
        `Thoughtful styling, comfortable flow, and well-placed visual moments are often what make a celebration feel complete. When those parts work together, the experience becomes memorable without ever feeling overloaded.`,
      ],
    },
  ]
}

const resolveCoverImage = post => {
  if (post?.cover_image) return post.cover_image
  return fallbackImagesByCategory[post?.category] || blogImg1
}

const resolvePublishedDate = index => fallbackDates[index % fallbackDates.length]

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
  const { data: blogs = [] } = useBlogs({ limit: 12 })
  const allPosts = useMemo(() => [...localBlogPagePosts, ...blogs], [blogs])

  const currentPost = useMemo(
    () => allPosts.find(post => post.slug === slug) ?? null,
    [allPosts, slug]
  )

  const relatedPosts = useMemo(() => {
    if (!currentPost) return []

    return allPosts
      .filter(post => post.slug !== currentPost.slug)
      .sort((a, b) => {
        if (a.category === currentPost.category && b.category !== currentPost.category) return -1
        if (a.category !== currentPost.category && b.category === currentPost.category) return 1
        return 0
      })
      .slice(0, 3)
  }, [allPosts, currentPost])

  const articleBlocks = useMemo(() => buildArticleBlocks(currentPost), [currentPost])
  const heroImage = resolveCoverImage(currentPost)

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
  if (!currentPost) return <Navigate to="/blogs" replace />

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
                  Elewen Studio
                </p>
                <p
                  className="text-right text-[18px] leading-[1.2] sm:text-[22px]"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    letterSpacing: '0',
                  }}
                >
                  {resolvePublishedDate(currentPost.id ?? 0)}
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
              {relatedPosts.map((post, index) => (
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
                      {resolvePublishedDate(index + 1)}
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

            <div className="mt-8 space-y-10">
              {articleBlocks.map((block, index) => {
                if (block.type === 'image-full') {
                  return (
                    <div
                      key={`${block.type}-${index}`}
                      className="anim-element slide-from-right overflow-hidden bg-white"
                      style={{ '--delay': '0s' }}
                    >
                      <img
                        src={block.image}
                        alt={block.alt}
                        className="h-[220px] w-full object-cover sm:h-[320px] lg:h-[388px]"
                      />
                    </div>
                  )
                }

                if (block.type === 'image-grid') {
                  return (
                    <div
                      key={`${block.type}-${index}`}
                      className="grid gap-4 sm:grid-cols-2 lg:gap-[18px]"
                    >
                      {block.images.map((image, imageIndex) => (
                        <div
                          key={image.alt}
                          className={`anim-element overflow-hidden bg-white ${imageIndex === 0 ? 'slide-from-left' : 'slide-from-right'}`}
                          style={{ '--delay': '0s' }}
                        >
                          <img
                            src={image.src}
                            alt={image.alt}
                            className="h-[220px] w-full object-cover sm:h-[280px] lg:h-[320px]"
                          />
                        </div>
                      ))}
                    </div>
                  )
                }

                return (
                  <div
                    key={`${block.type}-${index}`}
                    className="anim-element slide-from-right space-y-7"
                    style={{ '--delay': '0s' }}
                  >
                    {block.paragraphs.map(paragraph => (
                      <p
                        key={paragraph}
                        className="max-w-[980px] text-[#9B9A92]"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 400,
                          fontSize: '16px',
                          lineHeight: '150%',
                          letterSpacing: '0',
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )
              })}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default SingleBlogPage
