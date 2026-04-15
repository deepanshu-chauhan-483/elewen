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

export const EVENT_CATEGORIES_FALLBACK = ['Social', 'Corporate', 'Religious']

export const EVENT_CARDS_FALLBACK = [
  {
    id: 0,
    documentId: null,
    title: 'BIRTHDAY CELEBRATIONS',
    tagline: 'Curated décor and catering packages designed for effortless hosting.',
    category: 'Social',
    image: null,
  },
  {
    id: 1,
    documentId: null,
    title: 'HOUSE PARTIES',
    tagline: 'Structured planning for relaxed, beautiful gatherings.',
    category: 'Social',
    image: null,
  },
  {
    id: 2,
    documentId: null,
    title: 'BABY SHOWERS',
    tagline: 'Thoughtfully styled celebrations, simplified.',
    category: 'Social',
    image: null,
  },
  {
    id: 9,
    documentId: null,
    title: 'ANNIVERSARY EVENINGS',
    tagline: 'Warm, elegant setups for intimate dinners and milestone moments.',
    category: 'Social',
    image: null,
  },
  {
    id: 10,
    documentId: null,
    title: 'ENGAGEMENT PARTIES',
    tagline: 'Polished celebrations with decor styling, food curation, and hosting support.',
    category: 'Social',
    image: null,
  },
  {
    id: 11,
    documentId: null,
    title: 'COCKTAIL NIGHTS',
    tagline: 'Evening-ready experiences with ambience design, service, and entertainment.',
    category: 'Social',
    image: null,
  },
  {
    id: 12,
    documentId: null,
    title: 'BRUNCH GATHERINGS',
    tagline: 'Light, stylish daytime setups planned for guests, food, and flow.',
    category: 'Social',
    image: null,
  },
  {
    id: 13,
    documentId: null,
    title: 'FAMILY DINNERS',
    tagline: 'Thoughtful hosting support for intimate meals and meaningful celebrations.',
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
      'Traditional setups with floral arrangements, décor, and catering for religious gatherings.',
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

export const SERVICE_CARDS_FALLBACK = [
  {
    id: 0,
    documentId: null,
    title: 'Event Styling',
    description:
      "Backdrops, themes, balloon installations, and curated visual details that define your celebration's look.",
    category: 'Decor',
    image: null,
  },
  {
    id: 1,
    documentId: null,
    title: 'Lighting & Ambience',
    description:
      'Soft lighting setups that shape the mood — from fairy lights to warm spotlight accents.',
    category: 'Decor',
    image: null,
  },
  {
    id: 2,
    documentId: null,
    title: 'Sound & Setup',
    description:
      'Clear audio arrangements for music, announcements, and seamless event coordination.',
    category: 'Decor',
    image: null,
  },
  {
    id: 3,
    documentId: null,
    title: 'Floral & Balloon Decor',
    description:
      'Custom floral arrangements and balloon styling that bring colour and elegance to any celebration.',
    category: 'Decor',
    image: null,
  },
  {
    id: 4,
    documentId: null,
    title: 'Catering & Food Setup',
    description:
      'Full-service catering arrangements for parties, corporate events, and celebrations of all sizes.',
    category: 'Food & Beverages',
    image: null,
  },
  {
    id: 5,
    documentId: null,
    title: 'Bar & Beverages',
    description:
      'Curated bar setups with mocktail and cocktail options tailored to your event theme.',
    category: 'Food & Beverages',
    image: null,
  },
  {
    id: 6,
    documentId: null,
    title: 'Dessert & Cake Setup',
    description:
      'Custom dessert tables, cake arrangements, and sweet setups to sweeten your celebration.',
    category: 'Food & Beverages',
    image: null,
  },
  {
    id: 7,
    documentId: null,
    title: 'Live Food Stations',
    description:
      'Interactive live cooking stations — from chaat counters to pasta bars — for a memorable guest experience.',
    category: 'Food & Beverages',
    image: null,
  },
]
