/**
 * Fallback blog/guide data — mirrors live Strapi `blogs` on elewen.co.in.
 * Covers use offline copies under `public/offline-media/blogs/` so they work when Strapi is down.
 */

import { OFFLINE_BLOG_COVERS_BY_SLUG } from './offlineMedia'

export const BLOG_CATEGORIES_FALLBACK = ['Wedding', 'Corporate', 'Planning Tips']

export const BLOGS_FALLBACK = [
  {
    id: 40,
    documentId: null,
    title: '5 Wedding Decoration Trends for 2025 You Need to Know',
    slug: '5-wedding-decoration-trends-for-2025-you-need-to-know',
    excerpt:
      'From organic florals to dramatic lighting, discover the wedding decor trends that are defining celebrations this year.',
    category: 'Wedding',
    content: '',
    author: 'Elewen Studio',
    post_published_at: '2026-04-01T00:00:00.000Z',
    cover_image:
      OFFLINE_BLOG_COVERS_BY_SLUG['5-wedding-decoration-trends-for-2025-you-need-to-know'],
    blog_images: [],
  },
  {
    id: 41,
    documentId: null,
    title: 'How to Plan a Corporate Event That People Actually Enjoy',
    slug: 'how-to-plan-a-corporate-event-that-people-actually-enjoy',
    excerpt:
      "Corporate events don't have to be boring. Here's how to create engaging experiences your team will look forward to.",
    category: 'Corporate',
    content: '',
    author: 'Elewen Studio',
    post_published_at: '2026-03-20T00:00:00.000Z',
    cover_image:
      OFFLINE_BLOG_COVERS_BY_SLUG['how-to-plan-a-corporate-event-that-people-actually-enjoy'],
    blog_images: [],
  },
  {
    id: 50,
    documentId: null,
    title: '10 Ideas for a Perfect Birthday Party at Home',
    slug: '10-ideas-for-a-perfect-birthday-party-at-home',
    excerpt:
      'Planning a birthday at home? Here are 10 easy, beautiful ideas that will make the celebration memorable without the stress.',
    category: 'Planning Tips',
    content: '',
    author: 'Elewen Studio',
    post_published_at: '2026-03-10T00:00:00.000Z',
    cover_image: OFFLINE_BLOG_COVERS_BY_SLUG['10-ideas-for-a-perfect-birthday-party-at-home'],
    blog_images: [],
  },
]
