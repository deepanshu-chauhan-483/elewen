import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import heroLeft from '../assets/images/IMG_3001.jpg'
import heroRight from '../assets/images/IMG_7025.jpg'
import blogImg1 from '../assets/images/IMG_0658.jpg'
import blogImg2 from '../assets/images/outdoor-party-setup-with-balloons-and-decorations-2026-03-18-09-29-30-utc.jpg'
import blogImg3 from '../assets/images/IMG_3148.jpg'

const categories = ['All', 'Planning Tips', 'Decor Inspiration', 'Hosting Guide', 'Food & Catering']

const blogPosts = [
  {
    title: '5 Simple Decor Ideas for Small Gatherings',
    slug: '5-simple-decor-ideas-for-small-gatherings',
    date: 'January 12, 2023',
    excerpt: 'Easy styling ideas that make your space feel celebration-ready without overdoing it.',
    category: 'Decor Inspiration',
    image: blogImg1,
  },
  {
    title: 'What to Include in a Catering Menu for House Parties',
    slug: 'what-to-include-in-a-catering-menu-for-house-parties',
    date: 'January 12, 2023',
    excerpt: 'A practical breakdown of food, portions, and service styles for smooth hosting.',
    category: 'Food & Catering',
    image: blogImg2,
  },
  {
    title: 'Behind a Birthday Setup: From Planning to Execution',
    slug: 'behind-a-birthday-setup-from-planning-to-execution',
    date: 'January 12, 2023',
    excerpt: 'A look at how a simple birthday celebration comes together step by step.',
    category: 'Planning Tips',
    image: blogImg3,
  },
]

const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState('All')

  const visiblePosts = useMemo(() => {
    if (activeCategory === 'All') return blogPosts
    return blogPosts.filter(post => post.category === activeCategory)
  }, [activeCategory])

  return (
    <main className="min-h-screen bg-[#F7F4EE] font-sans text-[#202716]">
      <section
        data-nav-theme="glass"
        data-nav-surface="transparent"
        className="bg-[#CBB9A7] px-6 pb-16 pt-24 sm:pt-26 md:px-10 md:pt-28 lg:px-[96px] lg:pb-24 lg:pt-10 xl:pt-12"
      >
        <div className="mx-auto max-w-[1720px]">
          <div className="relative mt-14 md:mt-20 lg:mt-24">
            <div className="mx-auto max-w-[720px] text-center md:max-w-[820px] lg:absolute lg:left-1/2 lg:top-[-120px] lg:z-10 lg:w-[920px] lg:max-w-none lg:-translate-x-1/2 xl:w-[980px]">
              <h1
                className="mx-auto max-w-[980px] text-center text-[44px] leading-[1] text-[#6D2005] sm:text-[52px] md:text-[64px] lg:text-[80px]"
                style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
              >
                Ideas, Guides &amp;
                <br />
                Real Celebrations
              </h1>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-[1.08fr_0.92fr] lg:mt-[250px] lg:grid-cols-[664px_560px] lg:items-start lg:justify-start lg:gap-4 lg:pl-[100px]">
              <div className="h-[320px] overflow-hidden md:h-[480px] lg:h-[380px] lg:w-[664px]">
                <img
                  src={heroLeft}
                  alt="Celebration moment"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="h-[220px] overflow-hidden self-start md:mt-16 md:h-[300px] lg:mt-0 lg:h-[260px] lg:w-[560px]">
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
          <aside className="border-b border-[#A7AE98] pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
            <div className="flex flex-wrap gap-x-8 gap-y-4 lg:block lg:space-y-8">
              {categories.map(category => {
                const active = activeCategory === category
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`relative text-left text-[16px] w-full leading-[1.5] ${
                      active ? 'text-[#202716]' : 'text-[#9B9A92]'
                    }`}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0',
                    }}
                  >
                    {category}
                    {active && <span className="mt-2 block h-[1px] w-[42px] bg-[#A7AE98]" />}
                  </button>
                )
              })}
            </div>
          </aside>

          <div>
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
                  <div className="order-2 h-[256px] w-full overflow-hidden lg:order-1 lg:w-[276px]">
                    <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                  </div>
                )}

                <div className={index % 2 === 1 ? 'order-1 lg:order-2' : ''}>
                  <p
                    className="text-[16px] leading-[1.5] text-[#A77B45]"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      letterSpacing: '0',
                    }}
                  >
                    {post.date}
                  </p>

                  <h2
                    className="mt-3 max-w-[760px] text-[32px] leading-[1] text-[#171717] lg:text-[36px]"
                    style={{ fontFamily: "'Malgin', serif", fontWeight: 400, letterSpacing: '0' }}
                  >
                    {post.title}
                  </h2>

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
                  <div className="h-[256px] w-full overflow-hidden lg:w-[276px]">
                    <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                  </div>
                )}
              </article>
            ))}

            <div className="mt-10 flex items-center justify-center gap-5 md:gap-8 lg:mt-14">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6D2005] text-white md:h-14 md:w-14"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19 8 12l7-7" />
                </svg>
              </button>
              <div
                className="flex items-center gap-5 text-[16px] leading-[1.5] text-[#B9A89A] md:gap-7"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, letterSpacing: '0' }}
              >
                <span className="text-[#6D2005]">1</span>
                <span>2</span>
                <span>3</span>
                <span>...</span>
                <span>12</span>
              </div>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6D2005] text-white md:h-14 md:w-14"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default BlogPage
