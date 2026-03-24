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
  // Planning Tips
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
    title: 'Your First Event Planning Checklist: What to Do and When',
    slug: 'first-event-planning-checklist',
    excerpt:
      'A week-by-week breakdown of what needs to happen before your event — so nothing falls through.',
    category: 'Planning Tips',
    post_status: 'published',
    cover_image: null,
  },
  {
    id: 2,
    documentId: null,
    title: 'How to Set a Realistic Budget for Your Next Celebration',
    slug: 'realistic-event-budget-guide',
    excerpt:
      'Understand where your money goes — decor, food, setup — and how to allocate it without surprises.',
    category: 'Planning Tips',
    post_status: 'published',
    cover_image: null,
  },
  // Decor Inspiration
  {
    id: 3,
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
    id: 4,
    documentId: null,
    title: 'Balloon Styling Trends That Work for Any Celebration',
    slug: 'balloon-styling-trends',
    excerpt:
      'From organic arches to hanging clusters — how to use balloons beautifully without going overboard.',
    category: 'Decor Inspiration',
    post_status: 'published',
    cover_image: null,
  },
  {
    id: 5,
    documentId: null,
    title: 'How Lighting Changes the Mood of Your Event Space',
    slug: 'lighting-changes-event-mood',
    excerpt:
      'Warm fairy lights, spotlights, and candle setups — the simple choices that make a space feel intentional.',
    category: 'Decor Inspiration',
    post_status: 'published',
    cover_image: null,
  },
  // Hosting Guide
  {
    id: 6,
    documentId: null,
    title: 'The Perfect Hosting Checklist for House Parties',
    slug: 'hosting-checklist-house-parties',
    excerpt:
      'Everything you need before, during, and after your party — from setup and prep to post-event cleanup.',
    category: 'Hosting Guide',
    post_status: 'published',
    cover_image: null,
  },
  {
    id: 7,
    documentId: null,
    title: 'How to Be Present at Your Own Party (Without Worrying About Setup)',
    slug: 'be-present-at-your-own-party',
    excerpt:
      'Tips for delegating, preparing in advance, and letting go — so you enjoy the day as a host, not a manager.',
    category: 'Hosting Guide',
    post_status: 'published',
    cover_image: null,
  },
  {
    id: 8,
    documentId: null,
    title: 'Managing Guests, Timings, and Surprises on Event Day',
    slug: 'managing-guests-event-day',
    excerpt:
      'A calm, practical guide to handling the unexpected — late arrivals, layout changes, and last-minute requests.',
    category: 'Hosting Guide',
    post_status: 'published',
    cover_image: null,
  },
  // Food & Catering
  {
    id: 9,
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
    id: 10,
    documentId: null,
    title: 'Mocktail Menus That Work for Every Type of Celebration',
    slug: 'mocktail-menus-for-celebrations',
    excerpt:
      'From house parties to corporate gatherings — how to set up a bar that feels festive and inclusive.',
    category: 'Food & Catering',
    post_status: 'published',
    cover_image: null,
  },
  {
    id: 11,
    documentId: null,
    title: 'Dessert Table Ideas That Double as Decor',
    slug: 'dessert-table-ideas',
    excerpt:
      'Styled cake setups, tiered desserts, and sweet displays that are both beautiful and delicious.',
    category: 'Food & Catering',
    post_status: 'published',
    cover_image: null,
  },
]
