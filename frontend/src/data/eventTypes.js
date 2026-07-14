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
 *
 * `image` values are live Cloudinary URLs from production CMS. When Strapi API is
 * down, cards still show the same media (CDN is independent of Strapi).
 */

export const EVENT_CATEGORIES_FALLBACK = ['Social', 'Religious', 'Corporate']

/** Preferred Social event order for category + landing carousels. */
export const SOCIAL_EVENT_ORDER = [
  'Birthday Parties',
  'House Parties',
  'Anniversary',
  'Baby Shower',
  'Mehendi',
  'Bachelors',
  'Proposal',
  'Engagement',
  'Haldi',
  'Wedding',
  'Sufi Night',
  'Diwali Party',
]

export const LIVE_EVENT_IMAGES = {
  'birthday-parties':
    'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777269295/2_5e0fbb1dee.png',
  'house-parties': 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777545321/3_5640cadfc5.png',
  anniversary: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777545180/13_feeeb6d728.png',
  'baby-shower': 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777269584/4_522deb1a3a.png',
  bachelors: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777270155/14_1aed915513.png',
  proposal: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777545450/12_23463a13df.png',
  engagement: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777271380/15_7a510292ca.png',
  haldi: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777271524/10_c3f3cd1577.png',
  wedding: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777272106/11_bacafa7d4d.png',
  'sufi-night': 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777272306/16_3a145acd29.png',
  'diwali-party': 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777271224/8_c18e41d3f9.png',
  'bridal-shower': 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777271042/7_ea8a7009fc.png',
  'house-warming': 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777270317/9_eeab732b47.png',
  'pooja-kirtan': 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777545368/5_24a7bb412c.png',
  'exhibition-stalls':
    'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777270722/17_addac15484.png',
  'corporate-get-together':
    'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777270911/6_4fa0903409.png',
  'seminar-conference':
    'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1779426017/Seminar_e03028c527.png',
}

export const EVENT_CARDS_FALLBACK = [
  {
    id: 0,
    documentId: null,
    title: 'Birthday Parties',
    tagline: 'Curated decor and catering packages designed for effortless hosting.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES['birthday-parties'],
  },
  {
    id: 1,
    documentId: null,
    title: 'House Parties',
    tagline: 'Structured planning for relaxed, beautiful gatherings.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES['house-parties'],
  },
  {
    id: 9,
    documentId: null,
    title: 'Anniversary',
    tagline: 'Warm, elegant setups for intimate dinners and milestone moments.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES.anniversary,
  },
  {
    id: 2,
    documentId: null,
    title: 'Baby Shower',
    tagline: 'Thoughtfully styled celebrations, simplified.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES['baby-shower'],
  },
  {
    id: 26,
    documentId: null,
    title: 'Mehendi',
    tagline: 'Colourful setups with seating, decor, and guest-ready flow.',
    category: 'Social',
    image: null,
  },
  {
    id: 27,
    documentId: null,
    title: 'Bachelors',
    tagline: 'High-energy nights planned around music, food, and hosting.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES.bachelors,
  },
  {
    id: 28,
    documentId: null,
    title: 'Proposal',
    tagline: 'Intimate, styled moments designed to feel personal and memorable.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES.proposal,
  },
  {
    id: 10,
    documentId: null,
    title: 'Engagement',
    tagline: 'Polished celebrations with decor styling, food curation, and hosting support.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES.engagement,
  },
  {
    id: 29,
    documentId: null,
    title: 'Haldi',
    tagline: 'Bright ceremonial setups with florals, seating, and ritual support.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES.haldi,
  },
  {
    id: 30,
    documentId: null,
    title: 'Wedding',
    tagline: 'End-to-end planning for beautiful wedding celebrations.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES.wedding,
  },
  {
    id: 31,
    documentId: null,
    title: 'Sufi Night',
    tagline: 'Atmospheric evenings with music-led staging and guest comfort.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES['sufi-night'],
  },
  {
    id: 32,
    documentId: null,
    title: 'Diwali Party',
    tagline: 'Festive lighting, decor, and hosting for joyful Diwali gatherings.',
    category: 'Social',
    image: LIVE_EVENT_IMAGES['diwali-party'],
  },
  {
    id: 3,
    documentId: null,
    title: 'CORPORATE EVENTS',
    tagline:
      'Professional setups designed for seamless corporate gatherings and team celebrations.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['corporate-get-together'],
  },
  {
    id: 4,
    documentId: null,
    title: 'PRODUCT LAUNCHES',
    tagline: 'Curated event experiences to make your brand moment unforgettable.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['exhibition-stalls'],
  },
  {
    id: 5,
    documentId: null,
    title: 'OFFICE PARTIES',
    tagline: 'Thoughtful planning for team gatherings, farewells, and milestone celebrations.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['corporate-get-together'],
  },
  {
    id: 14,
    documentId: null,
    title: 'TEAM OFFSITES',
    tagline: 'Well-organized offsites with logistics, food, and activity support.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['corporate-get-together'],
  },
  {
    id: 15,
    documentId: null,
    title: 'AWARDS NIGHTS',
    tagline: 'Polished formal experiences with production, seating, and program flow.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['seminar-conference'],
  },
  {
    id: 16,
    documentId: null,
    title: 'CONFERENCE MEETS',
    tagline: 'Structured event planning for speakers, schedules, and attendee comfort.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['seminar-conference'],
  },
  {
    id: 17,
    documentId: null,
    title: 'BRAND SHOWCASES',
    tagline: 'Immersive branded experiences built for launches, demos, and media presence.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['exhibition-stalls'],
  },
  {
    id: 18,
    documentId: null,
    title: 'ANNUAL DAYS',
    tagline: 'End-to-end event planning for teams, awards, entertainment, and staging.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['corporate-get-together'],
  },
  {
    id: 19,
    documentId: null,
    title: 'CLIENT MIXERS',
    tagline: 'Relationship-building formats with elegant setup, food, and smooth hosting.',
    category: 'Corporate',
    image: LIVE_EVENT_IMAGES['corporate-get-together'],
  },
  {
    id: 6,
    documentId: null,
    title: 'PUJAS & FESTIVALS',
    tagline:
      'Traditional setups with floral arrangements, décor, and catering for religious gatherings.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES['pooja-kirtan'],
  },
  {
    id: 7,
    documentId: null,
    title: 'WEDDING CEREMONIES',
    tagline: 'Elegant planning to make your wedding day beautiful from start to finish.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES.wedding,
  },
  {
    id: 8,
    documentId: null,
    title: 'NAMING CEREMONIES',
    tagline:
      'Intimate and elegant setups for welcoming your little one with family and loved ones.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES['baby-shower'],
  },
  {
    id: 20,
    documentId: null,
    title: 'SATYANARAYAN PUJA',
    tagline: 'Traditional arrangements with rituals, seating, and coordinated hosting.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES['pooja-kirtan'],
  },
  {
    id: 21,
    documentId: null,
    title: 'GRIHA PRAVESH',
    tagline: 'Welcome-home ceremonies planned with pooja essentials and guest flow.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES['house-warming'],
  },
  {
    id: 22,
    documentId: null,
    title: 'MUNDAN CEREMONIES',
    tagline: 'Family-focused celebrations with decor, ritual support, and meals.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES['pooja-kirtan'],
  },
  {
    id: 23,
    documentId: null,
    title: 'JAGRAN EVENINGS',
    tagline: 'Prayer-focused gatherings coordinated with stage, seating, and guest comfort.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES['pooja-kirtan'],
  },
  {
    id: 24,
    documentId: null,
    title: 'HAVANS',
    tagline: 'Sacred setups managed with ritual planning, materials, and venue flow.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES['house-warming'],
  },
  {
    id: 25,
    documentId: null,
    title: 'COMMUNITY BHOJ',
    tagline: 'Larger religious meals organized with service teams and guest movement.',
    category: 'Religious',
    image: LIVE_EVENT_IMAGES['pooja-kirtan'],
  },
]

const LIVE_SERVICE_IMAGES = {
  decor: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777545321/3_5640cadfc5.png',
  decoration: 'https://elewen.co.in/assets/IMG_3001-BCeFQTvm.jpg',
  furniture: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777270722/17_addac15484.png',
  'technical-showrunning':
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/67bbc13b_2051_4a00_9afc_fdf4c25daeac_87ba34a021.png',
  catering: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777270155/14_1aed915513.png',
  bartending: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777270911/6_4fa0903409.png',
  sheesha: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777270911/6_4fa0903409.png',
}

export { LIVE_SERVICE_IMAGES }

export const SERVICE_CARDS_FALLBACK = [
  {
    id: 121,
    documentId: null,
    title: 'Decoration',
    slug: 'decoration',
    description: 'From simple setups to curated décor that transforms spaces',
    category: 'Decor',
    image: LIVE_SERVICE_IMAGES.decoration,
  },
  {
    id: 122,
    documentId: null,
    title: 'Furniture',
    slug: 'furniture',
    description: 'Rent stylish furniture to complete your event setup',
    category: 'Decor',
    image: LIVE_SERVICE_IMAGES.furniture,
  },
  {
    id: 123,
    documentId: null,
    title: 'Technical (Showrunning)',
    slug: 'technical-showrunning',
    description: 'Seamless showrunning by experienced in-house event managers',
    category: 'Decor',
    image: LIVE_SERVICE_IMAGES['technical-showrunning'],
  },
  {
    id: 124,
    documentId: null,
    title: 'Catering',
    slug: 'catering',
    description:
      'Full-service catering arrangements for parties, corporate events, and celebrations of all sizes.',
    category: 'Catering',
    image: LIVE_SERVICE_IMAGES.catering,
  },
  {
    id: 125,
    documentId: null,
    title: 'Bartending',
    slug: 'bartending',
    description:
      'Curated bar setups with mocktail and cocktail options tailored to your event theme.',
    category: 'Bartending',
    image: LIVE_SERVICE_IMAGES.bartending,
  },
  {
    id: 126,
    documentId: null,
    title: 'Sheesha / Hookah',
    slug: 'sheesha',
    description: 'Relaxed lounge experiences with managed setup and guest-ready presentation.',
    category: 'Sheesha / Hookah',
    image: LIVE_SERVICE_IMAGES.sheesha,
  },
]
