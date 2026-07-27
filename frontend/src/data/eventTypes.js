/**
 * Fallback event-type data — mirrors the mapped output of useEventCards / useServiceCards.
 *
 * Shape matches exactly what the hooks return from Strapi so the UI is identical
 * whether Strapi is reachable or not.
 *
 * Mapped shape (useEventCards):
 *   { id, documentId, title, tagline, category, image }
 *
 * Mapped shape (useServiceCards):
 *   { id, documentId, title, description, category, image }
 */

export const EVENT_CATEGORIES_FALLBACK = ['Social', 'Religious', 'Corporate']

/** Preferred Social event order for category + homepage carousels. */
export const SOCIAL_EVENT_ORDER = [
  'Birthday Parties',
  'House Parties',
  'Anniversary',
  'Baby Shower',
  'Mehendi',
  'Bridal Shower',
  'Proposal',
  'Engagement',
  'Haldi',
  'Wedding',
  'Sufi Night',
  'Diwali Party',
]

export const EVENT_CARDS_FALLBACK = [
  {
    id: 0,
    documentId: null,
    title: 'Birthday Parties',
    tagline: 'Curated Decor and catering packages designed for effortless hosting.',
    category: 'Social',
    image: null,
  },
  {
    id: 1,
    documentId: null,
    title: 'House Parties',
    tagline: 'Structured planning for relaxed, beautiful gatherings.',
    category: 'Social',
    image: null,
  },
  {
    id: 9,
    documentId: null,
    title: 'Anniversary',
    tagline: 'Warm, elegant setups for intimate dinners and milestone moments.',
    category: 'Social',
    image: null,
  },
  {
    id: 2,
    documentId: null,
    title: 'Baby Shower',
    tagline: 'Thoughtfully styled celebrations, simplified.',
    category: 'Social',
    image: null,
  },
  {
    id: 26,
    documentId: null,
    title: 'Mehendi',
    tagline: 'Colourful setups with seating, Decor, and guest-ready flow.',
    category: 'Social',
    image: null,
  },
  {
    id: 27,
    documentId: null,
    title: 'Bridal Shower',
    tagline: 'All about the bride, fun, and great vibes',
    category: 'Social',
    image: null,
  },
  {
    id: 28,
    documentId: null,
    title: 'Proposal',
    tagline: 'Intimate, polished setups for one unforgettable ask.',
    category: 'Social',
    image: null,
  },
  {
    id: 10,
    documentId: null,
    title: 'Engagement',
    tagline: 'Polished celebrations with Decor styling, food curation, and hosting support.',
    category: 'Social',
    image: null,
  },
  {
    id: 29,
    documentId: null,
    title: 'Haldi',
    tagline: 'Bright ceremonial setups with seating, florals, and smooth guest flow.',
    category: 'Social',
    image: null,
  },
  {
    id: 30,
    documentId: null,
    title: 'Wedding',
    tagline: 'End-to-end styling and hosting support for the big day.',
    category: 'Social',
    image: null,
  },
  {
    id: 31,
    documentId: null,
    title: 'Sufi Night',
    tagline: 'Atmospheric evenings with music-led ambience and service planning.',
    category: 'Social',
    image: null,
  },
  {
    id: 32,
    documentId: null,
    title: 'Diwali Party',
    tagline: 'Festive lighting, Decor, and hosting for celebration nights.',
    category: 'Social',
    image: null,
  },
  {
    id: 3,
    documentId: null,
    title: 'CORPORATE EVENTS',
    tagline:
      'Professional setups designed for seamless corporate gatherings and team celebrations.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 4,
    documentId: null,
    title: 'PRODUCT LAUNCHES',
    tagline: 'Curated event experiences to make your brand moment unforgettable.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 5,
    documentId: null,
    title: 'OFFICE PARTIES',
    tagline: 'Thoughtful planning for team gatherings, farewells, and milestone celebrations.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 14,
    documentId: null,
    title: 'TEAM OFFSITES',
    tagline: 'Well-organized offsites with logistics, food, and activity support.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 15,
    documentId: null,
    title: 'AWARDS NIGHTS',
    tagline: 'Polished formal experiences with production, seating, and program flow.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 16,
    documentId: null,
    title: 'CONFERENCE MEETS',
    tagline: 'Structured event planning for speakers, schedules, and attendee comfort.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 17,
    documentId: null,
    title: 'BRAND SHOWCASES',
    tagline: 'Immersive branded experiences built for launches, demos, and media presence.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 18,
    documentId: null,
    title: 'ANNUAL DAYS',
    tagline: 'End-to-end event planning for teams, awards, entertainment, and staging.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 19,
    documentId: null,
    title: 'CLIENT MIXERS',
    tagline: 'Relationship-building formats with elegant setup, food, and smooth hosting.',
    category: 'Corporate',
    image: null,
  },
  {
    id: 6,
    documentId: null,
    title: 'PUJAS & FESTIVALS',
    tagline:
      'Traditional setups with floral arrangements, Decor, and catering for religious gatherings.',
    category: 'Religious',
    image: null,
  },
  {
    id: 7,
    documentId: null,
    title: 'WEDDING CEREMONIES',
    tagline: 'Elegant planning to make your wedding day beautiful from start to finish.',
    category: 'Religious',
    image: null,
  },
  {
    id: 8,
    documentId: null,
    title: 'NAMING CEREMONIES',
    tagline:
      'Intimate and elegant setups for welcoming your little one with family and loved ones.',
    category: 'Religious',
    image: null,
  },
  {
    id: 20,
    documentId: null,
    title: 'SATYANARAYAN PUJA',
    tagline: 'Traditional arrangements with rituals, seating, and coordinated hosting.',
    category: 'Religious',
    image: null,
  },
  {
    id: 21,
    documentId: null,
    title: 'GRIHA PRAVESH',
    tagline: 'Welcome-home ceremonies planned with pooja essentials and guest flow.',
    category: 'Religious',
    image: null,
  },
  {
    id: 22,
    documentId: null,
    title: 'MUNDAN CEREMONIES',
    tagline: 'Family-focused celebrations with decor, ritual support, and meals.',
    category: 'Religious',
    image: null,
  },
  {
    id: 23,
    documentId: null,
    title: 'JAGRAN EVENINGS',
    tagline: 'Prayer-focused gatherings coordinated with stage, seating, and guest comfort.',
    category: 'Religious',
    image: null,
  },
  {
    id: 24,
    documentId: null,
    title: 'HAVANS',
    tagline: 'Sacred setups managed with ritual planning, materials, and venue flow.',
    category: 'Religious',
    image: null,
  },
  {
    id: 25,
    documentId: null,
    title: 'COMMUNITY BHOJ',
    tagline: 'Larger religious meals organized with service teams and guest movement.',
    category: 'Religious',
    image: null,
  },
]

export const DECOR_LANE_LABEL = 'Décor'

export const DECOR_SETUPS_LABEL = 'Décor Setups'

/** Accent-insensitive lane key for Décor / Decor / decor comparisons. */
export const normalizeServiceLaneKey = value =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const SERVICE_CATEGORY_ORDER = [
  DECOR_LANE_LABEL,
  'Catering',
  'Bartending',
  'Sheesha / Hookah',
]

export const SERVICE_CARDS_FALLBACK = [
  {
    id: 69,
    documentId: null,
    title: DECOR_SETUPS_LABEL,
    slug: 'decoration',
    description: 'From simple setups to curated décor that transforms spaces',
    category: DECOR_LANE_LABEL,
    image: '/offline-media/services/decoration.jpg',
  },
  {
    id: 124,
    documentId: null,
    title: 'Furniture',
    slug: 'furniture',
    description: 'Rent stylish furniture to complete your event setup',
    category: DECOR_LANE_LABEL,
    image: '/offline-media/services/furniture.png',
  },
  {
    id: 121,
    documentId: null,
    title: 'Catering',
    slug: 'catering',
    description:
      'Full-service catering arrangements for parties, corporate events, and celebrations of all sizes.',
    category: 'Catering',
    image: '/offline-media/services/catering.png',
  },
  {
    id: 122,
    documentId: null,
    title: 'Bartending',
    slug: 'bartending',
    description: 'Professional bar tenders, be it one bartender to a full bar team',
    category: 'Bartending',
    image: '/offline-media/services/bartending.png',
  },
  {
    id: 126,
    documentId: null,
    title: 'Sheesha / Hookah',
    slug: 'sheesha',
    description: 'Relaxed lounge experiences with managed setup and guest-ready presentation.',
    category: 'Sheesha / Hookah',
    image: '/offline-media/services/sheesha.png',
  },
]
