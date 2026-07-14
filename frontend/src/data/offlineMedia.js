/**
 * Offline media served from Vite `public/offline-media`.
 * Used when Strapi is down / USE_FALLBACK, or when CMS icon/cover fields are empty.
 */

export const OFFLINE_SERVICE_IMAGES = {
  decor: '/offline-media/services/decor.png',
  decoration: '/offline-media/services/decoration.jpg',
  furniture: '/offline-media/services/furniture.png',
  'rental-furniture': '/offline-media/services/furniture.png',
  'technical-showrunning': '/offline-media/services/technical-showrunning.jpg',
  catering: '/offline-media/services/catering.png',
  bartending: '/offline-media/services/bartending.png',
  'bar-tending': '/offline-media/services/bartending.png',
  sheesha: '/offline-media/services/sheesha.png',
}

export const OFFLINE_BLOG_COVERS_BY_SLUG = {
  '5-wedding-decoration-trends-for-2025-you-need-to-know':
    '/offline-media/blogs/5-wedding-decoration-trends-for-2025-you-need-to-know.jpg',
  'how-to-plan-a-corporate-event-that-people-actually-enjoy':
    '/offline-media/blogs/how-to-plan-a-corporate-event-that-people-actually-enjoy.jpg',
  '10-ideas-for-a-perfect-birthday-party-at-home':
    '/offline-media/blogs/10-ideas-for-a-perfect-birthday-party-at-home.jpg',
}

export function offlineServiceImage(slug) {
  const key = String(slug ?? '')
    .trim()
    .toLowerCase()
  return OFFLINE_SERVICE_IMAGES[key] ?? null
}

export function offlineBlogCover(slug) {
  const key = String(slug ?? '').trim()
  return OFFLINE_BLOG_COVERS_BY_SLUG[key] ?? null
}
