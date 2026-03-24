/**
 * Fallback package data — mirrors the Strapi `packages` content type.
 *
 * Strapi fields (Week 1 schema):
 *   title, description, base_price, category (relation → event-type),
 *   elements (component: package-element[]),
 *   addons (component: package-addon[]),
 *   pricing_rules (component: pricing-rule[]),
 *   images (media[])
 *
 * `tags` below are derived from element names — Strapi will populate them
 * via elements[].service.name once the relation is seeded.
 *
 * Replace this data once Strapi /api/packages?populate=* is seeded.
 */

export const PACKAGES_FALLBACK = [
  {
    id: 0,
    documentId: null,
    title: 'House Party Essentials',
    category: 'Birthday',
    description: 'A balanced decor package designed for relaxed gatherings and celebrations.',
    price: 'Starting from ₹21,000',
    base_price: 21000,
    tags: ['Balloon Styling', 'Fairy Lighting', 'Welcome Decor', 'Sound Setup', 'More'],
    images: [], // populated at runtime from local assets
  },
  {
    id: 1,
    documentId: null,
    title: 'Themed Birthday Bash',
    category: 'Birthday',
    description: 'Complete venue transformation with custom backdrops and tailored aesthetics.',
    price: 'Starting from ₹35,000',
    base_price: 35000,
    tags: ['Custom Backdrop', 'Themed Props', 'Balloon Arches', 'Lighting', 'More'],
    images: [],
  },
  {
    id: 2,
    documentId: null,
    title: 'Intimate Anniversary',
    category: 'Anniversary',
    description: 'Soft lighting, elegant florals, and curated dining setups for memorable nights.',
    price: 'Starting from ₹18,000',
    base_price: 18000,
    tags: ['Floral Decor', 'Candle Setup', 'Premium Cutlery', 'Music', 'More'],
    images: [],
  },
  {
    id: 3,
    documentId: null,
    title: 'Corporate Mixer',
    category: 'Corporate',
    description: 'Professional yet engaging setups perfect for team celebrations and milestones.',
    price: 'Starting from ₹45,000',
    base_price: 45000,
    tags: ['Branded Decor', 'AV Setup', 'Seating', 'Welcome Desk', 'More'],
    images: [],
  },
  {
    id: 4,
    documentId: null,
    title: 'Baby Shower Bloom',
    category: 'Baby Shower',
    description: 'Pastel hues, gentle aesthetics, and photo-ready moments for the special day.',
    price: 'Starting from ₹25,000',
    base_price: 25000,
    tags: ['Pastel Balloons', 'Photo Booth', 'Welcome Sign', 'Favors', 'More'],
    images: [],
  },
]
