import { Fragment, useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useBlogs } from '../hooks/useBlogs'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
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

const toAbsoluteStrapiUrl = url =>
  url
    ? url.startsWith('http')
      ? url
      : `${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}${url}`
    : null

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

const stripHtml = value =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .trim()

const paragraphsFromHtml = html => {
  if (typeof html !== 'string' || !html.trim()) return []

  const matches = [...html.matchAll(/<p\b[^>]*>(.*?)<\/p>/gis)]
  if (matches.length) {
    return matches
      .map(([, inner], index) => ({
        kind: 'paragraph',
        key: `html-paragraph-${index}`,
        text: stripHtml(inner),
      }))
      .filter(node => node.text)
  }

  const text = stripHtml(html)
  return text ? [{ kind: 'paragraph', key: 'html-paragraph-0', text }] : []
}

const getPlainTextFromChildren = children =>
  Array.isArray(children)
    ? children
        .map(child => child?.text ?? '')
        .join('')
        .trim()
    : ''

const renderInlineChildren = children =>
  Array.isArray(children)
    ? children.map((child, index) => {
        const text = child?.text ?? ''
        if (!text) return null

        let node = text
        if (child.bold) node = <strong key={`bold-${index}`}>{node}</strong>
        if (child.italic) node = <em key={`italic-${index}`}>{node}</em>
        if (child.underline) node = <u key={`underline-${index}`}>{node}</u>
        if (child.strikethrough) node = <s key={`strike-${index}`}>{node}</s>
        if (child.code) node = <code key={`code-${index}`}>{node}</code>

        if (child.url) {
          node = (
            <a
              key={`link-${index}`}
              href={child.url}
              target={child.url.startsWith('http') ? '_blank' : undefined}
              rel={child.url.startsWith('http') ? 'noreferrer' : undefined}
              className="text-[#6D2005] underline decoration-[1px] underline-offset-[3px]"
            >
              {node}
            </a>
          )
        }

        return <Fragment key={index}>{node}</Fragment>
      })
    : null

const getImageFromBlock = block => {
  const imageCandidate =
    block?.image ||
    block?.media ||
    block?.asset ||
    block?.file ||
    block?.data?.image ||
    block?.data?.media ||
    block?.children?.find?.(child => child?.type === 'image')?.image

  if (typeof imageCandidate === 'string') {
    return { src: toAbsoluteStrapiUrl(imageCandidate), alt: '' }
  }

  if (!imageCandidate || typeof imageCandidate !== 'object') return null

  const src = toAbsoluteStrapiUrl(
    imageCandidate.url ||
      imageCandidate.src ||
      imageCandidate.formats?.large?.url ||
      imageCandidate.formats?.medium?.url ||
      imageCandidate.formats?.small?.url
  )

  if (!src) return null

  return {
    src,
    alt: imageCandidate.alternativeText || imageCandidate.alt || imageCandidate.name || '',
  }
}

const normalizeContentNodes = post => {
  const blogImages = Array.isArray(post?.blog_images)
    ? post.blog_images
        .filter(image => image?.url)
        .map((image, index) => ({
          src: image.url,
          alt: image.alt || '',
          key: `blog-image-${index}`,
        }))
    : []

  let nodes = []

  if (typeof post?.content === 'string' && post.content.trim()) {
    nodes = paragraphsFromHtml(post.content)
  } else if (Array.isArray(post?.content) && post.content.length) {
    let nodes = []
    let imageBuffer = []

    const flushImages = () => {
      if (!imageBuffer.length) return
      nodes.push({ kind: 'images', images: imageBuffer })
      imageBuffer = []
    }

    post.content.forEach((block, index) => {
      if (!block || typeof block !== 'object') return

      const image = getImageFromBlock(block)
      if (block.type === 'image' && image) {
        imageBuffer.push({ ...image, key: `image-${index}` })
        return
      }

      flushImages()

      if (block.type === 'heading') {
        const text = getPlainTextFromChildren(block.children)
        if (text) nodes.push({ kind: 'heading', key: `heading-${index}`, block })
        return
      }

      if (block.type === 'list' && Array.isArray(block.children)) {
        nodes.push({ kind: 'list', key: `list-${index}`, block })
        return
      }

      if (block.type === 'quote') {
        const text = getPlainTextFromChildren(block.children)
        if (text) nodes.push({ kind: 'quote', key: `quote-${index}`, block })
        return
      }

      const text = getPlainTextFromChildren(block.children)
      if (text) nodes.push({ kind: 'paragraph', key: `paragraph-${index}`, block })
    })

    flushImages()

    if (nodes.length) {
      const hasImageNode = nodes.some(node => node.kind === 'images')
      if (hasImageNode || !blogImages.length) return nodes
      return injectBlogImagesIntoNodes(nodes, blogImages)
    }

    const html = blocksToHtml(post.content)
    if (html) nodes = paragraphsFromHtml(html)
  }

  if (nodes.length) {
    if (!blogImages.length) return nodes
    return injectBlogImagesIntoNodes(nodes, blogImages)
  }

  const title = post?.title || 'Thoughtful celebrations'
  const excerpt =
    post?.excerpt ||
    'A calm and practical approach to styling, planning, and hosting memorable moments at home.'

  return [
    {
      kind: 'paragraph',
      key: 'fallback-paragraph-0',
      text: `${title} starts with a simple idea: make the experience feel intentional without making it complicated.`,
    },
    {
      kind: 'paragraph',
      key: 'fallback-paragraph-1',
      text: excerpt,
    },
  ]
}

const injectBlogImagesIntoNodes = (baseNodes, blogImages) => {
  if (!blogImages.length) return baseNodes

  const nodes = [...baseNodes]
  nodes.unshift({ kind: 'images', images: [blogImages[0]] })

  if (blogImages.length > 1) {
    const pair = blogImages.slice(1, 3)
    const insertAfter = Math.min(3, nodes.length)
    nodes.splice(insertAfter, 0, { kind: 'images', images: pair })
  }

  if (blogImages.length > 3) {
    nodes.push({ kind: 'images', images: blogImages.slice(3) })
  }

  return nodes
}

const BlogContent = ({ nodes }) => (
  <div className="mt-8 max-w-none">
    {nodes.map((node, index) => {
      if (node.kind === 'html') {
        return (
          <div
            key={`html-${index}`}
            className="prose prose-p:my-6 prose-p:max-w-none prose-p:text-[#9B9A92] prose-p:text-[16px] prose-p:leading-[150%] prose-headings:mt-10 prose-headings:text-[#202716] prose-headings:font-normal prose-strong:text-[#202716] max-w-none"
            dangerouslySetInnerHTML={{ __html: node.html }}
          />
        )
      }

      if (node.kind === 'heading') {
        return (
          <h3
            key={node.key}
            className="mt-10 text-[#202716]"
            style={{
              fontFamily: "'Malgin', serif",
              fontWeight: 400,
              fontSize: 'clamp(24px, 2.1vw, 32px)',
              lineHeight: '110%',
              letterSpacing: '0',
            }}
          >
            {renderInlineChildren(node.block.children)}
          </h3>
        )
      }

      if (node.kind === 'list') {
        const isOrdered = node.block.format === 'ordered'
        const ListTag = isOrdered ? 'ol' : 'ul'

        return (
          <ListTag
            key={node.key}
            className={`my-6 space-y-3 pl-6 text-[16px] leading-[150%] text-[#9B9A92] ${
              isOrdered ? 'list-decimal' : 'list-disc'
            }`}
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
          >
            {node.block.children.map((item, itemIndex) => (
              <li key={`${node.key}-item-${itemIndex}`}>{renderInlineChildren(item.children)}</li>
            ))}
          </ListTag>
        )
      }

      if (node.kind === 'quote') {
        return (
          <blockquote
            key={node.key}
            className="my-8 border-l border-[#CDC7BE] pl-6 text-[#6D2005]"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: '18px',
              lineHeight: '160%',
              letterSpacing: '0',
            }}
          >
            {renderInlineChildren(node.block.children)}
          </blockquote>
        )
      }

      if (node.kind === 'images') {
        const isPair = node.images.length === 2

        return (
          <div
            key={`images-${index}`}
            className={`my-10 grid gap-4 md:gap-6 ${isPair ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
          >
            {node.images.map(image => (
              <div key={image.key} className="overflow-hidden bg-white">
                <img
                  src={image.src}
                  alt={image.alt}
                  className={`w-full object-cover ${isPair ? 'h-[180px] sm:h-[220px] lg:h-[240px]' : 'h-[240px] sm:h-[320px] lg:h-[360px]'}`}
                />
              </div>
            ))}
          </div>
        )
      }

      if (node.kind === 'paragraph' && node.text) {
        return (
          <p
            key={node.key}
            className="my-6 text-[#9B9A92]"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '150%',
              letterSpacing: '0',
            }}
          >
            {node.text}
          </p>
        )
      }

      return (
        <p
          key={node.key}
          className="my-6 text-[#9B9A92]"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '150%',
            letterSpacing: '0',
          }}
        >
          {renderInlineChildren(node.block.children)}
        </p>
      )
    })}
  </div>
)

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
  const currentBlogQuery = useBlogs({ limit: 1, slug })
  const allBlogsQuery = useBlogs({ limit: 50 })
  const { data: currentBlogData = [] } = currentBlogQuery
  const { data: allBlogs = [] } = allBlogsQuery
  const isStrapiLoading = useStrapiPageLoading(currentBlogQuery, allBlogsQuery)

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
  const contentNodes = useMemo(() => normalizeContentNodes(currentPost), [currentPost])

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
      { threshold: 0.05, rootMargin: '0px 0px -2% 0px' }
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
  if (isStrapiLoading) return <CmsPageLoader />
  if (!currentPost && currentBlogQuery.isFetched) return <Navigate to="/blogs" replace />
  if (!currentPost) return null

  return (
    <main ref={pageRef} className="single-blog-page min-h-screen bg-[#F7F4EE] text-[#202716]">
      <section
        data-nav-theme="glass"
        data-nav-surface="transparent"
        className="bg-[#CBB9A7] px-6 pb-14 pt-24 sm:pt-26 md:px-10 md:pt-28 lg:px-[96px] lg:pb-20 lg:pt-10 xl:pt-12"
      >
        <div className="mx-auto max-w-[1760px]">
          <div className="mt-14 md:mt-20 lg:mt-24">
            <div className="mx-auto max-w-[860px] text-center lg:max-w-[1080px] reveal-on-scroll">
              <h1
                className="font-display mx-auto max-w-[1080px] text-center text-[46px] leading-[0.95] text-[#6D2005] sm:text-[58px] md:text-[74px] lg:text-[100px]"
                style={{ fontWeight: 400, letterSpacing: '0' }}
              >
                <RevealLine>{currentPost.title}</RevealLine>
              </h1>
            </div>

            <div className="mt-12">
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
        <div className="mx-auto grid max-w-[1760px] items-start gap-14 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-[90px]">
          <aside className="single-blog-sidebar-border reveal-border-y relative order-2 self-start lg:order-1 lg:sticky lg:top-28 lg:pr-10">
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

          <article className="order-1 self-start lg:order-2">
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

            <div className="anim-element slide-from-right" style={{ '--delay': '0s' }}>
              <BlogContent nodes={contentNodes} />
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default SingleBlogPage
