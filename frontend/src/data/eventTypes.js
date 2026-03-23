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
  {
    id: 3,
    documentId: null,
    title: 'CORPORATE EVENTS',
    description:
      'Professional setups designed for seamless corporate gatherings and team celebrations.',
    category: 'Corporate',
  },
  {
    id: 4,
    documentId: null,
    title: 'PRODUCT LAUNCHES',
    description: 'Curated event experiences to make your brand moment unforgettable.',
    category: 'Corporate',
  },
  {
    id: 5,
    documentId: null,
    title: 'OFFICE PARTIES',
    description: 'Thoughtful planning for team gatherings, farewells, and milestone celebrations.',
    category: 'Corporate',
  },
  {
    id: 6,
    documentId: null,
    title: 'PUJAS & FESTIVALS',
    description:
      'Traditional setups with floral arrangements, décor, and catering for religious gatherings.',
    category: 'Religious',
  },
  {
    id: 7,
    documentId: null,
    title: 'WEDDING CEREMONIES',
    description: 'Elegant planning to make your wedding day beautiful from start to finish.',
    category: 'Religious',
  },
  {
    id: 8,
    documentId: null,
    title: 'NAMING CEREMONIES',
    description:
      'Intimate and elegant setups for welcoming your little one with family and loved ones.',
    category: 'Religious',
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
  {
    id: 3,
    documentId: null,
    title: 'Catering & Food Setup',
    description:
      'Full-service catering arrangements for parties, corporate events, and celebrations of all sizes.',
    category: 'Food & Beverage',
  },
  {
    id: 4,
    documentId: null,
    title: 'Bar & Beverages',
    description:
      'Curated bar setups with mocktail and cocktail options tailored to your event theme.',
    category: 'Food & Beverage',
  },
  {
    id: 5,
    documentId: null,
    title: 'Dessert & Cake Setup',
    description:
      'Custom dessert tables, cake arrangements, and sweet setups to sweeten your celebration.',
    category: 'Food & Beverage',
  },
]
