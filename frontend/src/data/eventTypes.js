/**
 * Fallback event-type data — mirrors the Strapi `events` content type.
 *
 * Strapi schema (Week 1):
 *   Events are hierarchical: top-level categories (Social, Corporate, Religious)
 *   with child sub-types (Birthday, House Party, Baby Shower, Wedding, etc.)
 *
 * Strapi endpoints:
 *   GET /api/events?filters[parent][id][$null]=true   → top-level categories
 *   GET /api/events?filters[parent][id][$eq]=<id>     → sub-types for category
 *   GET /api/events?populate=parent&sort=name         → all events flat
 */

export const EVENT_CATEGORIES_FALLBACK = ['Social', 'Corporate', 'Religious']

export const EVENT_CARDS_FALLBACK = [
  {
    id: 0,
    documentId: null,
    title: 'BIRTHDAY CELEBRATIONS',
    description: 'Curated décor and catering packages designed for effortless hosting.',
    category: 'Social',
  },
  {
    id: 1,
    documentId: null,
    title: 'HOUSE PARTIES',
    description: 'Structured planning for relaxed, beautiful gatherings.',
    category: 'Social',
  },
  {
    id: 2,
    documentId: null,
    title: 'BABY SHOWERS',
    description: 'Thoughtfully styled celebrations, simplified.',
    category: 'Social',
  },
]

export const SERVICE_CARDS_FALLBACK = [
  {
    id: 0,
    documentId: null,
    title: 'Event Styling',
    description:
      "Backdrops, themes, balloon installations, and curated visual details that define your celebration's look.",
    category: 'Decor',
  },
  {
    id: 1,
    documentId: null,
    title: 'Lighting & Ambience',
    description:
      'Soft lighting setups that shape the mood — from fairy lights to warm spotlight accents.',
    category: 'Decor',
  },
  {
    id: 2,
    documentId: null,
    title: 'Sound & Setup',
    description: 'Clear audio arrangements for music, announcements, and seamless coordination.',
    category: 'Tech',
  },
]
