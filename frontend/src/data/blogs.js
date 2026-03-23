/**
 * Fallback blog/guide data — mirrors the Strapi `blogs` content type.
 *
 * Strapi fields (Week 1 schema):
 *   title, slug, excerpt, body (rich text), cover_image (media),
 *   post_status ('draft'|'published'), post_published_at,
 *   category (Planning Tips | Decor Inspiration | Hosting Guide | Food & Catering)
 *
 * Note: field is `post_status` not `status` — Strapi reserved name workaround.
 * Note: field is `post_published_at` not `published_at` — same reason.
 * See: memory/project_schema_deviations.md
 *
 * Strapi endpoint:
 *   GET /api/blogs?filters[post_status][$eq]=published&sort=post_published_at:desc&populate=cover_image
 */

export const BLOG_CATEGORIES_FALLBACK = [
  'Planning Tips',
  'Decor Inspiration',
  'Hosting Guide',
  'Food & Catering',
]

export const BLOGS_FALLBACK = [
  {
    id: 0,
    documentId: null,
    title: 'How to Plan a Birthday Celebration at Home Without the Stress',
    slug: 'plan-birthday-celebration-at-home',
    excerpt:
      'A practical guide to organizing decor, food, and setup without managing multiple vendors.',
    category: 'Planning Tips',
    post_status: 'published',
    cover_image: null,
  },
  {
    id: 1,
    documentId: null,
    title: '5 Simple Decor Ideas That Instantly Elevate a House Party',
    slug: '5-decor-ideas-house-party',
    excerpt:
      'Easy styling ideas using backdrops, lighting, and small details to transform your space.',
    category: 'Decor Inspiration',
    post_status: 'published',
    cover_image: null,
  },
  {
    id: 2,
    documentId: null,
    title: 'Choosing the Right Catering Menu for Your Event',
    slug: 'choosing-catering-menu',
    excerpt:
      'Understand how guest count, menu style, and service format affect your event experience.',
    category: 'Food & Catering',
    post_status: 'published',
    cover_image: null,
  },
  {
    id: 3,
    documentId: null,
    title: 'The Perfect Hosting Checklist for House Parties',
    slug: 'hosting-checklist-house-parties',
    excerpt:
      'Everything you need before, during, and after your party — from setup and prep to post-event cleanup.',
    category: 'Hosting Guide',
    post_status: 'published',
    cover_image: null,
  },
]
